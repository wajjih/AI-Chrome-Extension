// Function to fetch suggestions from an AI service
async function fetchSuggestions(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "getApiKey" }, async (response) => {
      if (response && response.apiKey) {
        const apiKey = response.apiKey;
        console.debug("API Key retrieved:", apiKey.substring(0, 4) + "*****");
        try {
          const apiResponse = await fetch(
            "https://api.openai.com/v1/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-3.5-turbo", // Specify your desired model here
                prompt: text,
                max_tokens: 50,
                n: 1,
                stop: null,
              }),
            }
          );
          if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => null);
            console.error("API Error:", apiResponse.status, errorData);
            reject(
              `API request failed with status ${apiResponse.status}: ${
                (errorData && errorData.error && errorData.error.message) ||
                "Unknown error"
              }`
            );
            return;
          }
          const data = await apiResponse.json();
          if (
            !data.choices ||
            !Array.isArray(data.choices) ||
            data.choices.length < 1
          ) {
            reject("No suggestions received from the API.");
            return;
          }
          const suggestion = data.choices[0].text.trim();
          console.debug("Suggestion received:", suggestion);
          resolve(suggestion);
        } catch (error) {
          console.error("Fetch Error:", error);
          reject("An error occurred while fetching suggestions.");
        }
      } else {
        console.error("API key not found");
        reject("API Key not found");
      }
    });
  });
}

// This function updates (or creates) an element overlaying the textarea that shows the suggestion
function updateInlineSuggestion(textarea, suggestion) {
  let inlineSuggestion = document.getElementById("inline-suggestion");
  if (!inlineSuggestion) {
    inlineSuggestion = document.createElement("div");
    inlineSuggestion.id = "inline-suggestion";
    // Style the suggestion as gray text and ensure it doesn't capture pointer events
    inlineSuggestion.style.position = "absolute";
    inlineSuggestion.style.color = "gray";
    inlineSuggestion.style.pointerEvents = "none";
    // Use the same font settings as the textarea
    const computed = getComputedStyle(textarea);
    inlineSuggestion.style.fontFamily = computed.fontFamily;
    inlineSuggestion.style.fontSize = computed.fontSize;
    inlineSuggestion.style.lineHeight = computed.lineHeight;
    document.body.appendChild(inlineSuggestion);
  }

  // Position the inline suggestion relative to the textarea's top-left
  const rect = textarea.getBoundingClientRect();
  inlineSuggestion.style.top = rect.top + window.scrollY + "px";
  inlineSuggestion.style.left = rect.left + window.scrollX + "px";

  // Only show suggestion if it completes what the user already typed
  const currentText = textarea.value;
  if (suggestion.startsWith(currentText)) {
    console.log("Suggestion:", suggestion);
    inlineSuggestion.textContent = suggestion;
  } else {
    inlineSuggestion.textContent = "";
  }
}

// Listen for input events on textareas (or contentEditable elements)
document.addEventListener("input", async (event) => {
  const target = event.target;
  const targetTag = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;

  if (targetTag === "textarea" || isEditable) {
    // For contentEditable, you may choose innerText instead of value
    const text = target.value || target.innerText;
    try {
      let suggestions = await fetchSuggestions(text);
      // If suggestions is an array, use the first suggestion
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        suggestions = suggestions[0];
      }
      updateInlineSuggestion(target, suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }
});

// Listen for keydown events to accept (Tab) or dismiss (Space) the suggestion
document.addEventListener("keydown", (event) => {
  const target = event.target;
  const targetTag = target.tagName.toLowerCase();
  if (targetTag === "textarea") {
    const inlineSuggestion = document.getElementById("inline-suggestion");
    if (!inlineSuggestion) return;
    if (event.key === "Tab") {
      event.preventDefault();
      // Accept the suggestion by updating the textarea's content to the full suggestion
      target.value = inlineSuggestion.textContent;
      inlineSuggestion.textContent = "";
    } else if (event.key === " ") {
      // Cancel/dismiss the suggestion on Space
      inlineSuggestion.textContent = "";
    }
  }
});
