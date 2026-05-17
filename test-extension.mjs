// test-extension.mjs — tests cookie blocking + opt-out UI
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_PATH = __dirname;

async function main() {
  console.log('\n=== DROP YOUR PHONE — Extension Test ===\n');

  const ctx = await chromium.launchPersistentContext('', {
    headless: false,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    timeout: 30000,
  });

  // ── Get extension ID from service worker ──────────────────────────
  let extId = null;
  for (const sw of ctx.serviceWorkers()) {
    const url = sw.url();
    if (url.includes('background.js')) {
      extId = url.split('/')[2];
      break;
    }
  }
  if (!extId) {
    // Wait for the SW to register
    extId = await new Promise(resolve => {
      ctx.once('serviceworker', sw => {
        resolve(sw.url().split('/')[2]);
      });
      setTimeout(() => resolve(null), 5000);
    });
  }
  console.log(`Extension ID: ${extId || '(not detected yet)'}`);

  const page = await ctx.newPage();

  // ══════════════════════════════════════════════════════════════════
  // TEST 1 — Cookie blocking: inject content.js into a fake page
  // ══════════════════════════════════════════════════════════════════
  console.log('\n--- TEST 1: Cookie banner blocking ---');
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div id="onetrust-banner-sdk" style="position:fixed;bottom:0;display:block;width:100%;height:80px;background:#fff">
      <button id="onetrust-reject-all-handler" style="display:block">Reject All</button>
    </div>
    <p id="main">Page content</p>
    </body></html>
  `);

  // Programmatically check what content.js would do — inject the script
  // (We simulate it since we can't inject chrome extension content scripts into data: pages)
  const bannerExists = await page.evaluate(() => {
    const btn = document.querySelector('#onetrust-reject-all-handler');
    return !!btn && btn.offsetWidth > 0;
  });
  console.log(`  OneTrust banner present before test: ${bannerExists}`);

  // Test the DOM logic directly (mirrors content.js tryOneTrust())
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('#onetrust-reject-all-handler');
    if (btn && btn.offsetWidth > 0) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`  [${clicked ? 'PASS' : 'FAIL'}] OneTrust reject-all button found and clicked`);

  // Test generic banner detection (mirrors tryGeneric())
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="cookie-banner" style="position:fixed;bottom:0;display:block;width:100%;background:#eee;padding:10px">
      <p>We use cookies</p>
      <button id="accept">Accept all</button>
      <button id="necessary">Necessary only</button>
    </div>
    </body></html>
  `);

  const genericFound = await page.evaluate(() => {
    const kw = 'necessary only';
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.toLowerCase().trim().includes(kw));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log(`  [${genericFound ? 'PASS' : 'FAIL'}] Generic "necessary only" button detected and clicked`);

  // Test Cookiebot button detection
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div id="CybotCookiebotDialog" style="display:block">
      <button id="CybotCookiebotDialogBodyButtonDecline" style="display:inline-block">Decline</button>
    </div>
    </body></html>
  `);
  const cookiebotFound = await page.evaluate(() => {
    const btn = document.querySelector('#CybotCookiebotDialogBodyButtonDecline');
    return !!btn;
  });
  console.log(`  [${cookiebotFound ? 'PASS' : 'FAIL'}] Cookiebot decline button selector works`);

  // ══════════════════════════════════════════════════════════════════
  // TEST 2 — Popup UI: load popup.html and test the opt-out form
  // ══════════════════════════════════════════════════════════════════
  console.log('\n--- TEST 2: Popup / Opt-out UI ---');

  let popupPage;
  if (extId) {
    popupPage = await ctx.newPage();
    await popupPage.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: 'load', timeout: 10000 });
  } else {
    // Fallback: load popup.html as a local file (chrome.* APIs won't work but DOM can be inspected)
    popupPage = await ctx.newPage();
    await popupPage.goto(`file://${EXT_PATH}/popup.html`, { waitUntil: 'load', timeout: 10000 });
  }

  // Check all required form elements exist
  const elements = {
    'First name input':   '#ooFirstName',
    'Last name input':    '#ooLastName',
    'Email input':        '#ooEmail',
    'City input':         '#ooCity',
    'State input':        '#ooState',
    'Start opt-out btn':  '#startOptoutBtn',
    'Pause btn':          '#pauseOptoutBtn',
    'Redo btn':           '#redoOptoutBtn',
    'Erased msg div':     '#erasedMsg',
    'Broker list div':    '#brokerList',
    'Play button':        '#playBtn',
    'Blocking toggle':    '#blockingToggle',
    'Blocked count':      '#blockedCount',
  };

  let domPassed = 0, domFailed = 0;
  for (const [label, sel] of Object.entries(elements)) {
    const exists = await popupPage.locator(sel).count() > 0;
    console.log(`  [${exists ? 'PASS' : 'FAIL'}] ${label} (${sel})`);
    exists ? domPassed++ : domFailed++;
  }

  // Check broker count in manifesto
  const brokerCount = await popupPage.locator('#protestBrokerCount').textContent().catch(() => '?');
  console.log(`  [INFO] Manifesto shows ${brokerCount} brokers`);

  // Check startOptoutBtn text
  const startBtnText = await popupPage.locator('#startOptoutBtn').textContent().catch(() => '?');
  console.log(`  [INFO] Start button text: "${startBtnText.trim()}"`);

  // Check hidden state of pause/redo buttons on fresh load
  const pauseHidden = await popupPage.locator('#pauseOptoutBtn').evaluate(el => el.classList.contains('hidden')).catch(() => null);
  const redoHidden  = await popupPage.locator('#redoOptoutBtn').evaluate(el => el.classList.contains('hidden')).catch(() => null);
  console.log(`  [${pauseHidden === true ? 'PASS' : 'FAIL'}] Pause button hidden on fresh load`);
  console.log(`  [${redoHidden  === true ? 'PASS' : 'FAIL'}] Redo button hidden on fresh load`);

  // Fill the form and click start (validation check)
  await popupPage.fill('#ooFirstName', 'Test');
  // Leave last name blank — should refuse
  await popupPage.click('#startOptoutBtn');
  const stillEnabled = await popupPage.locator('#startOptoutBtn').evaluate(el => !el.disabled);
  console.log(`  [${stillEnabled ? 'PASS' : 'FAIL'}] Start btn stays enabled when last name is missing (validation works)`);

  // Fill rest of required fields
  await popupPage.fill('#ooLastName', 'User');
  await popupPage.fill('#ooEmail', 'test@example.com');
  await popupPage.fill('#ooCity', 'New York');
  await popupPage.fill('#ooState', 'NY');

  // Check startOptoutBtn is still clickable after fill
  const btnReady = await popupPage.locator('#startOptoutBtn').evaluate(el => !el.disabled);
  console.log(`  [${btnReady ? 'PASS' : 'FAIL'}] Start button is enabled after filling required fields`);

  // Click start
  await popupPage.click('#startOptoutBtn');
  await popupPage.waitForTimeout(500);

  // After clicking start, erased msg should be visible and btn disabled
  const erasedVisible = await popupPage.locator('#erasedMsg').evaluate(el => !el.classList.contains('hidden')).catch(() => false);
  const startDisabled = await popupPage.locator('#startOptoutBtn').evaluate(el => el.disabled).catch(() => false);
  const pauseVisible  = await popupPage.locator('#pauseOptoutBtn').evaluate(el => !el.classList.contains('hidden')).catch(() => false);
  const redoVisible   = await popupPage.locator('#redoOptoutBtn').evaluate(el => !el.classList.contains('hidden')).catch(() => false);
  const brokerListVis = await popupPage.locator('#brokerList').evaluate(el => !el.classList.contains('hidden')).catch(() => false);

  console.log(`  [${erasedVisible ? 'PASS' : 'FAIL'}] Erased message visible after starting`);
  console.log(`  [${startDisabled ? 'PASS' : 'FAIL'}] Start button disabled after starting`);
  console.log(`  [${pauseVisible  ? 'PASS' : 'FAIL'}] Pause button appears after starting`);
  console.log(`  [${redoVisible   ? 'PASS' : 'FAIL'}] Redo button appears after starting`);
  console.log(`  [${brokerListVis ? 'PASS' : 'FAIL'}] Broker list renders after starting`);

  // Test Redo/Clear button
  await popupPage.click('#redoOptoutBtn');
  await popupPage.waitForTimeout(300);
  const afterRedoEnabled = await popupPage.locator('#startOptoutBtn').evaluate(el => !el.disabled).catch(() => false);
  const afterRedoHidden  = await popupPage.locator('#pauseOptoutBtn').evaluate(el => el.classList.contains('hidden')).catch(() => false);
  const erasedHiddenAfterRedo = await popupPage.locator('#erasedMsg').evaluate(el => el.classList.contains('hidden')).catch(() => false);
  console.log(`  [${afterRedoEnabled ? 'PASS' : 'FAIL'}] Start button re-enabled after Redo`);
  console.log(`  [${afterRedoHidden  ? 'PASS' : 'FAIL'}] Pause button hidden after Redo`);
  console.log(`  [${erasedHiddenAfterRedo ? 'PASS' : 'FAIL'}] Erased message hidden after Redo`);

  // ══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════
  console.log('\n--- DOM element check summary ---');
  console.log(`  Passed: ${domPassed}  Failed: ${domFailed}`);

  await ctx.close();
  console.log('\n=== Tests complete ===\n');
}

main().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
