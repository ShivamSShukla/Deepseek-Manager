// ============================================
// MODULE 5: EXPORT MANAGER
// ============================================

class ExportManager {
  constructor() {
    this.formats = {
      json: this.exportAsJSON.bind(this),
      markdown: this.exportAsMarkdown.bind(this),
      html: this.exportAsHTML.bind(this),
      pdf: this.exportAsPDF.bind(this),
      txt: this.exportAsText.bind(this),
      csv: this.exportAsCSV.bind(this)
    };
    
    this.defaultOptions = {
      includeTimestamps: true,
      includeCodeBlocks: true,
      includeImages: false,
      includeMetadata: true,
      prettify: true
    };
  }
  
  async prepareExport(chat, options = {}) {
    const format = options.format || 'json';
    const exportFunc = this.formats[format];
    
    if (!exportFunc) {
      throw new Error(`Unsupported export format: ${format}`);
    }
    
    const exportOptions = { ...this.defaultOptions, ...options };
    return await exportFunc(chat, exportOptions);
  }
  
  async exportAsJSON(chat, options) {
    const exportData = {
      ...chat,
      exportMetadata: {
        format: 'json',
        exported: new Date().toISOString(),
        version: '1.0',
        options: options
      }
    };
    
    if (options.prettify) {
      return JSON.stringify(exportData, null, 2);
    }
    
    return JSON.stringify(exportData);
  }
  
