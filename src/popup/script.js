const btn = document.querySelector("button");

// Test button to send a message to the content script
btn.addEventListener("click", () => {
  alert("Button clicked");
  console.log("Button clicked SKIBIDI TOILET");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { greeting: "hello" },
      function (response) {
        console.log(response.farewell);
      }
    );
  });
});

// Save API key to Chrome Storage
document
  .getElementById("popup-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const apiKey = document.getElementById("api-key").value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ apiKey: apiKey }, () => {
        console.log("API key has been saved from popup.");
        chrome.storage.sync.get("apiKey", (data) => {
          console.log("Stored API key:", data.apiKey);
        });
      });
    }
  });

// Test AI suggestion functionality
document.getElementById("test-suggestion")?.addEventListener("click", () => {
  const testText = "This is a test input";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "FETCH_SUGGESTION", text: testText },
      (response) => {
        if (response.suggestion) {
          console.log("AI Suggestion:", response.suggestion);
        }
      }
    );
  });
});
