# Use Node.js 22 as specified in package.json engines
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache git bash

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Gemini CLI globally
RUN npm install -g @google/gemini-cli

# Copy application source
COPY src/ ./src/
COPY *.md ./

# Default command - keep container running
CMD ["tail", "-f", "/dev/null"]
