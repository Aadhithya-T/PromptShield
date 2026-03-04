// ── Classifier ──
// Calls your Flask/FastAPI backend to classify the prompt.
// Expected response shape from backend:
// {
//   label: "safe" | "unsafe" | "suspicious" | "jailbreak",
//   scores: { safe: 0.92, unsafe: 0.03, suspicious: 0.02, jailbreak: 0.03 },
// }

const Classifier = {
  async classify(prompt) {
    const res = await fetch(`${CONFIG.BACKEND_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return await res.json();
    // Returns: { label, scores }
  },
};
