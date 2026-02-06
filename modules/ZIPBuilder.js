// ============================================
// MODULE 4: ZIP BUILDER
// ============================================

class ZIPBuilder {
  constructor() {
    this.JSZip = null;
    this.isInitialized = false;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load JSZip library dynamically
      if (typeof JSZip === 'undefined') {
        await this._loadJSZip();
      }
      this.JSZip = window.JSZip;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ZIP builder:', error);
      throw error;
    }
  }
  
  async _loadJSZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  async createProjectZIP(options) {
    await this.initialize();
    
    const { chat, analysis, options: zipOptions } = options;
    const zip = new this.JSZip();
    
    // Add project files
    await this._addProjectFiles(zip, analysis.files, zipOptions);
    
    // Generate and add config files if needed
    if (zipOptions.generateConfigs) {
      await this._addConfigFiles(zip, analysis, zipOptions);
    }
    
    // Add chat context if requested
    if (zipOptions.includeChatContext) {
      await this._addChatContext(zip, chat, analysis);
    }
    
    // Add README
    await this._addReadme(zip, chat, analysis, zipOptions);
    
    // Add metadata
    await this._addMetadata(zip, chat, analysis, zipOptions);
    
    // Generate ZIP
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
  }
  
  async _addProjectFiles(zip, files, options) {
    files.forEach(file => {
      let path = file.name;
      
      // Organize files based on type if not flattening
      if (!options.flattenStructure) {
        path = this._organizeFilePath(file, options.projectName);
      }
      
      // Ensure path is within project folder
      if (!path.startsWith(options.projectName + '/')) {
        path = `${options.projectName}/${path}`;
      }
      
      // Add file to ZIP
      zip.file(path, file.content);
    });
  }
  
  _organizeFilePath(file, projectName) {
    const ext = file.extension || '';
    const name = file.name;
    
    // Determine directory based on file type
    if (ext === 'html') {
      return `${projectName}/${name}`;
    } else if (ext === 'css') {
      return `${projectName}/css/${name}`;
    } else if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') {
      return `${projectName}/src/${name}`;
    } else if (ext === 'py') {
      return `${projectName}/src/${name}`;
    } else if (ext === 'json') {
      return `${projectName}/${name}`;
    } else if (name === 'README.md') {
      return `${projectName}/${name}`;
    } else {
      return `${projectName}/${name}`;
    }
  }
  
  async _addConfigFiles(zip, analysis, options) {
    const { projectName, includeDependencies } = options;
    const projectType = analysis.projectType;
    
    // Get config templates
    const configs = this._getConfigTemplates(projectType, projectName, 
      includeDependencies ? analysis.dependencies : []);
    
    // Add each config file
    for (const [filename, content] of Object.entries(configs)) {
      const path = `${projectName}/${filename}`;
      zip.file(path, content);
    }
    
    // Add .gitignore if not already present
    if (!analysis.files.some(f => f.name.includes('.gitignore'))) {
      const gitignore = this._generateGitignore(projectType);
      zip.file(`${projectName}/.gitignore`, gitignore);
    }
  }
  
  _getConfigTemplates(projectType, projectName, dependencies) {
    const templates = {
      node: {
        'package.json': JSON.stringify({
          name: projectName,
          version: '1.0.0',
          description: 'Project generated from DeepSeek conversation',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            test: 'echo "Error: no test specified" && exit 1'
          },
          keywords: ['deepseek', 'generated'],
          author: 'DeepSeek User',
          license: 'MIT',
          dependencies: dependencies.reduce((obj, dep) => {
            obj[dep] = '*';
            return obj;
          }, {})
        }, null, 2)
      },
      
      python: {
        'requirements.txt': dependencies.join('\n') + '\n'
      },
      
      react: {
        'package.json': JSON.stringify({
          name: projectName,
          version: '1.0.0',
          private: true,
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0',
            'react-scripts': '5.0.0',
            ...dependencies.reduce((obj, dep) => {
              obj[dep] = '*';
              return obj;
            }, {})
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject'
          }
        }, null, 2)
      }
    };
    
    return templates[projectType] || {};
  }
  
  _generateGitignore(projectType) {
    const gitignores = {
      node: `node_modules/
.env
.DS_Store
dist/
build/
*.log
`,
      
      python: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.DS_Store
`,
      
      react: `node_modules/
.env
.DS_Store
dist/
build/
*.log
`,
      
      default: `.DS_Store
.env
*.log
`
    };
    
    return gitignores[projectType] || gitignores.default;
  }
  
  async _addChatContext(zip, chat, analysis) {
    const context = {
      source: 'DeepSeek Chat',
      conversationId: chat.id,
      exported: new Date().toISOString(),
      projectType: analysis.projectType,
      analysis: {
        confidence: analysis.confidence,
        languages: analysis.languages,
        dependencies: analysis.dependencies,
        fileCount: analysis.files.length
      },
      originalChat: {
        title: chat.title,
        messageCount: chat.messages?.length || 0,
        url: chat.url,
        timestamp: chat.timestamp
      }
    };
    
    const path = `${analysis.suggestedName || 'project'}/.deepseek-context.json`;
    zip.file(path, JSON.stringify(context, null, 2));
  }
  
  async _addReadme(zip, chat, analysis, options) {
    const projectName = options.projectName || analysis.suggestedName;
    
    const readmeContent = `# ${projectName}

Generated from DeepSeek conversation

## Project Details
- **Source**: DeepSeek Chat
- **Conversation**: ${chat.title || 'Untitled'}
- **Generated**: ${new Date().toISOString().split('T')[0]}
- **Project Type**: ${analysis.projectType || 'Unknown'}
- **Confidence Score**: ${analysis.confidence || 0}%

## Files
${analysis.files.map(f => `- \`${f.name}\` (${f.language}, ${f.lineCount} lines)`).join('\n')}

## How to Use
${this._generateUsageInstructions(analysis.projectType, analysis.files)}

## Dependencies
${analysis.dependencies.length > 0 
  ? analysis.dependencies.map(d => `- ${d}`).join('\n')
  : 'No external dependencies detected'}

## Notes
This project was automatically generated from a DeepSeek conversation.
Original chat context is available in \`.deepseek-context.json\`.

---
*Generated by DeepSeek Manager v1.0.0*
`;
    
    const path = `${projectName}/README.md`;
    zip.file(path, readmeContent);
  }
  
  _generateUsageInstructions(projectType, files) {
    const instructions = {
      web: `1. Open \`index.html\` in your web browser
2. Or, use a local server: \`python -m http.server 8000\`
3. Navigate to http://localhost:8000`,
      
      node: `1. Install dependencies: \`npm install\`
2. Run the application: \`npm start\`
3. Or run directly: \`node index.js\``,
      
      python: `1. Install requirements: \`pip install -r requirements.txt\`
2. Run the script: \`python main.py\` or \`python app.py\``,
      
      react: `1. Install dependencies: \`npm install\`
2. Start development server: \`npm start\`
3. Build for production: \`npm run build\``,
      
      default: `1. Check the files for specific instructions
2. Look for entry points like \`index.js\`, \`main.py\`, or \`index.html\`
3. Install any dependencies mentioned in the files`
    };
    
    return instructions[projectType] || instructions.default;
  }
  
  async _addMetadata(zip, chat, analysis, options) {
    const metadata = {
      generator: 'DeepSeek Manager',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      project: {
        name: options.projectName || analysis.suggestedName,
        type: analysis.projectType,
        fileCount: analysis.files.length,
        languages: analysis.languages,
        dependencies: analysis.dependencies
      },
      source: {
        chatId: chat.id,
        title: chat.title,
        url: chat.url,
        messageCount: chat.messages?.length || 0
      }
    };
    
    const path = `${options.projectName || analysis.suggestedName}/metadata.json`;
    zip.file(path, JSON.stringify(metadata, null, 2));
  }
  
  async downloadZIP(zipBlob, filename) {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  async createSimpleZIP(files, zipName) {
    await this.initialize();
    
    const zip = new this.JSZip();
    
    files.forEach((file, index) => {
      const filename = file.name || `file_${index + 1}.${file.extension || 'txt'}`;
      zip.file(filename, file.content);
    });
    
    // Add manifest
    zip.file('manifest.json', JSON.stringify({
      fileCount: files.length,
      created: new Date().toISOString(),
      source: 'DeepSeek Manager'
    }, null, 2));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await this.downloadZIP(zipBlob, zipName || 'deepseek-files.zip');
  }
}

export default ZIPBuilder;