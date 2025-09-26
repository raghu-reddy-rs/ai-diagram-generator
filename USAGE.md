# Diagram Generator - Detailed Usage Guide

This guide provides comprehensive usage instructions and advanced techniques for the Diagram Generator. For a quick overview, see the main [README.md](README.md).

## 🚀 Getting Started

### Initial Setup

1. **Install and configure:**
   ```bash
   # Run the setup script
   ./setup.sh

   # Or manually set API key
   export GEMINI_API_KEY="your-api-key-here"
   ```

2. **Verify installation:**
   ```bash
   analyzer test
   ```

3. **First analysis:**
   ```bash
   node src/cli.js analyze
   ```

## 📋 Command Reference

### Core Commands

All commands support the `analyzer` alias (when installed globally) or `node src/cli.js` for local usage.

#### Analysis Command
```bash
node src/cli.js analyze [path] [options]
```

**Path Options:**
- `.` or omitted: Current directory
- `./src`: Specific local directory
- `/absolute/path`: Absolute path to directory
- `https://github.com/user/repo.git`: Git repository URL

**Key Options:**
- `--prompt`: Custom analysis prompt (triggers AI enhancement)
- `--output`: Output file name (default: analysis-output.md)
- `--verbose`: Detailed logging and real-time output
- `--keep-clone`: Preserve cloned repositories
- `--model`: Specify Gemini model (default: gemini-2.5-pro)

#### Repository Management
```bash
# Clone for later analysis
analyzer clone https://github.com/user/repo.git

# Clone specific branch
analyzer clone https://github.com/user/repo.git -b feature-branch

# Clone to specific directory
analyzer clone https://github.com/user/repo.git -d ./my-repos
```

#### Testing and Validation
```bash
# Test API connection
analyzer test

# Test with specific API key
analyzer test --api-key "test-key"
```

## 🎯 Advanced Usage Patterns

### Multi-Stage Analysis

For comprehensive documentation, perform multiple focused analyses:

```bash
# 1. Overall architecture
node src/cli.js analyze --prompt "System architecture overview" --output 01-architecture.md

# 2. Data flows
node src/cli.js analyze --prompt "Data flow and processing pipelines" --output 02-dataflow.md

# 3. API documentation
node src/cli.js analyze --prompt "API endpoints and integration patterns" --output 03-apis.md

# 4. Database design
node src/cli.js analyze --prompt "Database schema and relationships" --output 04-database.md

# 5. Security analysis
node src/cli.js analyze --prompt "Security patterns and authentication flows" --output 05-security.md
```

### Domain-Specific Analysis

The AI enhancement system automatically adapts to different domains:

#### E-commerce/Payment Systems
```bash
node src/cli.js analyze --prompt "Payment processing and order fulfillment flows"
# Auto-enhanced with: payment gateways, order states, inventory, refunds, etc.
```

#### Authentication Systems
```bash
node src/cli.js analyze --prompt "User authentication and authorization"
# Auto-enhanced with: JWT, OAuth, sessions, RBAC, password flows, etc.
```

#### Microservices Architecture
```bash
node src/cli.js analyze --prompt "Microservices communication and boundaries"
# Auto-enhanced with: service mesh, API gateways, event sourcing, etc.
```

#### Data Processing Pipelines
```bash
node src/cli.js analyze --prompt "Data ingestion and processing workflows"
# Auto-enhanced with: ETL, streaming, batch processing, data validation, etc.
```

### Repository Analysis Strategies

#### Large Repositories
```bash
# Analyze specific components
node src/cli.js analyze ./src/auth --prompt "Authentication module analysis"
node src/cli.js analyze ./src/api --prompt "API layer documentation"
node src/cli.js analyze ./src/database --prompt "Data layer and models"

# Use focused prompts
node src/cli.js analyze --prompt "Focus only on the core business logic, ignore tests and utilities"
```

#### Monorepos
```bash
# Analyze each service separately
node src/cli.js analyze ./services/user-service --prompt "User service architecture"
node src/cli.js analyze ./services/payment-service --prompt "Payment service flows"
node src/cli.js analyze ./shared --prompt "Shared libraries and utilities"
```

## 🔧 Workflow Integration

### CI/CD Integration

Create documentation as part of your build process:

