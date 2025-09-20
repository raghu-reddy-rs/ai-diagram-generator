const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

class PaymentFlowAnalyzer {
  constructor(config) {
    this.config = config;
    this.aiProvider = config.aiProvider || 'openai';
    this.model = config.model || 'gpt-4';
    
    // Initialize AI client
    if (this.aiProvider === 'openai') {
      this.client = new OpenAI({
        apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY
      });
    } else if (this.aiProvider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY
      });
    } else {
      throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
    }
  }

  async analyzePaymentFlows(packedCodebase) {
    const prompt = this.createAnalysisPrompt(packedCodebase);
    
    try {
      let response;
      
      if (this.aiProvider === 'openai') {
        response = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        });
        
        const content = response.choices[0].message.content;
        return this.parseAnalysisResponse(content);
        
      } else if (this.aiProvider === 'anthropic') {
        response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4000,
          temperature: 0.1,
          system: this.getSystemPrompt(),
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
        
        const content = response.content[0].text;
        return this.parseAnalysisResponse(content);
      }
      
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  getSystemPrompt() {
    return `You are an expert software architect specializing in payment system analysis. Your task is to analyze codebases and identify payment-related flows, patterns, and integrations.

Key areas to focus on:
- Payment processing workflows (checkout, billing, subscriptions)
- Payment gateway integrations (Stripe, PayPal, Square, etc.)
- Transaction handling and state management
- Payment validation and error handling
- Webhook processing for payment events
- Refund and cancellation flows
- Security patterns in payment code

Output your analysis as a structured JSON response with the following format:
{
  "summary": "Brief overview of payment systems found",
  "flows": [
    {
      "name": "Flow name",
      "type": "checkout|billing|subscription|refund|webhook",
      "description": "Detailed description of the flow",
      "files": ["list", "of", "relevant", "files"],
      "components": ["key", "classes", "or", "functions"],
      "integrations": ["payment", "gateways", "used"],
      "mermaidSuggestion": "Suggested mermaid diagram structure"
    }
  ],
  "integrations": {
    "stripe": { "found": true, "files": ["file1.rb"], "features": ["payments", "webhooks"] },
    "paypal": { "found": false },
    "square": { "found": false }
  },
  "security": {
    "patterns": ["security patterns found"],
    "concerns": ["potential security issues"]
  }
}

Be thorough but concise. Focus on actionable insights that would help developers understand and document the payment flows.`;
  }

  createAnalysisPrompt(packedCodebase) {
    return `Please analyze the following codebase for payment-related flows and patterns. The codebase has been packed using Repomix and contains the complete repository structure and file contents.

Focus on identifying:
1. Payment processing workflows and business logic
2. Integration with payment gateways (Stripe, PayPal, etc.)
3. Transaction handling and state management
4. Payment-related API endpoints and controllers
5. Database models related to payments, orders, subscriptions
6. Webhook handlers for payment events
7. Error handling and validation patterns
8. Security measures in payment code

Here is the packed codebase:

${packedCodebase}

Please provide a comprehensive analysis following the JSON structure specified in the system prompt.`;
  }

  parseAnalysisResponse(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create a structured response from the text
      return {
        summary: content.substring(0, 500) + '...',
        flows: [],
        integrations: {},
        security: {
          patterns: [],
          concerns: []
        },
        rawResponse: content
      };
      
    } catch (error) {
      // Fallback: return the raw response with minimal structure
      return {
        summary: 'Failed to parse AI response as JSON',
        flows: [],
        integrations: {},
        security: {
          patterns: [],
          concerns: []
        },
        rawResponse: content,
        parseError: error.message
      };
    }
  }

  // Helper method to validate analysis results
  validateAnalysis(analysis) {
    const required = ['summary', 'flows', 'integrations', 'security'];
    const missing = required.filter(field => !analysis.hasOwnProperty(field));
    
    if (missing.length > 0) {
      console.warn(`Analysis missing required fields: ${missing.join(', ')}`);
    }
    
    return missing.length === 0;
  }

  // Method to get payment patterns for different languages/frameworks
  getPaymentPatterns(language) {
    const patterns = {
      ruby: [
        'Stripe::', 'PayPal::', 'payment', 'charge', 'subscription',
        'invoice', 'webhook', 'transaction', 'billing'
      ],
      javascript: [
        'stripe', 'paypal', 'payment', 'charge', 'subscription',
        'checkout', 'billing', 'transaction'
      ],
      python: [
        'stripe', 'paypal', 'payment', 'charge', 'subscription',
        'billing', 'transaction', 'webhook'
      ],
      php: [
        'Stripe\\', 'PayPal\\', 'payment', 'charge', 'subscription',
        'billing', 'transaction', 'webhook'
      ]
    };
    
    return patterns[language] || patterns.javascript;
  }

  // Method to extract file-specific payment information
  extractFilePaymentInfo(fileContent, filePath) {
    const info = {
      path: filePath,
      hasPaymentCode: false,
      patterns: [],
      functions: [],
      classes: []
    };
    
    // Common payment-related patterns
    const paymentPatterns = [
      /payment/gi,
      /stripe/gi,
      /paypal/gi,
      /charge/gi,
      /subscription/gi,
      /billing/gi,
      /invoice/gi,
      /webhook/gi,
      /transaction/gi,
      /checkout/gi
    ];
    
    paymentPatterns.forEach(pattern => {
      if (pattern.test(fileContent)) {
        info.hasPaymentCode = true;
        info.patterns.push(pattern.source);
      }
    });
    
    return info;
  }
}

module.exports = PaymentFlowAnalyzer;
