document
  .getElementById("options-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    // Get the API key entered by the user
    const apiKey = document.getElementById("api-key").value;
    chrome.storage.sync.set({ apiKey: apiKey }, () => {
      console.log("API key has been set");
    });
  });
