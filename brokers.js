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

  // ── SearchPeopleFree ──────────────────────────────────────────────────────
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

  // ── Nuwber ────────────────────────────────────────────────────────────────
  {
    id: 'nuwber', name: 'Nuwber',
    url: 'https://nuwber.com/removal/link',
    emailOnly: true,
    selectors: { email: 'input#removebylink-email', submit: 'button.js-touch-trigger' },
  },

  // ── USPhoneBook / PeopleSearchNow (same platform) ────────────────────────
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

  // ── IDCrawl ───────────────────────────────────────────────────────────────
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

  // ── NeighborReport ────────────────────────────────────────────────────────
  {
    id: 'neighborreport', name: 'NeighborReport',
    url: 'https://neighbor.report/remove',
    emailOnly: true,
    selectors: { email: 'input[name="email"], input[type="email"]', submit: 'button[type="submit"]' },
  },

  // ── Pipl ─────────────────────────────────────────────────────────────────
  {
    id: 'pipl', name: 'Pipl',
    url: 'https://pipl.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Centeda ───────────────────────────────────────────────────────────────
  {
    id: 'centeda', name: 'Centeda',
    url: 'https://centeda.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── USA People Search ─────────────────────────────────────────────────────
  {
    id: 'usapeoplesearch', name: 'USA People Search',
    url: 'https://www.usa-people-search.com/manage/opt_out.aspx',
    emailOnly: true,
    selectors: {
      firstName: 'input[id*="FirstName"], input[name*="FirstName"]',
      lastName:  'input[id*="LastName"], input[name*="LastName"]',
      email:     'input[id*="Email"], input[type="email"]',
      submit:    'input[type="submit"], button[type="submit"]',
    },
  },

  // ── FreePeopleDirectory ───────────────────────────────────────────────────
  {
    id: 'freepeopledirectory', name: 'FreePeopleDirectory',
    url: 'https://www.freepeopledirectory.com/optout',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Vericora ──────────────────────────────────────────────────────────────
  {
    id: 'vericora', name: 'Vericora',
    url: 'https://vericora.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Spokeo (email opt-out form, background) ───────────────────────────────
  {
    id: 'spokeo-email', name: 'Spokeo (email opt-out)',
    url: 'https://www.spokeo.com/optout',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── InstantPeopleFinder ───────────────────────────────────────────────────
  {
    id: 'instantpeoplesearcher', name: 'InstantPeopleFinder',
    url: 'https://www.instantpeoplesearcher.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Addresses360 ─────────────────────────────────────────────────────────
  {
    id: 'addresses360', name: 'Addresses360',
    url: 'https://www.addresses360.com/opt-out',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Epsilon / AbiliTec (marketing data opt-out) ───────────────────────────
  {
    id: 'epsilon', name: 'Epsilon',
    url: 'https://www.epsilon.com/us/privacy-policy/opt-out',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Oracle Data Cloud / Datalogix ─────────────────────────────────────────
  {
    id: 'oracle-datacloud', name: 'Oracle Data Cloud',
    url: 'https://datacloudoptout.oracle.com/optout',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── LiveRamp ──────────────────────────────────────────────────────────────
  {
    id: 'liveramp', name: 'LiveRamp',
    url: 'https://liveramp.com/opt_out/',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Exactis ───────────────────────────────────────────────────────────────
  {
    id: 'exactis', name: 'Exactis',
    url: 'https://exactis.com/opt-out/',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Persopo ───────────────────────────────────────────────────────────────
  {
    id: 'persopo', name: 'Persopo',
    url: 'https://persopo.com/remove_record.php',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Rehold ────────────────────────────────────────────────────────────────
  {
    id: 'rehold', name: 'Rehold',
    url: 'https://rehold.com/opt-out',
    emailOnly: true,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Veromi ────────────────────────────────────────────────────────────────
  {
    id: 'veromi', name: 'Veromi',
    url: 'https://www.veromi.net/wp-content/privacy_optout.php',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="first"], input[placeholder*="first" i]',
      lastName:  'input[name="last"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'input[type="submit"], button[type="submit"]',
    },
  },

  // ── NewEnglandFacts ───────────────────────────────────────────────────────
  {
    id: 'newenglandfacts', name: 'NewEnglandFacts',
    url: 'https://newenglandfacts.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── USATrace ──────────────────────────────────────────────────────────────
  {
    id: 'usatrace', name: 'USATrace',
    url: 'https://www.usatrace.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },


  // ══════════════════════════════════════════════════════════════════════
  // SEARCH-FIRST (foreground tab — we fill the search form, user picks record)
  // ══════════════════════════════════════════════════════════════════════

  // ── FastPeopleSearch ──────────────────────────────────────────────────────
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

  // ── PeopleConnect network ─────────────────────────────────────────────────
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

  // ── BeenVerified network ──────────────────────────────────────────────────
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

  // ── InfoPay platform (shared .NET component IDs across all these sites) ───
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
  {
    id: 'officialblackbook', name: 'OfficialBlackBook',
    url: 'https://www.officialblackbook.com/optout/',
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
    id: 'usrecords', name: 'USRecords',
    url: 'https://www.usrecords.com/optout/',
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
    id: 'publicrecords365', name: 'PublicRecords365',
    url: 'https://www.publicrecords365.com/optout/',
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
    id: 'peoplefindfast', name: 'PeopleFindFast',
    url: 'https://www.peoplefindfast.com/optout/',
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
    id: 'publicrecordscentral', name: 'PublicRecordsCentral',
    url: 'https://www.publicrecordscentral.com/optout/',
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
    id: 'backgroundcheckrun', name: 'BackgroundCheck.run',
    url: 'https://backgroundcheck.run/optout/',
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
    id: 'checksecrets', name: 'CheckSecrets',
    url: 'https://www.checksecrets.com/optout/',
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
    id: 'freepublicrecordsdirectory', name: 'FreePublicRecordsDirectory',
    url: 'https://www.freepublicrecordsdirectory.com/optout/',
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
    id: 'peoplesearchmaster', name: 'PeopleSearchMaster',
    url: 'https://www.peoplesearchmaster.com/optout/',
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
    id: 'publicrecordsofficial', name: 'PublicRecordsOfficial',
    url: 'https://www.publicrecordsofficial.com/optout/',
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
    id: 'lookupanyone', name: 'LookupAnyone',
    url: 'https://www.lookupanyone.com/optout/',
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
    id: 'searchusa', name: 'SearchUSA',
    url: 'https://www.searchusa.com/optout/',
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
    id: 'peoplefindersus', name: 'PeopleFindersUS',
    url: 'https://www.peoplefindersus.com/optout/',
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
    id: 'inforver', name: 'Inforver',
    url: 'https://www.inforver.com/ng/control/privacy',
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
    id: 'publicrecordsview', name: 'PublicRecordsView',
    url: 'https://www.publicrecordsview.com/optout/',
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

  // ── ThatsThem ─────────────────────────────────────────────────────────────
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

  // ── InfoTracer ────────────────────────────────────────────────────────────
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

  // ── PublicInfoServices ────────────────────────────────────────────────────
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

  // ── PrivateRecords ────────────────────────────────────────────────────────
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

  // ── CyberBackgroundChecks ─────────────────────────────────────────────────
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

  // ── SmartBackgroundChecks ─────────────────────────────────────────────────
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

  // ── AdvancedBackgroundChecks ──────────────────────────────────────────────
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

  // ── FamilyTreeNow ─────────────────────────────────────────────────────────
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

  // ── Acxiom ────────────────────────────────────────────────────────────────
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

  // ── MyLife ────────────────────────────────────────────────────────────────
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

  // ── SocialCatfish ─────────────────────────────────────────────────────────
  {
    id: 'socialcatfish', name: 'SocialCatfish',
    url: 'https://socialcatfish.com/opt-out/?id=request_optout',
    emailOnly: false,
    selectors: {
      state:     'select',
      firstName: 'input[placeholder="e.g. David"]',
      lastName:  'input[placeholder="e.g. Smith"]',
      email:     'input[placeholder="e.g. davidsmith@email.com"]',
      submit:    'button.sc-btn--submit, button[class*="submit"]',
    },
    instructions: 'Auto-fills state, name, email. Click Submit Now.',
  },

  // ── Archives.com ──────────────────────────────────────────────────────────
  {
    id: 'archives', name: 'Archives.com',
    url: 'https://www.archives.com/optout',
    emailOnly: false,
    selectors: {
      firstName:    'input[aria-label*="First Name"]',
      lastName:     'input[aria-label*="Last Name"]',
      city:         'input[aria-label*="City"]',
      state:        'select[aria-label*="State"]',
      email:        'input[aria-label*="Your Email Address"]',
      emailConfirm: 'input[aria-label*="Confirm Your Email"]',
      checkbox:     'input[type="checkbox"]',
      submit:       'button[type="submit"]',
    },
    instructions: 'Auto-fills all fields. Click Submit.',
  },

  // ── PeekYou ───────────────────────────────────────────────────────────────
  {
    id: 'peekyou', name: 'PeekYou',
    url: 'https://www.peekyou.com/about/contact/ccpa_optout/do_not_sell',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      state:     'select[name="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name, email, state. Click Submit.',
  },

  // ── PimEyes ───────────────────────────────────────────────────────────────
  {
    id: 'pimeyes', name: 'PimEyes',
    url: 'https://pimeyes.com/en/opt-out-request-form',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit opt-out request.',
  },

  // ── BlockShopper ──────────────────────────────────────────────────────────
  {
    id: 'blockshopper', name: 'BlockShopper',
    url: 'https://blockshopper.com/page/opt_out',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + city + state + email. Click Submit.',
  },

  // ── PublicDataUSA ─────────────────────────────────────────────────────────
  {
    id: 'publicdatausa', name: 'PublicDataUSA',
    url: 'https://publicdatausa.com/remove.php',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── FreeBackgroundCheck ───────────────────────────────────────────────────
  {
    id: 'freebackgroundcheck', name: 'FreeBackgroundCheck',
    url: 'https://www.freebackgroundcheck.org/opt-out',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      state:     'select[name="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state. Click Search → find record → Remove.',
  },

  // ── PeopleByName ──────────────────────────────────────────────────────────
  {
    id: 'peoplebyname', name: 'PeopleByName',
    url: 'https://www.peoplebyname.com/remove.php',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── SpyFly ────────────────────────────────────────────────────────────────
  {
    id: 'spyfly', name: 'SpyFly',
    url: 'https://www.spyfly.com/help-center/privacy-requests',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── VoterRecords ──────────────────────────────────────────────────────────
  {
    id: 'voterrecords', name: 'VoterRecords',
    url: 'https://voterrecords.com/faq',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      state:     'select[name="state"]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state + email. Click Submit.',
  },

  // ── Wink ──────────────────────────────────────────────────────────────────
  {
    id: 'wink', name: 'Wink',
    url: 'https://wink.com/help/optout',
    emailOnly: false,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills email. Click Submit → verify via email.',
  },

  // ── PropertyRecs ──────────────────────────────────────────────────────────
  {
    id: 'propertyrecs', name: 'PropertyRecs',
    url: 'https://dashboard.propertyrecs.com/opt-out',
    emailOnly: false,
    selectors: {
      fullName: 'input[placeholder*="Full Name" i], input[placeholder*="Name" i]',
      city:     'input[placeholder*="City" i], input[placeholder*="State" i]',
      submit:   'button[type="submit"]',
    },
    instructions: 'Search for your record → click Remove next to your listing.',
  },

  // ── MugshotLookup ─────────────────────────────────────────────────────────
  {
    id: 'mugshotlookup', name: 'MugshotLookup',
    url: 'https://www.mugshotlookup.com/removal',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── FaceCheck.ID ──────────────────────────────────────────────────────────
  {
    id: 'facecheck', name: 'FaceCheck.ID',
    url: 'https://facecheck.id/Face-Search/RemoveMyPhotos',
    emailOnly: false,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills email. Upload a photo of yourself → click Submit to request removal.',
  },

  // ── Ancestry.com ──────────────────────────────────────────────────────────
  {
    id: 'ancestry', name: 'Ancestry.com',
    url: 'https://www.ancestry.com/cs/privacypolicy',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Use the Do Not Sell link → fill name + email → Submit.',
  },

  // ── 411.com ───────────────────────────────────────────────────────────────
  {
    id: '411', name: '411.com',
    url: 'https://www.411.com/privacy',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      state:     'select[name="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email + state. Click Submit.',
  },

  // ── SearchBug ─────────────────────────────────────────────────────────────
  {
    id: 'searchbug', name: 'SearchBug',
    url: 'https://www.searchbug.com/info/optout.aspx',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="FirstName"], input[id*="FirstName"]',
      lastName:  'input[name="LastName"], input[id*="LastName"]',
      email:     'input[type="email"], input[name="Email"]',
      submit:    'input[type="submit"], button[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── Spokeo CCPA (email-only form) ─────────────────────────────────────────
  {
    id: 'spokeo-ccpa', name: 'Spokeo CCPA',
    url: 'https://www.spokeo.com/ccpa-optout',
    emailOnly: false,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills email. Click Do Not Sell My Info.',
  },

  // ── Haines & Co ───────────────────────────────────────────────────────────
  {
    id: 'hainesco', name: 'Haines & Co (Crisscross)',
    url: 'https://www.haines.com/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input[placeholder*="first" i], input[name*="first" i]',
      lastName:  'input[placeholder*="last" i], input[name*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      street:    'input[placeholder*="address" i], input[name*="address" i]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email + address. Click Submit.',
  },

  // ── Clearbit ──────────────────────────────────────────────────────────────
  {
    id: 'clearbit', name: 'Clearbit',
    url: 'https://clearbit.com/privacy/request',
    emailOnly: false,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills email. Select "Delete my data" → Submit.',
  },

  // ── FullContact ───────────────────────────────────────────────────────────
  {
    id: 'fullcontact', name: 'FullContact',
    url: 'https://www.fullcontact.com/privacy/opt-out/',
    emailOnly: false,
    selectors: {
      email:  'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills email. Click Opt Out.',
  },

  // ── Neustar / TransUnion Marketing ───────────────────────────────────────
  {
    id: 'neustar', name: 'Neustar (TransUnion)',
    url: 'https://www.transunion.com/consumer-privacy/marketing-opt-out',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      street:    'input[name="address"], input[placeholder*="address" i]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      zip:       'input[name="zip"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills all fields. Click Submit.',
  },

  // ── DataAxle (InfoUSA/Infogroup) ──────────────────────────────────────────
  {
    id: 'dataaxle', name: 'Data Axle',
    url: 'https://www.data-axle.com/opt-out/',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      street:    'input[name="address"]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      zip:       'input[name="zip"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + address. Click Submit.',
  },

  // ── InstantCheckmate CCPA (via BeenVerified but direct link) ─────────────
  {
    id: 'checkr', name: 'Checkr',
    url: 'https://candidate.checkr.com/privacy/request',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Select "Delete" request type → Submit.',
  },

  // ── CouncilOn ─────────────────────────────────────────────────────────────
  {
    id: 'councilon', name: 'CouncilOn',
    url: 'https://councilon.com/ex/privacypolicy',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── PeopleFinderFree ──────────────────────────────────────────────────────
  {
    id: 'peoplefinderfree', name: 'PeopleFinderFree',
    url: 'https://www.peoplefinderfree.com/optout/',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      state:     'select[name="state"]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + state + email. Click Search → find record → opt out.',
  },

  // ── Telephonedirectories.us ───────────────────────────────────────────────
  {
    id: 'telephonedirectories', name: 'TelephoneDirectories',
    url: 'https://www.telephonedirectories.us/Edit_Records',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── USPhoneBook platform siblings ─────────────────────────────────────────
  {
    id: 'phonebooks', name: 'PhoneBooks.com',
    url: 'https://www.phonebooks.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input#subject-firstname',
      lastName:  'input#subject-lastname',
      email:     'input#subject-email',
      checkbox:  'input#agreement',
      submit:    'button#BRP',
    },
  },
  {
    id: 'reversephonecheck', name: 'ReversePhoneCheck',
    url: 'https://www.reversephonecheck.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input#subject-firstname',
      lastName:  'input#subject-lastname',
      email:     'input#subject-email',
      checkbox:  'input#agreement',
      submit:    'button#BRP',
    },
  },

  // ── CheckPeople platform siblings ─────────────────────────────────────────
  {
    id: 'publicrecords', name: 'PublicRecords.com',
    url: 'https://www.publicrecords.com/opt-out',
    emailOnly: true,
    selectors: { email: 'input#requestorEmail', checkbox: 'input#acknowledge', submit: 'button[type="submit"]' },
  },
  {
    id: 'inforegistry', name: 'InfoRegistry',
    url: 'https://www.inforegistry.com/opt-out',
    emailOnly: true,
    selectors: { email: 'input#requestorEmail', checkbox: 'input#acknowledge', submit: 'button[type="submit"]' },
  },

  // ── More InfoPay platform ─────────────────────────────────────────────────
  {
    id: 'peoplereport', name: 'PeopleReport',
    url: 'https://www.peoplereport.com/optout/',
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
    id: 'publicrecordsusa', name: 'PublicRecordsUSA',
    url: 'https://www.publicrecordsusa.com/optout/',
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
    id: 'instantpeoplefinder', name: 'InstantPeopleFinder',
    url: 'https://www.instantpeoplefinder.com/optout/',
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

  // ── ArrestFacts ───────────────────────────────────────────────────────────
  {
    id: 'arrestfacts', name: 'ArrestFacts',
    url: 'https://www.arrestfacts.com/removal',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── Intelius CCPA (direct opt-out, separate from PeopleConnect) ───────────
  {
    id: 'numberville', name: 'Numberville',
    url: 'https://www.numberville.com/opt-out.html',
    emailOnly: false,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
    instructions: 'Auto-fills name + email. Click Submit.',
  },

  // ── Dataveria ─────────────────────────────────────────────────────────────
  {
    id: 'dataveria', name: 'Dataveria',
    url: 'https://dataveria.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Addresses360 siblings ─────────────────────────────────────────────────
  {
    id: 'clustrpages', name: 'ClustrPages',
    url: 'https://clustrpages.com/bl/opt-out',
    emailOnly: true,
    selectors: { email: 'input[name="inputEmail"]', submit: 'button[type="submit"]' },
  },
  {
    id: 'findfamilytree', name: 'FindFamilyTree',
    url: 'https://www.findfamilytree.com/optout/',
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

  // ── Zaba Search (direct, in addition to PeopleConnect coverage) ───────────
  {
    id: 'freerecordsregistry', name: 'FreeRecordsRegistry',
    url: 'https://www.freerecordsregistry.com/optout/',
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

  // ══════════════════════════════════════════════════════════════════════
  // MANUAL — requires profile URL, phone call, SSN verification, or account
  // ══════════════════════════════════════════════════════════════════════

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
  {
    id: 'spokeo-manual', name: 'Spokeo (profile removal)',
    url: 'https://www.spokeo.com/optout',
    manual: true,
    instructions: '1. Search your name on spokeo.com and open your listing. 2. Copy the profile URL. 3. Paste it into the opt-out URL field. 4. Enter email. 5. Click Opt Out → confirm via email.',
  },

];
