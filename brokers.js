// brokers.js — loaded by popup.html and optout.js content scripts.
//
// Broker list sourced from:
//   Big Ass Data Broker Opt-Out List (BADBOOL) by Yael Writes
//   https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List (MIT)
//
// Fields:
//   emailOnly: true  → background tab, auto-fills form + submits, auto-closes
//   emailOnly: false → foreground tab, fills search form, user picks record + closes tab
//   manual: true     → not queued; Open button shown with step-by-step instructions
//   covered: true    → handled by another broker; shown in list but not queued
//   selectors.checkbox     → a consent/terms checkbox to click before submitting
//   selectors.fullName     → a single combined first+last name field
//   selectors.emailConfirm → a confirm-email field (filled with same email value)

const BROKERS = [

  // ══════════════════════════════════════════════════════════════════════
  // EMAIL-ONLY (23) — background tab, auto-fills + submits, no user watching
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

  // ── USPhoneBook platform: USPhoneBook / PeopleSearchNow / PhoneBooks / AdvancedBGChecks
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
    id: 'advancedbackgroundchecks', name: 'AdvancedBGChecks',
    url: 'https://www.advancedbackgroundchecks.com/removal',
    emailOnly: true,
    selectors: {
      firstName: 'input#subject-firstname',
      lastName:  'input#subject-lastname',
      email:     'input#subject-email',
      checkbox:  'input#agreement',
      submit:    'button#BRP',
    },
  },

  // ── NeighborReport ────────────────────────────────────────────────────────
  {
    id: 'neighborreport', name: 'NeighborReport',
    url: 'https://neighbor.report/remove',
    emailOnly: true,
    selectors: { email: 'input[name="inputEmail"], input[type="email"]', submit: 'button.submit-comment' },
  },

  // ── Centeda / Vericora (ng/control/privacy platform) ─────────────────────
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

  // ── ThatsThem — fill all fields + submit (no record picking) ──────────────
  {
    id: 'thatsthem', name: "That'sThem",
    url: 'https://thatsthem.com/optout',
    emailOnly: true,
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
  },

  // ── Archives.com ──────────────────────────────────────────────────────────
  {
    id: 'archives', name: 'Archives.com',
    url: 'https://www.archives.com/optout',
    emailOnly: true,
    selectors: {
      firstName:    'input#FirstName',
      lastName:     'input#LastName',
      email:        'input#Email',
      emailConfirm: 'input#EmailConfirm',
      checkbox:     'input#AgreeToOptoutPolicy',
      submit:       'input#submit_btn',
    },
  },

  // ── Acxiom — simple CCPA deletion form ───────────────────────────────────
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://www.acxiom.com/optout/',
    emailOnly: true,
    selectors: {
      firstName: 'input#FirstName',
      lastName:  'input#LastName',
      email:     'input#Email',
      phone:     'input#Phone',
      submit:    'form#mktoForm_2564 button[type="submit"]',
    },
  },

  // ── SocialCatfish — CCPA opt-out (state → name → email → submit) ──────────
  {
    id: 'socialcatfish', name: 'SocialCatfish',
    url: 'https://socialcatfish.com/opt-out/?id=request_optout',
    emailOnly: true,
    selectors: {
      state:     'select#ccpa_state',
      firstName: 'input#first-name',
      lastName:  'input#last-name',
      email:     'input#email',
      submit:    '#request_optout_form button[type="submit"]',
    },
  },

  // ── MyLife (JotForm privacy request) ─────────────────────────────────────
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://mylife.jotform.com/260284407610047',
    emailOnly: true,
    selectors: {
      firstName: 'input#first_6',
      lastName:  'input#last_6',
      email:     'input#input_7',
      street:    'input#input_11_addr_line1',
      city:      'input#input_11_city',
      zip:       'input#input_11_postal',
      submit:    'button#input_2',
    },
  },

  // ── SpyFly ────────────────────────────────────────────────────────────────
  {
    id: 'spyfly', name: 'SpyFly',
    url: 'https://www.spyfly.com/help-center/privacy-requests',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PeopleByName ──────────────────────────────────────────────────────────
  {
    id: 'peoplebyname', name: 'PeopleByName',
    url: 'https://www.peoplebyname.com/remove.php',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── BlockShopper ──────────────────────────────────────────────────────────
  {
    id: 'blockshopper', name: 'BlockShopper',
    url: 'https://blockshopper.com/page/opt_out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="last_name"], input[placeholder*="last" i]',
      city:      'input[name="city"]',
      state:     'select[name="state"]',
      email:     'input[type="email"], input[name="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PublicDataUSA ─────────────────────────────────────────────────────────
  {
    id: 'publicdatausa', name: 'PublicDataUSA',
    url: 'https://publicdatausa.com/remove.php',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH-FIRST (10) — foreground tab, user picks their record + closes tab
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
      submit:    'button[type="submit"]:not(.search-form-button-submit)',
    },
    instructions: 'Form is pre-filled. Select "The subject of this request" → click Submit → verify via email.',
  },

  // ── PeopleConnect network (covers TruthFinder, InstantCheckmate, Intelius, 7 more) ─
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
  { id: 'truthfinder',        name: 'TruthFinder',        url: 'https://www.truthfinder.com/opt-out/',         covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'instantcheckmate',   name: 'Instant Checkmate',  url: 'https://www.instantcheckmate.com/opt-out/',    covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'intelius',           name: 'Intelius',           url: 'https://www.intelius.com/opt-out/',            covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'zabasearch',         name: 'ZabaSearch',         url: 'https://www.zabasearch.com/block_records/',    covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'ussearch',           name: 'US Search',          url: 'https://www.ussearch.com/opt-out/',            covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'anywho',             name: 'AnyWho',             url: 'https://www.anywho.com/opt-out',               covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'addresses',          name: 'Addresses.com',      url: 'https://www.addresses.com/optout',             covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'peoplelookup',       name: 'PeopleLookup',       url: 'https://www.peoplelookup.com/opt-out',         covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'neighborwho',        name: 'NeighborWho',        url: 'https://neighborwho.com/opt-out',              covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },
  { id: 'reversephonelookup', name: 'ReversePhoneLookup', url: 'https://www.reversephonelookup.com/opt-out',   covered: true, instructions: 'Covered by PeopleConnect Suppression Center.' },

  // ── BeenVerified network (covers PeopleSmart, PeopleLooker, BackgroundAlert) ─
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
  { id: 'peoplesmart',     name: 'PeopleSmart',     url: 'https://www.peoplesmart.com/optout-go',         covered: true, instructions: 'Covered by BeenVerified opt-out.' },
  { id: 'peoplelooker',    name: 'PeopleLooker',    url: 'https://www.peoplelooker.com/f/optout/search',  covered: true, instructions: 'Covered by BeenVerified opt-out.' },
  { id: 'backgroundalert', name: 'BackgroundAlert', url: 'https://www.backgroundalert.com/optout/',       covered: true, instructions: 'Covered by BeenVerified opt-out.' },

  // ── PeopleFinders ─────────────────────────────────────────────────────────
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

  // ── InfoPay platform: SearchQuarry / RecordsFinder / InfoTracer ───────────
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
    instructions: 'Form is pre-filled. Click Submit → find your record in results → confirm opt-out.',
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
    instructions: 'Form is pre-filled. Click Submit → find your record in results → confirm opt-out.',
  },
  {
    id: 'infotracer', name: 'InfoTracer',
    url: 'https://infotracer.com/optout/',
    emailOnly: false,
    selectors: {
      firstName: 'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_fname',
      lastName:  'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_lname',
      state:     'select#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_state',
      city:      'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_city',
      submit:    'button.form-btn',
    },
    instructions: 'Form is pre-filled. Click Submit → find your record in results → confirm opt-out.',
  },

  // ── StateRecords.org (InfoPay platform) ──────────────────────────────────
  {
    id: 'staterecords', name: 'StateRecords.org',
    url: 'https://staterecords.org/optout',
    emailOnly: false,
    selectors: {
      firstName: 'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_fname',
      lastName:  'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_lname',
      state:     'select#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_state',
      city:      'input#InfoPay_Core_Components_OptOuts_DataRemovalServiceModel_city',
      submit:    'button.form-btn',
    },
    instructions: 'Form is pre-filled. Click Submit → find your record in results → confirm opt-out.',
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

  // ── CyberBackgroundChecks / SmartBackgroundChecks ─────────────────────────
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

  // ══════════════════════════════════════════════════════════════════════
  // MANUAL — requires profile URL, phone call, SSN, photo, or account login
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'idcrawl', name: 'IDCrawl',
    url: 'https://www.idcrawl.com/remove-my-information',
    manual: true,
    instructions: '1. Search your name on idcrawl.com and open your profile. 2. Copy the profile URL. 3. Paste it into the removal form along with your email. 4. Confirm via email.',
  },
  {
    id: 'whitepages', name: 'WhitePages',
    url: 'https://www.whitepages.com/suppression-requests',
    manual: true,
    instructions: "1. Find your listing on whitepages.com and copy the URL. 2. Paste it into the suppression form. 3. Solve reCAPTCHA. 4. Enter phone number — you'll receive an automated call. 5. Press 1 to confirm removal.",
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
    id: 'spokeo', name: 'Spokeo',
    url: 'https://www.spokeo.com/optout',
    manual: true,
    instructions: '1. Search your name on spokeo.com and open your listing. 2. Copy the profile URL. 3. Paste it into the opt-out URL field. 4. Enter email. 5. Click Opt Out → confirm via email.',
  },
  {
    id: 'facecheck', name: 'FaceCheck.ID',
    url: 'https://facecheck.id/Face-Search/RemoveMyPhotos',
    manual: true,
    instructions: '1. Go to facecheck.id/Face-Search/RemoveMyPhotos. 2. Enter your email. 3. Upload a clear photo of your face. 4. Submit the removal request.',
  },
  {
    id: 'pimeyes', name: 'PimEyes',
    url: 'https://pimeyes.com/en/opt-out-request-form',
    manual: true,
    instructions: '1. Go to pimeyes.com/en/opt-out-request-form. 2. Enter your name and email. 3. Upload a photo of yourself. 4. Submit the opt-out request.',
  },

];
