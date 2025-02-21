// this file is where you can add javascript to the popup

const btn = document.querySelector("button");

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
