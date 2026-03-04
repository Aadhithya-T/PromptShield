// ── Gemini ──
// If CONFIG.BACKEND_HANDLES_GEMINI = true → asks your backend to call Gemini.
// If false → calls Gemini API directly from the browser (key exposed, dev only).

const Gemini = {
  async query(prompt) {
    if (CONFIG.BACKEND_HANDLES_GEMINI) {
      return await this._viaBackend(prompt);
    } else {
      return await this._direct(prompt);
    }
  },

  async _viaBackend(prompt) {
    const res = await fetch(`${CONFIG.BACKEND_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.response;
  },

  async _direct(prompt) {
    // Direct Gemini API call (expose key only in local dev)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
  },
};
