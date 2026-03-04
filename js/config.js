// ── PromptShield Config ──
// Replace with your actual API keys before running

const CONFIG = {
  // Your Flask/FastAPI backend URL (where app.py is running)
  BACKEND_URL: 'http://localhost:5000',

  // Gemini API key (only used if calling Gemini directly from frontend)
  // If your backend handles Gemini, leave this empty
  GEMINI_API_KEY: '',

  // Whether backend handles Gemini or frontend calls it directly
  BACKEND_HANDLES_GEMINI: true,
};
