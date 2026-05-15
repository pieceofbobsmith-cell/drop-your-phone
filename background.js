// background.js — service worker

let blockedCount = 0;
let blockingEnabled = true;
let cookieClearEnabled = true;
let optoutTabId = null; // ID of the one opt-out tab currently open
let optoutPaused = false;

// Tracks the last URL seen in each tab so we can clean up when the tab leaves
const tabUrlMap = new Map();

// Restore persisted state on startup (service worker can be killed and restarted by Chrome)
chrome.storage.local.get(['blockingEnabled', 'blockedCount', 'cookieClearEnabled', 'optoutTabId', 'optoutPaused'], (r) => {
  blockingEnabled = r.blockingEnabled !== false;
  blockedCount = r.blockedCount || 0;
  cookieClearEnabled = r.cookieClearEnabled !== false;
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

// Track tab URL changes so we know where to clean up cookies when a tab leaves
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    const oldUrl = tabUrlMap.get(tabId);
    tabUrlMap.set(tabId, changeInfo.url);
    if (oldUrl && cookieClearEnabled) {
      try {
        const oldBase = getBaseDomain(new URL(oldUrl).hostname);
        const newBase = getBaseDomain(new URL(changeInfo.url).hostname);
        if (oldBase !== newBase) clearTrackingCookies(oldUrl);
      } catch (_) {}
    }
  }
});

// When the opt-out tab closes, open the next one in the queue.
// Also clear tracking cookies for any regular tab that closes.
chrome.tabs.onRemoved.addListener((tabId) => {
  // Cookie cleanup for regular tabs
  const lastUrl = tabUrlMap.get(tabId);
  tabUrlMap.delete(tabId);
  if (lastUrl && cookieClearEnabled) {
    chrome.storage.local.get(['optoutTabId'], (r) => {
      // Don't wipe cookies on opt-out tabs — they're filling forms on broker sites
      const isOptout = tabId === (r.optoutTabId || optoutTabId);
      if (!isOptout) clearTrackingCookies(lastUrl);
    });
  }

  // Opt-out queue advancement
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

  // Popup sends the queue — each item is { url, emailOnly }
  if (message.type === 'START_OPTOUT_QUEUE') {
    optoutPaused = false;
    chrome.storage.local.set({ optoutQueue: message.queue, optoutPaused: false }, openNextOptout);
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

  // search-first only: optout.js filled the form — extend alarm so user has
  // time to find their record. emailOnly tabs do NOT send this message so
  // their 1-min alarm fires and advances the queue automatically.
  if (message.type === 'FILLING_STARTED') {
    chrome.alarms.clear('optoutTabClose');
    chrome.alarms.create('optoutTabClose', { delayInMinutes: 15 });
  }

  // optout.js signals submit was clicked — close the tab immediately so the
  // next broker opens without delay. The 1-min alarm set by openNextOptout
  // is the fallback if this message is never received (e.g. page navigated
  // and killed the content script before the message could be sent).
  if (message.type === 'CLOSE_ME' && sender.tab) {
    chrome.tabs.remove(sender.tab.id).catch(() => {});
  }

  if (message.type === 'SET_COOKIE_CLEAR') {
    cookieClearEnabled = message.enabled;
    chrome.storage.local.set({ cookieClearEnabled });
    sendResponse({ success: true });
  }

  return true;
});

function openNextOptout() {
  chrome.storage.local.get(['optoutQueue', 'optoutTabId'], ({ optoutQueue, optoutTabId: storedTabId }) => {
    // Sync in-memory state with storage (handles SW kill/restart).
    // Verify the tab actually exists — stale storage entry (race) would stall the queue.
    if (storedTabId) {
      chrome.tabs.get(storedTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          // Tab is gone; clear stale storage and continue
          optoutTabId = null;
          chrome.storage.local.remove(['optoutTabId']);
          chrome.alarms.clear('optoutTabClose');
          openNextOptout();
        } else {
          optoutTabId = storedTabId; // Tab still alive — wait for it
        }
      });
      return;
    }
    optoutTabId = null;

    if (optoutPaused) return; // paused — don't open next tab
    if (!optoutQueue || optoutQueue.length === 0) {
      chrome.storage.local.remove(['optoutQueue']);
      return;
    }
    const [next, ...rest] = optoutQueue;
    const url = typeof next === 'string' ? next : next.url;
    // Email-only brokers (just email field, no name search) run fully in background.
    // Search-first brokers open in the foreground so the user can select their record.
    const emailOnly = typeof next === 'object' ? !!next.emailOnly : false;
    chrome.storage.local.set({ optoutQueue: rest }, () => {
      chrome.tabs.create({ url, active: !emailOnly }, (tab) => {
        optoutTabId = tab.id;
        chrome.storage.local.set({ optoutTabId: tab.id });
        // Email-only: 3 min fallback (optout.js closes after success detection, up to 15s + 2s grace)
        // Search-first: 15 min so user has time to find + select their record
        chrome.alarms.create('optoutTabClose', { delayInMinutes: emailOnly ? 3 : 15 });
      });
    });
  });
}

// ── Cookie auto-clear helpers ─────────────────────────────────────────────────

function getBaseDomain(hostname) {
  const parts = hostname.split('.');
  // Handle known second-level TLDs (co.uk, com.au, etc.) — good enough heuristic
  if (parts.length > 2 && parts[parts.length - 2].length <= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

// Delete persistent cookies (ones with an expiration date set far in the future)
// from the given URL's domain. Session cookies (no expiry) are left alone.
// Persistent cookies = what ad/tracking networks set after "Accept all".
async function clearTrackingCookies(url) {
  if (!url || !url.startsWith('http')) return;
  try {
    const cutoff = (Date.now() / 1000) + (24 * 3600); // cookies expiring > 24h from now
    const cookies = await chrome.cookies.getAll({ url });
    for (const cookie of cookies) {
      if (cookie.expirationDate && cookie.expirationDate > cutoff) {
        const scheme = cookie.secure ? 'https' : 'http';
        const domain = cookie.domain.replace(/^\./, '');
        await chrome.cookies.remove({
          url: `${scheme}://${domain}${cookie.path}`,
          name: cookie.name,
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

function updateBadge() {
  const text = blockedCount > 0 ? String(blockedCount) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4fc3f7' });
}
