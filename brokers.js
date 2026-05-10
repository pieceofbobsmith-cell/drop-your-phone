// brokers.js — loaded by popup.html (<script>) and service worker (importScripts).
// selectors: null means manual-only (just opens the page, user fills it).
// instructions: shown in popup when user clicks the broker row.

const BROKERS = [
  {
    id: 'spokeo', name: 'Spokeo',
    url: 'https://www.spokeo.com/optout',
    selectors: null,
    instructions: 'Search your name → find your listing → click "Remove This Listing" → enter your email → click the confirmation link in your inbox.'
  },
  {
    id: 'whitepages', name: 'WhitePages',
    url: 'https://www.whitepages.com/suppression-requests',
    selectors: null,
    instructions: 'Click "Submit a Suppression Request" → search your name → select your listing → verify with a phone call (automated, ~30 sec).'
  },
  {
    id: 'beenverified', name: 'BeenVerified',
    url: 'https://www.beenverified.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. If a CAPTCHA appears, solve it and click Search, then select your record and confirm removal via email.'
  },
  {
    id: 'peoplelooker', name: 'PeopleLooker',
    url: 'https://www.peoplelooker.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. If a CAPTCHA appears, solve it and click Search, then select your record and confirm removal via email.'
  },
  {
    id: 'truthfinder', name: 'TruthFinder',
    url: 'https://www.truthfinder.com/opt-out/',
    selectors: null,
    instructions: 'Enter your name and state → click Search → find your record → click "Remove My Record" → enter your email → click the confirmation link in your inbox.'
  },
  {
    id: 'instantcheckmate', name: 'Instant Checkmate',
    url: 'https://www.instantcheckmate.com/opt-out/',
    selectors: null,
    instructions: 'Enter your name and state → click Search → find your record → click "Remove My Record" → enter your email → click the confirmation link in your inbox.'
  },
  {
    id: 'intelius', name: 'Intelius',
    url: 'https://www.intelius.com/opt-out/',
    selectors: null,
    instructions: 'Enter your name and state → click Search → find your listing → click "Opt Out" → fill in your email → confirm via the email link sent to you.'
  },
  {
    id: 'peoplefinder', name: 'PeopleFinder',
    url: 'https://www.peoplefinder.com/optout.php',
    selectors: null,
    instructions: 'Enter your name and state → click Search → check the box next to your record → click "Send Opt-Out Request" → confirm via the email link.'
  },
  {
    id: 'fastpeoplesearch', name: 'FastPeopleSearch',
    url: 'https://www.fastpeoplesearch.com/removal',
    selectors: { firstName: '#first_name', lastName: '#last_name', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the CAPTCHA → click Remove → confirm via the email link sent to you.'
  },
  {
    id: 'radaris', name: 'Radaris',
    url: 'https://radaris.com/ng/page/how-to-remove',
    selectors: null,
    instructions: 'Search your name → open your profile → click "Control Info" → select "Remove Info" → create a free account if prompted → submit the removal request.'
  },
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://isapps.acxiom.com/optout/optout.aspx',
    selectors: null,
    instructions: 'Fill in your name, address, and email → check "Opt out of all Acxiom data sales" → solve the CAPTCHA → click Submit.'
  },
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://www.mylife.com/ccpa/index.pubview',
    selectors: null,
    instructions: 'Fill in your name and email → click "Do Not Sell My Info" → check your inbox for a confirmation email and click the link.'
  },
  {
    id: 'nuwber', name: 'Nuwber',
    url: 'https://nuwber.com/removal/link',
    selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Send → open the email from Nuwber → click the removal confirmation link.'
  },
  {
    id: 'checkpeople', name: 'CheckPeople',
    url: 'https://checkpeople.com/opt-out',
    selectors: null,
    instructions: 'Enter your name and state → find your record → click "Remove Record" → enter your email → confirm via the email link.'
  },
  {
    id: 'ussearch', name: 'US Search',
    url: 'https://www.ussearch.com/opt-out/',
    selectors: null,
    instructions: 'Enter your first name, last name, state, and email → click Submit → check your email and click the confirmation link.'
  },
  {
    id: 'peoplefinders', name: 'PeopleFinders',
    url: 'https://www.peoplefinders.com/opt-out',
    selectors: null,
    instructions: 'Enter your name and state → click Search → find your record → click "Opt Out" → enter your email → confirm via the email link.'
  },
  {
    id: 'zabasearch', name: 'ZabaSearch',
    url: 'https://www.zabasearch.com/block_records/',
    selectors: null,
    instructions: 'Fill in your full name, address, and email → solve the CAPTCHA → click "Block My Record." No email confirmation needed.'
  },
  {
    id: 'publicrecordsnow', name: 'PublicRecordsNow',
    url: 'https://www.publicrecordsnow.com/static/view/optout',
    selectors: null,
    instructions: 'Enter your name and email → solve the CAPTCHA → click Submit. Check your email for a confirmation link if one is sent.'
  },
  {
    id: 'usphonebook', name: 'US Phone Book',
    url: 'https://www.usphonebook.com/opt-out',
    selectors: null,
    instructions: 'Search your name → find your listing → click "Remove" → enter your email → confirm via the email link.'
  },
  {
    id: 'thatsthem', name: "That'sThem",
    url: 'https://thatsthem.com/optout',
    selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Opt Out → check your inbox for a confirmation email and click the link.'
  },
];
