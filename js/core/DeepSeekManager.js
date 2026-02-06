// ============================================
// CORE CLASS: DeepSeekManager
// ============================================

class DeepSeekManager {
  constructor(config = {}) {
    this.version = '1.0.0';
    this.config = {
      autoSave: config.autoSave || true,
      storageLimit: config.storageLimit || 500 * 1024 * 1024, // 500MB
      defaultFormat: config.defaultFormat || 'json',
      enableAnalytics: config.enableAnalytics || false,
      ...config
    };
    
    // Initialize core modules
    this.storage = new ChatStorageManager(this.config.storageLimit);
    this.parser = new ChatParser();
    this.exporter = new ExportManager();
    this.projectBuilder = new ProjectBuilder();
    this.uiManager = new UIManager();
    this.zipBuilder = new ZIPBuilder();
    
    // State management
    this.state = {
      isInitialized: false,
      currentConversation: null,
      savedConversations: new Map(),
      exportQueue: [],
      projectCache: new Map()
    };
    
    // Event system
    this.events = new EventManager();
    
    this._initialize();
  }
  
  async _initialize() {
    try {
      console.log('🚀 DeepSeek Manager Initializing...');
      
      // Load saved data
      await this.storage.initialize();
      
      // Set up UI
      await this.uiManager.injectUI();
      
      // Start monitoring chat
      this._startChatMonitoring();
      
      // Set up event listeners
      this._setupEventListeners();
      
      this.state.isInitialized = true;
      console.log('✅ DeepSeek Manager Ready!');
      
      // Show welcome message
      this.uiManager.showNotification(
        'DeepSeek Manager loaded! Access via the toolbar button.',
        'success'
      );
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.uiManager.showNotification(
        'Failed to initialize DeepSeek Manager',
        'error'
      );
    }
  }
  
  _startChatMonitoring() {
    // Monitor DOM for chat changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this._handleChatUpdate();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also check periodically
    setInterval(() => this._handleChatUpdate(), 3000);
  }
  
  async _handleChatUpdate() {
    try {
      const currentChat = this.parser.extractCurrentChat();
      if (currentChat && !this._isSameChat(currentChat, this.state.currentConversation)) {
        this.state.currentConversation = currentChat;
        
        // Auto-save if enabled
        if (this.config.autoSave) {
          await this.autoSaveConversation(currentChat);
        }
        
        // Check for project completion
        const projectDetection = await this.projectBuilder.analyzeConversation(currentChat);
        if (projectDetection.isCompleteProject) {
          this.uiManager.showProjectDetectedNotification(projectDetection);
        }
        
        // Update UI with current chat info
        this.uiManager.updateChatInfo(currentChat);
      }
    } catch (error) {
      console.warn('Chat update error:', error);
    }
  }
  
  _isSameChat(chat1, chat2) {
    if (!chat1 || !chat2) return false;
    return chat1.id === chat2.id && 
           chat1.messageCount === chat2.messageCount;
  }
  
  _setupEventListeners() {
    // Listen for export requests
    this.events.on('export-requested', async (data) => {
      await this.handleExportRequest(data);
    });
    
    // Listen for save requests
    this.events.on('save-requested', async (chat) => {
      await this.saveConversation(chat);
    });
    
    // Listen for project export
    this.events.on('project-export', async (options) => {
      await this.exportProjectAsZIP(options);
    });
    
    // Listen for bulk operations
    this.events.on('bulk-export', async (options) => {
      await this.handleBulkExport(options);
    });
    
    // Listen for settings changes
    this.events.on('settings-changed', (settings) => {
      this.config = { ...this.config, ...settings };
      this.storage.updateConfig(this.config);
    });
  }
  
  // ============================================
  // PUBLIC API METHODS
  // ============================================
  
  async saveConversation(chat = null) {
    const targetChat = chat || this.state.currentConversation;
    if (!targetChat) {
      throw new Error('No conversation to save');
    }
    
    try {
      // Enhance chat data
      const enhancedChat = await this.parser.enhanceChatData(targetChat);
      
      // Save to storage
      const savedId = await this.storage.saveConversation(enhancedChat);
      
      // Update state
      this.state.savedConversations.set(savedId, enhancedChat);
      
      // Show confirmation
      this.uiManager.showNotification('Conversation saved successfully!', 'success');
      
      return savedId;
    } catch (error) {
      console.error('Save failed:', error);
      this.uiManager.showNotification('Failed to save conversation', 'error');
      throw error;
    }
  }
  
