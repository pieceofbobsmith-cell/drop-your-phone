// brokers.js — loaded by popup.html (<script>) and service worker (importScripts).
// selectors: null = manual only. instructions shown when user clicks the row.
// Selectors use comma-separated fallbacks — first match wins in optout.js.

const BROKERS = [
  // ── TIER 1: Full auto-fill (known selectors) ─────────────────────
  {
    id: 'beenverified', name: 'BeenVerified',
    url: 'https://www.beenverified.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the reCAPTCHA → click Search → select your record → confirm via email link.'
  },
  {
    id: 'peoplelooker', name: 'PeopleLooker',
    url: 'https://www.peoplelooker.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the reCAPTCHA → click Search → select your record → confirm via email link.'
  },
  {
    id: 'backgroundalert', name: 'BackgroundAlert',
    url: 'https://www.backgroundalert.com/optout/',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled (same network as BeenVerified). Solve reCAPTCHA → Search → select record → confirm via email.'
  },
  {
    id: 'fastpeoplesearch', name: 'FastPeopleSearch',
    url: 'https://www.fastpeoplesearch.com/removal',
    selectors: { firstName: '#first_name', lastName: '#last_name', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the CAPTCHA → click Remove → confirm via email link.'
  },
  {
    id: 'truepeoplesearch', name: 'TruePeopleSearch',
    url: 'https://www.truepeoplesearch.com/removal',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Send → open the email from TruePeopleSearch → click the removal link.'
  },
  {
    id: 'nuwber', name: 'Nuwber',
    url: 'https://nuwber.com/removal/link',
    selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Send → confirm via email link.'
  },
  {
    id: 'thatsthem', name: "That'sThem",
    url: 'https://thatsthem.com/optout',
    selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Opt Out → confirm via email link.'
  },
  {
    id: 'clustrmaps', name: 'ClustrMaps',
    url: 'https://clustrmaps.com/bl/opt-out',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },
  {
    id: 'dobsearch', name: 'DOBSearch',
    url: 'https://www.dobsearch.com/remove-my-info',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },
  {
    id: 'golookup', name: 'GoLookUp',
    url: 'https://golookup.com/opt-out',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },
  {
    id: 'socialcatfish', name: 'Social Catfish',
    url: 'https://socialcatfish.com/optout/',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Opt Out → confirm via email link.'
  },
  {
    id: 'dataveria', name: 'Dataveria',
    url: 'https://dataveria.com/optout',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },
  {
    id: 'inforver', name: 'Inforver',
    url: 'https://www.inforver.com/control/privacy',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Remove My Info → confirm via email.'
  },

  // ── TIER 2: Name + state search forms ────────────────────────────
  {
    id: 'truthfinder', name: 'TruthFinder',
    url: 'https://www.truthfinder.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Remove → confirm via email.'
  },
  {
    id: 'instantcheckmate', name: 'Instant Checkmate',
    url: 'https://www.instantcheckmate.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Remove → confirm via email.'
  },
  {
    id: 'intelius', name: 'Intelius',
    url: 'https://www.intelius.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your listing → click Opt Out → confirm via email.'
  },
  {
    id: 'checkpeople', name: 'CheckPeople',
    url: 'https://checkpeople.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → click your record → Remove Record → confirm via email.'
  },
  {
    id: 'peoplefinders', name: 'PeopleFinders',
    url: 'https://www.peoplefinders.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find listing → click Opt Out → confirm via email.'
  },
  {
    id: 'ussearch', name: 'US Search',
    url: 'https://www.ussearch.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[name="first_name"]', lastName: 'input[name="lastName"], input[name="last_name"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify fields → click Search → confirm via email.'
  },
  {
    id: 'familytreenow', name: 'FamilyTreeNow',
    url: 'https://www.familytreenow.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[id="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[id="lastName"], input[placeholder*="Last"]', state: 'select[name="state"], select[id="state"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Select your state if needed → click Search → select your record → click Opt Out → solve CAPTCHA → submit.'
  },
  {
    id: 'neighborwho', name: 'NeighborWho',
    url: 'https://neighborwho.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'voterrecords', name: 'VoterRecords',
    url: 'https://www.voterrecords.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'recordsfinder', name: 'RecordsFinder',
    url: 'https://recordsfinder.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your listing → click Opt Out → confirm via email.'
  },
  {
    id: 'officialusa', name: 'OfficialUSA',
    url: 'https://www.officialusa.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'staterecords', name: 'StateRecords',
    url: 'https://www.staterecords.org/optout.php',
    selectors: { firstName: 'input[name="firstName"], input[name="fname"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[name="lname"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify fields → click Search → find your record → submit opt-out → confirm via email.'
  },
  {
    id: 'idtrue', name: 'IDTrue',
    url: 'https://www.idtrue.com/optout/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your listing → click Opt Out → confirm via email.'
  },
  {
    id: 'uncoverthetruth', name: 'UncoverTheTruth',
    url: 'https://www.uncoverthetruth.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'searchpeoplefree', name: 'SearchPeopleFree',
    url: 'https://www.searchpeoplefree.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[id="first_name"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[id="last_name"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Remove → confirm via email.'
  },
  {
    id: 'cyberbackgroundchecks', name: 'CyberBackground Checks',
    url: 'https://www.cyberbackgroundchecks.com/removal',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Remove → confirm via email.'
  },
  {
    id: 'smartbackgroundchecks', name: 'SmartBackground Checks',
    url: 'https://www.smartbackgroundchecks.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'infotracer', name: 'InfoTracer',
    url: 'https://infotracer.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'councilon', name: 'CouncilOn',
    url: 'https://councilon.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'personsearchers', name: 'PersonSearchers',
    url: 'https://personsearchers.com/optout/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'freepeopledirectory', name: 'FreePeopleDirectory',
    url: 'https://www.freepeopledirectory.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'peopleby', name: 'PeopleBy',
    url: 'https://www.peopleby.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'peoplebyname', name: 'PeopleByName',
    url: 'https://www.peoplebyname.com/remove.php',
    selectors: { firstName: 'input[name="firstName"], input[name="fname"]', lastName: 'input[name="lastName"], input[name="lname"]', state: 'select[name="state"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → check the box next to your record → click Send Opt-Out → confirm via email.'
  },
  {
    id: 'peoplesearchnow', name: 'PeopleSearchNow',
    url: 'https://www.peoplesearchnow.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'arrestfacts', name: 'ArrestFacts',
    url: 'https://arrestfacts.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'homemetry', name: 'Homemetry',
    url: 'https://homemetry.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Enter your email if needed → click Submit → confirm via email link.'
  },
  {
    id: 'usatrace', name: 'USATrace',
    url: 'https://www.usatrace.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'lookupanyone', name: 'LookupAnyone',
    url: 'https://lookupanyone.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'quickpeopletrace', name: 'QuickPeopleTrace',
    url: 'https://www.quickpeopletrace.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'privateeyesite', name: 'PrivateEye',
    url: 'https://www.privateeye.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'publicrecordsnow', name: 'PublicRecordsNow',
    url: 'https://www.publicrecordsnow.com/static/view/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → solve CAPTCHA → click Submit → confirm via email if needed.'
  },
  {
    id: 'usphonebook', name: 'US Phone Book',
    url: 'https://www.usphonebook.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email link.'
  },
  {
    id: 'usidentify', name: 'USIdentify',
    url: 'https://www.usidentify.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'newenglandfacts', name: 'NewEnglandFacts',
    url: 'https://newenglandfacts.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'purecriminals', name: 'PureCriminals',
    url: 'https://purecriminals.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'verecord', name: 'VeRecord',
    url: 'https://verecord.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'waatp', name: 'WAATP',
    url: 'https://www.waatp.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'criminalwatchdog', name: 'CriminalWatchdog',
    url: 'https://www.criminalwatchdog.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'freepeoplesearch', name: 'FreePeopleSearch',
    url: 'https://freepeoplesearch.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'peoplefinderlocator', name: 'PeopleFinderLocator',
    url: 'https://www.peoplefinderlocator.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'locatefamily', name: 'LocateFamily',
    url: 'https://www.locatefamily.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Click Search → find your record → click Opt Out → confirm via email.'
  },

  // ── TIER 3: Name + full address forms ────────────────────────────
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://isapps.acxiom.com/optout/optout.aspx',
    selectors: { firstName: 'input[name="firstName"], input[id*="firstName"]', lastName: 'input[name="lastName"], input[id*="lastName"]', email: 'input[type="email"], input[name="email"]', state: 'select[name="state"], select[id*="state"]', submit: 'input[type="submit"], button[type="submit"]' },
    instructions: 'Auto-filled. Check the data removal boxes → select "Me" → verify address fields → solve reCAPTCHA → click Submit.'
  },
  {
    id: 'zabasearch', name: 'ZabaSearch',
    url: 'https://www.zabasearch.com/block_records/',
    selectors: { firstName: 'input[name="fname"], input[name="firstName"]', lastName: 'input[name="lname"], input[name="lastName"]', email: 'input[type="email"], input[name="email"]', submit: 'input[type="submit"], button[type="submit"]' },
    instructions: 'Auto-filled. Add your street address, city, state, zip → solve CAPTCHA → click Submit. No email confirmation needed.'
  },
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://www.mylife.com/ccpa/index.pubview',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Complete CAPTCHA if shown → click "Do Not Sell My Info" → confirm via email.'
  },
  {
    id: 'addresses', name: 'Addresses.com',
    url: 'https://www.addresses.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Add your address if prompted → click Submit → confirm via email.'
  },

  // ── TIER 4: Email-only + profile URL forms ────────────────────────
  {
    id: 'idcrawl', name: 'IDCrawl',
    url: 'https://www.idcrawl.com/opt-out',
    manual: true,
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"]' },
    instructions: '1. Open idcrawl.com and search your name. 2. Copy your profile URL. 3. On the opt-out page, paste your profile URL into the URL field. 4. Enter your email. 5. Click Submit → confirm via email.'
  },
  {
    id: 'xlek', name: 'Xlek',
    url: 'https://www.xlek.com/optout.php',
    selectors: { firstName: 'input[name="fname"], input[name="firstName"]', lastName: 'input[name="lname"], input[name="lastName"]', email: 'input[type="email"], input[name="email"]', submit: 'input[type="submit"], button[type="submit"]' },
    instructions: 'Auto-filled. Fill in your city and state manually → solve CAPTCHA → click Submit. No email confirmation.'
  },
  {
    id: 'searchbug', name: 'SearchBug',
    url: 'https://www.searchbug.com/opt-out/',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },

  // ── TIER 5: Manual (CAPTCHA / phone verify / find-your-listing first) ──
  {
    id: 'spokeo', name: 'Spokeo',
    url: 'https://www.spokeo.com/optout',
    manual: true,
    selectors: { email: 'input[name="email"], input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: '1. Go to spokeo.com in a new tab. 2. Search your name. 3. Open your listing and copy the URL. 4. Come back to this page and paste it into the URL field. 5. Enter your email. 6. Solve reCAPTCHA. 7. Click Opt Out. 8. Confirm via email.'
  },
  {
    id: 'whitepages', name: 'WhitePages',
    url: 'https://www.whitepages.com/suppression-requests',
    manual: true,
    selectors: null,
    instructions: '1. Click "Opt Out of WhitePages Premium". 2. Search your name and state. 3. Click on your listing. 4. Click "Remove Me". 5. Enter your phone number — an automated call will verify you. 6. Answer and press 1 to confirm.'
  },
  {
    id: 'radaris', name: 'Radaris',
    url: 'https://radaris.com/ng/page/how-to-remove',
    manual: true,
    selectors: null,
    instructions: '1. Go to radaris.com and search your name. 2. Click on your profile. 3. Click the ⋮ menu → "Control Info" → "Remove Info". 4. Create a free account if prompted. 5. Submit removal — confirm via email.'
  },
  {
    id: 'peoplefinder', name: 'PeopleFinder',
    url: 'https://www.peoplefinder.com/people_removal/',
    selectors: { firstName: 'input[name="firstName"], input[id="firstName"]', lastName: 'input[name="lastName"], input[id="lastName"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → check the box next to your record → click Send Opt-Out Request → confirm via email.'
  },
  {
    id: 'peekyou', name: 'PeekYou',
    url: 'https://www.peekyou.com/about/contact/optout/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your profile → click Remove → confirm via email.'
  },
  {
    id: 'spyfly', name: 'SpyFly',
    url: 'https://www.spyfly.com/help-center/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name, state, and email → click Submit → confirm via email link.'
  },
  {
    id: 'ownerly', name: 'Ownerly',
    url: 'https://www.ownerly.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify your name and email → click Submit → confirm via email link.'
  },
  {
    id: 'peoplesmart', name: 'PeopleSmart',
    url: 'https://www.peoplesmart.com/optout-go',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled (BeenVerified network). Solve reCAPTCHA → Search → select your record → confirm via email.'
  },
  {
    id: 'yoname', name: 'YoName',
    url: 'https://yoname.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify your name and email → click Submit → confirm via email link.'
  },
  {
    id: 'vitalrec', name: 'VitalRec',
    url: 'https://www.vitalrec.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'blackbookonline', name: 'BlackBook Online',
    url: 'https://www.blackbookonline.info/BBOOL-Optout.aspx',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'input[type="submit"], button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → solve CAPTCHA → click Submit → confirm via email.'
  },
  {
    id: 'suretrace', name: 'SureTrace',
    url: 'https://suretrace.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'rehold', name: 'Rehold',
    url: 'https://rehold.com/optout',
    selectors: { email: 'input[type="email"], input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Submit → confirm via email link.'
  },
  {
    id: 'usapeople', name: 'USAPeople',
    url: 'https://usapeople.us/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'spydialer', name: 'SpyDialer',
    url: 'https://www.spydialer.com/optout.aspx',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → solve CAPTCHA → click Submit → confirm via email.'
  },
  {
    id: 'yasni', name: 'Yasni',
    url: 'https://www.yasni.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'zoominfo', name: 'ZoomInfo',
    url: 'https://www.zoominfo.com/about/privacy/profile-and-data',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Click "Manage Your Profile" → verify your email → follow the removal link sent to your inbox.'
  },
  {
    id: 'phonebooks', name: 'Phonebooks.com',
    url: 'https://www.phonebooks.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'pub360', name: 'Pub360',
    url: 'https://pub360.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'peoplelookup', name: 'PeopleLookup',
    url: 'https://www.peoplelookup.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'reversephonelookup', name: 'ReversePhoneLookup',
    url: 'https://www.reversephonelookup.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'freebackgroundcheck', name: 'FreeBackgroundCheck',
    url: 'https://www.freebackgroundcheck.org/opt_out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'virtualpeoplefinder', name: 'VirtualPeopleFinder',
    url: 'https://www.virtualpeoplefinder.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },

  // ── ADDITIONAL AUTO BROKERS ───────────────────────────────────────
  {
    id: 'advancedbackgroundchecks', name: 'AdvancedBGChecks',
    url: 'https://www.advancedbackgroundchecks.com/removal',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify fields → click Search → select your record → confirm via email.'
  },
  {
    id: 'searchquarry', name: 'SearchQuarry',
    url: 'https://www.searchquarry.com/optout/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → select your record → confirm opt-out.'
  },
  {
    id: 'spokesearch', name: 'SpokeSearch',
    url: 'https://spokesearch.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'centeda', name: 'Centeda',
    url: 'https://centeda.com/ng/control/privacy',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'mugshotsonline', name: 'MugshotsOnline',
    url: 'https://mugshotsonline.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'arrest', name: 'Arrest.org',
    url: 'https://arrest.org/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'findpeoplefast', name: 'FindPeopleFast',
    url: 'https://www.findpeoplefast.net/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'peoplefindfast', name: 'PeopleFindFast',
    url: 'https://www.peoplefindfast.com/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'anywho', name: 'AnyWho',
    url: 'https://www.anywho.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your listing → click Opt Out.'
  },
  {
    id: 'checkruns', name: 'CheckRuns',
    url: 'https://www.checkruns.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'thetrueseeker', name: 'TheTrueSeeker',
    url: 'https://www.thetrueseeker.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out → confirm via email.'
  },
  {
    id: 'bebackgroundcheck', name: 'BeBackgroundCheck',
    url: 'https://www.bebackgroundcheck.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → select your record → confirm via email.'
  },
  {
    id: 'freepeopleidcheck', name: 'FreePeopleIDCheck',
    url: 'https://freepeopleidcheck.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → verify email → click Submit → confirm via email.'
  },
  {
    id: 'arivify', name: 'Arivify',
    url: 'https://arivify.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'privatereports', name: 'PrivateReports',
    url: 'https://privatereports.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'bumper', name: 'Bumper',
    url: 'https://bumper.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'lullar', name: 'Lullar',
    url: 'https://lullar.com/en/optout',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Remove → confirm via email.'
  },
  {
    id: 'publicrecordsofficial', name: 'PublicRecordsOfficial',
    url: 'https://www.publicrecordsofficial.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → click Search → find your record → click Opt Out.'
  },
  {
    id: 'peoplerocket', name: 'PeopleRocket',
    url: 'https://www.peoplerocket.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'numericphone', name: 'NumericPhone',
    url: 'https://www.numericphone.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'idverify', name: 'IDVerify',
    url: 'https://www.idverify.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Verify name and email → click Submit → confirm via email.'
  },
  {
    id: 'criminalbg', name: 'CriminalBG',
    url: 'https://criminalbg.com/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → verify email → click Submit → confirm via email.'
  },
  {
    id: 'backgroundcheck', name: 'BackgroundCheck.run',
    url: 'https://backgroundcheck.run/opt-out',
    selectors: { firstName: 'input[name="firstName"], input[placeholder*="First"]', lastName: 'input[name="lastName"], input[placeholder*="Last"]', state: 'select[name="state"]', email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Select your state → verify email → click Submit → confirm via email.'
  },
];
