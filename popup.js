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
  const streetEl    = document.getElementById('ooStreet');
  const zipEl       = document.getElementById('ooZip');
  const phoneEl     = document.getElementById('ooPhone');
  const startBtn    = document.getElementById('startOptoutBtn');
  const pauseBtn    = document.getElementById('pauseOptoutBtn');
  const redoBtn     = document.getElementById('redoOptoutBtn');
  const brokerList  = document.getElementById('brokerList');
  const erasedMsg   = document.getElementById('erasedMsg');

  // Three categories of brokers.
  // `covered` = handled by another broker in the queue (e.g. PeopleConnect network sites
  //   covered by the suppression.peopleconnect.us entry). Don't open separate tabs.
  const emailOnlyBrokers   = BROKERS.filter(b => !b.manual && !b.covered && b.emailOnly === true);
  const searchFirstBrokers = BROKERS.filter(b => !b.manual && !b.covered && b.emailOnly !== true);
  const manualBrokers      = BROKERS.filter(b => b.manual);

  // Show total count in manifesto
  const countEl2 = document.getElementById('protestBrokerCount');
  if (countEl2) countEl2.textContent = BROKERS.length;

  // ── Inject cookie blocker into current tab (uses activeTab — no broad host_permissions needed)
  function injectContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id, allFrames: true },
        files: ['content.js']
      }).catch(() => {}); // Silently ignore chrome://, extension pages, etc.
    });
  }

  // ── Tracker blocking ──────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (response) {
      toggle.checked = response.blockingEnabled !== false;
      countEl.textContent = response.blockedCount || 0;
      if (response.blockingEnabled !== false) injectContentScript();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockedCount !== undefined) {
      countEl.textContent = changes.blockedCount.newValue || 0;
    }
  });

  toggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'SET_BLOCKING', enabled: toggle.checked });
    if (toggle.checked) injectContentScript();
  });

  playBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://bytetobuild3d.com/game' });
    window.close();
  });

  // ── Restore saved profile and status ─────────────────────────────
  chrome.storage.local.get(['optoutProfile', 'optoutStatus'], ({ optoutProfile, optoutStatus }) => {
    if (optoutProfile) {
      firstNameEl.value = optoutProfile.firstName || '';
      lastNameEl.value  = optoutProfile.lastName  || '';
      emailEl.value     = optoutProfile.email     || '';
      cityEl.value      = optoutProfile.city      || '';
      stateEl.value     = optoutProfile.state     || '';
      streetEl.value    = optoutProfile.street    || '';
      zipEl.value       = optoutProfile.zip       || '';
      phoneEl.value     = optoutProfile.phone     || '';
    }
    if (optoutStatus) {
      renderBrokerList(optoutStatus);
      startBtn.disabled = true;
      startBtn.textContent = '\u26a1 RUNNING \u2014 close each tab when done';
      redoBtn.classList.remove('hidden');
      chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATE' }, (r) => {
        if (r && r.remaining > 0) {
          pauseBtn.classList.remove('hidden');
          pauseBtn.textContent = r.paused ? '\u25b6 RESUME' : '\u23f8 PAUSE';
        }
      });
    }
  });

  // ── Auto-save profile as user types ──────────────────────────────
  let saveTimer;
  [firstNameEl, lastNameEl, emailEl, cityEl, stateEl, streetEl, zipEl, phoneEl].forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        chrome.storage.local.set({ optoutProfile: buildProfile() });
      }, 400);
    });
  });

  function buildProfile() {
    return {
      firstName: firstNameEl.value.trim(),
      lastName:  lastNameEl.value.trim(),
      email:     emailEl.value.trim(),
      city:      cityEl.value.trim(),
      state:     stateEl.value.trim().toUpperCase(),
      street:    streetEl.value.trim(),
      zip:       zipEl.value.trim(),
      phone:     phoneEl.value.trim(),
    };
  }

  // ── Start opt-out ─────────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    const profile = buildProfile();
    if (!profile.firstName || !profile.lastName) {
      firstNameEl.focus();
      return;
    }
    if (!profile.email) {
      emailEl.focus();
      return;
    }
    startBtn.disabled = true;
    startBtn.textContent = '\u26a1 RUNNING \u2014 close each tab when done';

    const statuses = {};
    BROKERS.forEach(b => { statuses[b.id] = b.manual ? 'idle' : 'queued'; });
    chrome.storage.local.set({ optoutProfile: profile, optoutStatus: statuses });

    // Email-only brokers run fully in the background (they auto-close).
    // Search-first brokers open in the foreground one at a time — user picks
    // their record, then closes the tab to trigger the next one.
    // Sort email-only first so background ones finish before foreground ones start.
    const autoQueue = [
      ...emailOnlyBrokers.map(b =>   ({ url: b.url, emailOnly: true  })),
      ...searchFirstBrokers.map(b => ({ url: b.url, emailOnly: false })),
    ];
    chrome.runtime.sendMessage({ type: 'START_OPTOUT_QUEUE', queue: autoQueue });

    renderBrokerList(statuses);
    erasedMsg.classList.remove('hidden');
    erasedMsg.innerHTML =
      '<div class="erased-headline">\u26a1 OPT-OUTS RUNNING</div>'
      + '<div class="erased-body">'
      + emailOnlyBrokers.length + ' sites are auto-submitting in the background.<br>'
      + searchFirstBrokers.length + ' sites will open one at a time \u2014 '
      + 'each fills the search form automatically. You pick your record, click Opt Out, then close the tab.'
      + '</div>';
    pauseBtn.classList.remove('hidden');
    pauseBtn.textContent = '\u23f8 PAUSE';
    redoBtn.classList.remove('hidden');
  });

  pauseBtn.addEventListener('click', () => {
    const isPaused = pauseBtn.textContent.includes('RESUME');
    if (isPaused) {
      chrome.runtime.sendMessage({ type: 'RESUME_QUEUE' });
      pauseBtn.textContent = '\u23f8 PAUSE';
    } else {
      chrome.runtime.sendMessage({ type: 'PAUSE_QUEUE' });
      pauseBtn.textContent = '\u25b6 RESUME';
    }
  });

  redoBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_QUEUE' });
    chrome.storage.local.remove(['optoutStatus']);
    brokerList.classList.add('hidden');
    brokerList.innerHTML = '';
    erasedMsg.classList.add('hidden');
    erasedMsg.innerHTML = '';
    startBtn.disabled = false;
    startBtn.textContent = '\u26A1 ERASE ME FROM ALL OF THEM';
    pauseBtn.classList.add('hidden');
    pauseBtn.textContent = '\u23f8 PAUSE';
    redoBtn.classList.add('hidden');
    firstNameEl.focus();
  });

  // ── Render broker list (three sections) ──────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderBrokerList(statuses) {
    brokerList.classList.remove('hidden');
    let html = '';

    // ── SECTION 1: Manual ──
    if (manualBrokers.length) {
      html += '<div class="section-header section-manual">'
        + '\u26A0 ' + manualBrokers.length + ' SITES — DO THESE YOURSELF'
        + '</div>';
      manualBrokers.forEach(b => {
        const opened = statuses[b.id] === 'opened';
        html += '<div class="broker-row-manual" >'
          + '<span class="broker-name-manual">' + esc(b.name) + '</span>'
          + '<button class="open-btn' + (opened ? ' open-btn-done' : '') + '" data-id="' + esc(b.id) + '" data-url="' + esc(b.url) + '">'
            + (opened ? '\u2713 opened' : 'Open \u2192')
          + '</button>'
          + '</div>'
          + '<div class="broker-instructions-manual">' + esc(b.instructions || '') + '</div>';
      });
    }

    // ── SECTION 2: Search-first ──
    if (searchFirstBrokers.length) {
      html += '<div class="section-header section-search">'
        + '\u23f3 ' + searchFirstBrokers.length + ' SITES \u2014 WE FILL THE FORM, YOU PICK YOUR RECORD'
        + '</div>';
      html += '<div class="search-broker-list">';
      searchFirstBrokers.forEach(b => {
        html += '<div class="broker-row-auto">'
          + '<span class="broker-name-auto">' + esc(b.name) + '</span>'
          + '<span class="broker-badge-search">auto-search</span>'
          + '</div>';
      });
      html += '</div>';
      html += '<div class="search-broker-hint">Each site opens in a new tab. The form is pre-filled \u2014 click Search, find your name, click Opt Out, then close the tab. The next site opens automatically.</div>';
    }

    // ── SECTION 3: Email-only (auto) ──
    if (emailOnlyBrokers.length) {
      html += '<div class="section-header section-auto" id="autoSectionHeader">'
        + '\u2713 ' + emailOnlyBrokers.length + ' SITES AUTO-SUBMITTED '
        + '<span class="toggle-auto" id="toggleAutoBtn">see list \u25be</span>'
        + '</div>';
      html += '<div class="auto-broker-list hidden" id="autoBrokerList">';
      emailOnlyBrokers.forEach(b => {
        html += '<div class="broker-row-auto">'
          + '<span class="broker-name-auto">' + esc(b.name) + '</span>'
          + '<span class="broker-badge-sent">sent</span>'
          + '</div>';
      });
      html += '</div>';
    }

    brokerList.innerHTML = html;

    // Open-button handlers for manual brokers
    brokerList.querySelectorAll('.open-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('open-btn-done')) return;
        chrome.tabs.create({ url: btn.dataset.url, active: true });
        btn.textContent = '\u2713 opened';
        btn.classList.add('open-btn-done');
        chrome.storage.local.get(['optoutStatus'], ({ optoutStatus }) => {
          if (optoutStatus) {
            optoutStatus[btn.dataset.id] = 'opened';
            chrome.storage.local.set({ optoutStatus });
          }
        });
      });
    });

    // Toggle auto list
    const toggleBtn = document.getElementById('toggleAutoBtn');
    const autoList  = document.getElementById('autoBrokerList');
    if (toggleBtn && autoList) {
      toggleBtn.addEventListener('click', () => {
        autoList.classList.toggle('hidden');
        toggleBtn.textContent = autoList.classList.contains('hidden')
          ? 'see list \u25be' : 'hide list \u25b4';
      });
    }
  }
});
