# AuraLens

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![Chrome Extension](https://img.shields.io/badge/platform-Chrome-green.svg)]()

AuraLens is an accessibility-focused Chrome Extension that provides rich, emotionally aware audio descriptions of web images. Powered by Google's Gemini Vision AI, it goes beyond literal alt-text to convey the mood, atmosphere, and context of visual content for visually impaired users.

## Features

* **Contextual Analysis:** Uses the Gemini Vision API (`gemini-2.5-flash`) to generate concise, highly descriptive text.
* **On-Demand Execution:** Triggered only when needed via a context menu option or a customizable keyboard shortcut.
* **Audio Feedback:** Utilizes the native Chrome Text-to-Speech (TTS) API to read the description aloud.
* **Secure Configuration:** Stores the user-provided API key locally using `chrome.storage.local`.

## Technical Architecture

The extension is built using Chrome Manifest V3 and consists of:
* `background.js`: A Service Worker that handles API communication, context menu registration, and TTS execution. It features a dynamic model-selection algorithm to ensure compatibility with the user's specific API key access.
* `content.js`: An injected script that tracks the currently hovered DOM image elements for shortcut targeting.
* Options UI: A secure interface for API key management.

## Installation

### For Users
1. Download the latest `.zip` release from the [Releases page](../../releases).
2. Extract the ZIP file.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the extracted folder.
6. Click the AuraLens icon in the toolbar to configure your API key.

### For Developers
```bash
git clone https://github.com/Mavros-Lykos/auralens.git
cd auralens
```
Load the directory as an unpacked extension in Chrome.

## Usage

You must provide a free Google Gemini API key. You can obtain one from [Google AI Studio](https://aistudio.google.com/).

Once configured, you can trigger AuraLens in two ways:
1. **Context Menu:** Right-click any image and select `AuraLens: Describe Image`.
2. **Keyboard Shortcut:** Hover over an image and press `Ctrl+Shift+U` (Windows/Linux) or `Cmd+Shift+U` (macOS).

## Contributing

We welcome contributions to improve AuraLens. Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to submit pull requests, report issues, and request features.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License. See the [LICENSE](LICENSE) file for details. This explicitly prohibits commercial use of the provided source code.
