// optout.js — content script injected on data broker opt-out pages.
// Runs after brokers.js (which defines the global BROKERS array).
//
// TWO MODES:
//   emailOnly brokers: fill email → submit → auto-close (background tab).
//   search-first brokers: fill the search form → click Search → STAY OPEN.
//     User solves any CAPTCHA, picks their record, clicks Opt Out, closes tab.
//     The tab NEVER auto-closes while filling is in progress.

(function () {
  const nativeInputSetter  = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,  'value').set;
  const nativeSelectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;

  chrome.storage.local.get(['optoutProfile'], ({ optoutProfile }) => {
    if (!optoutProfile) return;

    const hostname = location.hostname.replace(/^www\./, '');
    const broker = BROKERS.find(b => {
      try { return new URL(b.url).hostname.replace(/^www\./, '') === hostname; }
      catch { return false; }
    });

    if (!broker || broker.manual || broker.covered) return;
    if (!broker.selectors) return;

    // Tell content.js this is an opt-out page — don't count cookie dismissals here
    window._dyp_isOptoutPage = true;

    const sel = broker.selectors;
    const isEmailOnly = broker.emailOnly === true;

    // ── Help banner (Shadow DOM) ──────────────────────────────────────────────
    const showBanner = (msg) => {
      const host = document.createElement('div');
      host.setAttribute('style', [
        'all:initial','position:fixed','top:0','left:0','right:0',
        'z-index:2147483647','display:block',
      ].join('!important;') + '!important');
      const shadow = host.attachShadow({ mode: 'closed' });
      const bar = document.createElement('div');
      bar.style.cssText = `
        background:#0f1117;color:#4fc3f7;border-bottom:1px solid #4fc3f7;
        padding:8px 16px;font-family:'Courier New',monospace;font-size:11px;
        letter-spacing:0.04em;line-height:1.6;text-align:center;
      `;
      bar.textContent = msg;
      shadow.appendChild(bar);
      (document.body || document.documentElement).appendChild(host);
    };

    if (!isEmailOnly) {
      showBanner(
        'DROP YOUR PHONE \u2014 filling form\u2026  ' +
        'Solve any CAPTCHA \u2192 find your name in results \u2192 click Opt Out \u2192 close this tab. Next site opens automatically.'
      );
    }

    // ── Fill an <input> ──────────────────────────────────────────────────────
    const fillEl = (el, value) => {
      if (!el || !value) return false;
      el.focus();
      nativeInputSetter.call(el, value);
      try { el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: value })); } catch (_) {}
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
      return true;
    };

    // ── Find an input: broker selector → autocomplete → name/id variants → placeholder ─
    const findInput = (brokerSel, type) => {
      if (brokerSel) {
        const el = document.querySelector(brokerSel);
        if (el && el.tagName === 'INPUT') return el;
      }
      const acMap = {
        firstName: 'given-name', lastName: 'family-name', email: 'email',
        city: 'address-level2', street: 'street-address', zip: 'postal-code', phone: 'tel',
      };
      if (acMap[type]) {
        const el = document.querySelector(`input[autocomplete="${acMap[type]}"]`);
        if (el) return el;
      }
      const nameMap = {
        firstName: ['firstName','first_name','fname','fname1','givenName','given_name','first','FirstName','q3_name[first]'],
        lastName:  ['lastName','last_name','lname','lname1','familyName','family_name','last','surname','LastName','q3_name[last]'],
        email:     ['email','emailAddress','email_address','Email','q7_email','login-email'],
        city:      ['city','cityName','city_name','City'],
        street:    ['address','street','streetAddress','street_address','address1','addr1','Address','input_11_addr_line1'],
        zip:       ['zip','zipCode','zip_code','postalCode','postal_code','postcode','Zip','input_11_postal'],
        phone:     ['phone','phoneNumber','phone_number','telephone','tel','mobile','Phone'],
      };
      for (const n of (nameMap[type] || [])) {
        const el = document.querySelector(`input[name="${n}"], input[id="${n}"]`);
        if (el) return el;
      }
      const phMap = {
        firstName: 'first', lastName: 'last', email: 'email',
        city: 'city', street: 'address', zip: 'zip', phone: 'phone',
      };
      if (phMap[type]) {
        const el = document.querySelector(`input[placeholder*="${phMap[type]}" i]`);
        if (el) return el;
      }
      if (type === 'email')  return document.querySelector('input[type="email"]') || null;
      if (type === 'phone')  return document.querySelector('input[type="tel"]') || null;
      if (type === 'zip')    return document.querySelector('input[name*="zip" i], input[id*="zip" i], input[name*="postal" i]') || null;
      if (type === 'street') return document.querySelector('input[name*="address" i], input[id*="address" i], input[placeholder*="street" i]') || null;
      return null;
    };

    // ── Find a <select> for state ─────────────────────────────────────────────
    const findSelect = (brokerSel) => {
      if (brokerSel) {
        const el = document.querySelector(brokerSel);
        if (el && el.tagName === 'SELECT') return el;
      }
      return document.querySelector(
        'select[name*="state" i], select[id*="state" i], select[autocomplete="address-level1"]'
      );
    };

    // ── Fill a <select> by value then option text ─────────────────────────────
    const fillSelect = (el, value) => {
      if (!el || !value) return false;
      nativeSelectSetter.call(el, value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (!el.value) {
        for (const opt of el.options) {
          if (opt.text.toLowerCase().includes(value.toLowerCase()) ||
              opt.value.toLowerCase() === value.toLowerCase()) {
            opt.selected = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
      return !!el.value;
    };

    // ── Click a consent/terms checkbox if present ─────────────────────────────
    const clickCheckbox = (brokerSel) => {
      if (!brokerSel) return false;
      const el = document.querySelector(brokerSel);
      if (!el) return false;
      if (!el.checked) el.click();
      return true;
    };

    // ── isFormReady: submit button + at least one expected field present ───────
    const isFormReady = () => {
      if (!sel.submit || !document.querySelector(sel.submit)) return false;
      if (isEmailOnly) return !!(findInput(sel.email, 'email') || findInput(null, 'email'));
      return !!(
        findInput(sel.firstName, 'firstName') ||
        findInput(sel.lastName,  'lastName')  ||
        findInput(sel.email,     'email')
      );
    };

    // ── waitForForm: MutationObserver until ready, 600ms settle ──────────────
    const waitForForm = (timeoutMs, cb) => {
      if (isFormReady()) { setTimeout(cb, 600); return; }
      const root = document.body || document.documentElement;
      if (!root) { cb(); return; }
      const obs = new MutationObserver(() => {
        if (isFormReady()) { obs.disconnect(); clearTimeout(t); setTimeout(cb, 600); }
      });
      obs.observe(root, { childList: true, subtree: true });
      const t = setTimeout(() => { obs.disconnect(); cb(); }, timeoutMs);
    };

    // ── Main ──────────────────────────────────────────────────────────────────
    waitForForm(15000, () => {
      // Tell background to cancel the forced-close alarm — we're actively filling.
      // A 15-min replacement alarm will be set so abandoned tabs still eventually close.
      chrome.runtime.sendMessage({ type: 'FILLING_STARTED' });

      const firstEl  = findInput(sel.firstName, 'firstName');
      const lastEl   = findInput(sel.lastName,  'lastName');
      const emailEl  = findInput(sel.email,     'email');
      const cityEl   = findInput(sel.city,      'city');
      const streetEl = findInput(sel.street,    'street');
      const zipEl    = findInput(sel.zip,       'zip');
      const phoneEl  = findInput(sel.phone,     'phone');
      const stateEl  = findSelect(sel.state);

      let filled = 0;
      if (fillEl(firstEl,  optoutProfile.firstName)) filled++;
      if (fillEl(lastEl,   optoutProfile.lastName))  filled++;
      if (fillEl(emailEl,  optoutProfile.email))     filled++;
      if (fillEl(cityEl,   optoutProfile.city))      filled++;
      if (fillEl(streetEl, optoutProfile.street))    filled++;
      if (fillEl(zipEl,    optoutProfile.zip))       filled++;
      if (fillEl(phoneEl,  optoutProfile.phone))     filled++;
      if (fillSelect(stateEl, optoutProfile.state))  filled++;
      // Consent/terms checkboxes (e.g. PeopleConnect suppression center)
      if (clickCheckbox(sel.checkbox)) filled++;

      // Nothing filled — leave tab open, background 15-min alarm will close it
      if (filled === 0) return;

      setTimeout(() => {
        const btn = document.querySelector(sel.submit);
        if (!btn) return;
        const form = btn.closest('form') || document.querySelector('form');
        if (form) form.noValidate = true;
        btn.click();

        if (isEmailOnly) {
          // Background tab: close after confirmation page loads (~7s).
          // The 15-min alarm in background.js is the safety net if this fails.
          setTimeout(() => chrome.runtime.sendMessage({ type: 'CLOSE_ME' }), 7000);
        }
        // search-first: tab stays open. User handles CAPTCHA + record selection.
        // Closes when user closes it, triggering the next broker.
      }, 800);
    });
  });
})();
