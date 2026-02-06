// Constants used throughout the DeepSeek Manager

export const CONFIG = {
  VERSION: '1.0.0',
  DEFAULT_STORAGE_LIMIT: 500 * 1024 * 1024, // 500MB
  DEFAULT_AUTO_SAVE: true,
  DEFAULT_FORMAT: 'json',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  CHAT_MONITORING_INTERVAL: 3000, // 3 seconds
  PARSE_THROTTLE: 1000, // 1 second
};

export const SELECTORS = {
  CHAT_CONTAINER: '[class*="chat"], [class*="conversation"], .messages-container',
  MESSAGE: '[class*="message"], [class*="chat-message"]',
  USER_MESSAGE: '[class*="user"], [class*="human"]',
  ASSISTANT_MESSAGE: '[class*="assistant"], [class*="ai"], [class*="bot"]',
  MESSAGE_CONTENT: '[class*="content"], [class*="text"], .prose',
  CODE_BLOCK: 'pre, code, [class*="code"], [class*="block"]',
  TIMESTAMP: '[class*="time"], [class*="timestamp"], time',
  AVATAR: '[class*="avatar"], [class*="icon"], img[alt*="avatar"]'
};

export const DB_CONFIG = {
  NAME: 'DeepSeekManagerDB',
  VERSION: 3,
  STORES: {
    CONVERSATIONS: 'conversations',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings'
  }
};

export const PROJECT_TYPES = {
  WEB: ['html', 'css', 'javascript', 'react', 'vue', 'angular'],
  NODE: ['javascript', 'typescript', 'node'],
  PYTHON: ['python'],
  DATA: ['python', 'r', 'jupyter'],
  MOBILE: ['javascript', 'typescript', 'dart', 'kotlin', 'swift'],
  API: ['javascript', 'python', 'java', 'php']
};

export const EXPORT_FORMATS = {
  JSON: 'json',
  MARKDOWN: 'markdown',
  HTML: 'html',
  PDF: 'pdf',
  TXT: 'txt',
  CSV: 'csv'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};