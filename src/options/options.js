document
  .getElementById("options-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const apiKey = document.getElementById("api-key").value;
    chrome.storage.sync.set({ apiKey: "YOUR_API_KEY" }, () => {
      console.log("API key has been set");
    });
  });
