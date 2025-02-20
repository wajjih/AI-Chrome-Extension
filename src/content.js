// Function to fetch suggestions from an AI service
async function fetchSuggestions(text) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("apiKey", async function (items) {
      const apiKey = items.apiKey;
      if (!apiKey) {
        reject("API Key not found");
        return;
      }

      try {
        const response = await fetch(
          "https://api.your-ai-service.com/suggest",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ text }),
          }
        );
        const data = await response.json();
        resolve(data.suggestions);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Function to show suggestions
function showSuggestions(textarea, suggestions) {
  // Create a suggestion box if it doesn't exist
  let suggestionBox = document.getElementById("ai-suggestion-box");
  if (!suggestionBox) {
    suggestionBox = document.createElement("div");
    suggestionBox.id = "ai-suggestion-box";
    suggestionBox.style.position = "absolute";
    suggestionBox.style.backgroundColor = "#fff";
    suggestionBox.style.border = "1px solid #ccc";
    suggestionBox.style.zIndex = "1000";
    document.body.appendChild(suggestionBox);
  }

  // Position the suggestion box
  const rect = textarea.getBoundingClientRect();
  suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
  suggestionBox.style.left = `${rect.left + window.scrollX}px`;

  // Populate the suggestion box
  suggestionBox.innerHTML = suggestions.map((s) => `<div>${s}</div>`).join("");
}

// Event listener for text areas
document.addEventListener("input", async (event) => {
  if (event.target.tagName.toLowerCase() === "textarea") {
    const text = event.target.value;
    try {
      const suggestions = await fetchSuggestions(text);
      showSuggestions(event.target, suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }
});

// Event listener to handle suggestion selection
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    const suggestionBox = document.getElementById("ai-suggestion-box");
    if (suggestionBox && suggestionBox.firstChild) {
      event.preventDefault();
      const textarea = document.activeElement;
      textarea.value += suggestionBox.firstChild.textContent;
      suggestionBox.remove();
    }
  }
});
