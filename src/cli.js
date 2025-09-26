#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const { spawn, execSync } = require('child_process');
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
  .option('-o, --output <file>', 'Output file path', getDefaultOutputPath())
  .option('--api-key <key>', 'Gemini API key (overrides environment)')
  .option('--model <model>', 'Gemini model to use', 'gemini-2.5-pro')
  .option('--clone-dir <dir>', 'Directory to clone repos into', './temp-repos')
  .option('-b, --branch <branch>', 'Git branch to clone (for repository URLs)')
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
        analysisPath = await cloneRepository(targetPath, options.cloneDir, options.verbose, options.branch);
        isCloned = true;
        spinner.succeed(chalk.green('✅ Repository cloned successfully'));
        spinner.start('Preparing analysis...');
      } else {
        // Verify path exists
        if (!await fs.pathExists(targetPath)) {
          throw new Error(`Path does not exist: ${targetPath}`);
        }
        spinner.text = 'Preparing analysis...';
      }

      // Gather git information if it's a cloned repository
      let gitInfo = null;
      if (isCloned || await isGitRepository(analysisPath)) {
        spinner.text = 'Analyzing git repository...';
        gitInfo = await getGitDiffInfo(analysisPath, options.branch, options.verbose);
      }

      // Get prompt (without git context - that will be added after enhancement)
      let prompt = options.prompt || getDefaultPrompt();

      if (options.verbose) {
        spinner.stop();
        console.log(chalk.blue(`\n🔍 Analysis Details:`));
        console.log(chalk.gray(`   Path: ${analysisPath}`));
        console.log(chalk.gray(`   Model: ${options.model}`));
        console.log(chalk.gray(`   Prompt: ${prompt.substring(0, 100)}...`));
        console.log(chalk.gray(`   Output: ${options.output}`));
        if (isCloned && options.branch) {
          console.log(chalk.gray(`   Branch: ${options.branch}`));
        }
        if (gitInfo && gitInfo.diffWithMaster) {
          console.log(chalk.gray(`   Git Diff: ${gitInfo.diffWithMaster.changes.split('\n').length} files changed`));
        }
        console.log('');
        spinner.start('Starting AI analysis...');
      }

      spinner.text = 'Running AI analysis...';

      // AI enhance step: analyze and enhance the user's prompt
      const enhancedPrompt = await aiEnhancePrompt(prompt, options);

      // Append git context to enhanced prompt if available (after enhancement, not during)
      let finalEnhancedPrompt = enhancedPrompt;
      if (gitInfo && gitInfo.diffWithMaster) {
        const gitContext = `\n\n## Git Context\n` +
          `Current Branch: ${gitInfo.currentBranch}\n` +
          `Base Branch: ${gitInfo.diffWithMaster.baseBranch}\n` +
          `Files Changed:\n${gitInfo.diffWithMaster.changes}\n\n` +
          `Please focus your analysis on the changes in the ${gitInfo.currentBranch} branch compared to ${gitInfo.diffWithMaster.baseBranch}.`;

        finalEnhancedPrompt = enhancedPrompt + gitContext;
      }

      // Ask user how they want to proceed
      const userChoice = await confirmEnhancedPrompt(finalEnhancedPrompt, prompt);
      if (!userChoice.proceed) {
        spinner.stop();
        console.log(chalk.yellow('Analysis cancelled by user.'));
        return;
      }

      // Use the chosen prompt for analysis
      const result = await runGeminiAnalysis(analysisPath, userChoice.finalPrompt, options.model, options.verbose);

      // Always pass to validator agent for final validation and fixes
      if (options.verbose) {
        console.log(chalk.blue('📋 First draft complete, passing to validator agent...'));
      }

      const finalResult = await validatorAgent(result, options);

      spinner.text = 'Saving results...';

      // Save output
      await fs.writeFile(options.output, finalResult);

      // Cleanup cloned repo if needed
      if (isCloned && !options.keepClone) {
        spinner.text = 'Cleaning up...';
        await fs.remove(path.dirname(analysisPath));
      }

      spinner.succeed(chalk.green(`✅ Analysis completed: ${options.output}`));

      // Show summary
      console.log(chalk.blue('\n📊 Analysis Summary:'));
      console.log(`   Analysis path: ${analysisPath}`);
      console.log(`   Output file: ${options.output}`);
      console.log(`   Model used: ${options.model}`);

      // Show file size
      const stats = await fs.stat(options.output);
      console.log(`   Output size: ${(stats.size / 1024).toFixed(1)} KB`);

      // Show final results
      const finalContent = await fs.readFile(options.output, 'utf8');
      const mermaidBlocks = finalContent.match(/```mermaid\n([\s\S]*?)\n```/g);
      const blockCount = mermaidBlocks ? mermaidBlocks.length : 0;

      if (blockCount > 0) {
        console.log(chalk.green(`   Mermaid diagrams: ${blockCount} diagram(s) validated by agent ✅`));
      } else {
        console.log(chalk.yellow(`   No Mermaid diagrams found in output ⚠️`));
      }

      if (isCloned) {
        console.log(`   Repository: ${targetPath}`);
        console.log(`   Cleanup: ${options.keepClone ? 'Kept' : 'Removed'}`);
      }

      console.log(chalk.green(`\n🎉 Analysis complete! View results: ${options.output}`));

      // Ask for follow-up improvements
      await askForFollowUp(options.output, finalContent, options);

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
      console.log(`1. Run: node src/cli.js analyze "${clonePath}"`);
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
      const testResult = await runGeminiAnalysis('.', 'Say "Hello, Gemini CLI is working!" and nothing else.', 'gemini-2.5-pro', true);

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
  return `Analyze this codebase and generate a comprehensive, detailed markdown with Mermaid (v9) diagrams that map the domain architecture and data flows. Your audience is a team of Senior Software Engineers.

REQUIREMENTS:
1. **Complete Component Mapping**: Identify and include ALL relevant components:
   - Controllers (API endpoints (both inbound and outbound) and their handlers)
   - Models (database entities and data structures)
   - Services/Interactors (business logic classes)
   - Jobs (background processing)
   - External API calls
   - Database operations
   - Analytics/tracking events

2. **Detailed Flow Coverage**: Map ALL execution paths including:
   - Success scenarios (happy path)
   - Failure scenarios (sad path)
   - Error scenarios (error handling)
   - Edge cases and validations
   - Conditional logic branches
   - Exception handling

3. **Proper Mermaid v9 Structure**: Use flowchart TD format with:
   - Subgraphs to group related functionality
   - Clear node IDs (alphanumeric only, no spaces or special characters)
   - Proper arrow connections showing data flow
   - Decision diamonds for conditional logic
   - Different node shapes for different component types

4. **Styling and Legend**: Include:
   - CSS classes for different component types (controllers, models, jobs, etc.)
   - Color coding to distinguish component types
   - A comprehensive legend explaining the color scheme
   - Professional styling with appropriate colors

5. **Component Type Identification**: Clearly categorize each component as:
   - 🔵 Endpoints (API routes)
   - 🔷 Controllers (request handlers)
   - 🟣 Organizers (high-level orchestration)
   - 🟪 Interactors (business logic units)
   - 🟠 Jobs (background processing)
   - ⚫ External APIs (third-party services)
   - 🟢 Models (data structures)
   - 🟡 Analytics (tracking events)
   - 🔴 Failures (error scenarios)

IMPORTANT: Generate a production-ready diagram with complete coverage, proper styling, and a detailed legend. The diagram should be comprehensive enough for technical documentation and system understanding.`;
}



