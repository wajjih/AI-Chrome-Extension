//function to get the current tab
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getApiKey") {
    chrome.storage.sync.get("apiKey", (items) => {
      sendResponse({ apiKey: items.apiKey });
    });
    // Return true to indicate asynchronous response
    return true;
  }
});
