# Installation Guide

## Installing Patch - Dark Pattern Detector

Patch is a browser extension that detects and flags dark patterns in real-time. Follow these steps to install it in your Chrome or Edge browser.

### Prerequisites

- Google Chrome (version 88 or later) or Microsoft Edge (version 88 or later)
- Basic understanding of browser extensions

### Installation Steps

#### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download the Extension Files**
   - Clone or download this repository to your local machine
   - Ensure all files are in a single directory

2. **Open Chrome/Edge Extensions Page**
   - Open Chrome or Edge browser
   - Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Alternatively, click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - This will reveal additional options

4. **Load the Extension**
   - Click the "Load unpacked" button
   - Navigate to the directory containing the extension files
   - Select the folder and click "Select Folder" or "Open"

5. **Verify Installation**
   - You should see the Patch extension card appear in your extensions list
   - The extension icon (a shield with a checkmark) should appear in your browser toolbar
   - If you don't see the icon, click the puzzle piece icon and pin Patch to your toolbar

### Using the Extension

1. **Activate Detection**
   - Click the Patch icon in your browser toolbar
   - Ensure the "Detection Active" toggle is enabled (it's on by default)

2. **Browse the Web**
   - Visit any website
   - Patch will automatically scan for dark patterns in real-time
   - Detected patterns will be highlighted with warning indicators

3. **View Detected Patterns**
   - Click the Patch icon to see a summary of detected patterns
   - The badge on the icon shows the number of patterns found on the current page
   - Each pattern includes its name, description, and severity level

4. **Interact with Flagged Elements**
   - Hover over warning indicators (⚠️) on the page to see pattern details
   - Pre-selected checkboxes will be automatically unchecked with a notice
   - Confusing wording will be clarified with additional explanations

### Troubleshooting

**Extension not working on a page:**
- Some pages (like chrome:// or edge:// URLs) cannot be modified by extensions
- Try refreshing the page after installing the extension
- Check that the extension is enabled in your extensions list

**No patterns detected:**
- This is good news! The page may not contain dark patterns
- Click the refresh button in the popup to re-scan the page

**Extension icon not visible:**
- Click the puzzle piece icon in your toolbar
- Find Patch in the list and click the pin icon

**Patterns not being highlighted:**
- Ensure "Detection Active" is toggled on in the popup
- Some dynamic content may take a moment to be analyzed
- Try refreshing the page

### Uninstalling

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find the Patch extension
3. Click "Remove"
4. Confirm the removal

### Privacy & Permissions

Patch requires the following permissions:
- **activeTab**: To analyze the current page you're viewing
- **storage**: To save your preferences (like whether detection is enabled)
- **scripting**: To modify deceptive interfaces on web pages
- **host_permissions (<all_urls>)**: To work on all websites

**Important**: Patch does not collect, store, or transmit any personal data. All analysis happens locally in your browser.

### Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
