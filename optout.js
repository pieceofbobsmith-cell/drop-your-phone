// optout.js — content script injected on data broker opt-out pages.
// Runs after brokers.js (which defines the global BROKERS array).
// Fills the form, submits it, then closes the tab so the queue can proceed.

(function () {
  chrome.storage.local.get(['optoutProfile'], ({ optoutProfile }) => {
    if (!optoutProfile) return;

    const hostname = location.hostname.replace(/^www\./, '');
    const broker = BROKERS.find(b => {
      try { return new URL(b.url).hostname.replace(/^www\./, '') === hostname; }
      catch { return false; }
    });

    // Manual brokers stay open — user handles them
    if (!broker || broker.manual) return;
    if (!broker.selectors) return;

    const sel = broker.selectors;

    // Guarantee this tab closes within 8s so the queue always progresses
    const guaranteedClose = setTimeout(
      () => chrome.runtime.sendMessage({ type: 'CLOSE_ME' }),
      8000
    );

    const fill = (selector, value) => {
      if (!selector || !value) return;
      const el = document.querySelector(selector);
      if (!el) return;
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Wait 1.5s for React/SPA to finish rendering the form
    setTimeout(() => {
      fill(sel.firstName, optoutProfile.firstName);
      fill(sel.lastName,  optoutProfile.lastName);
      fill(sel.email,     optoutProfile.email);
      fill(sel.city,      optoutProfile.city);
      fill(sel.state,     optoutProfile.state);

      // Submit after 600ms, then close after 4s
      setTimeout(() => {
        const btn = sel.submit && document.querySelector(sel.submit);
        if (btn) {
          btn.click();
          clearTimeout(guaranteedClose);
          setTimeout(() => chrome.runtime.sendMessage({ type: 'CLOSE_ME' }), 4000);
        }
        // If no submit button found, guaranteedClose fires at 8s
      }, 600);
    }, 1500);
  });
})();
