# Analyzer Usage Guide

## Quick Start

1. **Set your API key:**
```bash
export GEMINI_API_KEY="AIzaSyCyRbWTtaaONm3p9D6FzxEpjj1HDtXLJSM"
```

2. **Test the setup:**
```bash
node src/cli.js test
```

3. **Analyze current directory:**
```bash
node src/cli.js analyze
```

## Common Use Cases

### 1. Analyze Local Directory
```bash
# Basic analysis
node src/cli.js analyze /path/to/project

# With custom prompt
node src/cli.js analyze /path/to/project --prompt "Create a class diagram"
```

### 2. Analyze Git Repository
```bash
# Clone and analyze
node src/cli.js analyze https://github.com/user/repo.git

# Analyze specific branch
node src/cli.js clone https://github.com/user/repo.git -b develop
node src/cli.js analyze temp-repos/repo-*

# Keep cloned repo for further analysis
node src/cli.js analyze https://github.com/user/repo.git --keep-clone
```

### 3. Payment Flow Analysis
```bash
node src/cli.js analyze . --prompt "Analyze this codebase for payment processing flows and generate a sequence diagram showing the payment lifecycle from initiation to completion. Include user interactions, API calls, database operations, external service integrations (Stripe, PayPal, etc.), error handling flows, and webhook processing."
```

### 4. System Architecture
```bash
node src/cli.js analyze . --prompt "Create a component diagram showing the system architecture. Highlight main application modules/components, dependencies between components, data flow directions, external integrations, database connections, and API endpoints."
```

### 5. Database Schema
```bash
node src/cli.js analyze . --prompt "Analyze database models and relationships, then generate an entity-relationship diagram. Include database tables/models, relationships (one-to-one, one-to-many, many-to-many), key fields and constraints, indexes if apparent, and foreign key relationships."
```

## Command Options

### `analyze` command
- `[path]` - Path to analyze (directory, file, or git URL)
- `--prompt <text>` - Custom analysis prompt
- `--output <file>` - Output file path (default: analysis-output.md)
- `--api-key <key>` - Gemini API key (overrides environment)
- `--model <model>` - Gemini model to use (default: gemini-pro)
- `--clone-dir <dir>` - Directory for cloned repos (default: ./temp-repos)
- `--keep-clone` - Keep cloned repository after analysis
- `--verbose` - Enable verbose logging

### `clone` command
- `<repo>` - Git repository URL
- `--dir <directory>` - Directory to clone into (default: ./temp-repos)
- `--branch <branch>` - Branch to clone
- `--keep` - Keep the cloned repository

### `test` command
- `--api-key <key>` - Gemini API key to test

## Output

The analyzer generates markdown files containing:
- AI analysis of the codebase
- Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, etc.)
- Explanations of the diagram structure
- Insights about the codebase architecture

## Tips

1. **Use specific prompts** for better results:
   - "Create a sequence diagram for user authentication"
   - "Generate a flowchart showing data processing pipeline"
   - "Analyze API endpoints and create a component diagram"

2. **For large repositories**, consider analyzing specific directories:
   ```bash
   node src/cli.js analyze ./src --prompt "Focus on the main application logic"
   ```

3. **Chain analyses** for comprehensive documentation:
   ```bash
   # Architecture overview
   node src/cli.js analyze . --prompt "System architecture" --output architecture.md
   
   # Payment flows
   node src/cli.js analyze . --prompt "Payment processing flows" --output payments.md
   
   # Database design
   node src/cli.js analyze . --prompt "Database schema and relationships" --output database.md
   ```

4. **Use verbose mode** for debugging:
   ```bash
   node src/cli.js analyze . --verbose
   ```

## Troubleshooting

### API Key Issues
```bash
# Check if API key is set
echo $GEMINI_API_KEY

# Test API key
node src/cli.js test --api-key "your-key"
```

### Git Clone Issues
```bash
# Ensure git is installed
git --version

# Check repository URL
git ls-remote https://github.com/user/repo.git
```

### Gemini CLI Issues
```bash
# Check if Gemini CLI is installed
gemini --help

# Reinstall if needed
npm install -g @google/gemini-cli
```
