// this file is where you can add javascript to the popup

const btn = document.querySelector("button");

btn.addEventListener("click", () => {
  alert("Button clicked");
  console.log("Button clicked");
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
