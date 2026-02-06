// ============================================
// MAIN ENTRY POINT - DeepSeek Manager
// ============================================

import { DeepSeekManager } from './core/index.js';
import { constants, helpers } from './utils/index.js';

// Make available globally
window.DeepSeekManager = DeepSeekManager;
window.DSMConstants = constants;
window.DSMHelpers = helpers;

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDeepSeekManager);
} else {
  initializeDeepSeekManager();
}

async function initializeDeepSeekManager() {
  try {
    // Check if we're on DeepSeek
    if (!window.location.href.includes('deepseek')) {
      console.log('DeepSeek Manager: Not on DeepSeek, skipping initialization');
      return;
    }
    
    // Initialize manager
    window.deepSeekManager = new DeepSeekManager({
      autoSave: true,
      defaultFormat: 'json',
      storageLimit: constants.CONFIG.DEFAULT_STORAGE_LIMIT,
      enableAnalytics: false
    });
    
    console.log('DeepSeek Manager initialized successfully!');
    
  } catch (error) {
    console.error('Failed to initialize DeepSeek Manager:', error);
  }
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DeepSeekManager,
    ...constants,
    ...helpers
  };
}

console.log('DeepSeek Manager code loaded successfully!');