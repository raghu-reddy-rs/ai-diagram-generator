class MermaidGenerator {
  constructor() {
    this.diagramTypes = {
      flowchart: 'flowchart TD',
      sequence: 'sequenceDiagram',
      class: 'classDiagram',
      state: 'stateDiagram-v2'
    };
  }

  async generateDiagrams(analysisResult) {
    const diagrams = [];
    
    if (!analysisResult.flows || analysisResult.flows.length === 0) {
      return diagrams;
    }

    // Generate overview diagram
    const overviewDiagram = this.generateOverviewDiagram(analysisResult);
    if (overviewDiagram) {
      diagrams.push(overviewDiagram);
    }

    // Generate individual flow diagrams
    for (const flow of analysisResult.flows) {
      const flowDiagram = this.generateFlowDiagram(flow);
      if (flowDiagram) {
        diagrams.push(flowDiagram);
      }
    }

    // Generate integration diagram if multiple payment gateways found
    const integrationDiagram = this.generateIntegrationDiagram(analysisResult.integrations);
    if (integrationDiagram) {
      diagrams.push(integrationDiagram);
    }

    return diagrams;
  }

  generateOverviewDiagram(analysisResult) {
    if (!analysisResult.flows || analysisResult.flows.length === 0) {
      return null;
    }

    let mermaid = 'flowchart TD\n';
    let nodeId = 1;
    const nodes = new Map();

    // Add start node
    mermaid += '    Start([User Initiates Payment])\n';
    nodes.set('start', 'Start');

    // Add flow nodes
    analysisResult.flows.forEach((flow, index) => {
      const flowNodeId = `Flow${index + 1}`;
      const flowName = this.sanitizeNodeName(flow.name || `Payment Flow ${index + 1}`);
      mermaid += `    ${flowNodeId}[${flowName}]\n`;
      nodes.set(flow.name, flowNodeId);
    });

    // Add integration nodes
    if (analysisResult.integrations) {
      Object.entries(analysisResult.integrations).forEach(([gateway, info]) => {
        if (info.found) {
          const gatewayNodeId = `Gateway_${gateway}`;
          const gatewayName = this.capitalizeFirst(gateway);
          mermaid += `    ${gatewayNodeId}[${gatewayName} API]\n`;
          nodes.set(gateway, gatewayNodeId);
        }
      });
    }

    // Add end nodes
    mermaid += '    Success([Payment Success])\n';
    mermaid += '    Failure([Payment Failed])\n';

    // Add connections
    mermaid += '\n    Start --> Flow1\n';
    
    analysisResult.flows.forEach((flow, index) => {
      const currentFlow = `Flow${index + 1}`;
      const nextFlow = `Flow${index + 2}`;
      
      if (index < analysisResult.flows.length - 1) {
        mermaid += `    ${currentFlow} --> ${nextFlow}\n`;
      } else {
        mermaid += `    ${currentFlow} --> Success\n`;
        mermaid += `    ${currentFlow} --> Failure\n`;
      }
    });

    // Add gateway connections
    if (analysisResult.integrations) {
      Object.entries(analysisResult.integrations).forEach(([gateway, info]) => {
        if (info.found) {
          const gatewayNodeId = `Gateway_${gateway}`;
          mermaid += `    Flow1 --> ${gatewayNodeId}\n`;
          mermaid += `    ${gatewayNodeId} --> Success\n`;
          mermaid += `    ${gatewayNodeId} --> Failure\n`;
        }
      });
    }

    return {
      title: 'Payment System Overview',
      description: 'High-level overview of the payment processing system',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateFlowDiagram(flow) {
    if (!flow.name && !flow.description) {
      return null;
    }

    let mermaid = 'flowchart TD\n';
    
    // Determine flow type and generate appropriate diagram
    switch (flow.type) {
      case 'checkout':
        return this.generateCheckoutFlow(flow);
      case 'subscription':
        return this.generateSubscriptionFlow(flow);
      case 'webhook':
        return this.generateWebhookFlow(flow);
      case 'refund':
        return this.generateRefundFlow(flow);
      default:
        return this.generateGenericFlow(flow);
    }
  }

  generateCheckoutFlow(flow) {
    const mermaid = `flowchart TD
    A[User Clicks Checkout] --> B[Validate Cart]
    B --> C{Items Valid?}
    C -->|Yes| D[Calculate Total]
    C -->|No| E[Show Error]
    D --> F[Create Payment Intent]
    F --> G[Redirect to Payment Gateway]
    G --> H[User Enters Payment Info]
    H --> I{Payment Successful?}
    I -->|Yes| J[Process Order]
    I -->|No| K[Show Payment Error]
    J --> L[Send Confirmation Email]
    L --> M[Redirect to Success Page]
    K --> N[Return to Checkout]
    E --> N`;

    return {
      title: flow.name || 'Checkout Flow',
      description: flow.description || 'Standard checkout process flow',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateSubscriptionFlow(flow) {
    const mermaid = `flowchart TD
    A[User Selects Plan] --> B[Create Customer]
    B --> C[Setup Payment Method]
    C --> D[Create Subscription]
    D --> E{Subscription Created?}
    E -->|Yes| F[Activate Account]
    E -->|No| G[Show Error]
    F --> H[Send Welcome Email]
    H --> I[Redirect to Dashboard]
    G --> J[Return to Plan Selection]
    
    K[Recurring Billing] --> L[Charge Customer]
    L --> M{Payment Successful?}
    M -->|Yes| N[Extend Subscription]
    M -->|No| O[Retry Payment]
    O --> P{Retry Successful?}
    P -->|Yes| N
    P -->|No| Q[Suspend Account]`;

    return {
      title: flow.name || 'Subscription Flow',
      description: flow.description || 'Subscription management and billing flow',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateWebhookFlow(flow) {
    const mermaid = `flowchart TD
    A[Payment Gateway] --> B[Send Webhook]
    B --> C[Receive Webhook]
    C --> D[Verify Signature]
    D --> E{Signature Valid?}
    E -->|Yes| F[Parse Event Data]
    E -->|No| G[Return 401 Error]
    F --> H{Event Type?}
    H -->|payment.succeeded| I[Update Order Status]
    H -->|payment.failed| J[Handle Failed Payment]
    H -->|subscription.updated| K[Update Subscription]
    I --> L[Send Success Notification]
    J --> M[Send Failure Notification]
    K --> N[Update User Account]
    L --> O[Return 200 OK]
    M --> O
    N --> O`;

    return {
      title: flow.name || 'Webhook Processing Flow',
      description: flow.description || 'Payment webhook event processing',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateRefundFlow(flow) {
    const mermaid = `flowchart TD
    A[Refund Request] --> B[Validate Request]
    B --> C{Request Valid?}
    C -->|Yes| D[Check Refund Policy]
    C -->|No| E[Reject Request]
    D --> F{Within Policy?}
    F -->|Yes| G[Process Refund]
    F -->|No| H[Require Approval]
    G --> I[Call Payment Gateway]
    I --> J{Refund Successful?}
    J -->|Yes| K[Update Order Status]
    J -->|No| L[Log Error]
    K --> M[Send Refund Confirmation]
    H --> N[Manager Review]
    N --> O{Approved?}
    O -->|Yes| G
    O -->|No| E`;

    return {
      title: flow.name || 'Refund Processing Flow',
      description: flow.description || 'Payment refund processing workflow',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateGenericFlow(flow) {
    let mermaid = 'flowchart TD\n';
    
    // Create a simple flow based on available information
    mermaid += '    A[Start] --> B[Process]\n';
    mermaid += '    B --> C{Success?}\n';
    mermaid += '    C -->|Yes| D[Complete]\n';
    mermaid += '    C -->|No| E[Error]\n';

    // Add components if available
    if (flow.components && flow.components.length > 0) {
      flow.components.forEach((component, index) => {
        const nodeId = `Comp${index + 1}`;
        const compName = this.sanitizeNodeName(component);
        mermaid += `    ${nodeId}[${compName}]\n`;
      });
    }

    return {
      title: flow.name || 'Payment Flow',
      description: flow.description || 'Generic payment processing flow',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  generateIntegrationDiagram(integrations) {
    if (!integrations || Object.keys(integrations).length === 0) {
      return null;
    }

    const foundIntegrations = Object.entries(integrations)
      .filter(([_, info]) => info.found);

    if (foundIntegrations.length === 0) {
      return null;
    }

    let mermaid = 'flowchart TD\n';
    mermaid += '    App[Payment Application]\n';

    foundIntegrations.forEach(([gateway, info]) => {
      const gatewayId = `${gateway.toUpperCase()}`;
      const gatewayName = this.capitalizeFirst(gateway);
      mermaid += `    ${gatewayId}[${gatewayName} API]\n`;
      mermaid += `    App --> ${gatewayId}\n`;
    });

    return {
      title: 'Payment Gateway Integrations',
      description: 'Overview of integrated payment gateways',
      type: 'flowchart',
      mermaid: mermaid
    };
  }

  // Helper methods
  sanitizeNodeName(name) {
    return name.replace(/[^\w\s]/g, '').substring(0, 30);
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = MermaidGenerator;
