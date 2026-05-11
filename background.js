// background.js — service worker

let blockedCount = 0;
let blockingEnabled = true;
let optoutTabId = null; // ID of the one opt-out tab currently open

// Restore persisted state on startup
chrome.storage.local.get(['blockingEnabled', 'blockedCount'], (r) => {
  blockingEnabled = r.blockingEnabled !== false;
  blockedCount = r.blockedCount || 0;
  updateBadge();
  // Resume queue if service worker restarted mid-run
  if (!optoutTabId) openNextOptout();
});

// When the opt-out tab closes, open the next one in the queue
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === optoutTabId) {
    optoutTabId = null;
    setTimeout(openNextOptout, 600);
  }
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
    if (sender.tab && sender.tab.id) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'SHOW_TOAST' }).catch(() => {});
    }
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
    chrome.storage.local.set({ optoutQueue: message.urls }, openNextOptout);
  }

  // optout.js signals it's done — remove the tab (onRemoved opens the next)
  if (message.type === 'CLOSE_ME' && sender.tab) {
    chrome.tabs.remove(sender.tab.id).catch(() => {});
  }

  return true;
});

function openNextOptout() {
  if (optoutTabId !== null) return; // One already in progress
  chrome.storage.local.get(['optoutQueue'], ({ optoutQueue }) => {
    if (!optoutQueue || optoutQueue.length === 0) {
      chrome.storage.local.remove(['optoutQueue']);
      return;
    }
    const [next, ...rest] = optoutQueue;
    chrome.storage.local.set({ optoutQueue: rest }, () => {
      chrome.tabs.create({ url: next, active: false }, (tab) => {
        optoutTabId = tab.id;
      });
    });
  });
}

function updateBadge() {
  const text = blockedCount > 0 ? String(blockedCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4fc3f7' });
}
