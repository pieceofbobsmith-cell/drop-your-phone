// optout.js — content script injected on data broker opt-out pages.
// Runs after brokers.js (which defines the global BROKERS array).
//
// TWO MODES:
//   emailOnly brokers: fill email → submit → wait for navigation/success → auto-close.
//   search-first brokers: fill the search form → click Search → STAY OPEN.
//     User solves any CAPTCHA, picks their record, closes tab.
//
// CLOSE LOGIC (emailOnly):
//   1. After submit click, watch for:
//      a. Page navigates to a different URL → success; wait 2s then close.
//      b. A success/confirmation keyword appears in the DOM → close.
//      c. Fallback: 15s after submit click → close regardless.
//   2. Background has a 3-min alarm as final safety net.

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

    // ── Find an input ────────────────────────────────────────────────────────
    const findInput = (brokerSel, type) => {
      if (brokerSel) {
        const el = document.querySelector(brokerSel);
        if (el && el.tagName === 'INPUT') return el;
      }
      if (type === 'fullName') {
        return document.querySelector(
          'input[placeholder*="John Smith" i], input[placeholder*="full name" i], ' +
          'input[name*="fullname" i], input[id*="fullname" i], input[name="name"]'
        ) || null;
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

    // ── Fill a <select> ───────────────────────────────────────────────────────
    const STATE_NAMES = {
      AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
      CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
      HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
      KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
      MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
      MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
      NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
      OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
      SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
      VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
      DC:'District of Columbia',
    };

    const fillSelect = (el, value) => {
      if (!el || !value) return false;
      // Try exact value first
      nativeSelectSetter.call(el, value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (el.value) return true;
      // Expand 2-letter abbreviation to full name and try again
      const expanded = STATE_NAMES[value.toUpperCase()] || value;
      nativeSelectSetter.call(el, expanded);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (el.value) return true;
      // Text/value scan with both abbreviation and full name
      const targets = [value.toLowerCase(), expanded.toLowerCase()];
      for (const opt of el.options) {
        if (targets.includes(opt.text.toLowerCase()) ||
            targets.includes(opt.value.toLowerCase()) ||
            opt.text.toLowerCase().includes(expanded.toLowerCase())) {
          opt.selected = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
      return !!el.value;
    };

    // ── Click a consent checkbox ──────────────────────────────────────────────
    const clickCheckbox = (brokerSel) => {
      if (!brokerSel) return false;
      const el = document.querySelector(brokerSel);
      if (!el) return false;
      if (!el.checked) el.click();
      return true;
    };

    // ── isFormReady ───────────────────────────────────────────────────────────
    const isFormReady = () => {
      if (!sel.submit || !document.querySelector(sel.submit)) return false;
      if (isEmailOnly) {
        return !!(findInput(sel.email, 'email') || findInput(null, 'email'));
      }
      return !!(
        findInput(sel.fullName,  'fullName')  ||
        findInput(sel.firstName, 'firstName') ||
        findInput(sel.lastName,  'lastName')  ||
        findInput(sel.email,     'email')
      );
    };

    // ── waitForForm ───────────────────────────────────────────────────────────
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

    // ── waitForClose (emailOnly only) ─────────────────────────────────────────
    // After clicking submit, wait for a real signal before closing:
    //   1. Page navigates to a different path (form submitted → confirmation page)
    //   2. A success/thank-you keyword appears in the DOM
    //   3. Fallback: 15 seconds after submit click
    const waitForClose = () => {
      const startUrl = location.href;
      const successKeywords = [
        'thank you','thanks','confirmed','success','submitted','received',
        'opt-out complete','opt out complete','removal request','been removed',
        'will be removed','request received','check your email','verify your email',
        'confirmation sent','email sent','done','completed',
      ];

      const checkSuccess = () => {
        const body = (document.body || document.documentElement).innerText.toLowerCase();
        return successKeywords.some(kw => body.includes(kw));
      };

      // Watch for DOM success keywords
      let closed = false;
      const doClose = () => {
        if (closed) return;
        closed = true;
        chrome.runtime.sendMessage({ type: 'CLOSE_ME' });
      };

      // Check immediately (some sites update DOM synchronously)
      if (location.href !== startUrl || checkSuccess()) {
        setTimeout(doClose, 2000);
        return;
      }

      // MutationObserver for success keywords appearing in DOM
      const obs = new MutationObserver(() => {
        if (location.href !== startUrl || checkSuccess()) {
          obs.disconnect();
          clearTimeout(fallback);
          setTimeout(doClose, 2000); // 2s grace — let the page fully render
        }
      });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });

      // Fallback: close after 15 seconds no matter what
      const fallback = setTimeout(() => {
        obs.disconnect();
        doClose();
      }, 15000);
    };

    // ── Main ──────────────────────────────────────────────────────────────────
    waitForForm(15000, () => {
      if (!isEmailOnly) {
        chrome.runtime.sendMessage({ type: 'FILLING_STARTED' });
      }

      const fullNameEl     = findInput(sel.fullName, 'fullName');
      const firstEl        = findInput(sel.firstName, 'firstName');
      const lastEl         = findInput(sel.lastName,  'lastName');
      const emailEl        = findInput(sel.email,     'email');
      const emailConfirmEl = sel.emailConfirm ? document.querySelector(sel.emailConfirm) : null;
      const cityEl         = findInput(sel.city,      'city');
      const streetEl       = findInput(sel.street,    'street');
      const zipEl          = findInput(sel.zip,       'zip');
      const phoneEl        = findInput(sel.phone,     'phone');
      const stateEl        = findSelect(sel.state);

      let filled = 0;
      const fullName = (optoutProfile.firstName + ' ' + optoutProfile.lastName).trim();
      if (fillEl(fullNameEl, fullName))                  filled++;
      if (fillEl(firstEl,  optoutProfile.firstName))     filled++;
      if (fillEl(lastEl,   optoutProfile.lastName))      filled++;
      if (fillEl(emailEl,        optoutProfile.email))   filled++;
      if (fillEl(emailConfirmEl, optoutProfile.email))   filled++;
      if (fillEl(cityEl,         optoutProfile.city))    filled++;
      if (fillEl(streetEl, optoutProfile.street))        filled++;
      if (fillEl(zipEl,    optoutProfile.zip))           filled++;
      if (fillEl(phoneEl,  optoutProfile.phone))         filled++;
      if (fillSelect(stateEl, optoutProfile.state))      filled++;
      if (clickCheckbox(sel.checkbox))                   filled++;

      if (filled === 0) return;

      // Wait for button to be enabled (Turnstile, React state, etc.)
      // emailOnly: up to 100 × 200ms = 20s (covers Cloudflare Turnstile auto-solve)
      // search-first: up to 6 × 200ms = 1.2s
      const clickWhenReady = (attempts, delayMs) => {
        const btn = document.querySelector(sel.submit);
        if (!btn) return;
        if (btn.disabled && attempts > 0) {
          setTimeout(() => clickWhenReady(attempts - 1, delayMs), delayMs);
          return;
        }
        const form = btn.closest('form') || document.querySelector('form');
        if (form) form.noValidate = true;
        btn.click();

        if (isEmailOnly) {
          // Wait for navigation or success keywords before closing
          waitForClose();
        }
      };

      setTimeout(() => clickWhenReady(isEmailOnly ? 100 : 6, 200), 800);
    });
  });
})();
