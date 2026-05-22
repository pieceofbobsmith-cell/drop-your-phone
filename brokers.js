// brokers.js — loaded by popup.html and optout.js content scripts.
//
// Broker list sourced from:
//   Big Ass Data Broker Opt-Out List (BADBOOL) by Yael Writes
//   https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List (MIT)
//   EasyOptOuts reference list (MIT)
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
  // EMAIL-ONLY — background tab, auto-fills + submits, no user watching
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

  // ── ng/control/privacy platform ──────────────────────────────────────────
  // Centeda, Vericora, GoLookUp, ClubSet, Kwold, PubRecord360 all share this Angular platform.
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
  {
    id: 'golookup', name: 'GoLookUp',
    url: 'https://golookup.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },
  {
    id: 'clubset', name: 'ClubSet',
    url: 'https://www.clubset.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },
  {
    id: 'kwold', name: 'Kwold',
    url: 'https://www.kwold.com/ng/control/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },
  {
    id: 'pub360', name: 'PubRecord360',
    url: 'https://pub360.com/ng/control/privacy',
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

  // ── ZoomInfo — largest B2B data broker ───────────────────────────────────
  {
    id: 'zoominfo', name: 'ZoomInfo',
    url: 'https://www.zoominfo.com/update/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Veromi ────────────────────────────────────────────────────────────────
  {
    id: 'veromi', name: 'Veromi',
    url: 'https://www.veromi.net/privacy',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PrivateEye ────────────────────────────────────────────────────────────
  {
    id: 'privateeye', name: 'PrivateEye',
    url: 'https://www.privateeye.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[name="last_name"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── USA People Search ─────────────────────────────────────────────────────
  {
    id: 'usapeoplesearch', name: 'USA People Search',
    url: 'https://www.usa-people-search.com/manage/optout/submit',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── AllAreaCodes ──────────────────────────────────────────────────────────
  {
    id: 'allareacodes', name: 'AllAreaCodes',
    url: 'https://www.allareacodes.com/opt_out.htm',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[name="first_name"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[name="last_name"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"], input[name="submit"]',
    },
  },

  // ── Homemetry — property/address data ────────────────────────────────────
  {
    id: 'homemetry', name: 'Homemetry',
    url: 'https://homemetry.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Pipl — deep web people search ────────────────────────────────────────
  {
    id: 'pipl', name: 'Pipl',
    url: 'https://pipl.com/optout',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── CriminalWatchDog ──────────────────────────────────────────────────────
  {
    id: 'criminalwatchdog', name: 'CriminalWatchDog',
    url: 'https://www.criminalwatchdog.com/removal',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[name="first"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[name="last"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── iBackgroundCheck ──────────────────────────────────────────────────────
  {
    id: 'ibackgroundcheck', name: 'iBackgroundCheck',
    url: 'https://ibackgroundcheck.com/removal',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PeopleWhiz ────────────────────────────────────────────────────────────
  {
    id: 'peoplewhiz', name: 'PeopleWhiz',
    url: 'https://www.peoplewhiz.com/optout',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── NumberHub ─────────────────────────────────────────────────────────────
  {
    id: 'numberhub', name: 'NumberHub',
    url: 'https://www.numberhub.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── CourtRecord.net ───────────────────────────────────────────────────────
  {
    id: 'courtrecord', name: 'CourtRecord.net',
    url: 'https://www.courtrecord.net/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Oracle Data Cloud — ad-tech data broker ───────────────────────────────
  {
    id: 'oracle_datacloud', name: 'Oracle Data Cloud',
    url: 'https://datacloudoptout.oracle.com/',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── LiveRamp — ad-tech identity graph ────────────────────────────────────
  {
    id: 'liveramp', name: 'LiveRamp',
    url: 'https://optout.liveramp.com/',
    emailOnly: true,
    selectors: {
      email:  'input#optout_email',
      submit: 'input[type="submit"]',
    },
  },

  // ── InfoFree — B2B mailing list data ─────────────────────────────────────
  {
    id: 'infofree', name: 'InfoFree',
    url: 'https://infofree.com/opt-out/',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── FindPeopleFast ────────────────────────────────────────────────────────
  {
    id: 'findpeoplefast', name: 'FindPeopleFast',
    url: 'https://www.findpeoplefast.net/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── BirthDatabase ─────────────────────────────────────────────────────────
  {
    id: 'birthdatabase', name: 'BirthDatabase',
    url: 'https://www.birthdatabase.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Epsilon — direct mail data broker ────────────────────────────────────
  {
    id: 'epsilon', name: 'Epsilon',
    url: 'https://www.epsilon.com/us/about-us/data-subject-request',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PhoneDetective ────────────────────────────────────────────────────────
  {
    id: 'phonedetective', name: 'PhoneDetective',
    url: 'https://www.phonedetective.com/PD.aspx?id=optout',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Addresses.com (standalone form, also covered via PeopleConnect) ───────
  // Note: Keep as standalone since PeopleConnect is search-first; some users want email-only path.

  // ── PeopleSearchSite ──────────────────────────────────────────────────────
  {
    id: 'peoplesearchsite', name: 'PeopleSearchSite',
    url: 'https://www.peoplesearchsite.com/optout.php',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="fname"], input[placeholder*="first" i]',
      lastName:  'input[name="lname"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── CourtPublicRecords ────────────────────────────────────────────────────
  {
    id: 'courtpublicrecords', name: 'CourtPublicRecords',
    url: 'https://www.courtpublicrecords.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PublicPhoneRecords ────────────────────────────────────────────────────
  {
    id: 'publicphonerecords', name: 'PublicPhoneRecords',
    url: 'https://www.publicphonerecords.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PersonLookup ──────────────────────────────────────────────────────────
  {
    id: 'personlookup', name: 'PersonLookup',
    url: 'https://www.person-lookup.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── Classmates.com ────────────────────────────────────────────────────────
  {
    id: 'classmates', name: 'Classmates.com',
    url: 'https://www.classmates.com/privacy/consumer-request',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ── PeopleLookupFree ──────────────────────────────────────────────────────
  {
    id: 'peoplelookupfree', name: 'PeopleLookupFree',
    url: 'https://peoplelookupfree.com/optout',
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
    url: 'https://www.usatrace.com/opt-out',
    emailOnly: true,
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="first" i]',
      lastName:  'input[name="lastName"], input[placeholder*="last" i]',
      email:     'input[name="email"], input[type="email"]',
      submit:    'button[type="submit"], input[type="submit"]',
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH-FIRST — foreground tab, user picks their record + closes tab
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

  // ── PeekYou — opt-out page dead (redirects to homepage); manual email ──────
  {
    id: 'peekyou', name: 'PeekYou',
    url: 'https://www.peekyou.com/',
    manual: true,
    instructions: 'PeekYou\'s opt-out form redirects to homepage. Email optout@peekyou.com with subject "Opt-Out Request" including your full name and the URL of your profile on peekyou.com.',
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

  // ── InfoPay platform: SearchQuarry / RecordsFinder / InfoTracer / StateRecords ─
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
  {
    id: 'equifax', name: 'Equifax',
    url: 'https://www.equifax.com/personal/privacy/',
    manual: true,
    instructions: '1. Go to equifax.com/personal/privacy. 2. Click "Opt Out of Marketing". 3. Provide name, address, and last 4 of SSN to verify identity. 4. Submit opt-out request. Note: This opts you out of Equifax marketing products, not your credit file.',
  },
  {
    id: 'experian', name: 'Experian',
    url: 'https://www.experian.com/privacy/center.html',
    manual: true,
    instructions: '1. Go to experian.com/privacy/center.html. 2. Select your state. 3. Submit a CCPA/GDPR deletion request. 4. Provide name, email, and address for verification. 5. Confirm via email.',
  },
  {
    id: 'transunion', name: 'TransUnion',
    url: 'https://www.transunion.com/consumer-privacy',
    manual: true,
    instructions: '1. Go to transunion.com/consumer-privacy. 2. Select "Opt Out of Marketing". 3. Complete the form with your name and address. 4. Submit request. Alternatively, call 1-888-567-8688.',
  },
  {
    id: 'rocketreach', name: 'RocketReach',
    url: 'https://rocketreach.co/privacy',
    manual: true,
    instructions: '1. Go to rocketreach.co. 2. Search for your name/profile. 3. Open your profile. 4. Click the privacy/opt-out link or email privacy@rocketreach.co with subject "Data Deletion Request" including your name, email, and employer.',
  },
  {
    id: 'lusha', name: 'Lusha',
    url: 'https://www.lusha.com/privacy-policy/',
    manual: true,
    instructions: 'Lusha removed their opt-out page. Email privacy@lusha.com with subject "Data Deletion Request" including your full name, email, and company. They are GDPR/CCPA compliant and must respond within 30 days.',
  },
  {
    id: 'hunter', name: 'Hunter.io',
    url: 'https://hunter.io/privacy',
    manual: true,
    instructions: '1. Go to hunter.io. 2. Search your domain/name. 3. Find your profile. 4. Click the opt-out link on your profile page, or email privacy@hunter.io requesting deletion of your email and associated data.',
  },

];
