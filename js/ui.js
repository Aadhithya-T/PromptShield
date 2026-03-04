// ── UI Helpers ──

const UI = {
  // Element refs
  promptInput:    document.getElementById('prompt-input'),
  charNum:        document.getElementById('char-num'),
  analyzeBtn:     document.getElementById('analyze-btn'),
  resultPanel:    document.getElementById('result-panel'),
  classCard:      document.getElementById('classification-card'),
  statusBadge:    document.getElementById('status-badge'),
  statusDot:      document.getElementById('status-dot'),
  resultLabel:    document.getElementById('result-label'),
  resultMeta:     document.getElementById('result-meta'),
  resultMessage:  document.getElementById('result-message'),
  confidenceBars: document.getElementById('confidence-bars'),
  geminiCard:     document.getElementById('gemini-card'),
  geminiLoading:  document.getElementById('gemini-loading'),
  geminiResponse: document.getElementById('gemini-response'),

  // Status messages per class
  messages: {
    safe:       '✓ Prompt passed security checks. Forwarding to Gemini.',
    unsafe:     '✗ Request blocked. Prompt contains unsafe content.',
    suspicious: '⚠ Request blocked. Prompt flagged for recon-style behavior.',
    jailbreak:  '✗ Request blocked. Jailbreak attempt detected.',
  },

  // Labels shown next to badge
  labels: {
    safe:       'Request forwarded to LLM',
    unsafe:     'Request blocked',
    suspicious: 'Request flagged',
    jailbreak:  'Jailbreak detected',
  },

  setLoading(isLoading) {
    this.analyzeBtn.classList.toggle('loading', isLoading);
    this.analyzeBtn.disabled = isLoading;
  },

  showResult({ label, scores, latency }) {
    // Clear old status classes
    this.classCard.className = 'card result-card';
    this.classCard.classList.add(`status-${label}`);

    this.statusBadge.textContent = label;
    this.resultLabel.textContent = this.labels[label] || '';
    this.resultMessage.textContent = this.messages[label] || '';
    this.resultMeta.textContent = `${latency}ms`;

    this.renderConfidenceBars(scores);
    this.resultPanel.classList.add('visible');

    const showGemini = label === 'safe';
    this.geminiCard.style.display = showGemini ? 'block' : 'none';

    if (showGemini) {
      this.geminiLoading.style.display  = 'flex';
      this.geminiResponse.style.display = 'none';
      this.geminiResponse.textContent   = '';
    }
  },

  showGeminiResponse(text) {
    this.geminiLoading.style.display  = 'none';
    this.geminiResponse.style.display = 'block';
    this.geminiResponse.textContent   = text;
  },

  showGeminiError(msg) {
    this.geminiLoading.style.display  = 'none';
    this.geminiResponse.style.display = 'block';
    this.geminiResponse.textContent   = `Error: ${msg}`;
  },

  renderConfidenceBars(scores) {
    // scores: { safe: 0.92, unsafe: 0.03, suspicious: 0.02, jailbreak: 0.03 }
    const order = ['safe', 'unsafe', 'suspicious', 'jailbreak'];
    this.confidenceBars.innerHTML = '';

    order.forEach(cls => {
      const pct = Math.round((scores[cls] || 0) * 100);
      const row = document.createElement('div');
      row.className = 'conf-row';
      row.innerHTML = `
        <span class="conf-label">${cls}</span>
        <div class="conf-track">
          <div class="conf-fill fill-${cls}" data-pct="${pct}"></div>
        </div>
        <span class="conf-pct">${pct}%</span>
      `;
      this.confidenceBars.appendChild(row);
    });

    // Animate bars after paint
    requestAnimationFrame(() => {
      document.querySelectorAll('.conf-fill').forEach(el => {
        el.style.width = el.dataset.pct + '%';
      });
    });
  },

  updateCharCount(len) {
    this.charNum.textContent = len;
  },
};