  async exportAsMarkdown(chat, options) {
    let markdown = `# ${chat.title || 'DeepSeek Conversation'}\n\n`;
    
    if (options.includeMetadata) {
      markdown += `**Date:** ${new Date(chat.timestamp).toLocaleString()}\n`;
      markdown += `**URL:** ${chat.url || 'N/A'}\n\n`;
      markdown += `---\n\n`;
    }
    
    chat.messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'You' : 'DeepSeek';
      const time = options.includeTimestamps && message.timestamp 
        ? ` *(${new Date(message.timestamp).toLocaleTimeString()})*` 
        : '';
      
      markdown += `### ${role}${time}\n\n`;
      markdown += `${message.content}\n\n`;
      
      // Add code blocks
      if (options.includeCodeBlocks && message.codeBlocks && message.codeBlocks.length > 0) {
        message.codeBlocks.forEach((block, blockIndex) => {
          const language = block.language || 'text';
          markdown += `\`\`\`${language}\n`;
          markdown += `${block.code}\n`;
          markdown += '```\n\n';
        });
      }
      
      markdown += `---\n\n`;
    });
    
    if (options.includeMetadata) {
      markdown += `\n*Exported from DeepSeek Manager on ${new Date().toLocaleString()}*`;
    }
    
    return markdown;
  }
  
  async exportAsHTML(chat, options) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chat.title || 'DeepSeek Conversation'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #10a37f;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .message {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
        }
        .user-message {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .assistant-message {
            background: #f3e5f5;
            border-left: 4px solid #9c27b0;
        }
        .role {
            font-weight: bold;
            margin-bottom: 10px;
            color: #555;
        }
        .timestamp {
            font-size: 0.8em;
            color: #888;
            margin-left: 10px;
        }
        .content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${chat.title || 'DeepSeek Conversation'}</h1>
        ${options.includeMetadata ? `
        <p><strong>Date:</strong> ${new Date(chat.timestamp).toLocaleString()}</p>
        <p><strong>URL:</strong> ${chat.url || 'N/A'}</p>
        <p><strong>Messages:</strong> ${chat.messages?.length || 0}</p>
        ` : ''}
    </div>
    
    <div class="messages">
        ${chat.messages.map((message, index) => `
        <div class="message ${message.role}-message">
            <div class="role">
                ${message.role === 'user' ? 'You' : 'DeepSeek'}
                ${options.includeTimestamps && message.timestamp ? 
                  `<span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>` : ''}
            </div>
            <div class="content">${this._escapeHTML(message.content)}</div>
            ${options.includeCodeBlocks && message.codeBlocks && message.codeBlocks.length > 0 ? 
              message.codeBlocks.map(block => `
              <pre><code class="language-${block.language || 'text'}">${this._escapeHTML(block.code)}</code></pre>
              `).join('') : ''}
        </div>
        `).join('')}
    </div>
    
    ${options.includeMetadata ? `
    <div class="footer">
        <p>Exported from DeepSeek Manager on ${new Date().toLocaleString()}</p>
        <p>DeepSeek Manager v1.0.0</p>
    </div>
    ` : ''}
</body>
</html>`;
    
    return html;
  }
  
  async exportAsPDF(chat, options) {
    // Note: In browser, we can't generate PDF directly without a library
    // For now, return HTML that can be printed as PDF
    return await this.exportAsHTML(chat, options);
  }
  
  async exportAsText(chat, options) {
    let text = `${chat.title || 'DeepSeek Conversation'}\n`;
    text += '='.repeat(chat.title?.length || 20) + '\n\n';
    
    if (options.includeMetadata) {
      text += `Date: ${new Date(chat.timestamp).toLocaleString()}\n`;
      text += `URL: ${chat.url || 'N/A'}\n`;
      text += `Messages: ${chat.messages?.length || 0}\n\n`;
      text += '-'.repeat(50) + '\n\n';
    }
    
    chat.messages.forEach((message, index) => {
      const role = message.role === 'user' ? '[You]' : '[DeepSeek]';
      const time = options.includeTimestamps && message.timestamp 
        ? ` (${new Date(message.timestamp).toLocaleTimeString()})` 
        : '';
      
      text += `${role}${time}\n`;
      text += '-'.repeat(role.length + (time?.length || 0)) + '\n';
      text += message.content + '\n\n';
      
      // Add code blocks
      if (options.includeCodeBlocks && message.codeBlocks && message.codeBlocks.length > 0) {
        message.codeBlocks.forEach((block, blockIndex) => {
          const language = block.language || 'text';
          text += `[Code Block: ${language}]\n`;
          text += '-'.repeat(15 + language.length) + '\n';
          text += block.code + '\n\n';
        });
      }
      
      text += '\n';
    });
    
    if (options.includeMetadata) {
      text += `\nExported from DeepSeek Manager on ${new Date().toLocaleString()}`;
    }
    
    return text;
  }
  
  async exportAsCSV(chat, options) {
    let csv = 'Role,Timestamp,Content,Code Blocks\n';
    
    chat.messages.forEach(message => {
      const role = message.role;
      const timestamp = options.includeTimestamps ? 
        `"${new Date(message.timestamp).toISOString()}"` : '';
      
      // Escape content for CSV
      const content = this._escapeCSV(message.content);
      
      // Extract code blocks
      const codeBlocks = options.includeCodeBlocks && message.codeBlocks ? 
        message.codeBlocks.map(b => b.language).join('; ') : '';
      
      csv += `${role},${timestamp},"${content}","${codeBlocks}"\n`;
    });
    
    return csv;
  }
  
  generateFilename(chat, format) {
    const title = chat.title || 'conversation';
    const safeTitle = title
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 50);
    
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    
    const extensions = {
      json: 'json',
      markdown: 'md',
      html: 'html',
      pdf: 'pdf',
      txt: 'txt',
      csv: 'csv'
    };
    
    const ext = extensions[format] || 'txt';
    
    return `deepseek_${safeTitle}_${date}_${timestamp}.${ext}`;
  }
  
  async download(content, filename, mimeType = null) {
    // Determine MIME type
    if (!mimeType) {
      const extension = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        json: 'application/json',
        md: 'text/markdown',
        html: 'text/html',
        pdf: 'application/pdf',
        txt: 'text/plain',
        csv: 'text/csv'
      };
      mimeType = mimeTypes[extension] || 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  _escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  _escapeCSV(text) {
    return text
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ');
  }
}

export default ExportManager;