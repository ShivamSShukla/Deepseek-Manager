// ============================================
// MODULE 6: UI MANAGER
// ============================================

class UIManager {
  constructor() {
    this.uiElements = new Map();
    this.stylesAdded = false;
    this.currentChatId = null;
  }
  
  async injectUI() {
    // Add CSS styles
    this._injectStyles();
    
    // Create toolbar
    this._createToolbar();
    
    // Create sidebar
    this._createSidebar();
    
    // Create modals
    this._createModals();
    
    // Add event listeners
    this._setupUIEvents();
    
    console.log('UI injected successfully');
  }
  
  _injectStyles() {
    if (this.stylesAdded) return;
    
    const style = document.createElement('style');
    style.textContent = `
      /* DeepSeek Manager Styles */
      .deepseek-manager-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        gap: 10px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 12px;
        border: 1px solid #e0e0e0;
      }
      
      .deepseek-manager-btn {
        background: linear-gradient(135deg, #10a37f 0%, #0d8c6c 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .deepseek-manager-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(16, 163, 127, 0.3);
      }
      
      .deepseek-manager-btn:active {
        transform: translateY(0);
      }
      
      .deepseek-manager-btn.secondary {
        background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
      }
      
      .deepseek-manager-btn.secondary:hover {
        box-shadow: 0 6px 12px rgba(108, 117, 125, 0.3);
      }
      
      .deepseek-manager-btn.warning {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      }
      
      .deepseek-manager-btn.warning:hover {
        box-shadow: 0 6px 12px rgba(220, 53, 69, 0.3);
      }
      
      .deepseek-manager-sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: white;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        transition: right 0.3s ease;
        padding: 20px;
        overflow-y: auto;
      }
      
      .deepseek-manager-sidebar.open {
        right: 0;
      }
      
      .deepseek-manager-sidebar h2 {
        color: #10a37f;
        margin-top: 0;
        padding-bottom: 15px;
        border-bottom: 2px solid #f0f0f0;
      }
      
      .deepseek-manager-sidebar h3 {
        color: #333;
        margin-top: 20px;
        font-size: 16px;
      }
      
      .deepseek-conversation-list {
        max-height: 300px;
        overflow-y: auto;
        margin: 15px 0;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 10px;
      }
      
      .deepseek-conversation-item {
        padding: 12px;
        border-bottom: 1px solid #f5f5f5;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .deepseek-conversation-item:hover {
        background: #f8f9fa;
      }
      
      .deepseek-conversation-item.selected {
        background: #e8f4f1;
        border-left: 3px solid #10a37f;
      }
      
      .deepseek-conversation-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }
      
      .deepseek-conversation-meta {
        font-size: 12px;
        color: #666;
      }
      
      .deepseek-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10001;
        display: none;
        justify-content: center;
        align-items: center;
      }
      
      .deepseek-modal.open {
        display: flex;
      }
      
      .deepseek-modal-content {
        background: white;
        border-radius: 16px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      }
      
      .deepseek-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .deepseek-modal-title {
        font-size: 20px;
        font-weight: 700;
        color: #10a37f;
        margin: 0;
      }
      
      .deepseek-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      .deepseek-modal-close:hover {
        background: #f5f5f5;
      }
      
      .deepseek-form-group {
        margin-bottom: 20px;
      }
      
      .deepseek-form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }
      
      .deepseek-form-input,
      .deepseek-form-select {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
        transition: border 0.2s;
      }
      
      .deepseek-form-input:focus,
      .deepseek-form-select:focus {
        outline: none;
        border-color: #10a37f;
      }
      
      .deepseek-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        cursor: pointer;
      }
      
      .deepseek-checkbox input {
        width: 18px;
        height: 18px;
      }
      
      .deepseek-checkbox-label {
        user-select: none;
      }
      
      .deepseek-modal-footer {
        display: flex;
        gap: 10px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
      
      .deepseek-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10002;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .deepseek-notification.success {
        background: linear-gradient(135deg, #28a745 0%, #218838 100%);
      }
      
      .deepseek-notification.error {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      }
      
      .deepseek-notification.warning {
        background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        color: #212529;
      }
      
      .deepseek-notification.info {
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      }
      
      .deepseek-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        z-index: 10003;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .deepseek-loading.open {
        display: flex;
      }
      
      .deepseek-loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f0f0f0;
        border-top: 4px solid #10a37f;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .deepseek-project-preview {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        border: 1px solid #e0e0e0;
      }
      
      .deepseek-file-tree {
        font-family: 'Courier New', monospace;
        font-size: 14px;
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        margin: 10px 0;
      }
      
      .deepseek-file-tree ul {
        list-style: none;
        padding-left: 20px;
        margin: 0;
      }
      
      .deepseek-file-tree li {
        margin: 5px 0;
      }
      
      .deepseek-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin: 20px 0;
      }
      
      .deepseek-stat-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #e0e0e0;
      }
      
      .deepseek-stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #10a37f;
        margin-bottom: 5px;
      }
      
      .deepseek-stat-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `;
    
    document.head.appendChild(style);
    this.stylesAdded = true;
  }
  
  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'deepseek-manager-toolbar';
    toolbar.id = 'deepseek-manager-toolbar';
    
