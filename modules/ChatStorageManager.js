// ============================================
// MODULE 1: CHAT STORAGE MANAGER
// ============================================

class ChatStorageManager {
  constructor(limit = 500 * 1024 * 1024) {
    this.storageLimit = limit;
    this.dbName = 'DeepSeekManagerDB';
    this.dbVersion = 3;
    this.db = null;
    this.isInitialized = false;
  }
  
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const store = db.createObjectStore('conversations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('favorite', 'favorite', { unique: false });
        }
        
        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const store = db.createObjectStore('analytics', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }
  
  async saveConversation(conversation) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        reject(new Error('Storage not initialized'));
        return;
      }
      
      const transaction = this.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      
      // Ensure conversation has required fields
      const chatToSave = {
        ...conversation,
        id: conversation.id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: conversation.timestamp || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: 1
      };
      
      const request = store.put(chatToSave);
      
      request.onsuccess = () => {
        console.log('Conversation saved:', chatToSave.id);
        resolve(chatToSave.id);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  async getConversation(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async getAllConversations(options = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('timestamp');
      const request = index.getAll();
      
      request.onsuccess = () => {
        let conversations = request.result;
        
        // Apply filters
        if (options.sortBy === 'newest') {
          conversations.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
        }
        
        if (options.favoritesOnly) {
          conversations = conversations.filter(c => c.favorite);
        }
        
        if (options.limit) {
          conversations = conversations.slice(0, options.limit);
        }
        
        resolve(conversations);
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async getConversationsByFilter(filter = {}) {
    const all = await this.getAllConversations();
    
    return all.filter(chat => {
      // Date range filter
      if (filter.dateRange) {
        const chatDate = new Date(chat.timestamp);
        if (filter.dateRange.start && chatDate < new Date(filter.dateRange.start)) {
          return false;
        }
        if (filter.dateRange.end && chatDate > new Date(filter.dateRange.end)) {
          return false;
        }
      }
      
      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const chatTags = chat.tags || [];
        if (!filter.tags.some(tag => chatTags.includes(tag))) {
          return false;
        }
      }
      
      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const content = JSON.stringify(chat).toLowerCase();
        if (!content.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  async searchConversations(query, options = {}) {
    const all = await this.getAllConversations();
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const chat of all) {
      let score = 0;
      const searchableFields = [
        chat.title,
        chat.description,
        ...(chat.messages || []).map(m => m.content),
        ...(chat.tags || [])
      ].filter(Boolean);
      
      for (const field of searchableFields) {
        if (field.toLowerCase().includes(queryLower)) {
          score += field.toLowerCase().split(queryLower).length - 1;
        }
      }
      
      if (score > 0) {
        results.push({
          ...chat,
          _searchScore: score,
          _matchedSnippets: this._extractSnippets(chat, queryLower)
        });
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b._searchScore - a._searchScore);
    
    // Apply limit
    if (options.limit) {
      return results.slice(0, options.limit);
    }
    
    return results;
  }
  
  _extractSnippets(chat, query) {
    const snippets = [];
    const contextWords = 20;
    
    // Search in messages
    for (const message of chat.messages || []) {
      const words = message.content.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase().includes(query)) {
          const start = Math.max(0, i - contextWords);
          const end = Math.min(words.length, i + contextWords);
          snippets.push(words.slice(start, end).join(' '));
          break;
        }
      }
    }
    
    return snippets.slice(0, 3); // Return top 3 snippets
  }
  
  async deleteConversation(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async updateConversation(id, updates) {
    const chat = await this.getConversation(id);
    if (!chat) {
      throw new Error('Conversation not found');
    }
    
    const updatedChat = {
      ...chat,
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: (chat.version || 0) + 1
    };
    
    await this.saveConversation(updatedChat);
    return updatedChat;
  }
  
  async toggleFavorite(id) {
    const chat = await this.getConversation(id);
    if (!chat) {
      throw new Error('Conversation not found');
    }
    
    return await this.updateConversation(id, {
      favorite: !chat.favorite
    });
  }
  
  async addTags(id, tags) {
    const chat = await this.getConversation(id);
    if (!chat) {
      throw new Error('Conversation not found');
    }
    
    const existingTags = new Set(chat.tags || []);
    tags.forEach(tag => existingTags.add(tag));
    
    return await this.updateConversation(id, {
      tags: Array.from(existingTags)
    });
  }
  
  async getStats() {
    const all = await this.getAllConversations();
    
    const stats = {
      total: all.length,
      favorites: all.filter(c => c.favorite).length,
      withCode: all.filter(c => c.hasCodeBlocks).length,
      totalMessages: all.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
      totalSize: new Blob([JSON.stringify(all)]).size,
      byMonth: {},
      tags: {}
    };
    
    // Group by month
    all.forEach(chat => {
      const date = new Date(chat.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
      
      // Count tags
      (chat.tags || []).forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });
    
    return stats;
  }
  
  async logAnalytics(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      
      const record = {
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random().toString(36).substr(2, 9)
      };
      
      const request = store.add(record);
      
      request.onsuccess = () => resolve(record.id);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async cleanup(options = {}) {
    const all = await this.getAllConversations();
    
    // Sort by date (oldest first)
    all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let toDelete = [];
    
    // Filter based on options
    if (options.olderThan) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - options.olderThan);
      toDelete = all.filter(chat => 
        new Date(chat.timestamp) < cutoff && 
        (!options.keepFavorites || !chat.favorite)
      );
    }
    
    // Delete conversations
    const deletePromises = toDelete.map(chat => 
      this.deleteConversation(chat.id)
    );
    
    await Promise.all(deletePromises);
    
    return {
      deletedCount: toDelete.length,
      remaining: all.length - toDelete.length
    };
  }
  
  async exportAll() {
    const conversations = await this.getAllConversations();
    const analytics = await this._getAllAnalytics();
    const settings = await this._getAllSettings();
    
    return {
      version: 1,
      exported: new Date().toISOString(),
      conversations,
      analytics,
      settings,
      metadata: {
        count: conversations.length,
        totalSize: new Blob([JSON.stringify(conversations)]).size
      }
    };
  }
  
  async importAll(data) {
    // Clear existing data
    await this._clearDatabase();
    
    // Import conversations
    for (const chat of data.conversations || []) {
      await this.saveConversation(chat);
    }
    
    // Import settings
    if (data.settings) {
      await this._importSettings(data.settings);
    }
    
    return { success: true, count: data.conversations?.length || 0 };
  }
  
  async _getAllAnalytics() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analytics'], 'readonly');
      const store = transaction.objectStore('analytics');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async _getAllSettings() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
  async _importSettings(settings) {
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    for (const [key, value] of Object.entries(settings)) {
      store.put({ key, value });
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  }
  
  async _clearDatabase() {
    const stores = ['conversations', 'analytics', 'settings'];
    
    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      });
    }
  }
  
  getStatus() {
    return {
      initialized: this.isInitialized,
      dbName: this.dbName,
      limit: this.storageLimit
    };
  }
  
  updateConfig(config) {
    if (config.storageLimit) {
      this.storageLimit = config.storageLimit;
    }
  }
}

export default ChatStorageManager;