// AI enhance step: analyze user's prompt and enhance it with domain-specific details
async function aiEnhancePrompt(originalPrompt, options) {
  if (options.verbose) {
    console.log(chalk.blue('🤖 AI Enhance: Analyzing your request...'));
  }

  // Get the base comprehensive prompt template
  const basePrompt = getDefaultPrompt();

  const enhancePrompt = `You are an AI prompt enhancement specialist. Your role is to:

1. **ANALYZE** the user's request to understand what domain/system they want documented
2. **CUSTOMIZE** the comprehensive base prompt with domain-specific details
3. **ENHANCE** with relevant technical requirements for that specific domain

**USER'S ORIGINAL REQUEST:**
"${originalPrompt}"

**BASE COMPREHENSIVE PROMPT TEMPLATE:**
${basePrompt}

**YOUR TASKS:**
1. Identify the domain (e.g., payment processing, authentication, API gateway, microservices, etc.)
2. Take the base prompt and customize it for the specific domain and language/framework
3. Add domain-specific components, patterns, and technical details
4. Include relevant decision points and error handling scenarios

**ENHANCEMENT GUIDELINES:**
- Use the base prompt as your foundation - it has comprehensive architectural analysis requirements
- Customize the component examples for the specific domain (e.g., PaymentService, AuthController, etc.)
- Add domain-specific flows and patterns
- Include relevant architectural boundaries (microservices, UI, database, etc.)
- Specify important decision points (success/failure/error paths)
- Add code for code execution decision points
- Maintain the user's original intent while leveraging the comprehensive base template

**OUTPUT FORMAT:**
Return ONLY the enhanced prompt that will be used for analysis. Do not include explanations or commentary.

**EXAMPLE:**
Original: "Document the user authentication system"
Enhanced: [Base prompt customized with authentication-specific components like AuthController, UserService, JWT handling, OAuth flows, session management, password reset, etc.]

Provide the enhanced prompt now:`;

  try {
    const spinner = ora('🤖 Enhancing your request...').start();
    const enhancedPrompt = await runGeminiPrompt(enhancePrompt, options.model, false);
    spinner.succeed(chalk.green('✅ Request enhanced'));

    return enhancedPrompt.trim();
  } catch (error) {
    if (options.verbose) {
      console.log(chalk.yellow('⚠️  Enhancement failed, using original prompt'));
    }
    return originalPrompt;
  }
}

