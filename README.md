# 🛡️ PromptShield

PromptShield is a prompt security middleware for LLMs. It uses a fine-tuned DistilBERT classifier to label incoming prompts as **safe**, **unsafe**, **suspicious**, or **jailbreak** before forwarding to Google Gemini 2.5 Flash.

---

## How It Works

```
User Prompt → DistilBERT Classifier → safe?  → Gemini 2.5 Flash → Response
                                    → unsafe/suspicious/jailbreak → Blocked
```

1. User enters a prompt in the frontend
2. The prompt is sent to the Flask backend
3. DistilBERT classifies it into one of 4 classes
4. If **safe** → forwarded to Gemini, response shown
5. If **unsafe / suspicious / jailbreak** → request is blocked

---

## Classes

| Class | Description |
|---|---|
| `safe` | Normal prompt, forwarded to LLM |
| `unsafe` | Directly requests harmful content |
| `suspicious` | Recon-style or ambiguous behavior |
| `jailbreak` | Actively attempts to bypass safety |

---

## Project Structure

```
PromptShield/
├── index.html                  # Frontend entry point
├── css/
│   ├── reset.css
│   ├── variables.css           # Design tokens
│   ├── layout.css
│   ├── components.css
│   ├── status.css              # Per-class color rules
│   └── animations.css
├── js/
│   ├── config.js               # API keys & backend URL
│   ├── ui.js                   # DOM manipulation
│   ├── classifier.js           # POST /classify
│   ├── gemini.js               # POST /generate
│   └── main.js                 # Event wiring
├── backend.py                  # Flask API (classify + generate)
├── train.py                    # DistilBERT fine-tuning script
├── prompts.csv                 # Labeled training data
└── promptshield_model/         # Saved fine-tuned model
    ├── config.json
    ├── tokenizer_config.json
    ├── label_map.json
    └── pytorch_model.bin
```

---

## Setup

### 1. Install dependencies

```bash
pip install flask flask-cors transformers torch
```

### 2. Run the backend

```bash
python backend.py
```

Backend runs on `http://localhost:5000`

### 3. Open the frontend

Open `index.html` in your browser directly, or serve it:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`

### 4. Configure API keys

Edit `js/config.js`:

```js
const CONFIG = {
  BACKEND_URL: 'http://localhost:5000',
  BACKEND_HANDLES_GEMINI: true,
};
```

Set your Gemini API key in `backend.py`.

---

## Model

- **Base model:** `distilbert-base-uncased`
- **Task:** 4-class sequence classification
- **Training data:** ~12k labeled prompts (`prompts.csv`)
- **Metrics tracked:** Accuracy, F1, Precision, Recall
- **Best checkpoint selected by:** weighted F1

### Retrain

```bash
python train.py
```

---

## API Endpoints

### `POST /classify`

```json
// Request
{ "prompt": "How do I center a div?" }

// Response
{
  "label": "safe",
  "scores": {
    "safe": 0.9421,
    "unsafe": 0.0231,
    "suspicious": 0.0187,
    "jailbreak": 0.0161
  }
}
```

### `POST /generate`

```json
// Request
{ "prompt": "How do I center a div?" }

// Response
{ "response": "You can center a div using flexbox..." }
```

---

## Tech Stack

- **Classifier:** DistilBERT (HuggingFace Transformers)
- **Backend:** Python, Flask
- **LLM:** Google Gemini 2.5 Flash
- **Frontend:** HTML, CSS, Vanilla JS
