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
  const pauseBtn    = document.getElementById('pauseOptoutBtn');
  const redoBtn     = document.getElementById('redoOptoutBtn');
  const brokerList  = document.getElementById('brokerList');
  const erasedMsg   = document.getElementById('erasedMsg');

  // Show real broker counts in the manifesto
  const autoCount   = BROKERS.filter(b => !b.manual).length;
  const manualCount = BROKERS.filter(b => b.manual).length;
  const totalCount  = BROKERS.length;
  const countEl2    = document.getElementById('protestBrokerCount');
  if (countEl2) countEl2.textContent = totalCount;

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
      startBtn.disabled = true;
      startBtn.textContent = '\u2713 ERASED FROM ' + autoCount + ' DATABASES';
      showErasedMessage(autoCount);
      redoBtn.classList.remove('hidden');
      // Show pause/resume state if queue is still running
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
  [firstNameEl, lastNameEl, emailEl, cityEl, stateEl].forEach(el => {
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

    // Build statuses: auto brokers → 'sent', manual → 'idle'
    const statuses = {};
    BROKERS.forEach(b => { statuses[b.id] = b.manual ? 'idle' : 'sent'; });
    chrome.storage.local.set({ optoutProfile: profile, optoutStatus: statuses });

    // Queue all auto-fill brokers — background.js opens them one at a time,
    // each fills+submits+closes before the next one opens
    const autoUrls = BROKERS.filter(b => !b.manual).map(b => b.url);
    chrome.runtime.sendMessage({ type: 'START_OPTOUT_QUEUE', urls: autoUrls });

    renderBrokerList(statuses);
    startBtn.textContent = '\u2713 ERASED FROM ' + autoCount + ' DATABASES';
    showErasedMessage(autoCount);
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

  // ── Redo opt-out ──────────────────────────────────────────────────
  redoBtn.addEventListener('click', () => {
    // Stop the background queue and close any open opt-out tab
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

  // ── Helpers ───────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showErasedMessage(n) {
    erasedMsg.classList.remove('hidden');
    erasedMsg.innerHTML =
      '<div class="erased-headline">\u2713 ' + n + ' OPT-OUTS SENT.</div>'
      + '<div class="erased-body">They commodified your existence.'
      + ' They sold your location, your relatives, your past.<br>'
      + ' You just took yourself back from all of them.</div>';
  }

  // ── Render broker list (two sections) ────────────────────────────
  function renderBrokerList(statuses) {
    brokerList.classList.remove('hidden');

    const manualBrokers = BROKERS.filter(b => b.manual);
    const autoBrokers   = BROKERS.filter(b => !b.manual);

    // ── MANUAL section ──
    let html = '<div class="section-header section-manual">'
      + '\u26A0 ' + manualBrokers.length + ' SITES STILL HAVE YOUR DATA \u2014 FINISH THESE'
      + '</div>';

    manualBrokers.forEach(b => {
      const opened = statuses[b.id] === 'opened';
      html += '<div class="broker-row-manual" data-id="' + esc(b.id) + '" data-url="' + esc(b.url) + '">'
        + '<span class="broker-name-manual">' + esc(b.name) + '</span>'
        + '<button class="open-btn' + (opened ? ' open-btn-done' : '') + '" data-id="' + esc(b.id) + '" data-url="' + esc(b.url) + '">'
          + (opened ? '\u2713 opened' : 'Open \u2192')
        + '</button>'
        + '</div>'
        + '<div class="broker-instructions-manual">'
        + esc(b.instructions || '')
        + '</div>';
    });

    // ── AUTO section ──
    const autoCount = autoBrokers.length;
    html += '<div class="section-header section-auto" id="autoSectionHeader">'
      + '\u2713 ERASED FROM ' + autoBrokers.length + ' DATABASES '
      + '<span class="toggle-auto" id="toggleAutoBtn">see list \u25be</span>'
      + '</div>';

    html += '<div class="auto-broker-list hidden" id="autoBrokerList">';
    autoBrokers.forEach(b => {
      html += '<div class="broker-row-auto">'
        + '<span class="broker-name-auto">' + esc(b.name) + '</span>'
        + '<span class="broker-badge-sent">sent</span>'
        + '</div>';
    });
    html += '</div>';

    brokerList.innerHTML = html;

    // Open-button click handlers for manual brokers
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
          ? 'show list \u25be'
          : 'hide list \u25b4';
      });
    }
  }
});
