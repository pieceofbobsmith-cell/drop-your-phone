// brokers.js — loaded by popup.html and optout.js content scripts.
//
// Fields:
//   emailOnly: true  → background tab, auto-fills email + submits, auto-closes
//   emailOnly: false → foreground tab, fills search form, user picks record + closes tab
//   manual: true     → not queued; Open button shown with step-by-step instructions
//   covered: true    → handled by another broker; shown in list but not queued
//   selectors.checkbox → a consent/terms checkbox to click before submitting
//   selectors.fullName → a single combined first+last name field

const BROKERS = [

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH-FIRST (foreground tab — we fill the search form, user picks record)
  // ══════════════════════════════════════════════════════════════════════

  // ── PeopleConnect network — ONE suppression covers all brands ─────────────
  // Confirmed working. Covers: TruthFinder, InstantCheckmate, Intelius,
  //   ZabaSearch, US Search, AnyWho, Addresses.com, PeopleLookup,
  //   NeighborWho, ReversePhoneLookup.com
  // DOM verified 2026-05-13: email input[name="login-email"], checkbox input[name="consent"],
  //   submit button[type="submit"] — NOT disabled on load, both fields required.
  {
    id: 'peopleconnect', name: 'PeopleConnect Suppression Center',
    url: 'https://suppression.peopleconnect.us/login',
    emailOnly: false,
    selectors: {
      email:    'input[name="login-email"]',
      checkbox: 'input[name="consent"]',
      submit:   'button[type="submit"]',
    },
    instructions: 'Auto-fills email + checks consent. Click Continue → check email → click verification link → enter name & DOB → find and suppress your record. Covers TruthFinder, InstantCheckmate, Intelius, ZabaSearch, US Search, AnyWho, Addresses.com.',
  },
  { id: 'truthfinder',        name: 'TruthFinder',           url: 'https://www.truthfinder.com/opt-out/',         covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'instantcheckmate',   name: 'Instant Checkmate',     url: 'https://www.instantcheckmate.com/opt-out/',    covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'intelius',           name: 'Intelius',              url: 'https://www.intelius.com/opt-out/',            covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'zabasearch',         name: 'ZabaSearch',            url: 'https://www.zabasearch.com/block_records/',    covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'ussearch',           name: 'US Search',             url: 'https://www.ussearch.com/opt-out/',            covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'anywho',             name: 'AnyWho',                url: 'https://www.anywho.com/opt-out',               covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'addresses',          name: 'Addresses.com',         url: 'https://www.addresses.com/optout',             covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'peoplelookup',       name: 'PeopleLookup',          url: 'https://www.peoplelookup.com/opt-out',         covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'neighborwho',        name: 'NeighborWho',           url: 'https://neighborwho.com/opt-out',              covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'reversephonelookup', name: 'ReversePhoneLookup',    url: 'https://www.reversephonelookup.com/opt-out',   covered: true, instructions: 'Covered by PeopleConnect Suppression Center (Intelius).' },

  // ── FamilyTreeNow — Cloudflare-blocked as of 2026-05-13 ──────────────────
  {
    id: 'familytreenow', name: 'FamilyTreeNow',
    url: 'https://www.familytreenow.com/optout',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Fill first name, last name, email → solve hCaptcha → click Begin Privacy Request → verify email → find and opt out your record.',
  },

  // ── SearchQuarry — DOM verified 2026-05-13: uses long ASP.NET model-binding IDs ─
  {
    id: 'searchquarry', name: 'SearchQuarry',
    url: 'https://members.searchquarry.com/opt-out',
    emailOnly: false,
    selectors: {
      firstName: 'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_fname',
      lastName:  'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_lname',
      state:     'select#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_state',
      city:      'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_city',
      submit:    'button.form-btn',
    },
    instructions: 'Form is pre-filled. Click Submit → find your record → confirm opt-out.',
  },

  // ── ThatsThem — Spokeo-operated, confirmed working (full name + address + phone) ─
  {
    id: 'thatsthem', name: "That'sThem",
    url: 'https://thatsthem.com/optout',
    emailOnly: false,
    selectors: {
      fullName: 'input[placeholder="John Smith"]',
      street:   'input[placeholder="123 Main St"]',
      city:     'input[placeholder="Seattle"]',
      state:    'select',
      zip:      'input[placeholder="98101"]',
      email:    'input[placeholder="john@example.com"]',
      phone:    'input[placeholder="(206) 555-1234"]',
      submit:   'button[type="submit"]',
    },
    instructions: 'Form is pre-filled with your details. Click Submit Opt-Out Request.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // EMAIL-ONLY (background tab — confirmed working, auto-closes)
  // ══════════════════════════════════════════════════════════════════════

  // ── CheckPeople — DOM verified 2026-05-13 ─────────────────────────────────
  // Requires: email (input#requestorEmail) + consent checkbox (input#acknowledge).
  // Button (button.cp-auto-optout__button) enables after both are filled.
  {
    id: 'checkpeople', name: 'CheckPeople',
    url: 'https://checkpeople.com/opt-out',
    emailOnly: true,
    selectors: {
      email:    'input#requestorEmail',
      checkbox: 'input#acknowledge',
      submit:   'button.cp-auto-optout__button',
    },
    instructions: 'Auto-fills email + checks consent → Continue → verify via email link.',
  },
  // ── FreePeopleSearch — DOM verified 2026-05-13 ───────────────────────────
  // Same pattern as CheckPeople. Submit is <input type="submit"> not <button>.
  {
    id: 'freepeoplesearch', name: 'FreePeopleSearch',
    url: 'https://freepeoplesearch.com/opt-out',
    emailOnly: true,
    selectors: {
      email:    'input#requestorEmail',
      checkbox: 'input#acknowledge',
      submit:   'input.fps-auto-optout__button',
    },
    instructions: 'Auto-fills email + checks consent → Continue → verify via email link.',
  },
  // ── OfficialUSA — DOM verified 2026-05-13 ───────────────────────────────
  // Has Cloudflare Turnstile that auto-solves in real Chrome (~2-5s).
  // Button (button.fndprs) stays disabled until Turnstile completes.
  // optout.js clickWhenReady retries up to 20s to handle Turnstile delay.
  {
    id: 'officialusa', name: 'OfficialUSA',
    url: 'https://www.officialusa.com/opt-out/',
    emailOnly: true,
    selectors: {
      email:  'input[name="inputEmail"]',
      submit: 'button.fndprs',
    },
    instructions: 'Auto-fills email → waits for Turnstile → Next Step → opt-out submitted.',
  },
  // ── ClustrMaps — DOM verified 2026-05-13 ────────────────────────────────
  // Same backend/Turnstile as OfficialUSA.
  {
    id: 'clustrmaps', name: 'ClustrMaps',
    url: 'https://clustrmaps.com/bl/opt-out',
    emailOnly: true,
    selectors: {
      email:  'input[name="inputEmail"]',
      submit: 'button.submit-comment',
    },
    instructions: 'Auto-fills email → waits for Turnstile → Next Step → verify via email link.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // MANUAL — Cloudflare-blocked, needs profile URL, or multi-step CAPTCHA
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'beenverified', name: 'BeenVerified',
    url: 'https://www.beenverified.com/app/optout/search',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Search your name → select your record → Opt Out → confirm via email.',
  },
  {
    id: 'peoplesmart', name: 'PeopleSmart',
    url: 'https://www.peoplesmart.com/optout-go',
    manual: true,
    instructions: 'BeenVerified network — must open manually. Search your name → select record → confirm via email.',
  },
  { id: 'backgroundalert', name: 'BackgroundAlert', url: 'https://www.backgroundalert.com/optout/', covered: true, instructions: 'Covered by BeenVerified / PeopleSmart network.' },

  {
    id: 'nuwber', name: 'Nuwber',
    url: 'https://nuwber.com/removal/link',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Enter email → click removal link in email.',
  },
  {
    id: 'peoplefinders', name: 'PeopleFinders',
    url: 'https://www.peoplefinders.com/opt-out',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Enter name → search → select record → Opt Out → verify email. Also removes FastPeopleSearch, TruePeopleSearch, SearchPeopleFree.',
  },
  { id: 'fastpeoplesearch', name: 'FastPeopleSearch', url: 'https://www.fastpeoplesearch.com/removal',  covered: true, instructions: 'Covered by PeopleFinders opt-out above.' },
  { id: 'truepeoplesearch', name: 'TruePeopleSearch', url: 'https://www.truepeoplesearch.com/removal',  covered: true, instructions: 'Covered by PeopleFinders opt-out above.' },
  { id: 'searchpeoplefree', name: 'SearchPeopleFree', url: 'https://www.searchpeoplefree.com/opt-out', covered: true, instructions: 'Covered by PeopleFinders opt-out above.' },

  {
    id: 'golookup', name: 'GoLookUp',
    url: 'https://golookup.com/opt-out',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Enter email → verify.',
  },
  {
    id: 'cyberbackgroundchecks', name: 'CyberBackgroundChecks',
    url: 'https://www.cyberbackgroundchecks.com/removal',
    manual: true,
    instructions: 'Cloudflare-protected — must open manually. Search name → select record → Remove → verify email.',
  },
  {
    id: 'spokeo', name: 'Spokeo',
    url: 'https://www.spokeo.com/optout',
    manual: true,
    instructions: '1. Search your name on spokeo.com and open your listing. 2. Copy the profile URL. 3. Paste it into the opt-out URL field. 4. Enter email. 5. Click Opt Out → confirm via email.',
  },
  {
    id: 'whitepages', name: 'WhitePages',
    url: 'https://www.whitepages.com/suppression-requests',
    manual: true,
    instructions: '1. Find your listing on whitepages.com and copy the URL. 2. Paste it into the suppression form. 3. Solve reCAPTCHA. 4. Enter phone number — you\'ll get an automated call. 5. Press 1 to confirm removal.',
  },
  {
    id: 'radaris', name: 'Radaris',
    url: 'https://radaris.com/control-privacy',
    manual: true,
    instructions: '1. Search your name on radaris.com. 2. Open your profile. 3. Click ⋮ → Control Info → Remove Info. 4. Enter email → solve reCAPTCHA → confirm via email.',
  },
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://mylife.jotform.com/260284407610047',
    manual: true,
    instructions: '1. Fill in name, email, birth year, and address on the JotForm. 2. Optionally paste your MyLife profile URL. 3. Solve reCAPTCHA. 4. Click Submit.',
  },
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://www.acxiom.com/optout/',
    manual: true,
    instructions: '1. On the Acxiom Privacy Center, fill your name, email, and address in the "US Individual Opt Out" form. 2. Check the consent box. 3. Click Submit. 4. Confirm via email.',
  },
  {
    id: 'idcrawl', name: 'IDCrawl',
    url: 'https://www.idcrawl.com/opt-out',
    manual: true,
    instructions: '1. Search your name on idcrawl.com. 2. Copy your profile URL. 3. On the opt-out page, paste the URL + enter email. 4. Solve reCAPTCHA. 5. Click Submit → confirm via email.',
  },
  {
    id: 'advancedbackgroundchecks', name: 'AdvancedBGChecks',
    url: 'https://www.advancedbackgroundchecks.com/removal',
    manual: true,
    instructions: '1. Fill first name, last name, and email. 2. Check the authorization box. 3. Solve reCAPTCHA. 4. Click "Begin Removal Process". 5. Click the emailed link → complete details on the next form.',
  },
  {
    id: 'spydialer', name: 'SpyDialer',
    url: 'https://www.spydialer.com/consumers/',
    manual: true,
    instructions: '1. Click "Start". 2. Enter your phone number in the wizard. 3. Confirm removal.',
  },
  {
    id: 'freepeopledirectory', name: 'FreePeopleDirectory',
    url: 'https://www.freepeopledirectory.com/optout',
    manual: true,
    instructions: '1. Find your profile on freepeopledirectory.com and copy the URL. 2. Paste it into the removal form. 3. Click Submit.',
  },
  {
    id: 'zoominfo', name: 'ZoomInfo',
    url: 'https://www.zoominfo.com/privacy-center/privacy/profile-opt-out',
    manual: true,
    instructions: '1. Click "Manage Your Profile". 2. Enter your email. 3. Click the verification link. 4. Follow removal steps.',
  },

];
