// content.js — injected into every page at document_idle.
// Detects and dismisses cookie consent banners.

(function () {

// ── Injection guard — prevent double-run if popup injects while manifest already ran ──
if (window.__dyp_content_injected) return;
window.__dyp_content_injected = true;

// ── Iframe guard ─────────────────────────────────────────────────────────────
const isMainFrame = window.top === window.self;
if (!isMainFrame) {
  const probe = (location.href + ' ' + (document.title || '')).toLowerCase();
  const isCmpFrame = /consent|gdpr|privacy|cookie|sourcepoint|quantcast|didomi|onetrust|cookiebot|trustarc|sp-prod|consensu\.org|privacy-mgmt|usercentrics|axeptio/i.test(probe);
  if (!isCmpFrame) return;
}

let alreadyBlocked = false;

// ── Keyword lists ─────────────────────────────────────────────────────────────
const CONTAINER_KEYWORDS = [
  // English
  'reject all', 'decline all', 'deny all', 'refuse all', 'disagree',
  'reject cookies', 'decline cookies', 'refuse cookies',
  'necessary only', 'essential only', 'only necessary', 'only essential',
  'accept necessary', 'accept essential', 'use necessary', 'use essential',
  'necessary cookies only', 'essential cookies only',
  'continue without', 'proceed without', 'browse without',
  'i do not accept', "i don't accept", 'i disagree',
  'no, thank', 'no thanks',
  'do not sell', 'do not share', 'opt out of all',
  'use limited data', 'limited data use',
  'stay basic', 'basic version',
  'save & exit', 'save and exit',
  // German
  'alle ablehnen', 'ablehnen', 'nur notwendige', 'nur erforderliche',
  'nicht akzeptieren', 'weiter ohne zustimmung', 'ohne einwilligung',
  'nur essentielle', 'notwendige cookies', 'einstellungen speichern',
  // French
  'tout refuser', 'refuser tout', 'refuser', 'continuer sans accepter',
  'continuer sans consentir', 'uniquement nécessaires', 'nécessaires uniquement',
  'je refuse', 'refus', 'désactiver tout',
  // Spanish
  'rechazar todo', 'solo necesarias', 'solo esenciales', 'rechazar',
  'continuar sin aceptar', 'no aceptar',
  // Italian
  'rifiuta tutto', 'rifiuta', 'solo necessari', 'continua senza accettare',
  // Dutch
  'alles weigeren', 'weigeren', 'alleen noodzakelijk', 'alleen functioneel',
  // Portuguese
  'rejeitar tudo', 'apenas necessários', 'recusar',
  // Polish
  'odrzuć wszystkie', 'tylko niezbędne',
];

const STRICT_KEYWORDS = [
  'reject all', 'decline all', 'deny all', 'refuse all',
  'necessary only', 'essential only', 'only necessary', 'only essential',
  'continue without agreeing', 'continue without accepting',
  'necessary cookies only', 'essential cookies only',
  'use limited data',
  'alle ablehnen', 'tout refuser', 'refuser tout',
  'rechazar todo', 'rifiuta tutto', 'alles weigeren', 'rejeitar tudo',
];

// ── Known CMP container selectors ─────────────────────────────────────────────
const BANNER_CONTAINER_SELS = [
  '[id*="cookie"]', '[class*="cookie"]',
  '[id*="consent"]', '[class*="consent"]',
  '[id*="gdpr"]', '[class*="gdpr"]',
  '[id*="privacy"]', '[class*="privacy-banner"]', '[class*="privacy-notice"]',
  '[class*="CookieBanner"]', '[id*="CookieBanner"]',
  '.cc-window', '.cc-banner', '.cc-dialog',
  '#cookie-bar', '#cookie-notice', '#cookie-law-info-bar',
  '.cookie-popup', '#cookie-popup', '.cookie-consent',
  '[aria-label*="cookie" i]', '[aria-label*="consent" i]',
  '[aria-label*="privacy" i]',
  '[role="dialog"]', '[role="alertdialog"]',
  '[id^="sp_message"]', '[class*="sp_message"]',
  '#onetrust-banner-sdk', '.onetrust-pc-dark-filter',
  '#CybotCookiebotDialog',
  '#didomi-popup', '#didomi-host',
  '[class*="CmpOverlay"]', '[class*="cmp-overlay"]',
  '[class*="usercentrics"]', '[id*="usercentrics"]',
  '.cmp-container', '#cmp-container',
  '[class*="truste"]', '[id*="truste"]',
];

// ── Visibility check ──────────────────────────────────────────────────────────
function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = window.getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05;
}

// ── Signal block (for API-based methods that don't click a DOM element) ───────
function signalBlock() {
  alreadyBlocked = true;
  if (window._dyp_isOptoutPage) return;
  chrome.runtime.sendMessage({ type: 'TRACKER_BLOCKED' });
  if (isMainFrame) {
    showToast();
  } else {
    try { window.parent.postMessage({ type: 'DYP_IFRAME_BLOCKED' }, '*'); } catch (_) {}
  }
}

// ── Programmatic CMP APIs ─────────────────────────────────────────────────────

function tryOneTrustAPI() {
  try {
    if (window.OneTrust && typeof window.OneTrust.RejectAll === 'function') {
      window.OneTrust.RejectAll();
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

function tryUsercentricsAPI() {
  try {
    if (window.UC_UI && typeof window.UC_UI.denyAllConsents === 'function') {
      window.UC_UI.denyAllConsents();
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

function tryCookiebotAPI() {
  try {
    if (window.Cookiebot && typeof window.Cookiebot.decline === 'function') {
      window.Cookiebot.decline();
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

function tryAxeptioAPI() {
  try {
    if (window.axeptio && typeof window.axeptio.denyAll === 'function') {
      window.axeptio.denyAll();
      signalBlock();
      return true;
    }
    if (window._axeptio_ && typeof window._axeptio_.denyAll === 'function') {
      window._axeptio_.denyAll();
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

// ── Framework-specific DOM handlers ───────────────────────────────────────────
function tryOneTrust() {
  const btn = document.querySelector(
    '.ot-pc-refuse-all-handler, #onetrust-reject-all-handler, .onetrust-reject-all-handler, [onclick*="RejectAll"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

function tryCookiebot() {
  const btn = document.querySelector(
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll, #CybotCookiebotDialogBodyButtonDecline'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

function tryTrustArc() {
  const btn = document.querySelector('.trustarc-decline-btn, .pdynamicbutton .call');
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

function tryDidomi() {
  const btn = document.querySelector(
    '#didomi-notice-disagree-button, .didomi-button-highlight, [data-click="notice.disagree"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// ── Generic handler — three-tier search ──────────────────────────────────────
function tryGeneric() {
  for (const sel of BANNER_CONTAINER_SELS) {
    let containers;
    try { containers = document.querySelectorAll(sel); } catch (_) { continue; }
    for (const container of containers) {
      if (!isVisible(container)) continue;
      const btns = Array.from(
        container.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')
      ).filter(isVisible);
      for (const kw of CONTAINER_KEYWORDS) {
        const btn = btns.find(b => b.textContent.toLowerCase().trim().includes(kw));
        if (btn) { clickAndBlock(btn); return true; }
      }
    }
  }

  const overlayEls = document.querySelectorAll('div, section, aside, footer, header, form, article');
  for (const el of overlayEls) {
    if (!isVisible(el)) continue;
    const pos = window.getComputedStyle(el).position;
    if (pos !== 'fixed' && pos !== 'sticky' && pos !== 'absolute') continue;
    const elText = (el.textContent || '').toLowerCase();
    if (!elText.includes('cookie') && !elText.includes('consent') && !elText.includes('privacy')
        && !elText.includes('datenschutz') && !elText.includes('confidentialité')) continue;
    const btns = Array.from(
      el.querySelectorAll('button, [role="button"], a, input[type="button"]')
    ).filter(isVisible);
    for (const kw of CONTAINER_KEYWORDS) {
      const btn = btns.find(b => b.textContent.toLowerCase().trim().includes(kw));
      if (btn) { clickAndBlock(btn); return true; }
    }
  }

  // In CMP iframes we already know the context — use broader keywords to catch
  // CCPA "Do Not Sell" buttons and other privacy-specific actions.
  const tier3Keywords = isMainFrame ? STRICT_KEYWORDS : CONTAINER_KEYWORDS;
  const allBtns = Array.from(
    document.querySelectorAll('button, [role="button"], a, input[type="button"]')
  ).filter(isVisible);
  for (const kw of tier3Keywords) {
    const btn = allBtns.find(b => b.textContent.toLowerCase().trim().includes(kw));
    if (btn) { clickAndBlock(btn); return true; }
  }

  return false;
}

// ── Main scan ─────────────────────────────────────────────────────────────────
function scanAndBlock() {
  if (alreadyBlocked) return;
  // Programmatic APIs first (faster, no DOM needed)
  if (tryOneTrustAPI())    return;
  if (tryUsercentricsAPI()) return;
  if (tryCookiebotAPI())   return;
  if (tryAxeptioAPI())     return;
  // DOM-based
  if (tryOneTrust())  return;
  if (tryCookiebot()) return;
  if (tryTrustArc())  return;
  if (tryDidomi())    return;
  tryGeneric();
}

function clickAndBlock(btn) {
  alreadyBlocked = true;
  btn.click();
  if (window._dyp_isOptoutPage) return;
  chrome.runtime.sendMessage({ type: 'TRACKER_BLOCKED' });
  if (isMainFrame) {
    showToast();
  } else {
    try { window.parent.postMessage({ type: 'DYP_IFRAME_BLOCKED' }, '*'); } catch (_) {}
  }
}

// ── MutationObserver — watch for dynamically injected banners ─────────────────
function observeForBanners() {
  const target = document.body || document.documentElement;
  if (!target) return;
  const observer = new MutationObserver(() => {
    if (alreadyBlocked) { observer.disconnect(); return; }
    scanAndBlock();
  });
  observer.observe(target, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (chrome.runtime.lastError) return;
  if (response && response.blockingEnabled !== false) {
    scanAndBlock();
    observeForBanners();
    // Show toast when a child CMP iframe (e.g. Sourcepoint) signals it blocked
    if (isMainFrame) {
      window.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'DYP_IFRAME_BLOCKED'
            && !alreadyBlocked && !window._dyp_isOptoutPage) {
          alreadyBlocked = true;
          showToast();
        }
      });
    }
  }
});

// ── Toast (Shadow DOM — isolated from host page styles) ───────────────────────
function showToast() {
  const old = document.getElementById('__dypthost__');
  if (old) old.remove();

  const host = document.createElement('div');
  host.id = '__dypthost__';
  host.setAttribute('style', [
    'all:initial',
    'position:fixed',
    'bottom:20px',
    'right:20px',
    'z-index:2147483647',
    'pointer-events:none',
    'display:block',
    'max-width:280px',
  ].join('!important;') + '!important');

  const shadow = host.attachShadow({ mode: 'closed' });
  const toast = document.createElement('div');
  toast.textContent = "Tracker blocked. ICE can't follow you here.";
  toast.style.cssText = `
    background: #0f1117;
    color: #4fc3f7;
    border: 1px solid #4fc3f7;
    padding: 10px 14px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 2px;
    box-shadow: 0 0 12px rgba(79,195,247,0.3);
    word-wrap: break-word;
    white-space: normal;
    opacity: 1;
    transition: opacity 0.5s ease;
  `;
  shadow.appendChild(toast);
  (document.body || document.documentElement).appendChild(host);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => host.remove(), 600);
  }, 3000);
}

})(); // end IIFE
