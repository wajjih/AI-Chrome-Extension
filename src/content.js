// Track active element and current suggestion
let activeElement = null;
let currentSuggestion = null;

// Helper function to check if an element is a valid input field
function isValidInputField(element) {
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.isContentEditable
  );
}

// Helper function to get the content of an input field
function getEditorContent(element) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.value;
  } else if (element.isContentEditable) {
    return element.textContent || "";
  }
  return "";
}

// Helper function to get the cursor position in an input field
function getCursorPosition(element) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.selectionStart || 0;
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      return range.startOffset;
    }
  }
  return 0;
}

// Helper function to update the content of an input field
function updateEditorContent(element, newContent, cursorPosition) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    element.value = newContent;
    element.selectionStart = cursorPosition;
    element.selectionEnd = cursorPosition;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = newContent;
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(element.firstChild || element, cursorPosition);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

// Display inline suggestion
function showSuggestion(element, suggestion) {
  const rect = element.getBoundingClientRect();
  const suggestionDiv = document.createElement("div");
  suggestionDiv.className = "ai-suggestion";
  suggestionDiv.textContent = suggestion;
  suggestionDiv.style.position = "absolute";
  suggestionDiv.style.top = `${rect.bottom}px`;
  suggestionDiv.style.left = `${rect.left}px`;
  suggestionDiv.style.zIndex = "999999";
  suggestionDiv.style.backgroundColor = "#f0f0f0";
  suggestionDiv.style.padding = "4px";
  suggestionDiv.style.border = "1px solid #ccc";
  document.body.appendChild(suggestionDiv);

  // Store the current suggestion
  currentSuggestion = suggestion;
}

// Handle Tab key for completion
function handleTabCompletion(element) {
  if (currentSuggestion) {
    const content = getEditorContent(element);
    const cursorPos = getCursorPosition(element);
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    // Insert the suggestion
    const newContent = textBeforeCursor + currentSuggestion + textAfterCursor;
    const newCursorPos = cursorPos + currentSuggestion.length;

    updateEditorContent(element, newContent, newCursorPos);

    // Clear the suggestion
    document.querySelector(".ai-suggestion")?.remove();
    currentSuggestion = null;
  }
}

// Listen for input events
document.addEventListener("input", (event) => {
  const target = event.target;
  if (isValidInputField(target)) {
    activeElement = target;
    const content = getEditorContent(target);
    const cursorPos = getCursorPosition(target);
    const textBeforeCursor = content.slice(0, cursorPos);

    // Send a message to the background script to fetch a suggestion
    chrome.runtime.sendMessage(
      {
        type: "FETCH_SUGGESTION",
        text: textBeforeCursor,
      },
      (response) => {
        if (response.suggestion) {
          showSuggestion(target, response.suggestion);
        }
      }
    );
  }
});

// Listen for Tab key
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && activeElement) {
    event.preventDefault();
    handleTabCompletion(activeElement);
  }
});

// Function to fetch suggestions from an AI service
async function fetchSuggestions(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "getApiKey" }, async (response) => {
      if (response && response.apiKey) {
        const apiKey = response.apiKey;
        console.debug("API Key retrieved:", apiKey.substring(0, 4) + "*****");
        try {
          const apiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that completes sentences.",
                  },
                  {
                    role: "user",
                    content: `Complete the following sentence: "${text}"`,
                  },
                ],
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
          const suggestion = data.choices[0].message.content.trim();
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
    inlineSuggestion.style.backgroundColor = "transparent"; // Use transparent background
    inlineSuggestion.style.zIndex = "1000"; // Ensure it's on top
    inlineSuggestion.style.whiteSpace = "pre-wrap"; // Preserve whitespace and line breaks
    // Use the same font settings as the textarea
    const computed = getComputedStyle(textarea);
    inlineSuggestion.style.fontFamily = computed.fontFamily;
    inlineSuggestion.style.fontSize = computed.fontSize;
    inlineSuggestion.style.lineHeight = computed.lineHeight;
    document.body.appendChild(inlineSuggestion);
  }

  // Create a hidden div to mirror the textarea content and calculate the caret position
  let mirrorDiv = document.getElementById("mirror-div");
  if (!mirrorDiv) {
    mirrorDiv = document.createElement("div");
    mirrorDiv.id = "mirror-div";
    mirrorDiv.style.position = "absolute";
    mirrorDiv.style.whiteSpace = "pre-wrap";
    mirrorDiv.style.visibility = "hidden";
    mirrorDiv.style.pointerEvents = "none";
    document.body.appendChild(mirrorDiv);
  }

  // Copy the textarea styles to the mirror div
  const computed = getComputedStyle(textarea);
  mirrorDiv.style.fontFamily = computed.fontFamily;
  mirrorDiv.style.fontSize = computed.fontSize;
  mirrorDiv.style.lineHeight = computed.lineHeight;
  mirrorDiv.style.padding = computed.padding;
  mirrorDiv.style.border = computed.border;
  mirrorDiv.style.width = computed.width;

  // Copy the textarea content to the mirror div
  const text = textarea.value || "";
  const caretPosition = textarea.selectionStart || 0;
  const beforeCaret = text.substring(0, caretPosition);
  const afterCaret = text.substring(caretPosition);
  mirrorDiv.textContent = beforeCaret;

  // Create a span to mark the caret position
  const caretSpan = document.createElement("span");
  caretSpan.textContent = "|";
  mirrorDiv.appendChild(caretSpan);
  mirrorDiv.appendChild(document.createTextNode(afterCaret));

  // Position the inline suggestion relative to the caret position
  const textareaRect = textarea.getBoundingClientRect();
  const caretRect = caretSpan.getBoundingClientRect();
  inlineSuggestion.style.top =
    textareaRect.top + caretRect.top + window.scrollY + "px";
  inlineSuggestion.style.left =
    textareaRect.left + caretRect.left + window.scrollX + "px";

  // Only show suggestion if it completes what the user already typed
  const currentText = textarea.value || "";
  if (suggestion.startsWith(currentText)) {
    console.log("Suggestion:", suggestion);
    inlineSuggestion.textContent = suggestion.slice(currentText.length);
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
    const text =
      targetTag === "textarea" ? target.value : target.innerText || "";
    try {
      let suggestions = await fetchSuggestions(text);
      if (Array.isArray(suggestions)) {
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
  if (targetTag === "textarea" || target.isContentEditable) {
    const inlineSuggestion = document.getElementById("inline-suggestion");
    if (!inlineSuggestion || !inlineSuggestion.textContent) return;

    if (event.key === "Tab") {
      event.preventDefault();
      // Accept the suggestion by updating the textarea's content to the full suggestion
      if (targetTag === "textarea") {
        target.value += inlineSuggestion.textContent;
      } else {
        target.innerText += inlineSuggestion.textContent;
      }
      inlineSuggestion.textContent = "";
    } else if (event.key === " ") {
      // Cancel/dismiss the suggestion on Space
      inlineSuggestion.textContent = "";
    }
  }
});