  async autoSaveConversation(chat) {
    try {
      const chatId = chat.id || this._generateChatId(chat);
      const lastSave = await this.storage.getLastSaveTime(chatId);
      
      // Only auto-save if not saved in last 30 seconds
      if (!lastSave || (Date.now() - lastSave) > 30000) {
        await this.saveConversation(chat);
      }
    } catch (error) {
      // Silent fail for auto-save
      console.debug('Auto-save skipped:', error.message);
    }
  }
  
  async exportConversation(options = {}) {
    const {
      conversationId,
      format = this.config.defaultFormat,
      includeCode = true,
      includeMetadata = true,
      includeImages = false
    } = options;
    
    let chat;
    if (conversationId) {
      chat = await this.storage.getConversation(conversationId);
    } else {
      chat = this.state.currentConversation;
    }
    
    if (!chat) {
      throw new Error('No conversation to export');
    }
    
    try {
      const exportData = await this.exporter.prepareExport(chat, {
        format,
        includeCode,
        includeMetadata,
        includeImages
      });
      
      const filename = this.exporter.generateFilename(chat, format);
      await this.exporter.download(exportData, filename);
      
      this.uiManager.showNotification(`Exported as ${format.toUpperCase()}`, 'success');
      
      // Log analytics if enabled
      if (this.config.enableAnalytics) {
        this._logExportAnalytics(format, chat);
      }
      
      return { success: true, filename, format };
    } catch (error) {
      console.error('Export failed:', error);
      this.uiManager.showNotification('Export failed', 'error');
      throw error;
    }
  }
  
