@echo off
title Fix DeepSeek Manager Manifest Errors
color 0A
echo ========================================
echo    CREATING MISSING FILES FOR MANIFEST
echo ========================================
echo.

echo [1/10] Checking current directory...
if not exist "manifest.json" (
    echo ERROR: manifest.json not found!
    echo Please run this script in your extension folder.
    pause
    exit /b 1
)

echo [2/10] Creating directory structure...
if not exist "js" mkdir js
if not exist "js\core" mkdir js\core
if not exist "js\modules" mkdir js\modules
if not exist "js\utils" mkdir js\utils
if not exist "css" mkdir css
if not exist "icons" mkdir icons

echo [3/10] Creating js/core/index.js...
(
echo // Core module index
echo export * from './chat-parser.js';
echo export * from './storage-manager.js';
echo export * from './project-builder.js';
) > js\core\index.js

echo [4/10] Creating js/modules/index.js...
(
echo // Modules index
echo export * from './ui-manager.js';
echo export * from './export-manager.js';
echo export * from './zip-builder.js';
) > js\modules\index.js

echo [5/10] Creating js/utils/index.js...
(
echo // Utils index
echo export * from './helpers.js';
echo export * from './formatters.js';
echo export * from './validators.js';
) > js\utils\index.js

echo [6/10] Creating js/main.js...
(
echo // DeepSeek Manager Main Entry Point
echo console.log('DeepSeek Manager loading...');
echo 
echo // Import modules
echo import { ChatParser, StorageManager, ProjectBuilder } from './core/index.js';
echo import { UIManager, ExportManager, ZIPBuilder } from './modules/index.js';
echo import { formatDate, validateUrl } from './utils/index.js';
echo 
echo // Initialize when page loads
echo if (document.readyState === 'loading') {
echo   document.addEventListener('DOMContentLoaded', initDeepSeekManager);
echo } else {
echo   initDeepSeekManager();
echo }
echo 
echo function initDeepSeekManager() {
echo   console.log('Initializing DeepSeek Manager...');
echo   
echo   // Check if we're on DeepSeek
echo   if (!window.location.href.includes('deepseek.com')) {
echo     console.log('Not on DeepSeek, skipping initialization');
echo     return;
echo   }
echo   
echo   // Initialize modules
echo   const parser = new ChatParser();
echo   const storage = new StorageManager();
echo   const projectBuilder = new ProjectBuilder();
echo   const uiManager = new UIManager();
echo   
echo   // Store in global scope
echo   window.deepSeekManager = {
echo     parser,
echo     storage,
echo     projectBuilder,
echo     uiManager,
echo     version: '1.0.0'
echo   };
echo   
echo   console.log('DeepSeek Manager initialized successfully!');
echo   
echo   // Inject UI after a short delay
echo   setTimeout(() => {
echo     uiManager.injectUI();
echo   }, 1000);
echo }
) > js\main.js

echo [7/10] Creating placeholder module files...
(
echo // Chat Parser Module
echo class ChatParser {
echo   constructor() {
echo     console.log('ChatParser initialized');
echo   }
echo   
echo   extractCurrentChat() {
echo     return { messages: [], id: 'temp' };
echo   }
echo }
echo 
echo export { ChatParser };
) > js\core\chat-parser.js

(
echo // Storage Manager Module
echo class StorageManager {
echo   constructor() {
echo     console.log('StorageManager initialized');
echo   }
echo }
echo 
echo export { StorageManager };
) > js\core\storage-manager.js

(
echo // Project Builder Module
echo class ProjectBuilder {
echo   constructor() {
echo     console.log('ProjectBuilder initialized');
echo   }
echo }
echo 
echo export { ProjectBuilder };
) > js\core\project-builder.js

(
echo // UI Manager Module
echo class UIManager {
echo   constructor() {
echo     console.log('UIManager initialized');
echo   }
echo   
echo   injectUI() {
echo     console.log('Injecting UI...');
echo   }
echo }
echo 
echo export { UIManager };
) > js\modules\ui-manager.js

(
echo // Export Manager Module
echo class ExportManager {
echo   constructor() {
echo     console.log('ExportManager initialized');
echo   }
echo }
echo 
echo export { ExportManager };
) > js\modules\export-manager.js

(
echo // ZIP Builder Module
echo class ZIPBuilder {
echo   constructor() {
echo     console.log('ZIPBuilder initialized');
echo   }
echo }
echo 
echo export { ZIPBuilder };
) > js\modules\zip-builder.js

(
echo // Helpers Utility
echo export function formatDate(date) {
echo   return date.toISOString();
echo }
echo 
echo export function validateUrl(url) {
echo   return url.startsWith('https://');
echo }
) > js\utils\helpers.js

(
echo // Formatters Utility
echo export function formatBytes(bytes) {
echo   return bytes + ' bytes';
echo }
) > js\utils\formatters.js

