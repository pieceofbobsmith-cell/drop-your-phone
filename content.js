// content.js — injected into every page at document_idle.
// Detects and dismisses cookie consent banners.
//
// CMP rule selectors adapted from autoconsent (MIT) by DuckDuckGo
// https://github.com/duckduckgo/autoconsent

(function () {

// ── Injection guard — prevent double-run if popup injects while manifest already ran ──
if (window.__dyp_content_injected) return;
window.__dyp_content_injected = true;

// ── Iframe guard ─────────────────────────────────────────────────────────────
const isMainFrame = window.top === window.self;
if (!isMainFrame) {
  const probe = (location.href + ' ' + (document.title || '')).toLowerCase();
  const isCmpFrame = /consent|gdpr|privacy|cookie|sourcepoint|quantcast|didomi|onetrust|cookiebot|trustarc|sp-prod|consensu\.org|privacy-mgmt|usercentrics|axeptio|consentmanager|iubenda/i.test(probe);
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

// Keywords that reveal a "manage settings" step (two-step banners)
const MANAGE_KEYWORDS = [
  'manage', 'customize', 'customise', 'preferences', 'settings', 'options',
  'cookie settings', 'cookie preferences', 'manage cookies', 'manage consent',
  'manage preferences', 'more options', 'cookie options',
  'verwalten', 'einstellungen', 'personnaliser', 'gérer', 'ajustes',
  'preferenze', 'instelling', 'configurar',
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
  // autoconsent additions
  '#qc-cmp2-ui', '.qc-cmp2-ui',
  '.iubenda-cs-banner', '#iubenda-cs-banner',
  '.cky-consent-container', '.cky-consent-bar',
  '#borlabs-cookie', '.borlabs-cookie',
  '.osano-cm-window', '#osano-cm-window',
  '.klaro', '#klaro',
  '#ccm-widget', '.ccm-widget',
  '#cmpbox', '.cmpbox', '#cmpbox2',
  '.cmplz-cookiebanner', '#cmplz-cookiebanner',
  '.termly-styles', '#termly-code-snippet-support',
  '.js-cookie-consent', '#js-cookie-consent',
  '.cookieConsent', '#cookieConsent',
  '[class*="cookielaw"]', '[id*="cookielaw"]',
  '[class*="cookie-notice"]', '[id*="cookie-notice"]',
  '[class*="cookie-banner"]', '[id*="cookie-banner"]',
  '[class*="cookie-bar"]', '[id*="cookie-bar"]',
  '[class*="cookie-wall"]', '[id*="cookie-wall"]',
  '[class*="cookie-modal"]', '[id*="cookie-modal"]',
  '[class*="cookie-overlay"]', '[id*="cookie-overlay"]',
  '[class*="cookie-alert"]', '[id*="cookie-alert"]',
  '[class*="cookie-box"]', '[id*="cookie-box"]',
  '[class*="cookie-message"]', '[id*="cookie-message"]',
  '[class*="cookie-ribbon"]', '[id*="cookie-ribbon"]',
  '[class*="cookie-dialog"]', '[id*="cookie-dialog"]',
  '#admiral-consent-overlay', '.admiral-consent',
  '.evidon-banner', '#evidon-banner',
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

// autoconsent: Quantcast Choice — uses __tcfapi or DOM
function tryQuantcastAPI() {
  try {
    if (typeof window.__tcfapi === 'function') {
      window.__tcfapi('postCustomConsent', 2, () => {}, [], [], []);
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

// autoconsent: Klaro API
function tryKlaroAPI() {
  try {
    if (window.klaro && typeof window.klaro.getManager === 'function') {
      const mgr = window.klaro.getManager();
      if (mgr) {
        mgr.declineAll();
        mgr.saveAndApplyConsents();
        signalBlock();
        return true;
      }
    }
  } catch (_) {}
  return false;
}

// autoconsent: Didomi API
function tryDidomiAPI() {
  try {
    if (window.Didomi && typeof window.Didomi.setUserDisagreeToAll === 'function') {
      window.Didomi.setUserDisagreeToAll();
      signalBlock();
      return true;
    }
  } catch (_) {}
  return false;
}

// autoconsent: ConsentManager.net API
function tryConsentManagerAPI() {
  try {
    if (window.__cmp && typeof window.__cmp === 'function') {
      window.__cmp('setConsent', 0, null);
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

// autoconsent: Quantcast Choice DOM
function tryQuantcast() {
  const btn = document.querySelector(
    '.qc-cmp2-summary-buttons button:first-child, ' +
    '.qc-cmp2-buttons-desktop button:first-child, ' +
    '[mode="summary"] button[mode="secondary"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Iubenda
function tryIubenda() {
  const btn = document.querySelector(
    '.iubenda-cs-reject-btn, #iubFooterBtn, .iub-cmp-reject-btn, ' +
    '[class*="iubenda"] [class*="reject"], [class*="iubenda"] [class*="decline"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: CookieYes / CookiePro
function tryCookieYes() {
  const btn = document.querySelector(
    '.cky-btn-reject, .cky-btn-decline, ' +
    '[data-cky-tag="reject-button"], [data-cky-tag="decline-button"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Borlabs Cookie
function tryBorlabs() {
  const btn = document.querySelector(
    '#CookiePrefManager-Save, .borlabs-cookie__btn--decline, ' +
    '[data-borlabs-cookie-decline], .borlabs-cookie .cookie-preference__btn--decline'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Osano
function tryOsano() {
  const btn = document.querySelector(
    '.osano-cm-denyAll, .osano-cm-deny, .osano-cm-button--type_denyAll, ' +
    '[data-osano-cm-action="decline"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Klaro DOM
function tryKlaro() {
  const btn = document.querySelector(
    '.klaro .cn-decline, .klaro button.decline, .klaro .cm-btn-danger, ' +
    '.klaro [data-action="decline"], #klaro .cn-decline'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: CCM19
function tryCCM19() {
  const btn = document.querySelector(
    '.ccm-decline-all, .ccm--decline-all, #ccm-widget .ccm-decline-button, ' +
    '[data-action="ccm-decline"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: consentmanager.net
function tryConsentManager() {
  const btn = document.querySelector(
    '#cmpbox .cmpbtnno, #cmpbox2 .cmpbtnno, .cmpboxbtnno, ' +
    '[id^="cmpbox"] .cmpboxbtnno, .cmptxt_btn_no'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Complianz
function tryComplianz() {
  const btn = document.querySelector(
    '#cmplz-btn-dismiss, .cmplz-deny, .cmplz-btn-deny, ' +
    '[data-action="cmplz_set_cookies"][data-category="deny"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Termly
function tryTermly() {
  const btn = document.querySelector(
    '#termly-code-snippet-support .t-declineBtn, ' +
    '.termly-styles [data-tid="banner-decline"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Admiral (Marfeel)
function tryAdmiral() {
  const btn = document.querySelector(
    '#admiral-consent-overlay .reject, .admiral-consent .reject, ' +
    '.admiral-p-centerPage .reject-all, [data-adm-action="reject"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Evidon
function tryEvidon() {
  const btn = document.querySelector(
    '.evidon-banner-decline-button, #evidon-prefdiag-decline, ' +
    '[id*="evidon"] [class*="decline"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Sirdata
function trySirdata() {
  const btn = document.querySelector(
    '.sd-cmp-2bBtn.sd-reject, [data-sdtest] .sd-cmp-1Qve'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: SourcePoint (expanded from original)
function trySourcePoint() {
  const btn = document.querySelector(
    '[title="Reject All"], [title="Reject all"], [title="REJECT ALL"], ' +
    'button[aria-label*="reject" i], button[aria-label*="decline" i], ' +
    '[class*="sp-dsar__matrix-cell"] [data-type="REJECT_ALL"], ' +
    '[class*="message-button"][data-choice-id="11"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: cookie-script.com
function tryCookieScript() {
  const btn = document.querySelector(
    '#cookiescript_reject, .cookiescript_checkbox_text[for*="decline"], ' +
    '.cookiescript_buttons #cookiescript_reject'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Real Cookie Banner (WordPress plugin)
function tryRealCookieBanner() {
  const btn = document.querySelector(
    '.rcb-btn-refuse, .rcb-content-blocker .rcb-btn-refuse, ' +
    '[data-rcb-action="refuse"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Cookie Information (Cookieinfo.net)
function tryCookieInformation() {
  const btn = document.querySelector(
    '#declineButton, .cookie-information-popup .btn-reject, ' +
    '#ci-cookiepopup-decline'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// autoconsent: Responsa / Piwik PRO
function tryPiwikPRO() {
  const btn = document.querySelector(
    '.ppms_cm_agree-to-basics, .ppms_cm_footer--decline, ' +
    '[data-ppms-cm-button="decline_all"]'
  );
  if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
  return false;
}

// ── Two-step handler ──────────────────────────────────────────────────────────
// Some banners hide "Reject all" behind a "Manage settings" step.
// We click "Manage/Settings", wait for the panel, then click "Reject all".
let twoStepAttempted = false;
function tryTwoStep() {
  if (twoStepAttempted) return false;

  // Find a visible banner that has manage/customize but NOT a direct reject button
  const allBtns = Array.from(
    document.querySelectorAll('button, [role="button"], a')
  ).filter(isVisible);

  const manageBtn = allBtns.find(b => {
    const t = b.textContent.toLowerCase().trim();
    return MANAGE_KEYWORDS.some(kw => t.includes(kw)) &&
           !CONTAINER_KEYWORDS.some(kw => t.includes(kw));
  });

  if (!manageBtn) return false;

  // Make sure we're inside a banner context
  const inBanner = BANNER_CONTAINER_SELS.some(sel => {
    try { return manageBtn.closest(sel) !== null; } catch (_) { return false; }
  });
  if (!inBanner) return false;

  twoStepAttempted = true;
  manageBtn.click();

  // After clicking, wait for the reject button to appear
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    const allBtns2 = Array.from(
      document.querySelectorAll('button, [role="button"], a')
    ).filter(isVisible);
    for (const kw of STRICT_KEYWORDS) {
      const btn = allBtns2.find(b => b.textContent.toLowerCase().trim().includes(kw));
      if (btn) {
        clearInterval(poll);
        clickAndBlock(btn);
        return;
      }
    }
    if (attempts >= 10) clearInterval(poll); // give up after 2s
  }, 200);

  return true;
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

  // 1. Programmatic APIs — fastest, most reliable
  if (tryOneTrustAPI())       return;
  if (tryUsercentricsAPI())   return;
  if (tryCookiebotAPI())      return;
  if (tryAxeptioAPI())        return;
  if (tryDidomiAPI())         return;
  if (tryKlaroAPI())          return;
  if (tryConsentManagerAPI()) return;
  if (tryQuantcastAPI())      return;

  // 2. Framework-specific DOM — targeted selectors
  if (tryOneTrust())          return;
  if (tryCookiebot())         return;
  if (tryTrustArc())          return;
  if (tryDidomi())            return;
  if (tryQuantcast())         return;
  if (tryIubenda())           return;
  if (tryCookieYes())         return;
  if (tryBorlabs())           return;
  if (tryOsano())             return;
  if (tryKlaro())             return;
  if (tryCCM19())             return;
  if (tryConsentManager())    return;
  if (tryComplianz())         return;
  if (tryTermly())            return;
  if (tryAdmiral())           return;
  if (tryEvidon())            return;
  if (trySirdata())           return;
  if (trySourcePoint())       return;
  if (tryCookieScript())      return;
  if (tryRealCookieBanner())  return;
  if (tryCookieInformation()) return;
  if (tryPiwikPRO())          return;

  // 3. Generic keyword scan
  if (tryGeneric())           return;

  // 4. Two-step (manage settings → reject all) — runs async, does not block
  tryTwoStep();
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
