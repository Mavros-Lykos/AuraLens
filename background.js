chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "auralens-describe",
    title: "🪄 AuraLens: Describe Image",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "auralens-describe") {
    processImage(info.srcUrl, tab.id);
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "describe-image") {
    // Send message to content script to get the currently hovered image
    chrome.tabs.sendMessage(tab.id, { action: "getHoveredImage" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error communicating with content script:", chrome.runtime.lastError);
        chrome.tts.speak("AuraLens could not detect an image here. Please refresh the page or try right-clicking.");
        return;
      }
      
      if (response && response.srcUrl) {
        processImage(response.srcUrl, tab.id);
      } else {
        chrome.tts.speak("No image is currently selected. Hover your mouse over an image and try again.");
      }
    });
  }
});

async function processImage(imageUrl, tabId) {
  try {
    // Notify user we are starting (audio and visual)
    chrome.tts.speak("Analyzing image...", { enqueue: true });
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: "showLoadingToast" }).catch(() => {});
    }
    
    // Get API Key from storage
    const storage = await chrome.storage.local.get("geminiApiKey");
    const apiKey = storage.geminiApiKey;
    
    if (!apiKey) {
      chrome.tts.speak("AuraLens API key is missing. Please open the extension options to set it up.");
      if (tabId) chrome.tabs.sendMessage(tabId, { action: "hideLoadingToast" }).catch(() => {});
      return;
    }

    // Fetch the image as base64
    const base64Image = await fetchImageAsBase64(imageUrl);
    
    // Call Gemini API
    const description = await callGeminiAPI(base64Image, apiKey);
    
    // Speak the result and hide toast
    if (tabId) chrome.tabs.sendMessage(tabId, { action: "hideLoadingToast" }).catch(() => {});
    chrome.tts.speak(description, { enqueue: false });

  } catch (error) {
    console.error("AuraLens Error:", error);
    if (tabId) chrome.tabs.sendMessage(tabId, { action: "hideLoadingToast" }).catch(() => {});
    chrome.tts.speak("Sorry, AuraLens encountered an error while analyzing the image.");
  }
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader result looks like "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      // We only need the base64 part for the Gemini API
      const base64data = reader.result.split(',')[1];
      const mimeType = blob.type;
      resolve({ mimeType, data: base64data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getBestVisionModel(apiKey) {
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(listUrl);
    if (!response.ok) {
      console.error("Failed to list models, status:", response.status);
      return "models/gemini-2.5-flash";
    }
    
    const data = await response.json();
    if (!data || !data.models) return "models/gemini-2.5-flash";

    // Log ALL available models so we can debug in the console
    console.log("=== ALL AVAILABLE MODELS ===");
    data.models.forEach(m => {
      console.log(`  ${m.name} | methods: ${(m.supportedGenerationMethods || []).join(", ")}`);
    });
    console.log("============================");

    // Helper to safely check if a model supports generating content
    const supportsGen = (m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent");

    // Current model names as of 2026 (ordered by preference: cheapest/fastest first)
    const preferences = [
      "gemini-2.5-flash",
      "gemini-3-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-pro",
      "gemini-3.1-pro",
    ];
    
    for (const pref of preferences) {
      // Use exact match on the model name to avoid picking up weird variants
      const match = data.models.find(m => m.name === `models/${pref}` && supportsGen(m));
      if (match) {
        console.log("Selected model:", match.name);
        return match.name;
      }
    }

    // If exact match failed, try a looser search but exclude known broken ones
    const fallback = data.models.find(m => 
      supportsGen(m) && 
      m.name.includes("gemini") &&
      !m.name.includes("robotics") && 
      !m.name.includes("preview") &&
      !m.name.includes("embedding") &&
      !m.name.includes("aqa")
    );
    
    if (fallback) {
      console.log("Fallback model selected:", fallback.name);
      return fallback.name;
    }
    
  } catch (err) {
    console.error("Error fetching models:", err);
  }
  
  // Absolute last resort
  return "models/gemini-2.5-flash";
}

async function callGeminiAPI(imageObj, apiKey) {
  // Dynamically find the right model name instead of hardcoding it to prevent 404s
  const modelName = await getBestVisionModel(apiKey);
  console.log("Using model:", modelName);
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
  
  const prompt = "Describe this image in 2 to 3 short, plain-text sentences for a visually impaired listener. Capture what is shown and the mood it conveys. Do NOT use any markdown, asterisks, bullet points, or special formatting. Just speak naturally.";

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageObj.mimeType || "image/jpeg",
              data: imageObj.data
            }
          }
        ]
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  let text = result.candidates[0].content.parts[0].text;
  
  // Strip any markdown formatting that the model might still sneak in
  text = text.replace(/[*#_~`>]/g, "").replace(/\n+/g, " ").trim();
  
  return text;
}
