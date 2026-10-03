<h1>Caido Compare</h1>
<strong>Side-by-side comparison of HTTP requests, responses, and files in Caido, with every difference highlighted</strong>


---

<details closed>
<summary><b>Table of Contents</b></summary>
<br>

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Feedback & Issues](#feedback--issues)
- [License](#license)
</details>

## Overview

Compare puts two pieces of data next to each other and shows exactly what changed between them. Send requests and responses from Caido, paste text, or load a file, then compare them by words, bytes, or lines.

It is built for penetration testers and security researchers who need to spot the difference between two responses, two requests, or two versions of a file quickly.

## Features

<details>
<summary><b>Comparison Engine</b></summary>
<br>

- **Word-Level Comparison:** Highlights the words that changed inside each changed line
- **Byte-Level Comparison:** Highlights the exact characters that changed
- **Line-Level Comparison:** Marks whole lines as added, deleted, or modified
- **Aligned Side-by-Side View:** Lines line up across both sides, with a blank filler where a line was added or removed
- **Comparison Options:** Ignore whitespace and ignore case, while the result still shows your original text
- **Large Inputs:** Comparisons run in the background with a Cancel button, so Caido stays responsive even on very large responses
</details>

<details>
<summary><b>Result View</b></summary>
<br>

- **Wrap Lines:** Wrap long lines, or turn it off to scroll left and right
- **Sync Views:** Scroll both sides together, or turn it off to scroll each side on its own
- **Selectable Text:** Select and copy text from either side
- **Line Counts:** Added, deleted, modified, and unchanged line totals
</details>

<details>
<summary><b>Data Input</b></summary>
<br>

- **Paste:** Add the clipboard text
- **Load:** Add a text file of up to 10 MB
- **Send from Caido:** Right-click a request, a response, or up to 25 rows in HTTP History and choose "Send to Original" or "Send to Modified"
</details>

<details>
<summary><b>Panel Management</b></summary>
<br>

- **Two Panels:** Separate Original and Modified panels, each holding many items
- **Move:** Right-click an item, or a selection, to move it to the other panel
- **Remove and Clear:** Remove selected items or empty a panel
- **Per-Project Storage:** Each Caido project keeps its own items. Items saved by older versions of Compare are copied into the first project you open after updating, and the original files are kept as a backup
- **Item Tags:** Color-coded tags for clipboard, file, request, and response items
</details>

## Requirements

- Caido 0.57 or later

## Installation

### Via Caido's Plugin Store (Recommended)

1. Open Caido
2. Navigate to **Settings > Plugins**
3. Click the **Plugin Store** tab
4. Search for "Compare"
5. Click **Install**

### Manual Installation

1. Download the latest `plugin_package.zip` from the [Releases](https://github.com/caido-community/Compare/releases) page
2. Open Caido
3. Navigate to **Settings > Plugins**
4. Click **Install Package** and select the downloaded ZIP file

## Quick Start

### First Comparison

1. **Add Data to Panels:**
   - Use "Paste" to add clipboard content
   - Use "Load" to select a file from your system
   - Right-click a request, a response, or rows in HTTP History and choose "Send to Original" or "Send to Modified"

2. **Organize Data:**
   - Right-click any item and choose "Move" to send it to the other panel
   - Use "Remove" to delete selected items or "Clear" to empty a panel

3. **Select Items:**
   - Click one item in the Original panel
   - Click one item in the Modified panel
   - The compare buttons become available

4. **Compare:**
   - Click "Compare Words" for text
   - Click "Compare Bytes" for character-by-character changes
   - Click "Compare Lines" for line-by-line changes

5. **Analyze Results:**
   - Review the color-coded differences in the comparison window
   - Use "Wrap lines" and "Sync Views" to choose how the two sides scroll
   - Check the line counts at the bottom

## Documentation

Full documentation is available inside the plugin. Open Compare and click the **Docs** tab in the top bar for a quick start, input methods, comparison types, and panel management.

## Feedback & Issues

If you run into a problem or have an idea for an improvement:
- Report bugs and request features on the [GitHub repository](https://github.com/caido-community/Compare/issues)
- Share your security testing workflows and use cases

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://amrelsagaei.com">Amr Elsagaei</a> for the Caido and security community</p>
</div>
