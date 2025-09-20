#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const { runCli } = require('repomix');
const PaymentFlowAnalyzer = require('../core/PaymentFlowAnalyzer');
const MermaidGenerator = require('../core/MermaidGenerator');
const { loadConfig, createDefaultConfig } = require('../config/ConfigManager');

const program = new Command();

program
  .name('payment-flow-analyzer')
  .description('AI-powered payment flow analysis and Mermaid diagram generation')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze payment flows in a codebase and generate Mermaid diagrams')
  .argument('[path]', 'Path to analyze (local directory or GitHub URL)', '.')
  .option('-o, --output <file>', 'Output file for the analysis', 'payment-flows.md')
  .option('-f, --format <format>', 'Output format (markdown, json, xml)', 'markdown')
  .option('--ai-provider <provider>', 'AI provider (openai, anthropic)', 'openai')
  .option('--model <model>', 'AI model to use', 'gpt-4')
  .option('--include <patterns>', 'Include patterns (comma-separated)')
  .option('--exclude <patterns>', 'Exclude patterns (comma-separated)')
  .option('--compress', 'Use Repomix compression to reduce token count')
  .option('--github-token <token>', 'GitHub token for private repositories')
  .option('--verbose', 'Enable verbose logging')
  .option('--demo', 'Run in demo mode (no AI calls, shows what would be analyzed)')
  .action(async (targetPath, options) => {
    const spinner = ora('Starting payment flow analysis...').start();
    
    try {
      // Load configuration
      const config = await loadConfig();
      
      // Merge CLI options with config
      const analysisConfig = {
        ...config,
        aiProvider: options.aiProvider || config.ai?.provider || 'openai',
        model: options.model || config.ai?.model || 'gpt-4',
        outputFormat: options.format,
        outputFile: options.output,
        verbose: options.verbose || false,
        compress: options.compress || false,
        demo: options.demo || false,
        include: options.include ? options.include.split(',') : config.include || [],
        exclude: options.exclude ? options.exclude.split(',') : config.ignore?.customPatterns || [],
        githubToken: options.githubToken || config.github?.token || process.env.GITHUB_TOKEN
      };

      spinner.text = 'Packing codebase with Repomix...';
      
      // Step 1: Use Repomix to pack the codebase
      const repomixOptions = {
        output: 'temp-repomix-output.xml',
        style: 'xml',
        compress: analysisConfig.compress,
        include: analysisConfig.include.length > 0 ? analysisConfig.include.join(',') : undefined,
        ignore: analysisConfig.exclude.length > 0 ? analysisConfig.exclude.join(',') : undefined,
        quiet: !analysisConfig.verbose
      };

      // Handle remote repositories (only if it looks like a URL)
      if (targetPath.startsWith('http') || (targetPath.includes('/') && !targetPath.startsWith('.'))) {
        repomixOptions.remote = targetPath;
      }

      const repomixResult = await runCli([targetPath], process.cwd(), repomixOptions);

      // Check if the output file was created successfully
      if (!await fs.pathExists('temp-repomix-output.xml')) {
        throw new Error('Repomix failed to create output file');
      }

      spinner.text = 'Analyzing payment flows with AI...';
      
      // Step 2: Read the packed codebase
      const packedCodebase = await fs.readFile('temp-repomix-output.xml', 'utf8');
      
      // Step 3: Analyze payment flows using AI (or demo mode)
      let analysisResult;
      if (analysisConfig.demo) {
        analysisResult = createDemoAnalysis(packedCodebase);
        spinner.text = 'Creating demo analysis (no AI calls)...';
      } else {
        const analyzer = new PaymentFlowAnalyzer(analysisConfig);
        analysisResult = await analyzer.analyzePaymentFlows(packedCodebase);
      }
      
      spinner.text = 'Generating Mermaid diagrams...';
      
      // Step 4: Generate Mermaid diagrams
      const mermaidGenerator = new MermaidGenerator();
      const diagrams = await mermaidGenerator.generateDiagrams(analysisResult);
      
      spinner.text = 'Creating output file...';
      
      // Step 5: Create output file
      const outputContent = await createOutputFile(analysisResult, diagrams, analysisConfig);
      await fs.writeFile(analysisConfig.outputFile, outputContent);
      
      // Clean up temporary file
      await fs.remove('temp-repomix-output.xml');
      
      spinner.succeed(chalk.green(`✅ Analysis complete! Results saved to ${analysisConfig.outputFile}`));
      
      // Display summary
      console.log(chalk.blue('\n📊 Analysis Summary:'));
      console.log(`• Payment flows found: ${analysisResult.flows?.length || 0}`);
      console.log(`• Diagrams generated: ${diagrams?.length || 0}`);
      console.log(`• Output format: ${analysisConfig.outputFormat}`);
      console.log(`• File size: ${(await fs.stat(analysisConfig.outputFile)).size} bytes`);
      
    } catch (error) {
      spinner.fail(chalk.red('❌ Analysis failed'));
      console.error(chalk.red('Error:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize configuration file')
  .option('--global', 'Create global configuration')
  .action(async (options) => {
    const spinner = ora('Creating configuration file...').start();
    
    try {
      const configPath = await createDefaultConfig(options.global);
      spinner.succeed(chalk.green(`✅ Configuration created at ${configPath}`));
      console.log(chalk.blue('\n📝 Next steps:'));
      console.log('1. Edit the configuration file to add your AI API keys');
      console.log('2. Customize analysis patterns and output settings');
      console.log('3. Run: payment-flow-analyzer analyze [path]');
    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to create configuration'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test the analyzer with the tenant-portal-backend')
  .action(async () => {
    const testPath = path.resolve('../tenant-portal-backend');
    
    if (!await fs.pathExists(testPath)) {
      console.error(chalk.red('❌ tenant-portal-backend not found at ../tenant-portal-backend'));
      console.log(chalk.yellow('💡 Make sure the tenant-portal-backend directory exists'));
      process.exit(1);
    }
    
    console.log(chalk.blue('🧪 Testing with tenant-portal-backend...'));
    
    // Run analysis on the test repository
    await program.parseAsync(['node', 'cli.js', 'analyze', testPath, '--verbose']);
  });

// Helper function to create output file
async function createOutputFile(analysisResult, diagrams, config) {
  const timestamp = new Date().toISOString();
  
  if (config.outputFormat === 'json') {
    return JSON.stringify({
      timestamp,
      config: {
        aiProvider: config.aiProvider,
        model: config.model
      },
      analysis: analysisResult,
      diagrams
    }, null, 2);
  }
  
  // Default to Markdown format
  let content = `# Payment Flow Analysis\n\n`;
  content += `**Generated:** ${timestamp}\n`;
  content += `**AI Provider:** ${config.aiProvider}\n`;
  content += `**Model:** ${config.model}\n\n`;
  
  if (analysisResult.summary) {
    content += `## Summary\n\n${analysisResult.summary}\n\n`;
  }
  
  if (diagrams && diagrams.length > 0) {
    content += `## Payment Flow Diagrams\n\n`;
    diagrams.forEach((diagram, index) => {
      content += `### ${diagram.title || `Flow ${index + 1}`}\n\n`;
      if (diagram.description) {
        content += `${diagram.description}\n\n`;
      }
      content += `\`\`\`mermaid\n${diagram.mermaid}\n\`\`\`\n\n`;
    });
  }
  
  if (analysisResult.flows && analysisResult.flows.length > 0) {
    content += `## Detailed Analysis\n\n`;
    analysisResult.flows.forEach((flow, index) => {
      content += `### ${flow.name || `Payment Flow ${index + 1}`}\n\n`;
      content += `**Type:** ${flow.type || 'Unknown'}\n`;
      content += `**Files:** ${flow.files?.join(', ') || 'N/A'}\n\n`;
      if (flow.description) {
        content += `${flow.description}\n\n`;
      }
    });
  }
  
  return content;
}

// Demo analysis function for testing without AI
function createDemoAnalysis(packedCodebase) {
  // Simple pattern matching to simulate AI analysis
  const hasStripe = /stripe/gi.test(packedCodebase);
  const hasPayPal = /paypal/gi.test(packedCodebase);
  const hasPayment = /payment/gi.test(packedCodebase);
  const hasBilling = /billing/gi.test(packedCodebase);
  const hasSubscription = /subscription/gi.test(packedCodebase);

  return {
    summary: `Demo analysis of codebase found ${hasPayment ? 'payment' : 'no payment'} related code. This is a demonstration without AI analysis.`,
    flows: [
      {
        name: 'Demo Payment Flow',
        type: 'checkout',
        description: 'This is a demo flow showing what the analyzer would find',
        files: ['app/controllers/payments_controller.rb', 'app/models/payment.rb'],
        components: ['PaymentController', 'PaymentService', 'StripeService'],
        integrations: hasStripe ? ['stripe'] : [],
        mermaidSuggestion: 'flowchart TD'
      }
    ],
    integrations: {
      stripe: { found: hasStripe, files: ['payment related files'], features: ['payments', 'webhooks'] },
      paypal: { found: hasPayPal, files: [], features: [] }
    },
    security: {
      patterns: ['API key validation', 'HTTPS enforcement'],
      concerns: ['Demo mode - no real security analysis performed']
    }
  };
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

program.parse();