// Ask user to choose how to proceed with the enhanced prompt
async function confirmEnhancedPrompt(enhancedPrompt, originalPrompt) {
  console.log(chalk.blue('\n🎯 Enhanced Analysis Request:'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────────────────────────'));
  console.log(enhancedPrompt);
  console.log(chalk.gray('────────────────────────────────────────────────────────────────────────────────'));

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'How would you like to proceed?',
      choices: [
        {
          name: '✅ Use enhanced request (recommended)',
          value: 'enhanced',
          short: 'Enhanced'
        },
        {
          name: '📝 Use original request as-is',
          value: 'original',
          short: 'Original'
        },
        {
          name: '❌ Cancel analysis',
          value: 'cancel',
          short: 'Cancel'
        }
      ],
      default: 'enhanced'
    }
  ]);

  return {
    proceed: choice !== 'cancel',
    useEnhanced: choice === 'enhanced',
    finalPrompt: choice === 'enhanced' ? enhancedPrompt : originalPrompt
  };
}

// Extract Mermaid code blocks from markdown content
function extractMermaidBlocks(content) {
  const mermaidBlocks = [];
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  let match;
  let index = 1;

  while ((match = regex.exec(content)) !== null) {
    const mermaidContent = match[1].trim();
    const type = detectMermaidType(mermaidContent);

    mermaidBlocks.push({
      index,
      type,
      content: mermaidContent,
      fullMatch: match[0]
    });
    index++;
  }

  return mermaidBlocks;
}

// Detect the type of Mermaid diagram
function detectMermaidType(content) {
  const firstLine = content.split('\n')[0].trim().toLowerCase();

  if (firstLine.includes('sequencediagram')) return 'sequence';
  if (firstLine.includes('flowchart') || firstLine.includes('graph')) return 'flowchart';
  if (firstLine.includes('classDiagram')) return 'class';
  if (firstLine.includes('stateDiagram')) return 'state';
  if (firstLine.includes('erDiagram')) return 'er';
  if (firstLine.includes('gantt')) return 'gantt';
  if (firstLine.includes('pie')) return 'pie';
  if (firstLine.includes('journey')) return 'journey';

  return 'unknown';
}

