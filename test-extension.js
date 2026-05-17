/**
 * test-extension.js — Drop Your Phone cookie blocker logic test
 * Tests the actual blocking logic on real sites via Playwright (no extension needed).
 * Usage: node test-extension.js
 */

const { chromium } = require('playwright');

const SITES = [
  { url: 'https://www.pcmag.com',        label: 'PCMag',        cmpType: 'OneTrust API' },
  { url: 'https://www.cnn.com',          label: 'CNN',          cmpType: 'OneTrust API' },
  { url: 'https://www.theatlantic.com',  label: 'The Atlantic', cmpType: 'SP CCPA' },
  { url: 'https://www.theguardian.com',  label: 'Guardian',     cmpType: 'SP pay-wall' },
  { url: 'https://www.spiegel.de',       label: 'Spiegel',      cmpType: 'SP pay-wall' },
  { url: 'https://techcrunch.com',       label: 'TechCrunch',   cmpType: 'OneTrust/generic' },
  { url: 'https://www.wired.com',        label: 'Wired',        cmpType: 'OneTrust/generic' },
  { url: 'https://www.bbc.com',          label: 'BBC',          cmpType: 'SP' },
];

// Inline the full blocking logic — matches content.js exactly
const BLOCK_SCRIPT = `(function() {
  const CONTAINER_KEYWORDS = [
    'reject all','decline all','deny all','refuse all','disagree',
    'reject cookies','decline cookies','refuse cookies',
    'necessary only','essential only','only necessary','only essential',
    'accept necessary','accept essential','use necessary','use essential',
    'necessary cookies only','essential cookies only',
    'continue without','proceed without','browse without',
    'i do not accept',"i don't accept",'i disagree',
    'no, thank','no thanks',
    'do not sell','do not share','opt out of all',
    'use limited data','limited data use',
    'stay basic','basic version',
    'save & exit','save and exit',
    'alle ablehnen','ablehnen','nur notwendige','nur erforderliche',
    'nicht akzeptieren','weiter ohne zustimmung','ohne einwilligung',
    'nur essentielle','notwendige cookies','einstellungen speichern',
    'tout refuser','refuser tout','refuser','continuer sans accepter',
    'continuer sans consentir','uniquement nécessaires','nécessaires uniquement',
    'je refuse','refus','désactiver tout',
    'rechazar todo','solo necesarias','solo esenciales','rechazar',
    'continuar sin aceptar','no aceptar',
    'rifiuta tutto','rifiuta','solo necessari','continua senza accettare',
    'alles weigeren','weigeren','alleen noodzakelijk','alleen functioneel',
    'rejeitar tudo','apenas necessários','recusar',
    'odrzuc wszystkie','tylko niezbedne',
  ];
  const STRICT_KEYWORDS = [
    'reject all','decline all','deny all','refuse all',
    'necessary only','essential only','only necessary','only essential',
    'continue without agreeing','continue without accepting',
    'necessary cookies only','essential cookies only',
    'use limited data',
    'alle ablehnen','tout refuser','refuser tout',
    'rechazar todo','rifiuta tutto','alles weigeren','rejeitar tudo',
  ];
  const BANNER_CONTAINER_SELS = [
    '[id*="cookie"]','[class*="cookie"]',
    '[id*="consent"]','[class*="consent"]',
    '[id*="gdpr"]','[class*="gdpr"]',
    '[id*="privacy"]','[class*="privacy-banner"]','[class*="privacy-notice"]',
    '[class*="CookieBanner"]','[id*="CookieBanner"]',
    '.cc-window','.cc-banner','.cc-dialog',
    '#cookie-bar','#cookie-notice','#cookie-law-info-bar',
    '.cookie-popup','#cookie-popup','.cookie-consent',
    '[aria-label*="cookie" i]','[aria-label*="consent" i]',
    '[aria-label*="privacy" i]',
    '[role="dialog"]','[role="alertdialog"]',
    '[id^="sp_message"]','[class*="sp_message"]',
    '#onetrust-banner-sdk','.onetrust-pc-dark-filter',
    '#CybotCookiebotDialog',
    '#didomi-popup','#didomi-host',
    '[class*="CmpOverlay"]','[class*="cmp-overlay"]',
    '[class*="usercentrics"]','[id*="usercentrics"]',
    '.cmp-container','#cmp-container',
    '[class*="truste"]','[id*="truste"]',
  ];

  const isMainFrame = window.top === window.self;

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05;
  }

  let blocked = null;

  function clickAndBlock(btn) {
    btn.click();
    blocked = btn.textContent.trim().substring(0, 60);
  }

  function tryAPIs() {
    try {
      if (window.OneTrust && typeof window.OneTrust.RejectAll === 'function') {
        window.OneTrust.RejectAll();
        blocked = 'OneTrust.RejectAll()';
        return true;
      }
    } catch(_) {}
    try {
      if (window.Cookiebot && typeof window.Cookiebot.decline === 'function') {
        window.Cookiebot.decline();
        blocked = 'Cookiebot.decline()';
        return true;
      }
    } catch(_) {}
    try {
      if (window.UC_UI && typeof window.UC_UI.denyAllConsents === 'function') {
        window.UC_UI.denyAllConsents();
        blocked = 'UC_UI.denyAllConsents()';
        return true;
      }
    } catch(_) {}
    try {
      if (window.axeptio && typeof window.axeptio.denyAll === 'function') {
        window.axeptio.denyAll();
        blocked = 'axeptio.denyAll()';
        return true;
      }
    } catch(_) {}
    return false;
  }

  function tryDOMSelectors() {
    const domChecks = [
      '.ot-pc-refuse-all-handler,#onetrust-reject-all-handler,.onetrust-reject-all-handler',
      '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll,#CybotCookiebotDialogBodyButtonDecline',
      '.trustarc-decline-btn,.pdynamicbutton .call',
      '#didomi-notice-disagree-button,.didomi-button-highlight,[data-click="notice.disagree"]',
    ];
    for (const sel of domChecks) {
      const btn = document.querySelector(sel);
      if (btn && isVisible(btn)) { clickAndBlock(btn); return true; }
    }
    return false;
  }

  function tryGeneric() {
    for (const sel of BANNER_CONTAINER_SELS) {
      let containers;
      try { containers = document.querySelectorAll(sel); } catch(_) { continue; }
      for (const container of containers) {
        if (!isVisible(container)) continue;
        const btns = Array.from(
          container.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]')
        ).filter(isVisible);
        for (const kw of CONTAINER_KEYWORDS) {
          const btn = btns.find(b => b.textContent.toLowerCase().trim().includes(kw));
          if (btn) { clickAndBlock(btn); return true; }
        }
      }
    }

    const overlayEls = document.querySelectorAll('div,section,aside,footer,header,form,article');
    for (const el of overlayEls) {
      if (!isVisible(el)) continue;
      const pos = window.getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky' && pos !== 'absolute') continue;
      const elText = (el.textContent || '').toLowerCase();
      if (!elText.includes('cookie') && !elText.includes('consent') && !elText.includes('privacy')
          && !elText.includes('datenschutz') && !elText.includes('confidentialité')) continue;
      const btns = Array.from(
        el.querySelectorAll('button,[role="button"],a,input[type="button"]')
      ).filter(isVisible);
      for (const kw of CONTAINER_KEYWORDS) {
        const btn = btns.find(b => b.textContent.toLowerCase().trim().includes(kw));
        if (btn) { clickAndBlock(btn); return true; }
      }
    }

    const tier3Keywords = isMainFrame ? STRICT_KEYWORDS : CONTAINER_KEYWORDS;
    const allBtns = Array.from(
      document.querySelectorAll('button,[role="button"],a,input[type="button"]')
    ).filter(isVisible);
    for (const kw of tier3Keywords) {
      const btn = allBtns.find(b => b.textContent.toLowerCase().trim().includes(kw));
      if (btn) { clickAndBlock(btn); return true; }
    }
    return false;
  }

  tryAPIs() || tryDOMSelectors() || tryGeneric();
  return blocked;
})()`;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkBannerVisible(page) {
  return page.evaluate(() => {
    const sels = [
      '#onetrust-banner-sdk',
      '#CybotCookiebotDialog',
      '[id^="sp_message_container"]',
      '[id*="didomi"]',
      '.cc-window',
    ];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el && el.getBoundingClientRect().height > 0) return s;
    }
    const fixed = Array.from(document.querySelectorAll('div,section')).find(el => {
      const pos = window.getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') return false;
      const r = el.getBoundingClientRect();
      if (r.width < 200 || r.height < 30) return false;
      const t = (el.textContent || '').toLowerCase();
      return t.includes('cookie') || t.includes('consent') || t.includes('privacy');
    });
    return fixed ? 'custom-overlay' : null;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const results = [];

  for (const site of SITES) {
    console.log(`\n── ${site.label} (${site.cmpType})`);
    const page = await browser.newPage();

    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 25000 })
      .catch(e => console.log('  nav warn:', e.message.substring(0, 50)));
    await wait(4000);

    const bannerBefore = await checkBannerVisible(page);
    console.log(`  Banner before:  ${bannerBefore || 'none visible'}`);

    // Run blocking logic in main frame
    const mainResult = await page.evaluate(BLOCK_SCRIPT).catch(e => 'ERR: ' + e.message.substring(0,50));
    console.log(`  Main frame:     ${mainResult || 'nothing found'}`);

    // Run blocking logic in CMP sub-frames
    for (const frame of page.frames()) {
      const fUrl = frame.url();
      if (fUrl === page.url() || !fUrl || fUrl === 'about:blank') continue;
      if (/privacy-mgmt|sp-prod|sourcepoint|consent|didomi|cookiebot|onetrust/i.test(fUrl)) {
        const fResult = await frame.evaluate(BLOCK_SCRIPT).catch(() => null);
        if (fResult) console.log(`  Frame [${fUrl.substring(0,40)}]: ${fResult}`);
      }
    }

    await wait(2500);

    const bannerAfter = await checkBannerVisible(page);
    console.log(`  Banner after:   ${bannerAfter || 'none'}`);

    const hadBanner = !!bannerBefore;
    const cleared = hadBanner && !bannerAfter;
    const paywall = site.cmpType.includes('pay-wall');

    let result;
    if (!hadBanner)   result = 'NO_BANNER';
    else if (cleared) result = 'BLOCKED ✓';
    else if (paywall) result = 'PAY-WALL (expected)';
    else              result = 'MISSED ✗';

    console.log(`  Result:         ${result}`);
    results.push({ ...site, result });
    await page.close();
  }

  await browser.close();

  console.log('\n════════════════════════════════');
  console.log('FINAL RESULTS');
  console.log('════════════════════════════════');
  let blocked = 0, missed = 0;
  for (const r of results) {
    const icon = r.result.startsWith('BLOCKED') ? '✓' :
                 r.result.startsWith('PAY-WALL') ? '~' :
                 r.result.startsWith('NO_BANNER') ? '-' : '✗';
    console.log(`${icon} ${r.label.padEnd(14)} ${r.result}`);
    if (r.result.startsWith('BLOCKED')) blocked++;
    else if (r.result.startsWith('MISSED')) missed++;
  }
  const tested = results.filter(r => !r.result.startsWith('NO_BANNER') && !r.result.startsWith('PAY-WALL')).length;
  console.log(`\nBlocked: ${blocked}/${tested} sites with banners (excluding headless-skipped & pay-walls)`);
})().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
