# FitGirl Modern Gaming Library

A browser extension that redesigns the interface of `fitgirl-repacks.site` into a modern gaming library layout with card and table views, Steam review integration, quick search, and filtering tools.

## Features

- **Card and Table Views**: Toggle between a visual poster grid and a compact data table.
- **Steam Integration**: Displays Steam ratings and review data.
- **Search and Filter**: Keyboard shortcut (`Ctrl+K` / `Cmd+K`) search and filtering by size, rating, and genre.
- **Spotlight Banner**: Top banner displaying featured repacks and upcoming releases.
- **Local Execution**: Runs entirely on the client side with no third-party telemetry.

## Supported Browsers

Compatible with Chromium-based browsers:
- Google Chrome
- Brave
- Microsoft Edge
- Opera
- Vivaldi

## Installation

### 1. Download the Repository
1. Click the **Code** button at the top of this repository and select **Download ZIP** (or clone the repository using `git clone`).
2. Extract the downloaded `.zip` file to a persistent location on your computer.

> **Note**: Do not delete or move the extracted folder after installation. The browser loads the extension files directly from this path.

### 2. Enable Developer Mode
1. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
   - **Opera**: `opera://extensions`
2. Enable the **Developer mode** toggle in the top-right corner of the page.

### 3. Load the Extension
1. Click the **Load unpacked** button in the top-left toolbar.
2. Select the directory containing the extracted repository files (the folder containing `manifest.json`).
3. The extension will now appear in your installed extensions list.

### 4. Verify Installation
Navigate to `https://fitgirl-repacks.site` to confirm the interface is active.

## Updating

To update to a newer version:
1. Download or pull the latest repository files and replace the contents of your existing extension folder.
2. Go to `chrome://extensions`.
3. Locate **FitGirl Modern Gaming Library** and click the **Reload** button.

## Development

If modifying the extension locally:
1. Edit source files directly in `src/`, `css/`, or `content.js`.
2. Reload the extension on the `chrome://extensions` page to apply changes.

## Privacy

This extension does not collect or transmit personal data. See [PRIVACY.md](PRIVACY.md) for details on permissions and network requests.
