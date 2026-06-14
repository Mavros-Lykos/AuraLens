let hoveredImageSrc = null;

// Track mouse movement to identify hovered images
document.addEventListener('mouseover', (event) => {
  if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
    hoveredImageSrc = event.target.src || event.target.currentSrc;
  }
}, true);

document.addEventListener('mouseout', (event) => {
  if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
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
