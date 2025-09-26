# Docker Setup for Diagram Generator

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env and add your Gemini API key:**
   ```bash
   nano .env
   # Set: GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Build and start container:**
   ```bash
   docker-compose up -d
   ```

4. **Access container shell:**
   ```bash
   docker-compose exec diagram-generator bash
   ```

## Usage

Inside the container, you can run the analyzer normally:

```bash
# Analyze current directory
node src/cli.js analyze .

# Analyze a git repository (clones automatically)
node src/cli.js analyze https://github.com/user/repo.git

# Use custom prompts
node src/cli.js analyze https://github.com/user/repo.git --prompt "Create a sequence diagram"
```

## File Access

- **Output files**: Automatically saved to `./output/` on your host machine
- **Git repositories**: Cloned inside the container as needed
- **Persistent results**: All analysis results persist on your host

## Management

```bash
# View logs
docker-compose logs diagram-generator

# Stop container
docker-compose down

# Rebuild after changes
docker-compose build --no-cache
```

That's it! The container handles all dependencies and git operations internally.
