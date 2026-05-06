// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('blockingToggle');
  const countEl = document.getElementById('blockedCount');
  const playBtn = document.getElementById('playBtn');

  // Load current state from background
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
});
