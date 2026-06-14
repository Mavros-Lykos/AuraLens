let hoveredImageSrc = null;

// Find the image source from an element (supports <img> and CSS background-image)
function getImageSrc(el) {
  if (!el) return null;
  if (el.tagName && el.tagName.toLowerCase() === 'img') {
    return el.src || el.currentSrc || null;
  }
  // Check for CSS background-image
  const bg = window.getComputedStyle(el).backgroundImage;
  if (bg && bg !== 'none') {
    const match = bg.match(/url\(["']?(.*?)["']?\)/);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Track mouse movement to identify hovered images
document.addEventListener('mouseover', (event) => {
  const src = getImageSrc(event.target);
  if (src) {
    hoveredImageSrc = src;
  }
}, true);

document.addEventListener('mouseout', (event) => {
  // Only clear if the mouse is leaving to a non-image element
  const relatedSrc = getImageSrc(event.relatedTarget);
  if (!relatedSrc) {
    hoveredImageSrc = null;
  }
}, true);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getHoveredImage") {
    // If we have a hovered image, return its URL
    sendResponse({ srcUrl: hoveredImageSrc });
  } else if (request.action === "showLoadingToast") {
    showToast("🪄 AuraLens is analyzing...");
  } else if (request.action === "hideLoadingToast") {
    hideToast();
  }
});

let toastElement = null;

function showToast(message) {
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.style.position = 'fixed';
    toastElement.style.bottom = '20px';
    toastElement.style.right = '20px';
    toastElement.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    toastElement.style.color = '#fff';
    toastElement.style.padding = '12px 24px';
    toastElement.style.borderRadius = '8px';
    toastElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    toastElement.style.fontSize = '14px';
    toastElement.style.fontWeight = '500';
    toastElement.style.zIndex = '9999999';
    toastElement.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
    toastElement.style.backdropFilter = 'blur(8px)';
    toastElement.style.transition = 'opacity 0.3s ease';
    toastElement.style.pointerEvents = 'none'; // so it doesn't block clicks
    document.body.appendChild(toastElement);
  }
  toastElement.textContent = message;
  toastElement.style.opacity = '1';
}

function hideToast() {
  if (toastElement) {
    toastElement.style.opacity = '0';
    setTimeout(() => {
      if (toastElement) {
        toastElement.remove();
        toastElement = null;
      }
    }, 300);
  }
}
