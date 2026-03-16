// Forge Browser Extension - Background Service Worker

// Handle extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      forgeToken: null,
      forgeApiUrl: 'http://localhost:3001/api',
      lastCapture: null,
    });
  }
});

// Handle messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCapture') {
    chrome.storage.local.get(['lastCapture'], (result) => {
      sendResponse({ data: result.lastCapture });
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'clearCapture') {
    chrome.storage.local.set({ lastCapture: null });
    sendResponse({ success: true });
    return true;
  }
});
