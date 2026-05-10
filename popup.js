// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle      = document.getElementById('blockingToggle');
  const countEl     = document.getElementById('blockedCount');
  const playBtn     = document.getElementById('playBtn');
  const firstNameEl = document.getElementById('ooFirstName');
  const lastNameEl  = document.getElementById('ooLastName');
  const emailEl     = document.getElementById('ooEmail');
  const cityEl      = document.getElementById('ooCity');
  const stateEl     = document.getElementById('ooState');
  const startBtn    = document.getElementById('startOptoutBtn');
  const brokerList  = document.getElementById('brokerList');

  // ── Tracker blocking ──────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response) {
      toggle.checked = response.blockingEnabled !== false;
      countEl.textContent = response.blockedCount || 0;
    }
  });

  toggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'SET_BLOCKING', enabled: toggle.checked });
  });

  playBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('game.html') });
    window.close();
  });

  // ── Opt-out: restore saved profile and previous statuses ─────────
  chrome.storage.local.get(['optoutProfile', 'optoutStatus'], ({ optoutProfile, optoutStatus }) => {
    if (optoutProfile) {
      firstNameEl.value = optoutProfile.firstName || '';
      lastNameEl.value  = optoutProfile.lastName  || '';
      emailEl.value     = optoutProfile.email     || '';
      cityEl.value      = optoutProfile.city      || '';
      stateEl.value     = optoutProfile.state     || '';
    }
    if (optoutStatus) {
      renderBrokerList(optoutStatus);
      startBtn.textContent = '\u2713 OPT-OUT SENT';
    }
  });

  // ── Auto-save profile as user types ──────────────────────────────
  let saveTimer;
  const profileFields = [firstNameEl, lastNameEl, emailEl, cityEl, stateEl];
  profileFields.forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        chrome.storage.local.set({ optoutProfile: {
          firstName: firstNameEl.value.trim(),
          lastName:  lastNameEl.value.trim(),
          email:     emailEl.value.trim(),
          city:      cityEl.value.trim(),
          state:     stateEl.value.trim().toUpperCase(),
        }});
      }, 400);
    });
  });

  // ── Start opt-out ─────────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    const profile = {
      firstName: firstNameEl.value.trim(),
      lastName:  lastNameEl.value.trim(),
      email:     emailEl.value.trim(),
      city:      cityEl.value.trim(),
      state:     stateEl.value.trim().toUpperCase(),
    };
    if (!profile.firstName || !profile.lastName) {
      firstNameEl.focus();
      return;
    }
    startBtn.disabled = true;
    startBtn.textContent = '\u21bb OPENING TABS\u2026';

    // Save profile and build statuses
    const statuses = {};
    BROKERS.forEach(b => { statuses[b.id] = b.selectors ? 'submitted' : 'manual'; });
    chrome.storage.local.set({ optoutProfile: profile, optoutStatus: statuses });

    // Open all tabs directly from popup (reliable — no service worker roundtrip)
    BROKERS.forEach(b => chrome.tabs.create({ url: b.url, active: false }));

    renderBrokerList(statuses);
    startBtn.textContent = '\u2713 OPT-OUT SENT';
  });

  // ── Render broker status list ─────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderBrokerList(statuses) {
    brokerList.classList.remove('hidden');
    brokerList.innerHTML = BROKERS.map(b => {
      const status = statuses[b.id] || 'idle';
      const dotClass    = 'dot-' + status;
      const statusClass = 'status-' + status;
      const statusText  = status === 'submitted' ? 'sent'
                        : status === 'manual'    ? 'manual'
                        : status === 'error'     ? 'error'
                        :                          '\u2013';
      return '<div class="broker-item" data-id="' + esc(b.id) + '">'
        + '<span class="broker-dot ' + esc(dotClass) + '"></span>'
        + '<span class="broker-name">' + esc(b.name) + '</span>'
        + '<span class="broker-status-text ' + esc(statusClass) + '">' + esc(statusText) + '</span>'
        + '</div>'
        + '<div class="broker-instructions hidden" data-for="' + esc(b.id) + '">'
        + esc(b.instructions || '')
        + '</div>';
    }).join('');

    // Toggle instructions on row click
    brokerList.querySelectorAll('.broker-item').forEach(row => {
      row.addEventListener('click', () => {
        const panel = brokerList.querySelector('.broker-instructions[data-for="' + row.dataset.id + '"]');
        if (panel) panel.classList.toggle('hidden');
      });
    });
  }
});
