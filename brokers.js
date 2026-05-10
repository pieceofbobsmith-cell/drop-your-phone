// brokers.js — loaded by popup.html (<script>) and service worker (importScripts).
// selectors: null means manual-only (just opens the page, user fills it).
// instructions: shown in popup when user clicks the broker row.

const BROKERS = [
  {
    id: 'spokeo', name: 'Spokeo',
    url: 'https://www.spokeo.com/optout',
    selectors: { email: 'input[name="email"]', submit: 'button[type="submit"], input[type="submit"]' },
    instructions: '1. Open a new tab and go to spokeo.com. 2. Search your name. 3. Find your listing and copy the full URL from the address bar (looks like spokeo.com/Firstname-Lastname/City-State/p12345). 4. Come back to this tab and paste that URL into the "URL" field. 5. Your email is auto-filled. 6. Solve the reCAPTCHA. 7. Click Opt Out. 8. Click the confirmation link in your email.'
  },
  {
    id: 'whitepages', name: 'WhitePages',
    url: 'https://www.whitepages.com/suppression-requests',
    selectors: null,
    instructions: '1. Click "Opt Out of WhitePages Premium". 2. Search your name and state. 3. Find your listing and click on it. 4. Click "Remove Me". 5. Enter your phone number — they will call it with an automated verification. 6. Answer the call and press 1 to confirm. Done — no email needed.'
  },
  {
    id: 'beenverified', name: 'BeenVerified',
    url: 'https://www.beenverified.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the reCAPTCHA → click Search → select your record → click Send Verification Email → confirm via the link in your inbox.'
  },
  {
    id: 'peoplelooker', name: 'PeopleLooker',
    url: 'https://www.peoplelooker.com/app/optout/search',
    selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled. Solve the reCAPTCHA → click Search → select your record → click Send Verification Email → confirm via the link in your inbox.'
  },
  {
    id: 'truthfinder', name: 'TruthFinder',
    url: 'https://www.truthfinder.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder="First Name"]', lastName: 'input[name="lastName"], input[placeholder="Last Name"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Find your record in the results. 4. Click "Remove My Record". 5. Enter your email address. 6. Click Send Verification Email. 7. Click the link in your inbox to confirm.'
  },
  {
    id: 'instantcheckmate', name: 'Instant Checkmate',
    url: 'https://www.instantcheckmate.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder="First Name"]', lastName: 'input[name="lastName"], input[placeholder="Last Name"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Find your record in the results. 4. Click "Remove My Record". 5. Enter your email address. 6. Click Send Verification Email. 7. Click the link in your inbox to confirm.'
  },
  {
    id: 'intelius', name: 'Intelius',
    url: 'https://www.intelius.com/opt-out/',
    selectors: { firstName: 'input[name="firstName"], input[placeholder="First Name"]', lastName: 'input[name="lastName"], input[placeholder="Last Name"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Find your listing. 4. Click "Opt Out". 5. Enter your email and click Submit. 6. Click the confirmation link in your inbox.'
  },
  {
    id: 'peoplefinder', name: 'PeopleFinder',
    url: 'https://www.peoplefinder.com/people_removal/',
    selectors: { firstName: 'input[name="firstName"], input[id="firstName"]', lastName: 'input[name="lastName"], input[id="lastName"]', state: 'select[name="state"]', submit: 'button[type="submit"]' },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Check the box next to your record. 4. Click "Send Opt-Out Request". 5. Enter your email. 6. Confirm via the email link.'
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
    instructions: '1. Open radaris.com in a new tab and search your name. 2. Click on your profile. 3. Click the three-dot menu (⋮) on your profile page. 4. Select "Control Info". 5. Choose "Remove Info". 6. If prompted, create a free Radaris account (use any email). 7. Submit the removal — you will receive a confirmation email.'
  },
  {
    id: 'acxiom', name: 'Acxiom',
    url: 'https://isapps.acxiom.com/optout/optout.aspx',
    selectors: {
      firstName: 'input[name="firstName"], input[id*="firstName"]',
      lastName: 'input[name="lastName"], input[id*="lastName"]',
      email: 'input[type="email"], input[name="email"], input[id*="email"]',
      state: 'select[name="state"], select[id*="state"]',
      submit: 'input[type="submit"], button[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Check the boxes for what data to remove (Mailing Addresses, Phone Numbers, Email Addresses). 2. Select "Me" under who is opting out. 3. Verify your name and email are filled in. 4. Add your street address and zip code. 5. Solve the reCAPTCHA. 6. Click Submit.'
  },
  {
    id: 'mylife', name: 'MyLife',
    url: 'https://www.mylife.com/ccpa/index.pubview',
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="First"]',
      lastName: 'input[name="lastName"], input[placeholder*="Last"]',
      email: 'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Verify your name and email are filled in. 2. Complete the CAPTCHA if shown. 3. Click "Do Not Sell My Personal Information". 4. Check your inbox for a confirmation email and click the link.'
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
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="First"]',
      lastName: 'input[name="lastName"], input[placeholder*="Last"]',
      state: 'select[name="state"]',
      submit: 'button[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Find and click your record. 4. Click "Remove Record". 5. Enter your email. 6. Click Submit and confirm via the email link.'
  },
  {
    id: 'ussearch', name: 'US Search',
    url: 'https://www.ussearch.com/opt-out/',
    selectors: {
      firstName: 'input[name="firstName"], input[name="first_name"]',
      lastName: 'input[name="lastName"], input[name="last_name"]',
      state: 'select[name="state"]',
      email: 'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Verify name, state, and email are filled in. 2. Click Search/Submit. 3. Confirm via the email link sent to you.'
  },
  {
    id: 'peoplefinders', name: 'PeopleFinders',
    url: 'https://www.peoplefinders.com/opt-out',
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="First"]',
      lastName: 'input[name="lastName"], input[placeholder*="Last"]',
      state: 'select[name="state"]',
      submit: 'button[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Select your state if not filled. 2. Click Search. 3. Find your listing. 4. Click Opt Out. 5. Enter your email. 6. Confirm via the email link.'
  },
  {
    id: 'zabasearch', name: 'ZabaSearch',
    url: 'https://www.zabasearch.com/block_records/',
    selectors: {
      firstName: 'input[name="fname"], input[name="firstName"]',
      lastName: 'input[name="lname"], input[name="lastName"]',
      email: 'input[type="email"], input[name="email"]',
      submit: 'input[type="submit"], button[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Fill in your street address, city, state, and zip (required). 2. Solve the CAPTCHA. 3. Click Submit. No email confirmation needed — removal is usually instant.'
  },
  {
    id: 'publicrecordsnow', name: 'PublicRecordsNow',
    url: 'https://www.publicrecordsnow.com/static/view/optout',
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="First"]',
      lastName: 'input[name="lastName"], input[placeholder*="Last"]',
      email: 'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Verify your name and email are filled in. 2. Solve the CAPTCHA. 3. Click Submit. 4. Check your email for a confirmation link if one is sent.'
  },
  {
    id: 'usphonebook', name: 'US Phone Book',
    url: 'https://www.usphonebook.com/opt-out',
    selectors: {
      firstName: 'input[name="firstName"], input[placeholder*="First"]',
      lastName: 'input[name="lastName"], input[placeholder*="Last"]',
      email: 'input[type="email"], input[name="email"]',
      submit: 'button[type="submit"], input[type="submit"]'
    },
    instructions: 'Fields auto-filled where possible. 1. Verify your name and email are filled in. 2. Click Opt Out / Send. 3. Check your inbox for a confirmation link and click it.'
  },
  {
    id: 'thatsthem', name: "That'sThem",
    url: 'https://thatsthem.com/optout',
    selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' },
    instructions: 'Auto-filled with your email. Click Opt Out → check your inbox for a confirmation email and click the link.'
  },
];