  async exportProjectAsZIP(options = {}) {
    const {
      conversationId,
      projectName,
      includeChatContext = true,
      generateConfigs = true,
      includeDependencies = true,
      flattenStructure = false
    } = options;
    
    let chat;
    if (conversationId) {
      chat = await this.storage.getConversation(conversationId);
    } else {
      chat = this.state.currentConversation;
    }
    
    if (!chat) {
      throw new Error('No conversation to export as project');
    }
    
    try {
      // Show loading indicator
      this.uiManager.showLoading('Building project...');
      
      // Analyze conversation for project files
      const projectAnalysis = await this.projectBuilder.analyzeConversation(chat);
      
      // Build ZIP structure
      const zipData = await this.zipBuilder.createProjectZIP({
        chat,
        analysis: projectAnalysis,
        options: {
          projectName: projectName || projectAnalysis.suggestedName,
          includeChatContext,
          generateConfigs,
          includeDependencies,
          flattenStructure
        }
      });
      
      // Download ZIP
      const filename = `${projectName || projectAnalysis.suggestedName}.zip`;
      await this.zipBuilder.downloadZIP(zipData, filename);
      
      // Hide loading
      this.uiManager.hideLoading();
      
      // Show success
      this.uiManager.showNotification('Project exported as ZIP!', 'success');
      
      // Cache project data
      this.state.projectCache.set(chat.id, {
        analysis: projectAnalysis,
        exportedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        filename,
        fileCount: projectAnalysis.files.length,
        projectType: projectAnalysis.projectType
      };
      
    } catch (error) {
      this.uiManager.hideLoading();
      console.error('Project export failed:', error);
      this.uiManager.showNotification('Project export failed', 'error');
      throw error;
    }
  }
  
  async handleBulkExport(options = {}) {
    const {
      format = 'zip',
      dateRange,
      tags,
      searchQuery,
      includeMetadata = true
    } = options;
    
    try {
      this.uiManager.showLoading('Preparing bulk export...');
      
      // Get conversations based on filters
      const conversations = await this.storage.getConversationsByFilter({
        dateRange,
        tags,
        searchQuery
      });
      
      if (conversations.length === 0) {
        this.uiManager.showNotification('No conversations match your criteria', 'warning');
        return;
      }
      
      let result;
      if (format === 'zip') {
        // Export all as single ZIP
        result = await this._bulkExportAsZIP(conversations, options);
      } else {
        // Export as individual files in a ZIP
        result = await this._bulkExportAsFiles(conversations, options);
      }
      
      this.uiManager.hideLoading();
      this.uiManager.showNotification(
        `Exported ${conversations.length} conversations`,
        'success'
      );
      
      return result;
      
    } catch (error) {
      this.uiManager.hideLoading();
      console.error('Bulk export failed:', error);
      this.uiManager.showNotification('Bulk export failed', 'error');
      throw error;
    }
  }
  
  async searchConversations(query, options = {}) {
    return await this.storage.searchConversations(query, options);
  }
  
  async getConversationStats() {
    const stats = await this.storage.getStats();
    const projectStats = await this.projectBuilder.getStats();
    
    return {
      ...stats,
      projects: projectStats,
      managerVersion: this.version
    };
  }
  
  async clearStorage(options = {}) {
    const {
      keepFavorites = true,
      olderThan = null,
      maxSize = null
    } = options;
    
    const result = await this.storage.cleanup({
      keepFavorites,
      olderThan,
      maxSize
    });
    
    // Update state
    this.state.savedConversations.clear();
    
    this.uiManager.showNotification(
      `Cleared ${result.deletedCount} conversations`,
      'info'
    );
    
    return result;
  }
  
  async backupToFile() {
    try {
      const allData = await this.storage.exportAll();
      const filename = `deepseek-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      await this.exporter.download(
        JSON.stringify(allData, null, 2),
        filename,
        'application/json'
      );
      
      this.uiManager.showNotification('Backup created successfully', 'success');
      
      return { success: true, filename };
    } catch (error) {
      console.error('Backup failed:', error);
      this.uiManager.showNotification('Backup failed', 'error');
      throw error;
    }
  }
  
  async restoreFromFile(file) {
    try {
      this.uiManager.showLoading('Restoring backup...');
      
      const content = await this._readFileAsText(file);
      const backupData = JSON.parse(content);
      
      await this.storage.importAll(backupData);
      
      // Reload conversations
      this.state.savedConversations.clear();
      
      this.uiManager.hideLoading();
      this.uiManager.showNotification(
        `Restored ${backupData.conversations?.length || 0} conversations`,
        'success'
      );
      
      return { success: true, count: backupData.conversations?.length || 0 };
    } catch (error) {
      this.uiManager.hideLoading();
      console.error('Restore failed:', error);
      this.uiManager.showNotification('Restore failed - Invalid backup file', 'error');
      throw error;
    }
  }
  
  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================
  
  _generateChatId(chat) {
    const contentHash = this._hashString(
      JSON.stringify(chat.messages.slice(0, 3))
    );
    return `chat_${Date.now()}_${contentHash.substring(0, 8)}`;
  }
  
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  async _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
  
  async _bulkExportAsZIP(conversations, options) {
    const zip = new JSZip();
    
    for (const chat of conversations) {
      const exportData = await this.exporter.prepareExport(chat, {
        format: 'json',
        includeMetadata: options.includeMetadata
      });
      
      const filename = this.exporter.generateFilename(chat, 'json');
      zip.file(filename, exportData);
      
      // Also export as readable text if requested
      if (options.includeReadable) {
        const textData = await this.exporter.prepareExport(chat, {
          format: 'txt',
          includeMetadata: options.includeMetadata
        });
        zip.file(filename.replace('.json', '.txt'), textData);
      }
    }
    
    // Add manifest
    zip.file('MANIFEST.json', JSON.stringify({
      exported: new Date().toISOString(),
      count: conversations.length,
      source: 'DeepSeek Manager'
    }, null, 2));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const filename = `deepseek-bulk-${new Date().toISOString().split('T')[0]}.zip`;
    
    await this.exporter.download(zipBlob, filename, 'application/zip');
    
    return {
      success: true,
      filename,
      count: conversations.length
    };
  }
  
  async _bulkExportAsFiles(conversations, options) {
    // Create a folder for exports
    const zip = new JSZip();
    const folder = zip.folder(`exports-${Date.now()}`);
    
    for (const chat of conversations) {
      const exportData = await this.exporter.prepareExport(chat, {
        format: options.format,
        includeMetadata: options.includeMetadata
      });
      
      const filename = this.exporter.generateFilename(chat, options.format);
      folder.file(filename, exportData);
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const filename = `deepseek-exports-${options.format}-${Date.now()}.zip`;
    
    await this.exporter.download(zipBlob, filename, 'application/zip');
    
    return {
      success: true,
      filename,
      count: conversations.length,
      format: options.format
    };
  }
  
  _logExportAnalytics(format, chat) {
    const analytics = {
      event: 'export',
      format,
      timestamp: new Date().toISOString(),
      chatId: chat.id,
      messageCount: chat.messages?.length || 0,
      hasCode: chat.hasCodeBlocks || false
    };
    
    // Store locally
    this.storage.logAnalytics(analytics).catch(console.error);
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  getStatus() {
    return {
      initialized: this.state.isInitialized,
      version: this.version,
      storage: this.storage.getStatus(),
      currentChat: this.state.currentConversation ? {
        id: this.state.currentConversation.id,
        messageCount: this.state.currentConversation.messages?.length || 0
      } : null,
      savedCount: this.state.savedConversations.size
    };
  }
  
  destroy() {
    // Clean up observers
    if (this._chatObserver) {
      this._chatObserver.disconnect();
    }
    
    // Remove UI
    this.uiManager.removeUI();
    
    // Clear state
    this.state.isInitialized = false;
    
    console.log('DeepSeek Manager destroyed');
  }
}

export default DeepSeekManager;