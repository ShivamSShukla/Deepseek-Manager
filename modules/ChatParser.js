// ============================================
// MODULE 2: CHAT PARSER
// ============================================

class ChatParser {
  constructor() {
    this.selectors = {
      chatContainer: '[class*="chat"], [class*="conversation"], .messages-container',
      message: '[class*="message"], [class*="chat-message"]',
      userMessage: '[class*="user"], [class*="human"]',
      assistantMessage: '[class*="assistant"], [class*="ai"], [class*="bot"]',
      messageContent: '[class*="content"], [class*="text"], .prose',
      codeBlock: 'pre, code, [class*="code"], [class*="block"]',
      timestamp: '[class*="time"], [class*="timestamp"], time',
      avatar: '[class*="avatar"], [class*="icon"], img[alt*="avatar"]'
    };
    
    this.messageCache = new Map();
    this.lastParseTime = 0;
    this.parseThrottle = 1000; // ms
  }
  
  extractCurrentChat() {
    const now = Date.now();
    if (now - this.lastParseTime < this.parseThrottle) {
      return this.messageCache.get('current');
    }
    
    try {
      const chatData = this._parseChatFromDOM();
      this.messageCache.set('current', chatData);
      this.lastParseTime = now;
      return chatData;
    } catch (error) {
      console.warn('Chat parsing error:', error);
      return null;
    }
  }
  
  _parseChatFromDOM() {
    // Find chat container
    const chatContainer = this._findChatContainer();
    if (!chatContainer) {
      throw new Error('Chat container not found');
    }
    
    // Extract messages
    const messageElements = chatContainer.querySelectorAll(this.selectors.message);
    const messages = [];
    
    messageElements.forEach((el, index) => {
      const message = this._parseMessageElement(el, index);
      if (message) {
        messages.push(message);
      }
    });
    
    // Extract metadata
    const metadata = this._extractMetadata(chatContainer);
    
    // Generate chat ID
    const chatId = this._generateChatId(messages, metadata);
    
    return {
      id: chatId,
      title: metadata.title || `Chat ${new Date().toLocaleDateString()}`,
      messages,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      hasCodeBlocks: messages.some(m => m.codeBlocks && m.codeBlocks.length > 0),
      messageCount: messages.length
    };
  }
  
  _findChatContainer() {
    // Try multiple selectors
    for (const selector of Object.values(this.selectors).slice(0, 3)) {
      const element = document.querySelector(selector);
      if (element) {
        return element.closest('div') || element;
      }
    }
    
    // Fallback: find element with many messages
    const allDivs = document.querySelectorAll('div');
    let maxMessages = 0;
    let bestContainer = null;
    
    allDivs.forEach(div => {
      const messages = div.querySelectorAll(this.selectors.message);
      if (messages.length > maxMessages) {
        maxMessages = messages.length;
        bestContainer = div;
      }
    });
    
    return bestContainer;
  }
  
  _parseMessageElement(element, index) {
    try {
      // Determine role
      const isUser = element.matches(this.selectors.userMessage) || 
                    element.getAttribute('data-role') === 'user' ||
                    element.innerText.includes('You:') ||
                    element.querySelector(this.selectors.avatar)?.alt?.includes('user');
      
      const isAssistant = !isUser && (
        element.matches(this.selectors.assistantMessage) ||
        element.getAttribute('data-role') === 'assistant' ||
        element.innerText.includes('Assistant:') ||
        element.querySelector(this.selectors.avatar)?.alt?.includes('assistant')
      );
      
      if (!isUser && !isAssistant) {
        return null;
      }
      
      // Extract content
      const contentElement = element.querySelector(this.selectors.messageContent) || element;
      const rawContent = contentElement.innerText || contentElement.textContent || '';
      
      // Clean content
      const content = this._cleanMessageContent(rawContent);
      
      // Extract code blocks
      const codeBlocks = this._extractCodeBlocks(contentElement);
      
      // Extract timestamp
      const timestamp = this._extractTimestamp(element);
      
      // Extract images
      const images = this._extractImages(element);
      
      return {
        id: `msg_${index}_${Date.now()}`,
        role: isUser ? 'user' : 'assistant',
        content: content,
        rawContent: rawContent,
        codeBlocks: codeBlocks,
        images: images,
        timestamp: timestamp,
        elementIndex: index,
        hasCode: codeBlocks.length > 0,
        hasImages: images.length > 0
      };
    } catch (error) {
      console.warn('Failed to parse message:', error, element);
      return null;
    }
  }
  
