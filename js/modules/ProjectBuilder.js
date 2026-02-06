// ============================================
// MODULE 3: PROJECT BUILDER
// ============================================

class ProjectBuilder {
  constructor() {
    this.projectTypes = {
      web: ['html', 'css', 'javascript', 'react', 'vue', 'angular'],
      node: ['javascript', 'typescript', 'node'],
      python: ['python'],
      data: ['python', 'r', 'jupyter'],
      mobile: ['javascript', 'typescript', 'dart', 'kotlin', 'swift'],
      api: ['javascript', 'python', 'java', 'php']
    };
    
    this.configTemplates = {
      node: {
        'package.json': (name, deps) => JSON.stringify({
          name: name || 'deepseek-project',
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
          dependencies: deps.reduce((obj, dep) => {
            obj[dep] = 'latest';
            return obj;
          }, {})
        }, null, 2),
        
        '.gitignore': () => `node_modules/
.env
.DS_Store
dist/
build/
*.log
`
      },
      
      python: {
        'requirements.txt': (deps) => deps.join('\n'),
        
        '.gitignore': () => `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.DS_Store
`
      },
      
      react: {
        'package.json': (name, deps) => JSON.stringify({
          name: name || 'deepseek-react-app',
          version: '1.0.0',
          private: true,
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0',
            'react-scripts': '5.0.0',
            ...deps.reduce((obj, dep) => {
              obj[dep] = 'latest';
              return obj;
            }, {})
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test',
            eject: 'react-scripts eject'
          },
          browserslist: {
            production: ['>0.2%', 'not dead', 'not op_mini all'],
            development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
          }
        }, null, 2)
      }
    };
  }
  
  async analyzeConversation(chat) {
    const analysis = {
      isCompleteProject: false,
      projectType: null,
      suggestedName: this._suggestProjectName(chat),
      files: [],
      dependencies: new Set(),
      languages: new Set(),
      missingFiles: [],
      structure: {},
      confidence: 0
    };
    
    // Extract all code blocks
    const allCodeBlocks = [];
    chat.messages.forEach((msg, msgIndex) => {
      (msg.codeBlocks || []).forEach((block, blockIndex) => {
        allCodeBlocks.push({
          ...block,
          messageIndex: msgIndex,
          blockIndex: blockIndex,
          role: msg.role
        });
      });
    });
    
    if (allCodeBlocks.length === 0) {
      return analysis;
    }
    
    // Analyze code blocks
    analysis.files = this._extractFilesFromCodeBlocks(allCodeBlocks);
    
    // Detect languages
    analysis.files.forEach(file => {
      analysis.languages.add(file.language);
    });
    
    // Detect dependencies
    analysis.files.forEach(file => {
      const deps = this._extractDependencies(file.code, file.language);
      deps.forEach(dep => analysis.dependencies.add(dep));
    });
    
    // Determine project type
    analysis.projectType = this._determineProjectType(
      Array.from(analysis.languages),
      analysis.files,
      chat.messages
    );
    
    // Check if it's a complete project
    analysis.isCompleteProject = this._isCompleteProject(
      analysis.projectType,
      analysis.files
    );
    
    // Calculate confidence score
    analysis.confidence = this._calculateConfidence(analysis);
    
    // Suggest missing files
    if (analysis.isCompleteProject) {
      analysis.missingFiles = this._identifyMissingFiles(
        analysis.projectType,
        analysis.files
      );
      
      // Generate suggested structure
      analysis.structure = this._generateStructure(
        analysis.projectType,
        analysis.files,
        analysis.suggestedName
      );
    }
    
    // Convert Sets to Arrays
    analysis.dependencies = Array.from(analysis.dependencies);
    analysis.languages = Array.from(analysis.languages);
    
    return analysis;
  }
  
  _extractFilesFromCodeBlocks(codeBlocks) {
    const files = [];
    
    codeBlocks.forEach((block, index) => {
      // Try to extract filename from comments or context
      const filename = this._extractFilename(block, index);
      
      // Determine file type
      const fileType = this._determineFileType(block.language, filename);
      
      // Determine appropriate extension
      const extension = this._getExtension(block.language, fileType);
      
      // Create file object
      files.push({
        id: `file_${index}_${Date.now()}`,
        name: filename || `file_${index + 1}.${extension}`,
        content: block.code,
        language: block.language,
        extension: extension,
        type: fileType,
        lineCount: block.lineCount || block.code.split('\n').length,
        charCount: block.charCount || block.code.length,
        source: block.role,
        originalBlock: block
      });
    });
    
    return files;
  }
  
  _extractFilename(block, index) {
    const code = block.code;
    
    // Look for filename in comments
    const commentPatterns = [
      /\/\/\s*File:\s*([\w\-./]+)/i,
      /#\s*File:\s*([\w\-./]+)/i,
      /\/\*\s*File:\s*([\w\-./]+)/i,
      /<!--\s*File:\s*([\w\-./]+)/i,
      /@file\s+([\w\-./]+)/i,
      /@filename\s+([\w\-./]+)/i
    ];
    
    for (const pattern of commentPatterns) {
      const match = code.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Look for import/export statements that might indicate filename
    const importPatterns = [
      /from\s+['"]([\w\-./]+)['"]/g,
      /import\s+['"]([\w\-./]+)['"]/g,
      /require\(['"]([\w\-./]+)['"]\)/g
    ];
    
    for (const pattern of importPatterns) {
      const matches = [...code.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].includes('.') && !match[1].startsWith('.')) {
          return match[1];
        }
      }
    }
    
    // Default naming based on language and index
    const lang = block.language;
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      java: 'java',
      cpp: 'cpp',
      php: 'php',
      sql: 'sql',
      json: 'json',
      markdown: 'md',
      text: 'txt'
    };
    
    const ext = extensions[lang] || 'txt';
    return `file_${index + 1}.${ext}`;
  }
  
  _determineFileType(language, filename) {
    if (filename) {
      if (filename.endsWith('.html')) return 'html';
      if (filename.endsWith('.css')) return 'css';
      if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'javascript';
      if (filename.endsWith('.py')) return 'python';
      if (filename.endsWith('.json')) return 'json';
      if (filename.endsWith('.md')) return 'markdown';
    }
    
    return language || 'text';
  }
  
  _getExtension(language, fileType) {
    const extensions = {
      javascript: 'js',
      jsx: 'jsx',
      typescript: 'ts',
      tsx: 'tsx',
      python: 'py',
      html: 'html',
      css: 'css',
      java: 'java',
      cpp: 'cpp',
      php: 'php',
      sql: 'sql',
      json: 'json',
      markdown: 'md',
      text: 'txt',
      yaml: 'yml',
      xml: 'xml',
      csv: 'csv'
    };
    
    return extensions[fileType] || extensions[language] || 'txt';
  }
  
  _extractDependencies(code, language) {
    const dependencies = new Set();
    
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        // Look for import statements
        const jsImports = code.matchAll(/from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g);
        for (const match of jsImports) {
          const dep = match[1] || match[2];
          if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
            dependencies.add(dep.split('/')[0]);
          }
        }
        
        // Look for require statements
        const requires = code.matchAll(/require\(['"]([^'"]+)['"]\)/g);
        for (const match of requires) {
          const dep = match[1];
          if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
            dependencies.add(dep.split('/')[0]);
          }
        }
        break;
        
      case 'python':
        // Look for import statements
        const pyImports = code.matchAll(/^(?:import|from)\s+(\S+)/gm);
        for (const match of pyImports) {
          const dep = match[1].split('.')[0];
          if (dep && dep !== 'sys' && dep !== 'os' && dep !== 'json') {
            dependencies.add(dep);
          }
        }
        break;
        
      case 'java':
        // Look for import statements
        const javaImports = code.matchAll(/import\s+([\w.]+);/g);
        for (const match of javaImports) {
          const dep = match[1];
          if (dep && !dep.startsWith('java.')) {
            dependencies.add(dep.split('.')[0]);
          }
        }
        break;
    }
    
    return Array.from(dependencies);
  }
  
  _determineProjectType(languages, files, messages) {
    // Check for specific project types
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');
    
    // React project
    if (languages.includes('jsx') || 
        files.some(f => f.name.includes('.jsx') || f.content.includes('React.create'))) {
      return 'react';
    }
    
    // Node.js project
    if (languages.includes('javascript') && 
        (files.some(f => f.content.includes('require(')) ||
         files.some(f => f.content.includes('exports')))) {
      return 'node';
    }
    
    // Python project
    if (languages.includes('python')) {
      if (allText.includes('flask') || files.some(f => f.content.includes('Flask'))) {
        return 'flask';
      }
      if (allText.includes('django') || files.some(f => f.content.includes('django'))) {
        return 'django';
      }
      return 'python';
    }
    
    // Web project (HTML/CSS/JS)
    if (languages.some(lang => ['html', 'css', 'javascript'].includes(lang))) {
      return 'web';
    }
    
    // Default to first language
    return languages[0] || 'unknown';
  }
  
  _isCompleteProject(projectType, files) {
    const minFilesByType = {
      web: 2, // At least HTML + CSS or HTML + JS
      react: 2, // At least one component + index.js
      node: 1, // Just need package.json or index.js
      python: 1, // Just need main.py
      flask: 2, // app.py + requirements.txt
      django: 3 // More complex structure
    };
    
    const minFiles = minFilesByType[projectType] || 1;
    
    // Check if we have enough files
    if (files.length < minFiles) {
      return false;
    }
    
    // Check for entry point
    const hasEntryPoint = files.some(file => 
      file.name === 'index.html' || 
      file.name === 'app.js' || 
      file.name === 'index.js' || 
      file.name === 'main.py' ||
      file.name === 'app.py'
    );
    
    return hasEntryPoint || files.length >= 3;
  }
  
  _calculateConfidence(analysis) {
    let confidence = 0;
    
    // More files = higher confidence
    confidence += Math.min(analysis.files.length * 10, 30);
    
    // Has dependencies = more complete
    if (analysis.dependencies.length > 0) confidence += 20;
    
    // Multiple languages = more complex project
    if (analysis.languages.length > 1) confidence += 15;
    
    // Has entry point file
    const hasEntry = analysis.files.some(f => 
      ['index.html', 'app.js', 'index.js', 'main.py', 'app.py'].includes(f.name)
    );
    if (hasEntry) confidence += 25;
    
    // Has configuration files
    const hasConfig = analysis.files.some(f => 
      f.name.includes('package.json') || 
      f.name.includes('requirements.txt') ||
      f.name.includes('.gitignore')
    );
    if (hasConfig) confidence += 20;
    
    return Math.min(confidence, 100);
  }
  
  _identifyMissingFiles(projectType, existingFiles) {
    const missing = [];
    const existingNames = existingFiles.map(f => f.name.toLowerCase());
    
    const requiredFiles = {
      web: ['index.html', 'style.css', 'app.js'],
      react: ['package.json', 'src/App.js', 'src/index.js', 'public/index.html'],
      node: ['package.json', 'index.js', '.gitignore'],
      python: ['requirements.txt', 'main.py', '.gitignore'],
      flask: ['requirements.txt', 'app.py', 'templates/', 'static/']
    };
    
    const requirements = requiredFiles[projectType] || [];
    
    requirements.forEach(req => {
      if (!existingNames.some(name => name.includes(req.replace('/', '').replace('.', '')))) {
        missing.push(req);
      }
    });
    
    return missing;
  }
  
  _generateStructure(projectType, files, projectName) {
    const structure = {
      name: projectName,
      type: projectType,
      root: {},
      suggestedLayout: []
    };
    
    // Group files by type/directory
    files.forEach(file => {
      let path = file.name;
      
      // Put in appropriate directory based on file type
      if (file.extension === 'html') {
        structure.root[path] = file;
        structure.suggestedLayout.push(`/${path}`);
      } else if (file.extension === 'css') {
        structure.root[path] = file;
        structure.suggestedLayout.push(`/css/${path}`);
      } else if (file.extension === 'js') {
        structure.root[path] = file;
        structure.suggestedLayout.push(`/js/${path}`);
      } else if (file.extension === 'py') {
        structure.root[path] = file;
        structure.suggestedLayout.push(`/src/${path}`);
      } else {
        structure.root[path] = file;
        structure.suggestedLayout.push(`/${path}`);
      }
    });
    
    return structure;
  }
  
  _suggestProjectName(chat) {
    // Try to extract project name from chat
    const title = chat.title || '';
    const messages = chat.messages || [];
    
    // Look for project name in first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.toLowerCase();
      const patterns = [
        /(?:build|create|make|develop)\s+(?:a|an)?\s+([\w\s]+?)(?:\s+(?:project|app|application|website|program))/i,
        /project\s+(?:called|named)\s+['"]?([\w\s]+)['"]?/i,
        /create\s+['"]?([\w\s]+)['"]?/i
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/gi, '')
            .toLowerCase();
          if (name.length > 2) {
            return name;
          }
        }
      }
    }
    
    // Fallback names
    const fallbacks = [
      `deepseek-${title.replace(/\s+/g, '-').toLowerCase()}`,
      `chat-${chat.id.split('_')[1] || 'project'}`,
      `deepseek-project-${new Date().toISOString().split('T')[0]}`
    ];
    
    return fallbacks.find(name => name.length > 5) || 'deepseek-project';
  }
  
  async getStats() {
    // Return project analysis statistics
    return {
      totalAnalyzed: 0, // Would be tracked in real implementation
      projectTypes: Object.keys(this.projectTypes),
      configTemplates: Object.keys(this.configTemplates)
    };
  }
  
  generateConfigFiles(projectType, projectName, dependencies) {
    const templates = this.configTemplates[projectType];
    if (!templates) return {};
    
    const configs = {};
    
    for (const [filename, generator] of Object.entries(templates)) {
      configs[filename] = generator(projectName, dependencies);
    }
    
    return configs;
  }
}

export default ProjectBuilder;