```bash
#!/bin/bash
# docs-generation.sh

echo "Generating architectural documentation..."

# Generate comprehensive docs
node src/cli.js analyze --prompt "Complete system documentation" --output docs/architecture.md

# Generate API docs
node src/cli.js analyze ./src/api --prompt "API documentation with endpoints and flows" --output docs/api.md

# Generate database docs
node src/cli.js analyze ./src/models --prompt "Database schema and relationships" --output docs/database.md

echo "Documentation generated successfully!"
```

### Development Workflow

```bash
# Before code review - document new features
node src/cli.js analyze ./src/new-feature --prompt "Document this new feature's architecture and integration points"

# After major refactoring - update architecture docs
node src/cli.js analyze --prompt "Updated system architecture after refactoring"

# For onboarding - generate comprehensive overview
node src/cli.js analyze --prompt "Complete system overview for new team members"
```

## 🎨 Output Customization

### Diagram Types

The tool automatically selects appropriate diagram types, but you can guide it:

```bash
# Force specific diagram types
node src/cli.js analyze --prompt "Create ONLY a sequence diagram for the authentication flow"
node src/cli.js analyze --prompt "Generate a class diagram showing the domain models"
node src/cli.js analyze --prompt "Create a flowchart for the data processing pipeline"
```

### Output Formatting

```bash
# Detailed technical documentation
node src/cli.js analyze --prompt "Create detailed technical documentation with code examples and implementation notes"

# High-level overview
node src/cli.js analyze --prompt "Create a high-level architectural overview suitable for stakeholders"

# Developer-focused documentation
node src/cli.js analyze --prompt "Create developer-focused documentation with implementation details and patterns"
```

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### 1. API Key Problems
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Test with explicit key
analyzer test --api-key "your-actual-key"

# Check for hidden characters
export GEMINI_API_KEY="$(echo 'your-key' | tr -d '[:space:]')"
```

#### 2. Git Repository Issues
```bash
# Test repository access
git ls-remote https://github.com/user/repo.git

# Use SSH instead of HTTPS
node src/cli.js analyze git@github.com:user/repo.git

# Clone manually first
git clone https://github.com/user/repo.git temp-repo
node src/cli.js analyze ./temp-repo
```

#### 3. Large Repository Timeouts
```bash
# Use verbose mode to monitor progress
node src/cli.js analyze --verbose

# Analyze smaller chunks
node src/cli.js analyze ./src --prompt "Focus on source code only"

# Exclude large directories
node src/cli.js analyze --prompt "Analyze the codebase but ignore node_modules, dist, and build directories"
```

#### 4. Gemini CLI Issues
```bash
# Verify installation
which gemini
gemini --version

# Reinstall if needed
npm uninstall -g @google/gemini-cli
npm install -g @google/gemini-cli

# Check permissions
ls -la $(which gemini)
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Full verbose output
node src/cli.js analyze --verbose

# Monitor system resources
node src/cli.js analyze --verbose 2>&1 | tee analysis.log

# Check generated prompts
node src/cli.js analyze --verbose | grep -A 10 "Enhanced Analysis Request"
```

## 📊 Best Practices

### Prompt Engineering

1. **Be Specific**: Instead of "document the code", use "create a sequence diagram showing user registration flow"

2. **Include Context**: "Analyze this Node.js Express API and create component diagrams showing middleware, routes, and database interactions"

3. **Specify Audience**: "Create documentation suitable for senior developers" vs "Create overview for product managers"

4. **Request Multiple Views**: "Create both high-level architecture and detailed component diagrams"

### Output Management

```bash
# Organize outputs by date
node src/cli.js analyze --output "docs/$(date +%Y-%m-%d)-architecture.md"

# Use descriptive names
node src/cli.js analyze --prompt "Payment flows" --output "payment-system-analysis.md"

# Create documentation sets
mkdir -p docs/{architecture,apis,database}
node src/cli.js analyze --prompt "System architecture" --output "docs/architecture/overview.md"
```

### Team Collaboration

```bash
# Generate consistent documentation
node src/cli.js analyze --prompt "Create standardized architectural documentation following our team's documentation template"

# Update existing docs
node src/cli.js analyze --prompt "Update the existing architecture documentation with recent changes, preserving the existing structure"
```

This comprehensive guide should help you make the most of the Diagram Generator. For additional examples and prompt templates, see [example-prompts.md](example-prompts.md).
