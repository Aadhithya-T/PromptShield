"""
PromptShield — Backend
======================
Endpoints:
  POST /classify  → { label, scores }
  POST /generate  → { response }
  GET  /health    → { status, model }

To run:
  pip install flask flask-cors
  python backend.py

When your model is ready:
  1. Set MODEL_READY = True
  2. Fill in your GEMINI_API_KEY
  3. The real classifier and Gemini call will take over automatically
"""

import os
import json
import time
import random
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows requests from index.html on any origin

# ── Config ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")   # set via env or paste here
GEMINI_URL     = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
MODEL_PATH     = "./promptshield_model"
LABEL_MAP_PATH = os.path.join(MODEL_PATH, "label_map.json")

# Flip to True once your model folder is ready
MODEL_READY = False

# ── Model loader (only runs if MODEL_READY = True) ─────────────────────────
classifier_model    = None
classifier_tokenizer = None
label_map           = None

def load_model():
    global classifier_model, classifier_tokenizer, label_map

    import torch
    import torch.nn.functional as F
    from transformers import (
        DistilBertTokenizerFast,
        DistilBertForSequenceClassification,
    )

    print("[PromptShield] Loading model from", MODEL_PATH)
    classifier_tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_PATH)
    classifier_model     = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
    classifier_model.eval()

    # Load label map saved during training
    with open(LABEL_MAP_PATH) as f:
        raw = json.load(f)
        # label_map.json is { "jailbreak": 0, "safe": 1, ... }
        # flip to { 0: "jailbreak", 1: "safe", ... }
        label_map = {v: k for k, v in raw.items()}

    print("[PromptShield] Model ready. Labels:", label_map)


# ── Real classifier ────────────────────────────────────────────────────────
def real_classify(prompt: str):
    import torch
    import torch.nn.functional as F

    inputs = classifier_tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    with torch.no_grad():
        logits = classifier_model(**inputs).logits

    probs  = F.softmax(logits, dim=-1).squeeze().tolist()
    scores = {label_map[i]: round(p, 4) for i, p in enumerate(probs)}
    label  = max(scores, key=scores.get)
    return label, scores


# ── Mock classifier (used while MODEL_READY = False) ──────────────────────
def mock_classify(prompt: str):
    """
    Returns deterministic-ish mock scores so the UI can be fully tested.
    Simple heuristics make the mock slightly realistic:
      - prompts with 'ignore', 'pretend', 'bypass' → jailbreak
      - prompts with 'hack', 'malware', 'exploit'  → unsafe
      - very short prompts                          → suspicious
      - everything else                             → safe
    """
    p = prompt.lower()

    jailbreak_keywords  = ["ignore", "pretend", "bypass", "jailbreak", "dan", "no restrictions", "act as"]
    unsafe_keywords     = ["hack", "malware", "exploit", "keylogger", "virus", "steal", "inject"]
    suspicious_keywords = ["what can you", "what are your limits", "what won't you", "can you help with"]

    if any(k in p for k in jailbreak_keywords):
        winner = "jailbreak"
    elif any(k in p for k in unsafe_keywords):
        winner = "unsafe"
    elif any(k in p for k in suspicious_keywords) or len(prompt.split()) < 4:
        winner = "suspicious"
    else:
        winner = "safe"

    # Build believable score distribution
    base   = {l: round(random.uniform(0.01, 0.06), 4) for l in ["safe", "unsafe", "suspicious", "jailbreak"]}
    others = sum(v for k, v in base.items() if k != winner)
    base[winner] = round(1.0 - others, 4)

    return winner, base


# ── Gemini call ────────────────────────────────────────────────────────────
def call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        # No key set — return a clear mock so dev can still see the UI working
        time.sleep(0.6)
        return (
            "[Mock Gemini Response]\n\n"
            f"You asked: \"{prompt}\"\n\n"
            "Set your GEMINI_API_KEY in backend.py or as an environment variable "
            "to see real responses from Gemini 2.5 Flash."
        )

    url  = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        res = requests.post(url, json=body, timeout=30)
        res.raise_for_status()
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"Gemini API error: {e.response.status_code} — {e.response.text}")
    except Exception as e:
        raise RuntimeError(f"Gemini call failed: {str(e)}")


# ── Routes ─────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model":  "real" if MODEL_READY else "mock",
    })


@app.route("/classify", methods=["POST"])
def classify():
    data   = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        if MODEL_READY:
            label, scores = real_classify(prompt)
        else:
            label, scores = mock_classify(prompt)

        return jsonify({"label": label, "scores": scores})

    except Exception as e:
        print("[/classify] Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/generate", methods=["POST"])
def generate():
    data   = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        response = call_gemini(prompt)
        return jsonify({"response": response})

    except Exception as e:
        print("[/generate] Error:", e)
        return jsonify({"error": str(e), "message": str(e)}), 500


# ── Startup ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if MODEL_READY:
        load_model()
    else:
        print("[PromptShield] Running in MOCK mode — set MODEL_READY = True when model is ready")

    print("[PromptShield] Starting on http://localhost:5000")
    app.run(port=5000, debug=True)
