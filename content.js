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
  // Prefer "necessary only" button; fall back to reject-all
  const btn = document.querySelector(
    '.ot-pc-refuse-all-handler, #onetrust-reject-all-handler'
  );
  if (btn) { btn.click(); notifyBlocked(); return true; }
  return false;
}

function tryCookiebot() {
  // "Allow necessary only" = decline non-essential
  const btn = document.querySelector(
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll, #CybotCookiebotDialogBodyButtonDecline'
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
  // Prefer "necessary/essential only" text first, then fall back to reject/decline
  const preferredKeywords = [
    'necessary only', 'essential only', 'accept necessary',
    'accept essential', 'only necessary', 'only essential',
    'use necessary', 'use essential'
  ];
  const fallbackKeywords = [
    'reject all', 'decline all', 'deny all',
    'reject cookies', 'decline cookies'
  ];
  const candidates = Array.from(
    document.querySelectorAll('button, [role="button"], a')
  );
  // First pass: necessary/essential only buttons
  for (const el of candidates) {
    const text = el.textContent.toLowerCase().trim();
    if (preferredKeywords.some(k => text.includes(k))) {
      el.click();
      notifyBlocked();
      return true;
    }
  }
  // Second pass: reject/decline all buttons
  for (const el of candidates) {
    const text = el.textContent.toLowerCase().trim();
    if (fallbackKeywords.some(k => text.includes(k))) {
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
