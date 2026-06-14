// Restores state using the preferences stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.local.get({ geminiApiKey: '' }, (items) => {
    document.getElementById('apiKey').value = items.geminiApiKey;
  });
};

// Saves options to chrome.storage
const saveOptions = () => {
  const key = document.getElementById('apiKey').value.trim();
  
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = '✅ API Key saved securely!';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
