// brokers.js — loaded by popup.html (<script>) and optout.js (via manifest content_scripts)
// selectors: null means manual-only (just opens the page, user fills it).
// selectors fields: firstName, lastName, email, city, state, submit — CSS selector strings.

const BROKERS = [
  { id: 'spokeo',           name: 'Spokeo',           url: 'https://www.spokeo.com/optout',                         selectors: null },
  { id: 'whitepages',       name: 'WhitePages',        url: 'https://www.whitepages.com/suppression-requests',        selectors: null },
  { id: 'beenverified',     name: 'BeenVerified',      url: 'https://www.beenverified.com/app/optout/search',         selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' } },
  { id: 'peoplelooker',     name: 'PeopleLooker',      url: 'https://www.peoplelooker.com/app/optout/search',         selectors: { firstName: 'input[name="firstName"]', lastName: 'input[name="lastName"]', submit: 'button[type="submit"]' } },
  { id: 'truthfinder',      name: 'TruthFinder',       url: 'https://www.truthfinder.com/opt-out/',                  selectors: null },
  { id: 'instantcheckmate', name: 'Instant Checkmate', url: 'https://www.instantcheckmate.com/opt-out/',             selectors: null },
  { id: 'intelius',         name: 'Intelius',          url: 'https://www.intelius.com/opt-out/',                     selectors: null },
  { id: 'peoplefinder',     name: 'PeopleFinder',      url: 'https://www.peoplefinder.com/optout.php',               selectors: null },
  { id: 'fastpeoplesearch', name: 'FastPeopleSearch',  url: 'https://www.fastpeoplesearch.com/removal',              selectors: { firstName: '#first_name', lastName: '#last_name', submit: 'button[type="submit"]' } },
  { id: 'radaris',          name: 'Radaris',           url: 'https://radaris.com/ng/page/how-to-remove',             selectors: null },
  { id: 'acxiom',           name: 'Acxiom',            url: 'https://isapps.acxiom.com/optout/optout.aspx',          selectors: null },
  { id: 'mylife',           name: 'MyLife',            url: 'https://www.mylife.com/ccpa/index.pubview',             selectors: null },
  { id: 'nuwber',           name: 'Nuwber',            url: 'https://nuwber.com/removal/link',                       selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' } },
  { id: 'checkpeople',      name: 'CheckPeople',       url: 'https://checkpeople.com/opt-out',                       selectors: null },
  { id: 'ussearch',         name: 'US Search',         url: 'https://www.ussearch.com/opt-out/',                     selectors: null },
  { id: 'peoplefinders',    name: 'PeopleFinders',     url: 'https://www.peoplefinders.com/opt-out',                 selectors: null },
  { id: 'zabasearch',       name: 'ZabaSearch',        url: 'https://www.zabasearch.com/block_records/',             selectors: null },
  { id: 'publicrecordsnow', name: 'PublicRecordsNow',  url: 'https://www.publicrecordsnow.com/static/view/optout',   selectors: null },
  { id: 'usphonebook',      name: 'US Phone Book',     url: 'https://www.usphonebook.com/opt-out',                   selectors: null },
  { id: 'thatsthem',        name: "That'sThem",        url: 'https://thatsthem.com/optout',                          selectors: { email: 'input[type="email"]', submit: 'button[type="submit"]' } },
];
