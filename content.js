// content.js — injected into every page at document_idle
// Detects and dismisses cookie consent banners.
// Sends TRACKER_BLOCKED to background when successful.
// Listens for SHOW_TOAST from background and injects a styled notification.

let toastShown = false;

// Check if blocking is enabled before scanning
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (chrome.runtime.lastError) return; // extension context invalidated
  if (response && response.blockingEnabled !== false) {
    scanAndBlock();
    observeForBanners();
  }
});

// Listen for toast trigger sent back from background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_TOAST' && !toastShown) {
    toastShown = true;
    showToast();
  }
});

// Try each framework in order, stop at first match
function scanAndBlock() {
  if (tryOneTrust()) return;
  if (tryCookiebot()) return;
  if (tryTrustArc()) return;
  tryGeneric();
}

function tryOneTrust() {
  const btn = document.querySelector(
    '#onetrust-reject-all-handler, .ot-pc-refuse-all-handler'
  );
  if (btn) { btn.click(); notifyBlocked(); return true; }
  return false;
}

function tryCookiebot() {
  const btn = document.querySelector(
    '#CybotCookiebotDialogBodyButtonDecline'
  );
  if (btn) { btn.click(); notifyBlocked(); return true; }
  return false;
}

function tryTrustArc() {
  const btn = document.querySelector(
    '.trustarc-decline-btn, .pdynamicbutton .call'
  );
  if (btn) { btn.click(); notifyBlocked(); return true; }
  return false;
}

function tryGeneric() {
  // Find any button whose visible text says "reject all", "decline all", etc.
  const keywords = [
    'reject all', 'decline all', 'deny all',
    'necessary only', 'essential only',
    'reject cookies', 'decline cookies'
  ];
  const candidates = Array.from(
    document.querySelectorAll('button, [role="button"], a')
  );
  for (const el of candidates) {
    const text = el.textContent.toLowerCase().trim();
    if (keywords.some(k => text.includes(k))) {
      el.click();
      notifyBlocked();
      return true;
    }
  }
  return false;
}

function notifyBlocked() {
  chrome.runtime.sendMessage({ type: 'TRACKER_BLOCKED' });
}

// Watch for dynamically injected banners (many sites load them after DOMContentLoaded)
function observeForBanners() {
  const observer = new MutationObserver(() => {
    if (!toastShown) scanAndBlock();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Disconnect after 10 seconds — banner has loaded by then or not at all
  setTimeout(() => observer.disconnect(), 10000);
}

function showToast() {
  // Remove any existing toast
  const old = document.getElementById('__drop-phone-toast__');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = '__drop-phone-toast__';
  toast.textContent = 'Tracker blocked. ICE can\'t follow you here.';
  toast.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    background: #0f1117 !important;
    color: #4fc3f7 !important;
    border: 1px solid #4fc3f7 !important;
    padding: 10px 16px !important;
    font-family: monospace !important;
    font-size: 13px !important;
    z-index: 2147483647 !important;
    border-radius: 2px !important;
    box-shadow: 0 0 12px rgba(79, 195, 247, 0.3) !important;
    max-width: 300px !important;
    pointer-events: none !important;
    opacity: 1 !important;
    transition: opacity 0.5s ease !important;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.setProperty('opacity', '0', 'important');
    setTimeout(() => toast.remove(), 600);
  }, 3000);
}
