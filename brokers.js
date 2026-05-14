// brokers.js — loaded by popup.html and optout.js content scripts.
//
// Broker list sourced from:
//   Big Ass Data Broker Opt-Out List (BADBOOL) by Yael Writes
//   https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List (MIT)
//
// Fields:
//   emailOnly: true  → background tab, auto-fills email (+ optional name) + submits, auto-closes
//   emailOnly: false → foreground tab, fills search form, user picks record + closes tab
//   manual: true     → not queued; Open button shown with step-by-step instructions
//   covered: true    → handled by another broker; shown in list but not queued
//   selectors.checkbox     → a consent/terms checkbox to click before submitting
//   selectors.fullName     → a single combined first+last name field
//   selectors.emailConfirm → a confirm-email field (filled with same email value)

const BROKERS = [

  // ══════════════════════════════════════════════════════════════════════
  // EMAIL-ONLY — background tab, auto-fills form + submits, auto-closes.
  // No user interaction required.
  // ══════════════════════════════════════════════════════════════════════

  // ── CheckPeople / FreePeopleSearch (same platform) ────────────────────────
  {
    id: 'checkpeople', name: 'CheckPeople',
    url: 'https://checkpeople.com/opt-out',
    emailOnly: true,
    selectors: { email: 'input#requestorEmail', checkbox: 'input#acknowledge', submit: 'button.cp-auto-optout__button' },
  },
  {
    id: 'freepeoplesearch', name: 'FreePeopleSearch',
    url: 'https://freepeoplesearch.com/opt-out',
    emailOnly: true,
    selectors: { email: 'input#requestorEmail', checkbox: 'input#acknowledge', submit: 'input.fps-auto-optout__button' },
  },

  // ── OfficialUSA / ClustrMaps (same platform) ─────────────────────────────
  {
    id: 'officialusa', name: 'OfficialUSA',
    url: 'https://www.officialusa.com/opt-out/',
    emailOnly: true,
    selectors: { email: 'input[name="inputEmail"]', submit: 'button.fndprs' },
  },
  {
    id: 'clustrmaps', name: 'ClustrMaps',
    url: 'https://clustrmaps.com/bl/opt-out',
    emailOnly: true,
    selectors: { email: 'input[name="inputEmail"]', submit: 'button.submit-comment' },
  },

  // ── TruePeopleSearch ──────────────────────────────────────────────────────
  {
    id: 'truepeoplesearch', name: 'TruePeopleSearch',
    url: 'https://www.truepeoplesearch.com/removal',
    emailOnly: true,
    selectors: { email: 'input[name="email"], input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
  },

  // ── SearchPeopleFree — name + email + Turnstile (auto-solved in real Chrome)
  {
    id: 'searchpeoplefree', name: 'SearchPeopleFree',
    url: 'https://www.searchpeoplefree.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input#o_first',
      lastName:  'input#o_last',
      email:     'input#o_email',
      checkbox:  'input#o_terms',
      submit:    'button#o_submit',
    },
  },

  // ── Nuwber — specific selectors required (multiple forms on page) ─────────
  {
    id: 'nuwber', name: 'Nuwber',
    url: 'https://nuwber.com/removal/link',
    emailOnly: true,
    selectors: { email: 'input#removebylink-email', submit: 'button.js-touch-trigger' },
  },

  // ── USPhoneBook — name + email form (URL changed to /removal) ────────────
  {
    id: 'usphonebook', name: 'USPhoneBook',
    url: 'https://www.usphonebook.com/removal',
    emailOnly: true,
    selectors: {
      firstName: 'input#subject-firstname',
      lastName:  'input#subject-lastname',
      email:     'input#subject-email',
      checkbox:  'input#agreement',
      submit:    'button#BRP',
    },
  },

  // ── PeopleSearchNow — name + email form (same platform as USPhoneBook) ────
  {
    id: 'peoplesearchnow', name: 'PeopleSearchNow',
    url: 'https://www.peoplesearchnow.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input#subject-firstname',
      lastName:  'input#subject-lastname',
      email:     'input#subject-email',
      checkbox:  'input#agreement',
      submit:    'button#BRP',
    },
  },

  // ── IDCrawl — email + confirm-email form (URL changed to /remove-my-information)
  {
    id: 'idcrawl', name: 'IDCrawl',
    url: 'https://www.idcrawl.com/remove-my-information',
    emailOnly: true,
    selectors: {
      email:        'input[name="email"]',
      emailConfirm: 'input[name="email-confirm"]',
      submit:       'button[type="submit"], input[type="submit"]',
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH-FIRST (foreground tab — we fill the search form, user picks record)
  // ══════════════════════════════════════════════════════════════════════

  // ── FastPeopleSearch — multi-step Alpine.js form (URL changed to /optout) ─
  {
    id: 'fastpeoplesearch', name: 'FastPeopleSearch',
    url: 'https://www.fastpeoplesearch.com/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input#firstname',
      lastName:  'input#lastname',
      email:     'input#email',
      checkbox:  'input[name="legal"]',
      submit:    'button[type="submit"]',
    },
    instructions: 'Form is pre-filled. Select "The subject of this request" from the dropdown → click Submit → verify via email.',
  },

  // ── PeopleConnect network — ONE suppression covers all brands ─────────────
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

  // ── BeenVerified network (URL changed to /svc/optout) ────────────────────
  {
    id: 'beenverified', name: 'BeenVerified',
    url: 'https://www.beenverified.com/svc/optout/search/optouts',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"]',
      lastName:  'input[name="ln"]',
      submit:    'button[type="submit"]',
    },
    instructions: 'Auto-fills name. Complete Turnstile → Search → find your record → Opt Out → verify via email. Also removes PeopleSmart, PeopleLooker, BackgroundAlert.',
  },
  { id: 'peoplesmart',      name: 'PeopleSmart',     url: 'https://www.peoplesmart.com/optout-go',              covered: true, instructions: 'Covered by BeenVerified opt-out.' },
  { id: 'peoplelooker',     name: 'PeopleLooker',    url: 'https://www.peoplelooker.com/f/optout/search',       covered: true, instructions: 'Covered by BeenVerified opt-out.' },
  { id: 'backgroundalert',  name: 'BackgroundAlert', url: 'https://www.backgroundalert.com/optout/',            covered: true, instructions: 'Covered by BeenVerified opt-out.' },

  // ── PeopleFinders network ─────────────────────────────────────────────────
  {
    id: 'peoplefinders', name: 'PeopleFinders',
    url: 'https://www.peoplefinders.com/opt-out',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstname"], input[placeholder*="first" i]',
      lastName:  'input[name="lastname"], input[placeholder*="last" i]',
      state:     'select[name="state"], select[id*="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state. Click Search → find your record → opt out → verify email.',
  },

  // ── SearchQuarry / RecordsFinder / CourtCaseFinder (InfoPay platform) ─────
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
  {
    id: 'recordsfinder', name: 'RecordsFinder',
    url: 'https://recordsfinder.com/optout/',
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
  {
    id: 'courtcasefinder', name: 'CourtCaseFinder',
    url: 'https://www.courtcasefinder.com/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_fname',
      lastName:  'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_lname',
      city:      'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_city',
      submit:    'button.form-btn',
    },
    instructions: 'Form is pre-filled. Click Submit → find your record → confirm opt-out.',
  },

  // ── ThatsThem — full info form ────────────────────────────────────────────
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

  // ── InfoTracer — name + state search ─────────────────────────────────────
  {
    id: 'infotracer', name: 'InfoTracer',
    url: 'https://infotracer.com/optout/',
    emailOnly: false,
    selectors: {
      firstName: 'input[placeholder="First Name *"]',
      lastName:  'input[placeholder="Last Name *"]',
      state:     'select',
      city:      'input[placeholder="City"]',
      submit:    'button[type="submit"]',
    },
    instructions: 'Form is pre-filled. Click Submit → find your record in results → opt out.',
  },

  // ── PublicInfoServices — full form + Cloudflare Turnstile ────────────────
  {
    id: 'publicinfoservices', name: 'PublicInfoServices',
    url: 'https://www.publicinfoservices.com/help-center/privacy-requests',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"]',
      lastName:  'input[placeholder="Last Name"]',
      city:      'input[name="city"]',
      state:     'select[name="States"]',
      zip:       'input[name="zip"]',
      email:     'input[name="email"]',
      submit:    'button[type="submit"]',
    },
    instructions: 'Form is pre-filled. Wait for Turnstile → verify form → click Submit.',
  },

  // ── PrivateRecords — name/city/state search ───────────────────────────────
  {
    id: 'privaterecords', name: 'PrivateRecords',
    url: 'https://www.privaterecords.net/api/helper/optOutLight/search',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"]',
      lastName:  'input[name="lname"]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      email:     'input[name="email"]',
      submit:    'input#pageFormSubmitBtn',
    },
    instructions: 'Form is pre-filled. Click Search → find your record → confirm removal.',
  },

  // ── CyberBackgroundChecks — name search ───────────────────────────────────
  {
    id: 'cyberbackgroundchecks', name: 'CyberBackgroundChecks',
    url: 'https://www.cyberbackgroundchecks.com/removal',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      state:     'select[name="state"], select[id*="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state. Click Search → select your record → Remove → verify email.',
  },

  // ── SmartBackgroundChecks — name + state search ───────────────────────────
  {
    id: 'smartbackgroundchecks', name: 'SmartBackgroundChecks',
    url: 'https://www.smartbackgroundchecks.com/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      state:     'select[name="state"], select[id*="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state. Click Search → select your record → Remove.',
  },

  // ── AdvancedBackgroundChecks — name + email (user solves reCAPTCHA) ───────
  {
    id: 'advancedbackgroundchecks', name: 'AdvancedBGChecks',
    url: 'https://www.advancedbackgroundchecks.com/removal',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"]',
      checkbox:  'input[type="checkbox"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email + checks authorization box. Solve reCAPTCHA → click Begin Removal → confirm via email.',
  },

  // ── FamilyTreeNow — user solves hCaptcha ─────────────────────────────────
  {
    id: 'familytreenow', name: 'FamilyTreeNow',
    url: 'https://www.familytreenow.com/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Solve hCaptcha → Begin Privacy Request → verify email → find and opt out your record.',
  },

  // ── Acxiom — name + email + address ──────────────────────────────────────
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://www.acxiom.com/optout/',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"]',
      street:    'input[name="address"], input[placeholder*="address" i]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      zip:       'input[name="zip"], input[name="postal"]',
      checkbox:  'input[type="checkbox"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name, email, and address. Check consent box → click Submit → confirm via email.',
  },

  // ── MyLife — JotForm (auto-fills all fields) ──────────────────────────────
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://mylife.jotform.com/260284407610047',
    emailOnly: false,
    selectors: {
      firstName: 'input[id*="first"], input[name*="first"]',
      lastName:  'input[id*="last"], input[name*="last"]',
      email:     'input[type="email"]',
      street:    'input[id*="addr_line1"], input[name*="addr_line1"]',
      city:      'input[id*="addr_city"], input[name*="addr_city"]',
      state:     'select[id*="addr_state"], input[id*="addr_state"]',
      zip:       'input[id*="addr_zip"], input[name*="postal"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills all fields. Solve reCAPTCHA → click Submit.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // MANUAL — requires profile URL, phone call, SSN verification, or account
  // ══════════════════════════════════════════════════════════════════════

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
    instructions: "1. Find your listing on whitepages.com and copy the URL. 2. Paste it into the suppression form. 3. Solve reCAPTCHA. 4. Enter phone number — you'll get an automated call. 5. Press 1 to confirm removal.",
  },
  {
    id: 'radaris', name: 'Radaris',
    url: 'https://radaris.com/control-privacy',
    manual: true,
    instructions: '1. Search your name on radaris.com. 2. Open your profile. 3. Click ⋮ → Control Info → Remove Info. 4. Enter email → solve reCAPTCHA → confirm via email.',
  },
  {
    id: 'lexisnexis', name: 'LexisNexis',
    url: 'https://optout.lexisnexis.com/',
    manual: true,
    instructions: 'Requires name, address, and last 4 digits of SSN to verify identity. Go to optout.lexisnexis.com and complete the multi-step form.',
  },

];