  _cleanMessageContent(content) {
    return content
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }
  
  _extractCodeBlocks(element) {
    const codeElements = element.querySelectorAll(this.selectors.codeBlock);
    const codeBlocks = [];
    
    codeElements.forEach((codeEl, index) => {
      const code = codeEl.textContent || '';
      if (code.trim().length > 0) {
        // Try to detect language
        const language = this._detectLanguage(code, codeEl);
        
        codeBlocks.push({
          id: `code_${index}_${Date.now()}`,
          code: code,
          language: language,
          element: codeEl.outerHTML,
          lineCount: code.split('\n').length,
          charCount: code.length
        });
      }
    });
    
    // Also look for inline code marked with backticks
    const text = element.textContent || '';
    const inlineCodeMatches = text.match(/`([^`]+)`/g) || [];
    inlineCodeMatches.forEach((match, index) => {
      const code = match.replace(/`/g, '');
      codeBlocks.push({
        id: `inline_${index}_${Date.now()}`,
        code: code,
        language: 'text',
        isInline: true
      });
    });
    
    return codeBlocks;
  }
  
  _detectLanguage(code, element) {
    // Check for language class
    const className = element.className || '';
    const langMatch = className.match(/language-(\w+)/);
    if (langMatch) return langMatch[1];
    
    // Check for data-language attribute
    const dataLang = element.getAttribute('data-language');
    if (dataLang) return dataLang;
    
    // Heuristic detection
    const firstLine = code.split('\n')[0].toLowerCase();
    
    const langPatterns = {
      javascript: ['function', 'const ', 'let ', 'var ', '=>', 'console.', 'import ', 'export '],
      python: ['def ', 'import ', 'from ', 'class ', 'print(', 'if __name__'],
      html: ['<!doctype', '<html', '<body', '<div', '<span', '<p>'],
      css: ['{', '}', ':', ';', 'color:', 'font-'],
      java: ['public class', 'void main', 'System.out'],
      cpp: ['#include', 'using namespace', 'cout <<'],
      php: ['<?php', 'echo ', '$_'],
      sql: ['SELECT ', 'FROM ', 'WHERE ', 'INSERT INTO'],
      bash: ['#!/bin/', 'echo ', 'cd ', 'mkdir ', 'cp ', 'mv '],
      json: ['{', '}', '"', ':'],
      markdown: ['# ', '## ', '```', '|', '---']
    };
    
    for (const [lang, patterns] of Object.entries(langPatterns)) {
      if (patterns.some(pattern => firstLine.includes(pattern))) {
        return lang;
      }
    }
    
    return 'text';
  }
  
  _extractTimestamp(element) {
    const timeElement = element.querySelector(this.selectors.timestamp);
    if (timeElement) {
      const timeText = timeElement.textContent || timeElement.getAttribute('datetime');
      if (timeText) {
        try {
          return new Date(timeText).toISOString();
        } catch (e) {
          // Try to parse relative time
          return this._parseRelativeTime(timeText);
        }
      }
    }
    
    // Fallback to current time with offset based on position
    const now = new Date();
    const offset = element.elementIndex || 0;
    now.setMinutes(now.getMinutes() - offset);
    return now.toISOString();
  }
  
  _parseRelativeTime(text) {
    const now = new Date();
    const lower = text.toLowerCase();
    
    if (lower.includes('just now') || lower.includes('a few seconds')) {
      return now.toISOString();
    }
    
    if (lower.includes('minute')) {
      const match = text.match(/(\d+)/);
      const minutes = match ? parseInt(match[1]) : 1;
      now.setMinutes(now.getMinutes() - minutes);
      return now.toISOString();
    }
    
    if (lower.includes('hour')) {
      const match = text.match(/(\d+)/);
      const hours = match ? parseInt(match[1]) : 1;
      now.setHours(now.getHours() - hours);
      return now.toISOString();
    }
    
    return now.toISOString();
  }
  
  _extractImages(element) {
    const images = [];
    const imgElements = element.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      const src = img.src || img.getAttribute('data-src');
      if (src && !src.startsWith('data:')) { // Skip data URIs for now
        images.push({
          id: `img_${index}_${Date.now()}`,
          src: src,
          alt: img.alt || '',
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      }
    });
    
    return images;
  }
  
  _extractMetadata(container) {
    const metadata = {
      title: document.title.replace(' - DeepSeek', '').replace('DeepSeek - ', ''),
      url: window.location.href,
      parsedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
    
    // Try to find conversation title
    const titleElements = container.querySelectorAll('h1, h2, h3, [class*="title"], [class*="heading"]');
    for (const el of titleElements) {
      const text = el.textContent.trim();
      if (text && text.length > 5 && text.length < 100) {
        metadata.conversationTitle = text;
        break;
      }
    }
    
    return metadata;
  }
  
  _generateChatId(messages, metadata) {
    if (messages.length === 0) {
      return `chat_${Date.now()}`;
    }
    
    // Create hash from first and last message
    const hashContent = messages.length > 2 
      ? messages[0].content + messages[messages.length - 1].content
      : messages.map(m => m.content).join('');
    
    const hash = this._simpleHash(hashContent);
    return `chat_${metadata.title?.replace(/\s+/g, '_').toLowerCase() || 'untitled'}_${hash}`;
  }
  
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
  
  async enhanceChatData(chat) {
    // Add additional analysis
    const enhanced = { ...chat };
    
    // Count statistics
    enhanced.stats = {
      userMessages: chat.messages.filter(m => m.role === 'user').length,
      assistantMessages: chat.messages.filter(m => m.role === 'assistant').length,
      totalWords: chat.messages.reduce((sum, m) => sum + (m.content.split(/\s+/).length), 0),
      totalChars: chat.messages.reduce((sum, m) => sum + m.content.length, 0),
      codeBlocks: chat.messages.reduce((sum, m) => sum + (m.codeBlocks?.length || 0), 0),
      images: chat.messages.reduce((sum, m) => sum + (m.images?.length || 0), 0)
    };
    
    // Extract topics
    enhanced.topics = this._extractTopics(chat.messages);
    
    // Extract potential project info
    enhanced.projectInfo = this._detectProjectInfo(chat.messages);
    
    // Calculate duration
    if (chat.messages.length > 1) {
      const firstTime = new Date(chat.messages[0].timestamp);
      const lastTime = new Date(chat.messages[chat.messages.length - 1].timestamp);
      enhanced.duration = lastTime - firstTime;
    }
    
    return enhanced;
  }
  
  _extractTopics(messages) {
    const topics = new Set();
    const keywords = [
      'react', 'vue', 'angular', 'javascript', 'python', 'java', 'c++', 'html', 'css',
      'node', 'express', 'database', 'api', 'backend', 'frontend', 'mobile', 'web',
      'machine learning', 'ai', 'data', 'algorithm', 'debug', 'error', 'fix',
      'tutorial', 'example', 'code', 'project', 'app', 'application'
    ];
    
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    
    keywords.forEach(keyword => {
      if (allText.includes(keyword.toLowerCase())) {
        topics.add(keyword);
      }
    });
    
    return Array.from(topics);
  }
  
  _detectProjectInfo(messages) {
    const info = {
      isProject: false,
      type: null,
      languages: new Set(),
      files: [],
      dependencies: new Set()
    };
    
    // Check for project indicators
    const projectIndicators = [
      'project', 'app', 'application', 'website', 'program',
      'build a', 'create a', 'develop a', 'make a'
    ];
    
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    
    // Check if this looks like a project discussion
    if (projectIndicators.some(indicator => allText.includes(indicator))) {
      info.isProject = true;
    }
    
    // Extract languages from code blocks
    messages.forEach(message => {
      (message.codeBlocks || []).forEach(block => {
        if (block.language && block.language !== 'text') {
          info.languages.add(block.language);
        }
      });
    });
    
    // Check for file mentions
    const filePattern = /(?:file|filename|create)\s+(?:called\s+)?(['"]?)([\w\-./]+\.\w+)\1/gi;
    messages.forEach(message => {
      const matches = [...message.content.matchAll(filePattern)];
      matches.forEach(match => {
        info.files.push(match[2]);
      });
    });
    
    // Check for dependencies
    const depPatterns = [
      /npm install (\S+)/gi,
      /pip install (\S+)/gi,
      /yarn add (\S+)/gi,
      /import (\S+)/gi,
      /require\(['"](\S+)['"]\)/gi,
      /from (\S+) import/gi
    ];
    
    messages.forEach(message => {
      depPatterns.forEach(pattern => {
        const matches = [...message.content.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1] && !match[1].includes('.') && match[1].length < 50) {
            info.dependencies.add(match[1].replace(/['"]/g, ''));
          }
        });
      });
    });
    
    return {
      ...info,
      languages: Array.from(info.languages),
      dependencies: Array.from(info.dependencies)
    };
  }
}

export default ChatParser;