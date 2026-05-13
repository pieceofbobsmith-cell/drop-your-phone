// background.js — service worker

let blockedCount = 0;
let blockingEnabled = true;
let optoutTabId = null; // ID of the one opt-out tab currently open
let optoutPaused = false;

// Restore persisted state on startup (service worker can be killed and restarted by Chrome)
chrome.storage.local.get(['blockingEnabled', 'blockedCount', 'optoutTabId', 'optoutPaused'], (r) => {
  blockingEnabled = r.blockingEnabled !== false;
  blockedCount = r.blockedCount || 0;
  optoutPaused = r.optoutPaused === true;
  updateBadge();

  const savedTabId = r.optoutTabId || null;
  if (savedTabId) {
    // Verify the tab still exists — it may have closed while the SW was dead
    chrome.tabs.get(savedTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        // Tab is gone; clear stale state and continue queue
        optoutTabId = null;
        chrome.storage.local.remove(['optoutTabId']);
        chrome.alarms.clear('optoutTabClose');
        if (!optoutPaused) openNextOptout();
      } else {
        optoutTabId = savedTabId; // Tab still alive, wait for it to close
      }
    });
  } else if (!optoutPaused) {
    openNextOptout();
  }
});

// Alarm-based guaranteed close — fires even if optout.js never ran (redirect, CAPTCHA, etc.)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'optoutTabClose' && optoutTabId !== null) {
    chrome.tabs.remove(optoutTabId).catch(() => {});
  }
});

// When the opt-out tab closes, open the next one in the queue
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(['optoutTabId'], (r) => {
    const trackedId = r.optoutTabId || optoutTabId;
    if (tabId === trackedId) {
      optoutTabId = null;
      chrome.storage.local.remove(['optoutTabId']);
      chrome.alarms.clear('optoutTabClose');
      setTimeout(openNextOptout, 600);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'TRACKER_BLOCKED') {
    if (!blockingEnabled) {
      sendResponse({ success: false, reason: 'blocking disabled' });
      return true;
    }
    blockedCount++;
    chrome.storage.local.set({ blockedCount });
    updateBadge();
    sendResponse({ success: true });
  }

  if (message.type === 'GET_STATE') {
    sendResponse({ blockingEnabled, blockedCount });
  }

  if (message.type === 'SET_BLOCKING') {
    blockingEnabled = message.enabled;
    chrome.storage.local.set({ blockingEnabled });
    sendResponse({ success: true });
  }

  if (message.type === 'RESET_COUNT') {
    blockedCount = 0;
    chrome.storage.local.set({ blockedCount: 0 });
    updateBadge();
    sendResponse({ success: true });
  }

  // Popup sends the full list of auto-broker URLs to process
  if (message.type === 'START_OPTOUT_QUEUE') {
    optoutPaused = false;
    chrome.storage.local.set({ optoutQueue: message.urls, optoutPaused: false }, openNextOptout);
  }

  if (message.type === 'PAUSE_QUEUE') {
    optoutPaused = true;
    chrome.storage.local.set({ optoutPaused: true });
    sendResponse({ success: true });
  }

  if (message.type === 'RESUME_QUEUE') {
    optoutPaused = false;
    chrome.storage.local.set({ optoutPaused: false }, openNextOptout);
    sendResponse({ success: true });
  }

  if (message.type === 'GET_QUEUE_STATE') {
    chrome.storage.local.get(['optoutQueue', 'optoutPaused'], (r) => {
      sendResponse({ paused: r.optoutPaused === true, remaining: (r.optoutQueue || []).length });
    });
    return true;
  }

  // Redo button: cancel the entire queue and close any open opt-out tab
  if (message.type === 'CLEAR_QUEUE') {
    chrome.alarms.clear('optoutTabClose');
    const tabToClose = optoutTabId;
    optoutTabId = null;
    optoutPaused = false;
    chrome.storage.local.remove(['optoutQueue', 'optoutTabId', 'optoutPaused']);
    if (tabToClose !== null) chrome.tabs.remove(tabToClose).catch(() => {});
    sendResponse({ success: true });
  }

  // optout.js signals it's done — remove the tab (onRemoved opens the next)
  if (message.type === 'CLOSE_ME' && sender.tab) {
    chrome.tabs.remove(sender.tab.id).catch(() => {});
  }

  return true;
});

function openNextOptout() {
  chrome.storage.local.get(['optoutQueue', 'optoutTabId'], ({ optoutQueue, optoutTabId: storedTabId }) => {
    // Sync in-memory state with storage (handles SW kill/restart)
    if (storedTabId) {
      optoutTabId = storedTabId;
      return; // Tab still open, wait for it to close
    }
    optoutTabId = null;

    if (optoutPaused) return; // paused — don't open next tab
    if (!optoutQueue || optoutQueue.length === 0) {
      chrome.storage.local.remove(['optoutQueue']);
      return;
    }
    const [next, ...rest] = optoutQueue;
    chrome.storage.local.set({ optoutQueue: rest }, () => {
      chrome.tabs.create({ url: next, active: false }, (tab) => {
        optoutTabId = tab.id;
        // Persist so onRemoved can match it after a SW restart
        chrome.storage.local.set({ optoutTabId: tab.id });
        // Background-level guaranteed close: 15s covers redirect + no-form cases
        chrome.alarms.create('optoutTabClose', { delayInMinutes: 0.25 });
      });
    });
  });
}

function updateBadge() {
  const text = blockedCount > 0 ? String(blockedCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4fc3f7' });
}
