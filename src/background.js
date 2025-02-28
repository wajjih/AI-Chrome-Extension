// Function to get the current tab
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

// Function to fetch AI suggestion
async function fetchAISuggestion(text) {
  // Retrieve the API key from Chrome Storage
  const data = await chrome.storage.sync.get("apiKey");
  const apiKey = data.apiKey;

  if (!apiKey) {
    console.error("API key not found in Chrome Storage.");
    return "";
  }

  // Call the AI API
  const response = await fetch("https://your-ai-api.com/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ prompt: text }),
  });
  const result = await response.json();
  return result.completion;
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getApiKey") {
    // Return the API key
    chrome.storage.sync.get("apiKey", (data) => {
      sendResponse({ apiKey: data.apiKey });
    });
    return true; // Indicates sendResponse will be called asynchronously.
  } else if (request.type === "FETCH_SUGGESTION") {
    // Fetch and return the AI suggestion
    fetchAISuggestion(request.text).then((suggestion) => {
      sendResponse({ suggestion });
    });
    return true; // Indicates sendResponse will be called asynchronously.
  }
});