(
echo // Validators Utility
echo export function isValidJSON(str) {
echo   try {
echo     JSON.parse(str);
echo     return true;
echo   } catch {
echo     return false;
echo   }
echo }
) > js\utils\validators.js

echo [8/10] Creating css/deepseek-manager.css...
(
echo /* DeepSeek Manager Styles */
echo .deepseek-toolbar {
echo   position: fixed;
echo   top: 10px;
echo   right: 10px;
echo   z-index: 10000;
echo   background: white;
echo   padding: 10px;
echo   border-radius: 8px;
echo   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
echo }
echo 
echo .deepseek-btn {
echo   background: #10a37f;
echo   color: white;
echo   border: none;
echo   padding: 8px 12px;
echo   border-radius: 4px;
echo   cursor: pointer;
echo   margin: 2px;
echo }
) > css\deepseek-manager.css

echo [9/10] Creating placeholder icons...
REM Create simple placeholder icons (1x1 pixel transparent PNG base64)
echo iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg== > icons\icon16.png.tmp
certutil -decode icons\icon16.png.tmp icons\icon16.png >nul
copy icons\icon16.png icons\icon48.png >nul
copy icons\icon16.png icons\icon128.png >nul
del icons\icon16.png.tmp

echo [10/10] Creating popup.html...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo   ^<meta charset="UTF-8"^>
echo   ^<title^>DeepSeek Manager^</title^>
echo   ^<style^>
echo     body {
echo       width: 300px;
echo       padding: 15px;
echo       font-family: Arial, sans-serif;
echo     }
echo     .btn {
echo       width: 100%%;
echo       padding: 10px;
echo       margin: 5px 0;
echo       background: #10a37f;
echo       color: white;
echo       border: none;
echo       border-radius: 4px;
echo       cursor: pointer;
echo     }
echo   ^</style^>
echo ^</head^>
echo ^<body^>
echo   ^<h3^>DeepSeek Manager^</h3^>
echo   ^<button class="btn" id="saveBtn"^>Save Chat^</button^>
echo   ^<button class="btn" id="exportBtn"^>Export Chat^</button^>
echo   ^<button class="btn" id="projectBtn"^>Export Project^</button^>
echo   ^<script src="popup.js"^>^</script^>
echo ^</body^>
echo ^</html^>
) > popup.html

(
echo // Popup JavaScript
echo document.getElementById('saveBtn').addEventListener('click', () => {
echo   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
echo     chrome.tabs.sendMessage(tabs[0].id, {action: 'saveChat'});
echo   });
echo });
echo 
echo document.getElementById('exportBtn').addEventListener('click', () => {
echo   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
echo     chrome.tabs.sendMessage(tabs[0].id, {action: 'exportChat'});
echo   });
echo });
echo 
echo document.getElementById('projectBtn').addEventListener('click', () => {
echo   chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
echo     chrome.tabs.sendMessage(tabs[0].id, {action: 'exportProject'});
echo   });
echo });
) > popup.js

echo.
echo ========================================
echo      ALL FILES CREATED SUCCESSFULLY!
echo ========================================
echo.
echo Created the following files:
echo - js/core/index.js
echo - js/core/chat-parser.js
echo - js/core/storage-manager.js
echo - js/core/project-builder.js
echo - js/modules/index.js
echo - js/modules/ui-manager.js
echo - js/modules/export-manager.js
echo - js/modules/zip-builder.js
echo - js/utils/index.js
echo - js/utils/helpers.js
echo - js/utils/formatters.js
echo - js/utils/validators.js
echo - js/main.js
echo - css/deepseek-manager.css
echo - icons/icon16.png
echo - icons/icon48.png
echo - icons/icon128.png
echo - popup.html
echo - popup.js
echo.
echo Your folder structure should now be:
echo deepseek-manager/
echo ├── manifest.json
echo ├── js/
echo │   ├── core/
echo │   │   ├── index.js
echo │   │   ├── chat-parser.js
echo │   │   ├── storage-manager.js
echo │   │   └── project-builder.js
echo │   ├── modules/
echo │   │   ├── index.js
echo │   │   ├── ui-manager.js
echo │   │   ├── export-manager.js
echo │   │   └── zip-builder.js
echo │   ├── utils/
echo │   │   ├── index.js
echo │   │   ├── helpers.js
echo │   │   ├── formatters.js
echo │   │   └── validators.js
echo │   └── main.js
echo ├── css/
echo │   └── deepseek-manager.css
echo ├── icons/
echo │   ├── icon16.png
echo │   ├── icon48.png
echo │   └── icon128.png
echo ├── popup.html
echo └── popup.js
echo.
echo Now go to chrome://extensions/ and:
echo 1. Make sure Developer Mode is ON
echo 2. Click "Reload" button on your extension
echo 3. The error should be gone!
echo.
pause