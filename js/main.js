// ── Main ──

document.addEventListener('DOMContentLoaded', () => {

  // ── Char counter ──
  UI.promptInput.addEventListener('input', () => {
    const len = UI.promptInput.value.length;
    UI.updateCharCount(len);
    UI.analyzeBtn.disabled = len === 0;
  });

  // ── Keyboard shortcut: Ctrl/Cmd + Enter to analyze ──
  UI.promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!UI.analyzeBtn.disabled) handleAnalyze();
    }
  });

  // ── Analyze button ──
  UI.analyzeBtn.addEventListener('click', handleAnalyze);

});

async function handleAnalyze() {
  const prompt = UI.promptInput.value.trim();
  if (!prompt) return;

  UI.setLoading(true);
  UI.resultPanel.classList.remove('visible');

  const t0 = Date.now();

  try {
    // 1. Classify
    const { label, scores } = await Classifier.classify(prompt);
    const latency = Date.now() - t0;

    // 2. Show classification result
    UI.showResult({ label, scores, latency });

    // 3. If safe, query Gemini
    if (label === 'safe') {
      try {
        const response = await Gemini.query(prompt);
        UI.showGeminiResponse(response);
      } catch (geminiErr) {
        UI.showGeminiError(geminiErr.message);
      }
    }

  } catch (err) {
    console.error('Classification error:', err);
    alert(`Error: ${err.message}`);
  } finally {
    UI.setLoading(false);
  }
}
