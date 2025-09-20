const { Octokit } = require('@octokit/rest');
const crypto = require('crypto');

class GitHubIntegration {
  constructor(config) {
    this.config = config;
    this.token = config.github?.token || process.env.GITHUB_TOKEN;
    this.webhookSecret = config.github?.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET;
    
    if (this.token) {
      this.octokit = new Octokit({
        auth: this.token
      });
    }
  }

  async postComment(owner, repo, issueNumber, content) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: content
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to post GitHub comment: ${error.message}`);
    }
  }

  async createFile(owner, repo, path, content, message, branch = 'main') {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create GitHub file: ${error.message}`);
    }
  }

  async createPullRequest(owner, repo, title, body, head, base = 'main') {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async getRepository(owner, repo) {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get repository: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const actualSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    );
  }

  parseWebhookPayload(payload) {
    try {
      const data = JSON.parse(payload);
      
      return {
        action: data.action,
        repository: {
          owner: data.repository?.owner?.login,
          name: data.repository?.name,
          fullName: data.repository?.full_name,
          cloneUrl: data.repository?.clone_url
        },
        issue: data.issue ? {
          number: data.issue.number,
          title: data.issue.title,
          body: data.issue.body,
          user: data.issue.user?.login
        } : null,
        pullRequest: data.pull_request ? {
          number: data.pull_request.number,
          title: data.pull_request.title,
          body: data.pull_request.body,
          user: data.pull_request.user?.login,
          head: data.pull_request.head?.ref,
          base: data.pull_request.base?.ref
        } : null,
        comment: data.comment ? {
          id: data.comment.id,
          body: data.comment.body,
          user: data.comment.user?.login
        } : null
      };
    } catch (error) {
      throw new Error(`Failed to parse webhook payload: ${error.message}`);
    }
  }

  isAnalysisCommand(commentBody) {
    const commands = [
      '/analyze payment flows',
      '/analyze payments',
      '/payment-flow-analyzer',
      '/pfa analyze'
    ];

    return commands.some(command => 
      commentBody.toLowerCase().includes(command.toLowerCase())
    );
  }

  extractAnalysisOptions(commentBody) {
    const options = {
      format: 'markdown',
      compress: false,
      includeTests: false
    };

    // Extract format option
    const formatMatch = commentBody.match(/--format[=\s]+(\w+)/i);
    if (formatMatch) {
      options.format = formatMatch[1].toLowerCase();
    }

    // Extract compress option
    if (commentBody.includes('--compress')) {
      options.compress = true;
    }

    // Extract include tests option
    if (commentBody.includes('--include-tests')) {
      options.includeTests = true;
    }

    return options;
  }

  formatAnalysisComment(analysisResult, diagrams, options = {}) {
    let comment = '## 🔍 Payment Flow Analysis Results\n\n';
    
    // Add timestamp
    comment += `**Generated:** ${new Date().toISOString()}\n`;
    comment += `**AI Provider:** ${options.aiProvider || 'Unknown'}\n`;
    comment += `**Model:** ${options.model || 'Unknown'}\n\n`;

    // Add summary
    if (analysisResult.summary) {
      comment += `### Summary\n\n${analysisResult.summary}\n\n`;
    }

    // Add diagrams
    if (diagrams && diagrams.length > 0) {
      comment += '### Payment Flow Diagrams\n\n';
      diagrams.forEach((diagram, index) => {
        comment += `#### ${diagram.title || `Flow ${index + 1}`}\n\n`;
        if (diagram.description) {
          comment += `${diagram.description}\n\n`;
        }
        comment += `\`\`\`mermaid\n${diagram.mermaid}\n\`\`\`\n\n`;
      });
    }

    // Add integrations found
    if (analysisResult.integrations) {
      const foundIntegrations = Object.entries(analysisResult.integrations)
        .filter(([_, info]) => info.found)
        .map(([gateway, info]) => `**${gateway.toUpperCase()}**: ${info.features?.join(', ') || 'Basic integration'}`);

      if (foundIntegrations.length > 0) {
        comment += '### Payment Integrations Found\n\n';
        foundIntegrations.forEach(integration => {
          comment += `- ${integration}\n`;
        });
        comment += '\n';
      }
    }

    // Add security analysis
    if (analysisResult.security) {
      if (analysisResult.security.patterns?.length > 0) {
        comment += '### Security Patterns\n\n';
        analysisResult.security.patterns.forEach(pattern => {
          comment += `- ✅ ${pattern}\n`;
        });
        comment += '\n';
      }

      if (analysisResult.security.concerns?.length > 0) {
        comment += '### Security Concerns\n\n';
        analysisResult.security.concerns.forEach(concern => {
          comment += `- ⚠️ ${concern}\n`;
        });
        comment += '\n';
      }
    }

    // Add footer
    comment += '---\n';
    comment += '*Generated by [Payment Flow Analyzer](https://github.com/yourusername/payment-flow-analyzer)*';

    return comment;
  }

  async handleWebhookEvent(eventType, payload) {
    const parsedPayload = this.parseWebhookPayload(payload);

    switch (eventType) {
      case 'issue_comment':
        return await this.handleIssueComment(parsedPayload);
      case 'pull_request':
        return await this.handlePullRequest(parsedPayload);
      default:
        return { handled: false, reason: `Unsupported event type: ${eventType}` };
    }
  }

  async handleIssueComment(payload) {
    if (!payload.comment || !this.isAnalysisCommand(payload.comment.body)) {
      return { handled: false, reason: 'Not an analysis command' };
    }

    const options = this.extractAnalysisOptions(payload.comment.body);
    
    return {
      handled: true,
      action: 'analyze',
      repository: payload.repository,
      issue: payload.issue,
      pullRequest: payload.pullRequest,
      options
    };
  }

  async handlePullRequest(payload) {
    // Handle PR events if needed
    return { handled: false, reason: 'PR events not implemented yet' };
  }
}

module.exports = GitHubIntegration;
