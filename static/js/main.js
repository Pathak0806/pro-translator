// ── DOM refs ─────────────────────────────────────────────────────
const sourceLang   = document.getElementById('sourceLang');
const targetLang   = document.getElementById('targetLang');
const inputText    = document.getElementById('inputText');
const outputText   = document.getElementById('outputText');
const translateBtn = document.getElementById('translateBtn');
const swapBtn      = document.getElementById('swapBtn');
const clearBtn     = document.getElementById('clearBtn');
const copyBtn      = document.getElementById('copyBtn');
const speakBtn     = document.getElementById('speakBtn');
const detectBtn    = document.getElementById('detectBtn');
const charCount    = document.getElementById('charCount');
const sourceLabel  = document.getElementById('sourceLabel');
const targetLabel  = document.getElementById('targetLabel');
const statusText   = document.getElementById('translateStatus');
const loading      = document.getElementById('loadingOverlay');
const loaderText   = document.getElementById('loaderText');

let lastTranslation = '';

// ── Char counter ─────────────────────────────────────────────────
inputText.addEventListener('input', () => {
  charCount.textContent = inputText.value.length;
});

// ── Language label sync ──────────────────────────────────────────
sourceLang.addEventListener('change', () => {
  sourceLabel.textContent = sourceLang.value;
});
targetLang.addEventListener('change', () => {
  targetLabel.textContent = targetLang.value;
});

// ── Swap languages ───────────────────────────────────────────────
swapBtn.addEventListener('click', () => {
  const src = sourceLang.value;
  const tgt = targetLang.value;
  sourceLang.value = tgt;
  targetLang.value = src;
  sourceLabel.textContent = tgt;
  targetLabel.textContent = src;

  // Also swap text if there's a translation
  if (lastTranslation) {
    inputText.value = lastTranslation;
    charCount.textContent = lastTranslation.length;
    outputText.innerHTML = '<span class="output-placeholder">Translation appears here...</span>';
    lastTranslation = '';
  }
});

// ── Clear ────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  charCount.textContent = '0';
  outputText.innerHTML = '<span class="output-placeholder">Translation appears here...</span>';
  statusText.textContent = '';
  lastTranslation = '';
  inputText.focus();
});

// ── Translate ────────────────────────────────────────────────────
translateBtn.addEventListener('click', doTranslate);

inputText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doTranslate();
});

async function doTranslate() {
  const text = inputText.value.trim();
  if (!text) {
    inputText.focus();
    return;
  }

  showLoading('Translating...');

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: sourceLang.value,
        target_lang: targetLang.value
      })
    });

    const data = await res.json();
    hideLoading();

    if (data.error) {
      statusText.textContent = '⚠ ' + data.error;
      return;
    }

    lastTranslation = data.translation;
    outputText.textContent = data.translation;
    statusText.textContent = `✓ Translated from ${sourceLang.value} to ${targetLang.value}`;

  } catch (err) {
    hideLoading();
    statusText.textContent = '⚠ Something went wrong. Try again.';
  }
}

// ── Auto-detect language ─────────────────────────────────────────
detectBtn.addEventListener('click', async () => {
  const text = inputText.value.trim();
  if (!text) return;

  showLoading('Detecting language...');

  try {
    const res = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    hideLoading();

    // Try to match detected language to dropdown
    const detected = data.language;
    const options = Array.from(sourceLang.options).map(o => o.value);
    const match = options.find(o => o.toLowerCase() === detected.toLowerCase());
    if (match) {
      sourceLang.value = match;
      sourceLabel.textContent = match;
      statusText.textContent = `✓ Detected: ${detected}`;
    } else {
      statusText.textContent = `Detected: ${detected}`;
    }
  } catch (err) {
    hideLoading();
  }
});

// ── Copy translation ─────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  if (!lastTranslation) return;
  navigator.clipboard.writeText(lastTranslation).then(() => {
    showToast('✓ Copied to clipboard');
  });
});

// ── Text to speech ───────────────────────────────────────────────
speakBtn.addEventListener('click', () => {
  if (!lastTranslation) return;
  const utter = new SpeechSynthesisUtterance(lastTranslation);
  window.speechSynthesis.speak(utter);
});

// ── Quick pairs ──────────────────────────────────────────────────
document.querySelectorAll('.pair-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.src;
    const tgt = btn.dataset.tgt;
    sourceLang.value = src;
    targetLang.value = tgt;
    sourceLabel.textContent = src;
    targetLabel.textContent = tgt;
    inputText.focus();
  });
});

// ── Loading helpers ──────────────────────────────────────────────
function showLoading(text) {
  loaderText.textContent = text;
  loading.classList.remove('hidden');
}
function hideLoading() {
  loading.classList.add('hidden');
}

// ── Toast ────────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
