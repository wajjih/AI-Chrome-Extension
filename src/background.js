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
    chrome.storage.sync.get("apiKey", (data) => {
      sendResponse({ apiKey: data.apiKey });
    });
    return true; // Indicates sendResponse will be called asynchronously.
  }
});