// Validate Mermaid syntax using basic syntax checks
async function validateMermaidSyntax(mermaidContent) {
  try {
    const errors = [];
    const lines = mermaidContent.split('\n');

    // Basic syntax validation checks
    const firstLine = lines[0].trim().toLowerCase();

    // Check for valid diagram type
    const validTypes = ['flowchart', 'graph', 'sequencediagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey'];
    const hasValidType = validTypes.some(type => firstLine.includes(type.toLowerCase()));

    if (!hasValidType) {
      errors.push('Missing or invalid diagram type declaration');
    }

    // Check for common syntax issues
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('%%')) continue; // Skip empty lines and comments

      // Check for unmatched brackets
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;

      if (openBrackets !== closeBrackets) {
        errors.push(`Line ${i + 1}: Unmatched square brackets`);
      }
      if (openParens !== closeParens) {
        errors.push(`Line ${i + 1}: Unmatched parentheses`);
      }

      // Check for invalid node syntax combinations
      if (line.includes('([') && line.includes('])')) {
        errors.push(`Line ${i + 1}: Invalid node syntax - cannot combine parentheses and brackets like ([...]). Use either (...) or [...] but not both.`);
      }

      // Check for parentheses in node text that conflicts with node shape syntax
      const nodeWithParensInText = /\w+\(".*\(.*\).*"\):::/g;
      if (nodeWithParensInText.test(line)) {
        errors.push(`Line ${i + 1}: Invalid node syntax - parentheses in node text conflict with rounded rectangle syntax. Use square brackets instead: NodeID["text with (parentheses)"]`);
      }

      // Check for other invalid node syntax patterns
      if (line.includes(']{') || line.includes('}[')) {
        errors.push(`Line ${i + 1}: Invalid node syntax - malformed bracket/brace combination`);
      }

      // Check for invalid arrow syntax
      if (line.includes('-->-') || line.includes('--->>')) {
        errors.push(`Line ${i + 1}: Invalid arrow syntax`);
      }
    }

    // If no errors found, consider it valid
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Validation error: ' + error.message]
    };
  }
}