    toolbar.innerHTML = `
      <button class="deepseek-manager-btn" id="deepseek-save-btn" title="Save current conversation">
        <span>💾</span> Save
      </button>
      <button class="deepseek-manager-btn" id="deepseek-export-btn" title="Export conversation">
        <span>📤</span> Export
      </button>
      <button class="deepseek-manager-btn" id="deepseek-project-btn" title="Export as project">
        <span>📦</span> Project
      </button>
      <button class="deepseek-manager-btn secondary" id="deepseek-manager-btn" title="Open manager">
        <span>⚙️</span> Manager
      </button>
    `;
    
    document.body.appendChild(toolbar);
    this.uiElements.set('toolbar', toolbar);
  }
  
  _createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'deepseek-manager-sidebar';
    sidebar.id = 'deepseek-manager-sidebar';
    
    sidebar.innerHTML = `
      <h2>DeepSeek Manager</h2>
      
      <div class="deepseek-stats-grid" id="deepseek-stats">
        <!-- Stats will be populated dynamically -->
      </div>
      
      <h3>Saved Conversations</h3>
      <div class="deepseek-conversation-list" id="deepseek-conversation-list">
        <div class="deepseek-conversation-item">
          <div class="deepseek-conversation-title">Loading conversations...</div>
        </div>
      </div>
      
      <h3>Quick Actions</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="deepseek-manager-btn" id="deepseek-bulk-export">
          <span>📦</span> Bulk Export
        </button>
        <button class="deepseek-manager-btn secondary" id="deepseek-search-btn">
          <span>🔍</span> Search
        </button>
        <button class="deepseek-manager-btn secondary" id="deepseek-backup-btn">
          <span>💾</span> Backup
        </button>
        <button class="deepseek-manager-btn warning" id="deepseek-clear-btn">
          <span>🗑️</span> Clear
        </button>
      </div>
      
      <h3>Settings</h3>
      <div class="deepseek-checkbox">
        <input type="checkbox" id="deepseek-auto-save" checked>
        <label for="deepseek-auto-save" class="deepseek-checkbox-label">Auto-save conversations</label>
      </div>
      <div class="deepseek-checkbox">
        <input type="checkbox" id="deepseek-notifications" checked>
        <label for="deepseek-notifications" class="deepseek-checkbox-label">Show notifications</label>
      </div>
    `;
    
    document.body.appendChild(sidebar);
    this.uiElements.set('sidebar', sidebar);
  }
  
  _createModals() {
    // Export Modal
    const exportModal = document.createElement('div');
    exportModal.className = 'deepseek-modal';
    exportModal.id = 'deepseek-export-modal';
    
    exportModal.innerHTML = `
      <div class="deepseek-modal-content">
        <div class="deepseek-modal-header">
          <h3 class="deepseek-modal-title">Export Conversation</h3>
          <button class="deepseek-modal-close" id="deepseek-export-close">&times;</button>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Format</label>
          <select class="deepseek-form-select" id="deepseek-export-format">
            <option value="json">JSON (Full data)</option>
            <option value="markdown">Markdown (Readable)</option>
            <option value="html">HTML (Web page)</option>
            <option value="txt">Text (Simple)</option>
            <option value="csv">CSV (Spreadsheet)</option>
          </select>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Options</label>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-export-timestamps" checked>
            <label for="deepseek-export-timestamps" class="deepseek-checkbox-label">Include timestamps</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-export-code" checked>
            <label for="deepseek-export-code" class="deepseek-checkbox-label">Include code blocks</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-export-metadata" checked>
            <label for="deepseek-export-metadata" class="deepseek-checkbox-label">Include metadata</label>
          </div>
        </div>
        
        <div class="deepseek-modal-footer">
          <button class="deepseek-manager-btn" id="deepseek-export-confirm">
            <span>📤</span> Export
          </button>
          <button class="deepseek-manager-btn secondary" id="deepseek-export-cancel">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Project Export Modal
    const projectModal = document.createElement('div');
    projectModal.className = 'deepseek-modal';
    projectModal.id = 'deepseek-project-modal';
    
    projectModal.innerHTML = `
      <div class="deepseek-modal-content">
        <div class="deepseek-modal-header">
          <h3 class="deepseek-modal-title">Export as Project</h3>
          <button class="deepseek-modal-close" id="deepseek-project-close">&times;</button>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Project Name</label>
          <input type="text" class="deepseek-form-input" id="deepseek-project-name" placeholder="my-awesome-project">
        </div>
        
        <div class="deepseek-project-preview" id="deepseek-project-preview">
          <p>Project preview will appear here...</p>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Options</label>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-project-context" checked>
            <label for="deepseek-project-context" class="deepseek-checkbox-label">Include chat context</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-project-configs" checked>
            <label for="deepseek-project-configs" class="deepseek-checkbox-label">Generate config files</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-project-deps" checked>
            <label for="deepseek-project-deps" class="deepseek-checkbox-label">Include dependencies</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-project-flat">
            <label for="deepseek-project-flat" class="deepseek-checkbox-label">Flatten file structure</label>
          </div>
        </div>
        
        <div class="deepseek-modal-footer">
          <button class="deepseek-manager-btn" id="deepseek-project-confirm">
            <span>📦</span> Create ZIP
          </button>
          <button class="deepseek-manager-btn secondary" id="deepseek-project-cancel">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Bulk Export Modal
    const bulkModal = document.createElement('div');
    bulkModal.className = 'deepseek-modal';
    bulkModal.id = 'deepseek-bulk-modal';
    
    bulkModal.innerHTML = `
      <div class="deepseek-modal-content">
        <div class="deepseek-modal-header">
          <h3 class="deepseek-modal-title">Bulk Export</h3>
          <button class="deepseek-modal-close" id="deepseek-bulk-close">&times;</button>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Export Format</label>
          <select class="deepseek-form-select" id="deepseek-bulk-format">
            <option value="zip">ZIP (All in one)</option>
            <option value="json">JSON files</option>
            <option value="markdown">Markdown files</option>
            <option value="txt">Text files</option>
          </select>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Date Range</label>
          <div style="display: flex; gap: 10px;">
            <input type="date" class="deepseek-form-input" id="deepseek-bulk-date-start" style="flex: 1;">
            <input type="date" class="deepseek-form-input" id="deepseek-bulk-date-end" style="flex: 1;">
          </div>
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Tags (comma-separated)</label>
          <input type="text" class="deepseek-form-input" id="deepseek-bulk-tags" placeholder="react, javascript, tutorial">
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Search Query</label>
          <input type="text" class="deepseek-form-input" id="deepseek-bulk-search" placeholder="Search within conversations">
        </div>
        
        <div class="deepseek-form-group">
          <label class="deepseek-form-label">Options</label>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-bulk-metadata" checked>
            <label for="deepseek-bulk-metadata" class="deepseek-checkbox-label">Include metadata</label>
          </div>
          <div class="deepseek-checkbox">
            <input type="checkbox" id="deepseek-bulk-readable" checked>
            <label for="deepseek-bulk-readable" class="deepseek-checkbox-label">Include readable version</label>
          </div>
        </div>
        
        <div class="deepseek-modal-footer">
          <button class="deepseek-manager-btn" id="deepseek-bulk-confirm">
            <span>📦</span> Export All
          </button>
          <button class="deepseek-manager-btn secondary" id="deepseek-bulk-cancel">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    // Loading Overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'deepseek-loading';
    loadingOverlay.id = 'deepseek-loading';
    
    loadingOverlay.innerHTML = `
      <div class="deepseek-loading-spinner"></div>
      <p id="deepseek-loading-text">Processing...</p>
    `;
    
    // Append all modals
    [exportModal, projectModal, bulkModal, loadingOverlay].forEach(modal => {
      document.body.appendChild(modal);
    });
    
    this.uiElements.set('exportModal', exportModal);
    this.uiElements.set('projectModal', projectModal);
    this.uiElements.set('bulkModal', bulkModal);
    this.uiElements.set('loadingOverlay', loadingOverlay);
  }
  
  _setupUIEvents() {
    // Toolbar buttons
    document.getElementById('deepseek-manager-btn').addEventListener('click', () => {
      this.toggleSidebar();
    });
    
    document.getElementById('deepseek-save-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('save-requested'));
    });
    
    document.getElementById('deepseek-export-btn').addEventListener('click', () => {
      this.showExportModal();
    });
    
    document.getElementById('deepseek-project-btn').addEventListener('click', () => {
      this.showProjectModal();
    });
    
    // Sidebar buttons
    document.getElementById('deepseek-bulk-export').addEventListener('click', () => {
      this.showBulkModal();
    });
    
    // Modal close buttons
    document.getElementById('deepseek-export-close').addEventListener('click', () => {
      this.hideExportModal();
    });
    
    document.getElementById('deepseek-project-close').addEventListener('click', () => {
      this.hideProjectModal();
    });
    
    document.getElementById('deepseek-bulk-close').addEventListener('click', () => {
      this.hideBulkModal();
    });
    
    // Export confirm button
    document.getElementById('deepseek-export-confirm').addEventListener('click', () => {
      const format = document.getElementById('deepseek-export-format').value;
      const options = {
        includeTimestamps: document.getElementById('deepseek-export-timestamps').checked,
        includeCode: document.getElementById('deepseek-export-code').checked,
        includeMetadata: document.getElementById('deepseek-export-metadata').checked
      };
      
      window.dispatchEvent(new CustomEvent('export-requested', {
        detail: { format, ...options }
      }));
      
      this.hideExportModal();
    });
    
    // Project confirm button
    document.getElementById('deepseek-project-confirm').addEventListener('click', () => {
      const projectName = document.getElementById('deepseek-project-name').value;
      const options = {
        includeChatContext: document.getElementById('deepseek-project-context').checked,
        generateConfigs: document.getElementById('deepseek-project-configs').checked,
        includeDependencies: document.getElementById('deepseek-project-deps').checked,
        flattenStructure: document.getElementById('deepseek-project-flat').checked,
        projectName: projectName || undefined
      };
      
      window.dispatchEvent(new CustomEvent('project-export', {
        detail: options
      }));
      
      this.hideProjectModal();
    });
    
    // Bulk confirm button
    document.getElementById('deepseek-bulk-confirm').addEventListener('click', () => {
      const format = document.getElementById('deepseek-bulk-format').value;
      const dateStart = document.getElementById('deepseek-bulk-date-start').value;
      const dateEnd = document.getElementById('deepseek-bulk-date-end').value;
      const tags = document.getElementById('deepseek-bulk-tags').value;
      const searchQuery = document.getElementById('deepseek-bulk-search').value;
      
      const options = {
        format,
        dateRange: dateStart || dateEnd ? {
          start: dateStart || undefined,
          end: dateEnd || undefined
        } : undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        searchQuery: searchQuery || undefined,
        includeMetadata: document.getElementById('deepseek-bulk-metadata').checked,
        includeReadable: document.getElementById('deepseek-bulk-readable').checked
      };
      
      window.dispatchEvent(new CustomEvent('bulk-export', {
        detail: options
      }));
      
      this.hideBulkModal();
    });
    
    // Cancel buttons
    ['export', 'project', 'bulk'].forEach(type => {
      document.getElementById(`deepseek-${type}-cancel`).addEventListener('click', () => {
        this[`hide${type.charAt(0).toUpperCase() + type.slice(1)}Modal`]();
      });
    });
    
    // Close modals on outside click
    ['export', 'project', 'bulk'].forEach(type => {
      document.getElementById(`deepseek-${type}-modal`).addEventListener('click', (e) => {
        if (e.target.id === `deepseek-${type}-modal`) {
          this[`hide${type.charAt(0).toUpperCase() + type.slice(1)}Modal`]();
        }
      });
    });
  }
  
  // Modal control methods
  showExportModal() {
    document.getElementById('deepseek-export-modal').classList.add('open');
  }
  
  hideExportModal() {
    document.getElementById('deepseek-export-modal').classList.remove('open');
  }
  
  showProjectModal() {
    document.getElementById('deepseek-project-modal').classList.add('open');
  }
  
  hideProjectModal() {
    document.getElementById('deepseek-project-modal').classList.remove('open');
  }
  
  showBulkModal() {
    document.getElementById('deepseek-bulk-modal').classList.add('open');
  }
  
  hideBulkModal() {
    document.getElementById('deepseek-bulk-modal').classList.remove('open');
  }
  
  showLoading(text = 'Processing...') {
    const loading = document.getElementById('deepseek-loading');
    document.getElementById('deepseek-loading-text').textContent = text;
    loading.classList.add('open');
  }
  
  hideLoading() {
    document.getElementById('deepseek-loading').classList.remove('open');
  }
  
  // Sidebar control
  toggleSidebar() {
    const sidebar = document.getElementById('deepseek-manager-sidebar');
    sidebar.classList.toggle('open');
    
    // Load conversations when sidebar opens
    if (sidebar.classList.contains('open')) {
      this.loadConversationsList();
      this.updateStats();
    }
  }
  
  async loadConversationsList() {
    const listElement = document.getElementById('deepseek-conversation-list');
    
    // In real implementation, this would load from storage
    listElement.innerHTML = `
      <div class="deepseek-conversation-item">
        <div class="deepseek-conversation-title">Example Conversation</div>
        <div class="deepseek-conversation-meta">Today, 5 messages</div>
      </div>
    `;
  }
  
  async updateStats() {
    const statsElement = document.getElementById('deepseek-stats');
    
    // In real implementation, this would load real stats
    statsElement.innerHTML = `
      <div class="deepseek-stat-card">
        <div class="deepseek-stat-value">12</div>
        <div class="deepseek-stat-label">Conversations</div>
      </div>
      <div class="deepseek-stat-card">
        <div class="deepseek-stat-value">156</div>
        <div class="deepseek-stat-label">Messages</div>
      </div>
      <div class="deepseek-stat-card">
        <div class="deepseek-stat-value">8</div>
        <div class="deepseek-stat-label">Projects</div>
      </div>
      <div class="deepseek-stat-card">
        <div class="deepseek-stat-value">4.2MB</div>
        <div class="deepseek-stat-label">Storage</div>
      </div>
    `;
  }
  
  // Notification system
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `deepseek-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Store reference
    this.uiElements.set('notification', notification);
  }
  
  // Project detection notification
  showProjectDetectedNotification(analysis) {
    if (analysis.isCompleteProject && analysis.confidence > 60) {
      const message = `🎯 Project detected: ${analysis.suggestedName} (${analysis.confidence}% confidence)`;
      const notification = document.createElement('div');
      notification.className = 'deepseek-notification success';
      notification.innerHTML = `
        ${message}
        <button id="deepseek-quick-export" style="margin-left: 10px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer;">
          Export ZIP
        </button>
      `;
      
      document.body.appendChild(notification);
      
      // Add event listener to the button
      setTimeout(() => {
        const button = document.getElementById('deepseek-quick-export');
        if (button) {
          button.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('project-export', {
              detail: {
                projectName: analysis.suggestedName,
                includeChatContext: true,
                generateConfigs: true
              }
            }));
            notification.remove();
          });
        }
      }, 100);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 8000);
    }
  }
  
  // Update chat info in UI
  updateChatInfo(chat) {
    // Could update a status indicator or counter
    if (chat && chat.id !== this.currentChatId) {
      this.currentChatId = chat.id;
      // Update any UI elements that show current chat info
    }
  }
  
  // Update project preview
  updateProjectPreview(analysis) {
    const preview = document.getElementById('deepseek-project-preview');
    if (!preview || !analysis) return;
    
    let html = `
      <h4 style="margin-top: 0;">${analysis.suggestedName}</h4>
      <p><strong>Type:</strong> ${analysis.projectType}</p>
      <p><strong>Confidence:</strong> ${analysis.confidence}%</p>
      <p><strong>Files detected:</strong> ${analysis.files.length}</p>
    `;
    
    if (analysis.files.length > 0) {
      html += `<div class="deepseek-file-tree">
        <ul>`;
      
      analysis.files.forEach(file => {
        html += `<li>📄 ${file.name} <span style="color: #888;">(${file.language})</span></li>`;
      });
      
      html += `</ul></div>`;
    }
    
    preview.innerHTML = html;
  }
  
  removeUI() {
    // Remove all UI elements
    this.uiElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clear references
    this.uiElements.clear();
    
    // Remove styles
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
      if (style.textContent.includes('DeepSeek Manager')) {
        style.remove();
      }
    });
    
    this.stylesAdded = false;
  }
}

export default UIManager;