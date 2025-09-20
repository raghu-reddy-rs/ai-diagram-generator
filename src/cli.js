#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const inquirer = require('inquirer');

const { version } = require('../package.json');

const program = new Command();

program
  .name('analyzer')
  .description('Simple file analyzer using Gemini CLI for Mermaid diagram generation')
  .version(version);

program
  .command('analyze')
  .description('Analyze files and generate Mermaid diagrams using Gemini CLI')
  .argument('[path]', 'Path to analyze (directory, file, or git repo URL)', '.')
  .option('-p, --prompt <prompt>', 'Custom analysis prompt')
  .option('-o, --output <file>', 'Output file path', 'analysis-output.md')
  .option('--api-key <key>', 'Gemini API key (overrides environment)')
  .option('--model <model>', 'Gemini model to use', 'gemini-pro')
  .option('--clone-dir <dir>', 'Directory to clone repos into', './temp-repos')
  .option('--keep-clone', 'Keep cloned repository after analysis')
  .option('--verbose', 'Enable verbose logging')
  .action(async (targetPath, options) => {
    const spinner = ora('Starting analysis...').start();

    try {
      // Set API key if provided
      if (options.apiKey) {
        process.env.GEMINI_API_KEY = options.apiKey;
      }

      // Validate API key
      if (!process.env.GEMINI_API_KEY) {
        spinner.fail(chalk.red('❌ Gemini API key not found'));
        console.log(chalk.yellow('💡 Set GEMINI_API_KEY environment variable or use --api-key option'));
        process.exit(1);
      }

      let analysisPath = targetPath;
      let isCloned = false;

      // Check if it's a git repository URL
      if (isGitUrl(targetPath)) {
        spinner.text = 'Cloning repository...';
        analysisPath = await cloneRepository(targetPath, options.cloneDir, options.verbose);
        isCloned = true;
        spinner.text = 'Repository cloned, starting analysis...';
      } else {
        // Verify path exists
        if (!await fs.pathExists(targetPath)) {
          throw new Error(`Path does not exist: ${targetPath}`);
        }
      }

      // Get prompt
      const prompt = options.prompt || getDefaultPrompt();

      if (options.verbose) {
        console.log(chalk.blue(`\n🔍 Analyzing: ${analysisPath}`));
        console.log(chalk.gray(`Model: ${options.model}`));
        console.log(chalk.gray(`Prompt: ${prompt.substring(0, 100)}...`));
      }

      spinner.text = 'Running Gemini analysis...';

      // Run Gemini CLI directly on the path
      const result = await runGeminiAnalysis(analysisPath, prompt, options.model, options.verbose);

      spinner.text = 'Saving results...';

      // Save output
      await fs.writeFile(options.output, result);

      // Cleanup cloned repo if needed
      if (isCloned && !options.keepClone) {
        spinner.text = 'Cleaning up...';
        await fs.remove(path.dirname(analysisPath));
      }

      spinner.succeed(chalk.green(`✅ Analysis completed: ${options.output}`));

      // Show summary
      console.log(chalk.blue('\n📊 Analysis Summary:'));
      console.log(`Analysis path: ${analysisPath}`);
      console.log(`Output file: ${options.output}`);
      console.log(`Model used: ${options.model}`);
      if (isCloned) {
        console.log(`Repository: ${targetPath}`);
        console.log(`Cleanup: ${options.keepClone ? 'Kept' : 'Removed'}`);
      }

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
  .command('clone')
  .description('Clone a git repository for analysis')
  .argument('<repo>', 'Git repository URL')
  .option('-d, --dir <directory>', 'Directory to clone into', './temp-repos')
  .option('-b, --branch <branch>', 'Branch to clone')
  .option('--keep', 'Keep the cloned repository')
  .action(async (repo, options) => {
    const spinner = ora('Cloning repository...').start();

    try {
      const clonePath = await cloneRepository(repo, options.dir, true, options.branch);

      spinner.succeed(chalk.green(`✅ Repository cloned: ${clonePath}`));
      console.log(chalk.blue('\n📝 Next steps:'));
      console.log(`1. Run: analyzer analyze "${clonePath}"`);
      console.log('2. Use custom prompts with --prompt option');

    } catch (error) {
      spinner.fail(chalk.red('❌ Clone failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test Gemini CLI connection')
  .option('--api-key <key>', 'Gemini API key to test')
  .action(async (options) => {
    const spinner = ora('Testing Gemini CLI...').start();

    try {
      if (options.apiKey) {
        process.env.GEMINI_API_KEY = options.apiKey;
      }

      if (!process.env.GEMINI_API_KEY) {
        throw new Error('API key not found. Set GEMINI_API_KEY or use --api-key');
      }

      // Test with a simple prompt
      const testResult = await runGeminiAnalysis('.', 'Say "Hello, Gemini CLI is working!" and nothing else.', 'gemini-pro', true);

      spinner.succeed(chalk.green('✅ Gemini CLI test passed'));
      console.log(chalk.blue('🎉 Response:'), testResult.trim());

    } catch (error) {
      spinner.fail(chalk.red('❌ Gemini CLI test failed'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Helper functions
function getDefaultPrompt() {
  return `Analyze this codebase and generate a comprehensive Mermaid diagram that best represents the system architecture, data flow, or component relationships.

Please:
1. Identify the main components, modules, or classes
2. Determine the relationships and dependencies between them
3. Choose the most appropriate Mermaid diagram type (flowchart, sequence, class, etc.)
4. Generate clean, well-structured Mermaid syntax
5. Include a brief explanation of what the diagram represents

Focus on creating a diagram that would be most useful for understanding the codebase structure and flow.`;
}

function isGitUrl(url) {
  const gitUrlPatterns = [
    /^https?:\/\/github\.com\//,
    /^https?:\/\/gitlab\.com\//,
    /^https?:\/\/bitbucket\.org\//,
    /^git@github\.com:/,
    /^git@gitlab\.com:/,
    /^git@bitbucket\.org:/,
    /\.git$/
  ];

  return gitUrlPatterns.some(pattern => pattern.test(url));
}

async function cloneRepository(repoUrl, baseDir, verbose = false, branch = null) {
  // Create unique directory name
  const repoName = path.basename(repoUrl, '.git');
  const timestamp = Date.now();
  const cloneDir = path.join(baseDir, `${repoName}-${timestamp}`);

  await fs.ensureDir(cloneDir);

  return new Promise((resolve, reject) => {
    const args = ['clone'];

    if (branch) {
      args.push('-b', branch);
    }

    args.push(repoUrl, cloneDir);

    if (verbose) {
      console.log(chalk.gray(`Running: git ${args.join(' ')}`));
    }

    const gitProcess = spawn('git', args, {
      stdio: verbose ? 'inherit' : 'pipe'
    });

    gitProcess.on('close', (code) => {
      if (code === 0) {
        resolve(cloneDir);
      } else {
        reject(new Error(`Git clone failed with exit code ${code}`));
      }
    });

    gitProcess.on('error', (error) => {
      reject(new Error(`Failed to run git clone: ${error.message}`));
    });
  });
}

async function runGeminiAnalysis(analysisPath, prompt, model = 'gemini-pro', verbose = false) {
  return new Promise((resolve, reject) => {
    const args = [];

    if (model && model !== 'gemini-pro') {
      args.push('--model', model);
    }

    // Change to the analysis directory and run gemini with the prompt
    args.push(prompt);

    if (verbose) {
      console.log(chalk.gray(`Running: gemini ${args.join(' ')}`));
      console.log(chalk.gray(`Working directory: ${analysisPath}`));
    }

    const geminiProcess = spawn('gemini', args, {
      cwd: analysisPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    geminiProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    geminiProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    geminiProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Gemini CLI failed with exit code ${code}: ${stderr}`));
      }
    });

    geminiProcess.on('error', (error) => {
      reject(new Error(`Failed to run Gemini CLI: ${error.message}`));
    });
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

program.parse();
