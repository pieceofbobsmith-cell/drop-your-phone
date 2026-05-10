// optout.js — content script injected on data broker opt-out pages.
// Runs after brokers.js (which defines the global BROKERS array).
// Reads optoutProfile from storage and auto-fills the form.

(function () {
  chrome.storage.local.get(['optoutProfile'], ({ optoutProfile }) => {
    if (!optoutProfile) return;

    const hostname = location.hostname.replace(/^www\./, '');
    const broker = BROKERS.find(b => {
      try { return new URL(b.url).hostname.replace(/^www\./, '') === hostname; }
      catch { return false; }
    });
    if (!broker || !broker.selectors) return;

    const sel = broker.selectors;

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

      // Then submit after 600ms
      setTimeout(() => {
        const btn = sel.submit && document.querySelector(sel.submit);
        if (btn) btn.click();
      }, 600);
    }, 1500);
  });
})();