async function validatorAgent(firstDraft, options) {
  console.log(chalk.blue('🔍 Validator Agent: Starting validation process...'));

  // Extract and analyze Mermaid diagrams first
  console.log(chalk.blue('🔍 Validator: Extracting Mermaid diagrams from first draft...'));
  const mermaidBlocks = extractMermaidBlocks(firstDraft);
  console.log(chalk.blue(`🔍 Validator: Found ${mermaidBlocks.length} Mermaid diagram(s) to analyze`));

  // Validate each diagram
  const validationResults = [];
  for (const block of mermaidBlocks) {
    console.log(chalk.blue(`🔍 Validator: Analyzing diagram ${block.index} (${block.type})...`));
    const result = await validateMermaidSyntax(block.content);
    validationResults.push({
      ...block,
      isValid: result.isValid,
      errors: result.errors
    });

    if (result.isValid) {
      console.log(chalk.green(`✅ Validator: Diagram ${block.index} syntax is valid`));
    } else {
      console.log(chalk.yellow(`⚠️ Validator: Diagram ${block.index} has syntax issues:`));
      result.errors.forEach(error => {
        console.log(chalk.yellow(`   - ${error}`));
      });
    }
  }

  // Create validation summary
  const validDiagrams = validationResults.filter(r => r.isValid).length;
  const invalidDiagrams = validationResults.filter(r => !r.isValid).length;

  console.log(chalk.blue('🔍 Validator: Validation Summary:'));
  console.log(chalk.green(`   ✅ Valid diagrams: ${validDiagrams}`));
  if (invalidDiagrams > 0) {
    console.log(chalk.yellow(`   ⚠️ Diagrams needing fixes: ${invalidDiagrams}`));
  }

  // If all diagrams are valid, return the first draft immediately
  if (invalidDiagrams === 0) {
    console.log(chalk.green('🎯 Validator: All diagrams are valid, no fixes needed'));
    console.log(chalk.green('✅ Validator Agent completed validation'));
    if (options.verbose) {
      console.log(chalk.green('🎯 Final validated diagram ready'));
    }
    return firstDraft;
  }

  // Create the validator agent prompt
  const validationSummary = validationResults.map(r =>
    `- Diagram ${r.index} (${r.type}): ${r.isValid ? '✅ Valid' : '❌ Issues: ' + r.errors.join(', ')}`
  ).join('\n');

  console.log(chalk.blue('🔍 Validator: Preparing validation prompt for AI agent...'));
  const validatorPrompt = `You are a specialized Mermaid Diagram Validator Agent. Your role is to produce clean, documentation-ready markdown.

**VALIDATION ANALYSIS:**
${validationSummary}

**YOUR TASKS:**
1. **Validate Syntax**: Fix any Mermaid syntax errors that would prevent rendering
2. **Clean Output**: Remove any processing commentary, validation notes, or technical details
3. **Documentation Focus**: Ensure the output is readable by engineers as architectural documentation
4. **Preserve Content**: Keep all explanatory text, headings, and structure that help understanding

**COMMON ISSUES TO FIX:**
- **Invalid node syntax combinations**: NodeID(["Text"]) should be NodeID["Text"] or NodeID("Text") - never combine parentheses and brackets
- **Parentheses in node text**: NodeID("text with (parentheses)") causes parser conflicts - use NodeID["text with (parentheses)"] instead
- **Node syntax with spaces/special chars**: A1(POST /api/payments) should be A1["POST /api/payments"]
- **Malformed node definitions**: NodeID(["Text should be NodeID["Text"]
- **Invalid arrows**: Remove semicolons after arrows, fix malformed arrows like -->- or --->>
- **Inline class syntax**: Replace ::: with class statements
- **Unquoted labels**: Special characters need proper quoting
- **Missing or broken styling definitions**
- **Bracket/brace combinations**: Fix invalid patterns like ]{, }[, or other malformed combinations

**INPUT - FIRST DRAFT TO VALIDATE:**
${firstDraft}

**CRITICAL OUTPUT REQUIREMENTS:**
- Return ONLY the clean, final markdown documentation
- NO validation commentary, processing notes, or "corrected output" headers
- NO technical details about what was fixed
- The output should read like professional architectural documentation
- Include explanatory text, headings, and context that help engineers understand the system
- Ensure all Mermaid diagrams use proper syntax and will render correctly

**OUTPUT:** Clean, documentation-ready markdown that serves as architectural overview for engineers.`;

  try {
    const spinner = ora('🔍 Validator Agent processing with AI...').start();

    console.log(chalk.blue('🔍 Validator: Sending validation request to AI agent...'));
    // Run the validator agent with just the prompt (no file analysis needed)
    const validatedResult = await runGeminiPrompt(validatorPrompt, 'gemini-2.5-pro', false);

    console.log(chalk.blue('🔍 Validator: Received response from AI agent, re-validating...'));

    // Re-validate the corrected content
    const correctedBlocks = extractMermaidBlocks(validatedResult);
    console.log(chalk.blue(`🔍 Validator: Re-checking ${correctedBlocks.length} diagram(s) in corrected output...`));

    let allFixed = true;
    for (const block of correctedBlocks) {
      const result = await validateMermaidSyntax(block.content);
      if (!result.isValid) {
        console.log(chalk.yellow(`⚠️ Validator: Diagram ${block.index} still has issues: ${result.errors.join(', ')}`));
        allFixed = false;
      } else {
        console.log(chalk.green(`✅ Validator: Diagram ${block.index} is now valid`));
      }
    }

    if (allFixed) {
      console.log(chalk.green('🎯 Validator: All diagrams successfully validated and corrected'));
    } else {
      console.log(chalk.yellow('⚠️ Validator: Some diagrams still have minor issues, but proceeding with best effort'));
    }

    spinner.succeed(chalk.green('✅ Validator Agent completed validation'));

    if (options.verbose) {
      console.log(chalk.green('🎯 Final validated diagram ready'));
    }

    return validatedResult;

  } catch (error) {
    console.log(chalk.red('❌ Validator Agent encountered an error during processing'));
    console.error(chalk.red('Validator Error Details:'), error.message);
    if (options.verbose) {
      console.log(chalk.red('❌ Validator Agent failed, returning first draft'));
    }
    return firstDraft; // Return first draft if validator fails
  }
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

// Check if a path is a git repository
async function isGitRepository(repoPath) {
  try {
    execSync('git rev-parse --git-dir', { cwd: repoPath, stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
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

// Gather git diff information for branch comparison
async function getGitDiffInfo(repoPath, branch, verbose = false) {
  try {
    const gitInfo = {
      currentBranch: branch || 'unknown',
      diffWithMaster: null,
      commitInfo: null,
      hasGitRepo: false
    };

    // Check if it's a git repository
    try {
      if (verbose) {
        console.log(chalk.blue(`🔍 Checking git repository at: ${repoPath}`));
      }
      execSync('git rev-parse --git-dir', { cwd: repoPath, stdio: 'pipe' });
      gitInfo.hasGitRepo = true;
      if (verbose) {
        console.log(chalk.green('✅ Git repository detected'));
      }
    } catch (error) {
      if (verbose) {
        console.log(chalk.yellow(`⚠️  Not a git repository, skipping git analysis. Error: ${error.message}`));
        console.log(chalk.gray(`   Attempted path: ${repoPath}`));
      }
      return gitInfo;
    }

    // Get current branch if not specified
    if (!gitInfo.currentBranch || gitInfo.currentBranch === 'unknown') {
      try {
        gitInfo.currentBranch = execSync('git branch --show-current', {
          cwd: repoPath,
          encoding: 'utf8'
        }).trim();
      } catch (error) {
        gitInfo.currentBranch = 'detached-head';
      }
    }

    // Get commit information for current branch
    try {
      const commitHash = execSync('git rev-parse HEAD', {
        cwd: repoPath,
        encoding: 'utf8'
      }).trim();

      const commitMessage = execSync('git log -1 --pretty=format:"%s"', {
        cwd: repoPath,
        encoding: 'utf8'
      }).trim();

      gitInfo.commitInfo = {
        hash: commitHash.substring(0, 8),
        message: commitMessage
      };
    } catch (error) {
      if (verbose) {
        console.log(chalk.yellow('⚠️  Could not get commit information'));
      }
    }

    // Get diff with master/main branch
    const masterBranches = ['master', 'main'];
    for (const masterBranch of masterBranches) {
      try {
        // Check if master/main branch exists
        execSync(`git show-ref --verify --quiet refs/heads/${masterBranch}`, {
          cwd: repoPath,
          stdio: 'pipe'
        });

        // Get diff if current branch is different from master/main
        if (gitInfo.currentBranch !== masterBranch) {
          const diffOutput = execSync(`git diff ${masterBranch}...HEAD --name-status`, {
            cwd: repoPath,
            encoding: 'utf8'
          }).trim();

          if (diffOutput) {
            gitInfo.diffWithMaster = {
              baseBranch: masterBranch,
              changes: diffOutput,
              summary: `Changes in ${gitInfo.currentBranch} compared to ${masterBranch}`
            };
          }
        }
        break; // Found a master branch, stop looking
      } catch (error) {
        // Continue to next master branch candidate
        continue;
      }
    }

    if (verbose && gitInfo.diffWithMaster) {
      console.log(chalk.blue(`\n📊 Git Analysis:`));
      console.log(chalk.gray(`   Current Branch: ${gitInfo.currentBranch}`));
      console.log(chalk.gray(`   Base Branch: ${gitInfo.diffWithMaster.baseBranch}`));
      console.log(chalk.gray(`   Files Changed: ${gitInfo.diffWithMaster.changes.split('\n').length}`));
    }

    return gitInfo;
  } catch (error) {
    if (verbose) {
      console.log(chalk.yellow(`⚠️  Git analysis failed: ${error.message}`));
    }
    return {
      currentBranch: branch || 'unknown',
      diffWithMaster: null,
      commitInfo: null,
      hasGitRepo: false,
      error: error.message
    };
  }
}

// Ask for follow-up improvements to the generated documentation
async function askForFollowUp(outputFile, currentContent, options) {
  try {
    const { wantFollowUp } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantFollowUp',
        message: 'Would you like to add anything else or improve the documentation?',
        default: false
      }
    ]);

    if (!wantFollowUp) {
      return;
    }

    // Get follow-up request from user
    const { followUpPrompt } = await inquirer.prompt([
      {
        type: 'input',
        name: 'followUpPrompt',
        message: 'What would you like to add or improve?',
        validate: (input) => {
          if (!input.trim()) {
            return 'Please enter a follow-up request.';
          }
          return true;
        }
      }
    ]);

    console.log(chalk.blue('\n🔄 Processing follow-up request...'));

    // Create context-aware follow-up prompt
    const contextPrompt = `You are enhancing existing architectural documentation. Here is the current documentation:

**CURRENT DOCUMENTATION:**
${currentContent}

**USER'S FOLLOW-UP REQUEST:**
${followUpPrompt}

**YOUR TASK:**
Enhance the existing documentation by adding the requested improvements while preserving all existing content. You should:
1. **Keep ALL existing content** - Do not remove or replace any existing sections
2. **Add new content** - Address the specific follow-up request by adding new sections, diagrams, or details
3. **Maintain consistency** - Use the same style, format, and tone as the existing documentation
4. **Enhance, don't replace** - Build upon what's already there

**IMPORTANT:**
- Return the COMPLETE enhanced documentation (existing content + new additions)
- Keep all existing Mermaid diagrams and add new ones if requested
- Preserve the existing structure and add new sections as needed
- Ensure all Mermaid syntax is correct
- If the current documentation is incomplete or minimal, create a comprehensive version that addresses the follow-up request

Provide the enhanced documentation now:`;

    const spinner = ora('🔄 Enhancing documentation...').start();

    try {
      // Use gemini-cli to process the follow-up with full context
      const enhancedContent = await runGeminiPrompt(contextPrompt, options.model, false);

      // Validate the enhanced content
      const finalContent = await validatorAgent(enhancedContent, options);

      // Save the improved version
      await fs.writeFile(outputFile, finalContent);

      spinner.succeed(chalk.green('✅ Documentation enhanced successfully!'));

      console.log(chalk.green(`\n🎉 Enhanced documentation saved to: ${outputFile}`));

      // Offer another round of improvements
      await askForFollowUp(outputFile, finalContent, options);

    } catch (error) {
      spinner.fail(chalk.red('❌ Follow-up enhancement failed'));
      console.error(chalk.red('Error:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
    }

  } catch (error) {
    // User cancelled or other error - just return gracefully
    if (error.name !== 'ExitPromptError') {
      console.error(chalk.red('Follow-up error:'), error.message);
    }
  }
}

// Function to run gemini with just a prompt (for validator agent)
async function runGeminiPrompt(prompt, model = 'gemini-2.5-pro', verbose = false) {
  return new Promise((resolve, reject) => {
    const args = [];

    if (model && model !== 'gemini-2.5-pro') {
      args.push('--model', model);
    }

    // Just run gemini with the prompt (no file analysis)
    args.push(prompt);

    if (verbose) {
      console.log(chalk.gray(`Running: gemini ${args.join(' ')}`));
    }

    const geminiProcess = spawn('gemini', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    geminiProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      if (verbose) {
        console.log(chalk.gray(`📝 Received ${chunk.length} characters from Gemini`));
      }
    });

    geminiProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    geminiProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Gemini CLI failed with code ${code}: ${stderr}`));
      }
    });

    geminiProcess.on('error', (error) => {
      reject(new Error(`Failed to run Gemini CLI: ${error.message}`));
    });
  });
}

async function runGeminiAnalysis(analysisPath, prompt, model = 'gemini-2.5-pro', verbose = false) {
  return new Promise((resolve, reject) => {
    const args = [];

    if (model && model !== 'gemini-2.5-pro') {
      args.push('--model', model);
    }

    // Change to the analysis directory and run gemini with the prompt
    // Add explicit instruction to prevent write_file tool usage
    const modifiedPrompt = `${prompt}

CRITICAL INSTRUCTION: Please provide your complete analysis as markdown text directly in your response. Do NOT attempt to use any write_file, save_file, create_file, or similar file-writing tools. These tools are not available in this environment. Just return the complete markdown content with Mermaid diagrams directly in your response text.

Your response should be complete, well-formatted markdown documentation that can be saved to a file.`;

    args.push(modifiedPrompt);

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
    let lastOutput = Date.now();

    // Provide periodic feedback during long operations
    const feedbackInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastOutput) / 1000);
      if (verbose) {
        console.log(chalk.gray(`⏳ Still analyzing... (${elapsed}s elapsed)`));
      }
    }, 10000); // Every 10 seconds

    geminiProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      lastOutput = Date.now();

      if (verbose) {
        // Stream the actual content from Gemini in real-time
        process.stdout.write(chalk.cyan(chunk));
      } else {
        // Just show progress indicator
        console.log(chalk.gray(`📝 Received ${data.length} characters from Gemini`));
      }
    });

    geminiProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      if (verbose) {
        console.log(chalk.yellow(`⚠️  Gemini stderr: ${data.toString().trim()}`));
      }
    });

    geminiProcess.on('close', (code) => {
      clearInterval(feedbackInterval);
      if (code === 0) {
        if (verbose) {
          console.log(chalk.green(`✅ AI analysis completed (${stdout.length} characters)`));
        }
        resolve(stdout.trim());
      } else {
        reject(new Error(`Gemini CLI failed with exit code ${code}: ${stderr}`));
      }
    });

    geminiProcess.on('error', (error) => {
      clearInterval(feedbackInterval);
      reject(new Error(`Failed to run Gemini CLI: ${error.message}`));
    });
  });
}

// Get default output path - use /app/output in Docker, current directory otherwise
function getDefaultOutputPath() {
  const outputDir = process.env.DEFAULT_OUTPUT_DIR;
  if (outputDir) {
    return path.join(outputDir, 'analysis-output.md');
  }
  return 'analysis-output.md';
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
