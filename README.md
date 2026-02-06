<h1>Caido Compare</h1>
<strong>A professional data comparison plugin for Caido that provides side-by-side comparison with visual difference highlighting</strong>


---

<details closed>
<summary><b>Table of Contents</b></summary>
<br>

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Feedback & Issues](#feedback--issues)
- [License](#license)
</details>

## Overview

Compare is a powerful Caido plugin designed for security professionals who need precise data comparison capabilities. Whether you're analyzing HTTP requests/responses, comparing configuration files, or examining code differences, Compare provides professional-grade comparison tools with visual difference highlighting - similar to industry-standard comparison tools.

Built specifically for penetration testers and security researchers, Compare integrates seamlessly with Caido's workflow to enhance your security testing capabilities.

## Features

<details>
<summary><b>Professional Comparison Engine</b></summary>
<br>

- **Word-Level Comparison:** Intelligent word-boundary detection for text content analysis
- **Byte-Level Comparison:** Character-by-character analysis for precise difference detection
- **Line-Level Comparison:** Line-by-line comparison ideal for structured content
- **Visual Highlighting:** Color-coded differences with full-width backgrounds (Added, Deleted, Modified, Unchanged)
- **Side-by-Side View:** Professional layout with synchronized scrolling option
- **Comparison Options:** Ignore whitespace and ignore case for flexible comparison
</details>

<details>
<summary><b>Multiple Data Input Methods</b></summary>
<br>

- **Clipboard Integration:** Paste content directly from clipboard
- **File Loading:** Support for various file formats up to 10MB
- **HTTP History Integration:** Direct integration with Caido's HTTP history
- **Context Menu Support:** Right-click to send requests/responses to Original or Modified
</details>

<details>
<summary><b>Advanced Panel Management</b></summary>
<br>

- **Dual-Panel Layout:** Independent Original and Modified panels for comparison
- **Multi-Item Storage:** Store multiple items per panel with metadata
- **Transfer Between Panels:** Right-click any item to transfer between Original and Modified
- **Bulk Operations:** Select multiple items for removal or management
- **Data Persistence:** Automatic project-based data storage
</details>

<details>
<summary><b>HTTP Integration Features</b></summary>
<br>

- **Request Analysis:** Compare different HTTP requests for parameter analysis
- **Response Comparison:** Analyze server response variations
- **Bulk Processing:** Process up to 25 requests simultaneously
- **Metadata Preservation:** Maintains request method, URL, headers information
</details>

<details>
<summary><b>Professional UI/UX</b></summary>
<br>

- **Modern Interface:** Clean, intuitive design matching Caido's theme
- **Type-Specific Badges:** Color-coded item types (clipboard, file, request, response)
- **Responsive Layout:** Optimized for different screen sizes with adaptive modal sizing
- **Detailed Statistics:** Comprehensive difference counts and analysis
- **Professional Modal:** Dedicated comparison view with advanced controls and proper minimum dimensions
</details>

## Installation

### Via Caido's Plugin Store (Recommended)

1. Open Caido
2. Navigate to **Settings > Plugins** 
3. Click the **Plugin Store** tab
4. Search for "Compare"
5. Click **Install**

### Manual Installation

1. Download the latest `plugin_package.zip` from the [Releases](https://github.com/amrelsagaei/compare/releases) page
2. Open Caido
3. Navigate to **Settings > Plugins**
4. Click **Install Package** and select the downloaded ZIP file

## Quick Start

### First Comparison

1. **Add Data to Panels:**
   - Use "Paste" to add clipboard content
   - Use "Load" to select files from your system
   - Right-click requests in HTTP History → "Compare: Send to Original" or "Send to Modified"

2. **Organize Data:**
   - Right-click any item to transfer between Original and Modified panels
   - Use "Remove" to delete selected items or "Clear" to empty panels

3. **Select Items:**
   - Click one item in Original panel
   - Click one item in Modified panel
   - Compare buttons will be enabled

4. **Compare:**
   - Click "Compare Words" for text analysis
   - Click "Compare Bytes" for precise character analysis

5. **Analyze Results:**
   - Review color-coded differences in the comparison modal
   - Use "Sync Views" for synchronized scrolling
   - Check statistics for detailed difference counts


## Documentation

Complete documentation is available within the plugin:
- Click the **"Docs"** button in the top-right corner
- Access comprehensive guides and usage examples
- View quick start tutorials and best practices
- Find troubleshooting tips and advanced features


## Feedback & Issues

If you encounter any issues or have suggestions for improvements, please:
- Report bugs and feature requests on our [GitHub repository](https://github.com/amrelsagaei/compare/issues)
- Share your security testing workflows and use cases
- Contribute to the growing knowledge base

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://amrelsagaei.com">Amr Elsagaei</a> for the Caido and security community</p>
</div>
