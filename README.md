# DeepSeek Manager

A complete solution for exporting and managing DeepSeek conversations as projects.

## Features

- **Chat Export**: Export conversations in JSON, Markdown, HTML, PDF, TXT, and CSV formats
- **Project Detection**: Automatically detect and export complete projects from conversations
- **ZIP Creation**: Create organized ZIP files with project structure
- **Local Storage**: Save conversations locally with IndexedDB
- **Bulk Operations**: Export multiple conversations at once
- **Search**: Search through saved conversations
- **Backup & Restore**: Backup all data to a file and restore later

## Installation

### As a Browser Extension
1. Clone this repository
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. Visit DeepSeek chat to start using

### As a User Script
1. Install a userscript manager (Tampermonkey, Violentmonkey, etc.)
2. Create a new script and paste the contents of `js/main.js`
3. Add the required dependencies (JSZip)
4. Save and visit DeepSeek chat

## Usage

### Basic Usage
```javascript
// Initialize the manager
const manager = new DeepSeekManager({
    autoSave: true,
    storageLimit: 500 * 1024 * 1024
});

// Save current conversation
await manager.saveConversation();

// Export as JSON
await manager.exportConversation({ format: 'json' });

// Export as project ZIP
await manager.exportProjectAsZIP({
    projectName: 'my-project',
    includeChatContext: true
});