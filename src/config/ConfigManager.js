const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configFileName = 'payment-flow-analyzer.config.json';
    this.localConfigPath = path.join(process.cwd(), this.configFileName);
    this.globalConfigPath = path.join(os.homedir(), '.config', 'payment-flow-analyzer', this.configFileName);
  }

  async loadConfig() {
    // Try to load local config first, then global config
    const localExists = await fs.pathExists(this.localConfigPath);
    const globalExists = await fs.pathExists(this.globalConfigPath);

    let config = this.getDefaultConfig();

    if (globalExists) {
      const globalConfig = await fs.readJson(this.globalConfigPath);
      config = { ...config, ...globalConfig };
    }

    if (localExists) {
      const localConfig = await fs.readJson(this.localConfigPath);
      config = { ...config, ...localConfig };
    }

    // Override with environment variables
    config = this.applyEnvironmentOverrides(config);

    return config;
  }

  async createDefaultConfig(isGlobal = false) {
    const config = this.getDefaultConfig();
    const configPath = isGlobal ? this.globalConfigPath : this.localConfigPath;

    // Ensure directory exists
    await fs.ensureDir(path.dirname(configPath));

    // Write config file
    await fs.writeJson(configPath, config, { spaces: 2 });

    return configPath;
  }

  getDefaultConfig() {
    return {
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        openaiApiKey: null,
        anthropicApiKey: null,
        temperature: 0.1,
        maxTokens: 4000
      },
      analysis: {
        patterns: [
          'payment',
          'transaction',
          'billing',
          'checkout',
          'stripe',
          'paypal',
          'subscription',
          'invoice',
          'webhook',
          'refund'
        ],
        excludePaths: [
          'node_modules',
          'dist',
          'build',
          'coverage',
          '.git',
          'tmp',
          'temp'
        ],
        includeTests: false,
        maxFileSize: '100kb',
        supportedLanguages: [
          'javascript',
          'typescript',
          'ruby',
          'python',
          'php',
          'java',
          'go'
        ]
      },
      output: {
        format: 'markdown',
        includeDocumentation: true,
        outputPath: './docs',
        diagramTypes: ['flowchart', 'sequence'],
        showFileReferences: true,
        includeSecurityAnalysis: true
      },
      github: {
        token: null,
        webhookSecret: null,
        autoComment: false,
        createPullRequest: false
      },
      repomix: {
        compress: false,
        style: 'xml',
        removeComments: false,
        removeEmptyLines: false,
        includeGitLogs: false,
        securityCheck: true
      },
      logging: {
        level: 'info',
        verbose: false,
        logFile: null
      }
    };
  }

  applyEnvironmentOverrides(config) {
    // AI Configuration
    if (process.env.OPENAI_API_KEY) {
      config.ai.openaiApiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.ANTHROPIC_API_KEY) {
      config.ai.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env.AI_PROVIDER) {
      config.ai.provider = process.env.AI_PROVIDER;
    }
    if (process.env.AI_MODEL) {
      config.ai.model = process.env.AI_MODEL;
    }

    // GitHub Configuration
    if (process.env.GITHUB_TOKEN) {
      config.github.token = process.env.GITHUB_TOKEN;
    }
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      config.github.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    }

    // Output Configuration
    if (process.env.OUTPUT_FORMAT) {
      config.output.format = process.env.OUTPUT_FORMAT;
    }
    if (process.env.OUTPUT_PATH) {
      config.output.outputPath = process.env.OUTPUT_PATH;
    }

    // Logging Configuration
    if (process.env.LOG_LEVEL) {
      config.logging.level = process.env.LOG_LEVEL;
    }
    if (process.env.VERBOSE === 'true') {
      config.logging.verbose = true;
    }

    return config;
  }

  async saveConfig(config, isGlobal = false) {
    const configPath = isGlobal ? this.globalConfigPath : this.localConfigPath;
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(configPath));
    
    // Write config file
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    return configPath;
  }

  async updateConfig(updates, isGlobal = false) {
    const currentConfig = await this.loadConfig();
    const updatedConfig = this.deepMerge(currentConfig, updates);
    
    return await this.saveConfig(updatedConfig, isGlobal);
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  validateConfig(config) {
    const errors = [];

    // Validate AI configuration
    if (!config.ai.provider) {
      errors.push('AI provider is required');
    }

    if (config.ai.provider === 'openai' && !config.ai.openaiApiKey) {
      errors.push('OpenAI API key is required when using OpenAI provider');
    }

    if (config.ai.provider === 'anthropic' && !config.ai.anthropicApiKey) {
      errors.push('Anthropic API key is required when using Anthropic provider');
    }

    // Validate output configuration
    const validFormats = ['markdown', 'json', 'xml'];
    if (!validFormats.includes(config.output.format)) {
      errors.push(`Invalid output format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Validate diagram types
    const validDiagramTypes = ['flowchart', 'sequence', 'class', 'state'];
    const invalidDiagramTypes = config.output.diagramTypes.filter(
      type => !validDiagramTypes.includes(type)
    );
    if (invalidDiagramTypes.length > 0) {
      errors.push(`Invalid diagram types: ${invalidDiagramTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getConfigSummary() {
    const config = await this.loadConfig();
    const validation = this.validateConfig(config);

    return {
      configPath: await fs.pathExists(this.localConfigPath) ? this.localConfigPath : this.globalConfigPath,
      aiProvider: config.ai.provider,
      model: config.ai.model,
      outputFormat: config.output.format,
      hasApiKey: !!(config.ai.openaiApiKey || config.ai.anthropicApiKey),
      isValid: validation.isValid,
      errors: validation.errors
    };
  }
}

// Export singleton instance and class
const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  loadConfig: () => configManager.loadConfig(),
  createDefaultConfig: (isGlobal) => configManager.createDefaultConfig(isGlobal),
  saveConfig: (config, isGlobal) => configManager.saveConfig(config, isGlobal),
  updateConfig: (updates, isGlobal) => configManager.updateConfig(updates, isGlobal),
  validateConfig: (config) => configManager.validateConfig(config),
  getConfigSummary: () => configManager.getConfigSummary()
};
