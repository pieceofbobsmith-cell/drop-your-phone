// background.js — service worker

let blockedCount = 0;
let blockingEnabled = true;

// Restore persisted state on startup
chrome.storage.local.get(['blockingEnabled', 'blockedCount'], (result) => {
  blockingEnabled = result.blockingEnabled !== false;
  blockedCount = result.blockedCount || 0;
  updateBadge();
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

  return true;
});

function updateBadge() {
  const text = blockedCount > 0 ? String(blockedCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4fc3f7' });
}
