# Example Prompts for Diagram Generator

This collection provides proven prompts for different analysis scenarios. The AI enhancement system will automatically adapt these prompts to your specific codebase and domain.

## 🏗️ System Architecture

### High-Level Architecture Overview
```bash
node src/cli.js analyze --prompt "Create a comprehensive system architecture diagram showing all major components, their relationships, data flows, and external integrations. Include both logical and physical architecture views."
```

### Microservices Architecture
```bash
node src/cli.js analyze --prompt "Document the microservices architecture with service boundaries, inter-service communication patterns, shared databases, message queues, API gateways, and external dependencies. Show both synchronous and asynchronous communication flows."
```

### Layered Architecture
```bash
node src/cli.js analyze --prompt "Analyze the layered architecture showing presentation layer, business logic layer, data access layer, and infrastructure layer. Include dependencies, data flow between layers, and key patterns used."
```

## 💳 Payment & E-commerce Systems

### Complete Payment Flow
```bash
node src/cli.js analyze --prompt "Analyze payment processing flows and generate a comprehensive sequence diagram showing the complete payment lifecycle from cart to completion. Include user interactions, payment gateway integrations (Stripe, PayPal, etc.), fraud detection, webhook processing, refund flows, and error handling scenarios."
```

### Stripe-Specific Payment Integration
```bash
# Real-world example: Analyzing specific payment provider flows
node src/cli.js analyze ../tenant-portal-backend --prompt "Analyze this application and create a flow diagram showing the various Stripe specific payment flows. IGNORE plaid since that is going to be removed" --verbose
```

### Payment Provider Migration
```bash
node src/cli.js analyze --prompt "Document current payment flows and identify components that need to be updated when migrating from [old provider] to [new provider]. Highlight integration points and data transformation requirements."
```

### Order Management System
```bash
node src/cli.js analyze --prompt "Document the order management system with flowcharts showing order creation, inventory management, fulfillment processes, shipping integration, order status updates, and cancellation/return workflows."
```

### Subscription & Billing
```bash
node src/cli.js analyze --prompt "Create diagrams for subscription and billing systems showing subscription lifecycle, recurring billing, plan changes, proration calculations, dunning management, and payment retry logic."
```

## 🔐 Authentication & Security

### Authentication System
```bash
node src/cli.js analyze --prompt "Analyze the authentication system and create sequence diagrams showing user registration, login flows, password reset, multi-factor authentication, session management, JWT token handling, and OAuth integration patterns."
```

### Authorization & RBAC
```bash
node src/cli.js analyze --prompt "Document the authorization system with diagrams showing role-based access control (RBAC), permission management, resource protection, policy enforcement points, and access decision flows."
```

### Security Architecture
```bash
node src/cli.js analyze --prompt "Create a comprehensive security architecture diagram showing authentication boundaries, authorization checkpoints, data encryption points, security middleware, input validation, and potential attack vectors with their mitigations."
```

## 🗄️ Database & Data Management

### Database Schema & Relationships
```bash
node src/cli.js analyze --prompt "Generate an entity-relationship diagram showing all database tables, relationships (one-to-one, one-to-many, many-to-many), foreign key constraints, indexes, and data integrity rules. Include both logical and physical data models."
```

### Data Flow & ETL Processes
```bash
node src/cli.js analyze --prompt "Create data flow diagrams showing how data moves through the system, including data ingestion, transformation processes, validation steps, storage mechanisms, and data export/reporting flows."
```

### Caching Strategy
```bash
node src/cli.js analyze --prompt "Document the caching architecture showing cache layers (browser, CDN, application, database), cache invalidation strategies, cache warming processes, and cache consistency mechanisms."
```

## 🌐 API & Integration

### REST API Documentation
```bash
node src/cli.js analyze --prompt "Generate comprehensive API documentation with sequence diagrams showing request/response flows for all endpoints. Include authentication, request validation, business logic processing, database interactions, error handling, and response formatting."
```

### GraphQL Schema & Resolvers
```bash
node src/cli.js analyze --prompt "Document the GraphQL architecture showing schema definitions, resolver functions, data fetching patterns, query optimization, subscription handling, and integration with underlying data sources."
```

### Third-Party Integrations
```bash
node src/cli.js analyze --prompt "Create integration diagrams showing all external service integrations, API calls, webhook handling, data synchronization processes, error handling, retry mechanisms, and fallback strategies."
```

## 📊 Data Processing & Analytics

### Real-Time Data Pipeline
```bash
node src/cli.js analyze --prompt "Document the real-time data processing pipeline with flowcharts showing data ingestion, stream processing, event handling, data transformation, aggregation logic, and output to various sinks."
```

### Batch Processing System
```bash
node src/cli.js analyze --prompt "Create diagrams for batch processing systems showing job scheduling, data extraction, transformation logic, validation processes, error handling, monitoring, and result distribution."
```

### Analytics & Reporting
```bash
node src/cli.js analyze --prompt "Document the analytics and reporting system showing data collection, aggregation processes, report generation, dashboard updates, and data visualization components."
```

## 🧪 Testing & Quality Assurance

### Testing Architecture
```bash
node src/cli.js analyze --prompt "Analyze the testing strategy and create diagrams showing test pyramid structure, unit test coverage, integration test flows, end-to-end test scenarios, mocking strategies, test data management, and CI/CD test pipeline integration."
```

### Quality Gates & Code Review
```bash
node src/cli.js analyze --prompt "Document the quality assurance process with flowcharts showing code review workflows, automated quality checks, static analysis integration, security scanning, performance testing, and deployment gates."
```

## 🚀 DevOps & Infrastructure

### CI/CD Pipeline
```bash
node src/cli.js analyze --prompt "Create comprehensive diagrams of the CI/CD pipeline showing source control integration, build processes, testing stages, security scanning, artifact management, deployment strategies, and rollback procedures."
```

### Infrastructure Architecture
```bash
node src/cli.js analyze --prompt "Document the infrastructure architecture showing server topology, load balancers, databases, caching layers, monitoring systems, logging infrastructure, and disaster recovery mechanisms."
```

### Container & Orchestration
```bash
node src/cli.js analyze --prompt "Analyze containerization and orchestration setup with diagrams showing Docker containers, Kubernetes clusters, service mesh, ingress controllers, persistent storage, and scaling mechanisms."
```

## 📱 Frontend & User Experience

### Frontend Architecture
```bash
node src/cli.js analyze --prompt "Document the frontend architecture showing component hierarchy, state management, routing, API integration, asset management, build processes, and performance optimization strategies."
```

### User Journey & Workflows
```bash
node src/cli.js analyze --prompt "Create user journey diagrams showing key user workflows, decision points, form interactions, navigation patterns, error states, and success paths through the application."
```

### Mobile App Architecture
```bash
node src/cli.js analyze --prompt "Analyze mobile application architecture showing native/hybrid components, state management, offline capabilities, push notifications, deep linking, and platform-specific integrations."
```

## 🔄 Event-Driven Architecture

### Event Sourcing & CQRS
```bash
node src/cli.js analyze --prompt "Document event sourcing and CQRS patterns showing event stores, command handlers, event handlers, read models, projections, and eventual consistency mechanisms."
```

### Message Queues & Pub/Sub
```bash
node src/cli.js analyze --prompt "Create diagrams for message-driven architecture showing message queues, publishers, subscribers, message routing, dead letter queues, and message processing patterns."
```

### Saga Pattern
```bash
node src/cli.js analyze --prompt "Document distributed transaction management using saga patterns, showing orchestration vs choreography approaches, compensation actions, and failure handling strategies."
```

## 🎯 Domain-Specific Prompts

### Healthcare Systems
```bash
node src/cli.js analyze --prompt "Analyze healthcare system architecture focusing on patient data flows, HIPAA compliance boundaries, clinical workflows, integration with medical devices, and audit trail mechanisms."
```

### Financial Services
```bash
node src/cli.js analyze --prompt "Document financial services architecture showing transaction processing, regulatory compliance controls, risk management systems, audit trails, and integration with banking networks."
```

### IoT & Edge Computing
```bash
node src/cli.js analyze --prompt "Create diagrams for IoT architecture showing device connectivity, edge processing, data aggregation, cloud integration, device management, and real-time analytics."
```

### Machine Learning Systems
```bash
node src/cli.js analyze --prompt "Document ML system architecture showing data pipelines, model training workflows, feature stores, model serving infrastructure, A/B testing frameworks, and model monitoring systems."
```

## 💡 Advanced Analysis Techniques

### Performance & Scalability
```bash
node src/cli.js analyze --prompt "Analyze system performance and scalability aspects with diagrams showing bottlenecks, scaling strategies, caching layers, database optimization, and performance monitoring points."
```

### Error Handling & Resilience
```bash
node src/cli.js analyze --prompt "Document error handling and system resilience patterns showing circuit breakers, retry mechanisms, fallback strategies, graceful degradation, and failure recovery processes."
```

### Monitoring & Observability
```bash
node src/cli.js analyze --prompt "Create comprehensive observability diagrams showing logging architecture, metrics collection, distributed tracing, alerting systems, and dashboard configurations."
```

### Legacy System Integration
```bash
node src/cli.js analyze --prompt "Document legacy system integration patterns showing adapter patterns, data transformation layers, gradual migration strategies, and coexistence mechanisms."
```

## 🎯 Real-World Examples

These examples show how to craft effective, specific prompts for actual projects:

### Focused Analysis with Exclusions
```bash
# Analyze specific functionality while ignoring deprecated components
node src/cli.js analyze ../tenant-portal-backend --prompt "Analyze this application and create a flow diagram showing the various Stripe specific payment flows. IGNORE plaid since that is going to be removed" --verbose

# Focus on active features only
node src/cli.js analyze ./src --prompt "Document the user authentication system but EXCLUDE the legacy OAuth1 implementation that's being deprecated"

# Analyze current architecture while planning migration
node src/cli.js analyze --prompt "Document the current microservices architecture but IGNORE the monolith components that are scheduled for decomposition"
```

### Project-Specific Analysis
```bash
# Multi-tenant application analysis
node src/cli.js analyze ./tenant-service --prompt "Analyze this multi-tenant SaaS application showing tenant isolation, data segregation, and billing integration per tenant"

# API versioning strategy
node src/cli.js analyze ./api --prompt "Document the API versioning strategy showing v1, v2, and v3 endpoints, deprecation paths, and backward compatibility mechanisms"

# Feature flag implementation
node src/cli.js analyze --prompt "Analyze the feature flag system showing flag evaluation, user targeting, gradual rollouts, and A/B testing integration"
```

### Integration-Focused Analysis
```bash
# Third-party service integration
node src/cli.js analyze --prompt "Document integration with Salesforce CRM showing data synchronization, webhook handling, and error recovery for lead management"

# Payment processor comparison
node src/cli.js analyze --prompt "Compare Stripe and PayPal integration implementations, highlighting differences in webhook handling, refund processing, and subscription management"

# Database migration analysis
node src/cli.js analyze --prompt "Document the current PostgreSQL schema and create migration diagrams for the planned move to MongoDB, showing data transformation requirements"
```

### Maintenance and Refactoring
```bash
# Technical debt analysis
node src/cli.js analyze --prompt "Identify and document technical debt areas, showing tightly coupled components, code duplication, and refactoring opportunities"

# Performance bottleneck identification
node src/cli.js analyze --prompt "Analyze performance-critical paths and create diagrams showing current bottlenecks, caching opportunities, and optimization strategies"

# Security audit preparation
node src/cli.js analyze --prompt "Document security-sensitive components and data flows for upcoming security audit, highlighting authentication boundaries and data encryption points"
```

## 🎨 Customization Tips

### Audience-Specific Documentation
```bash
# For executives and stakeholders
node src/cli.js analyze --prompt "Create high-level architectural overview suitable for executive presentation, focusing on business value, cost implications, and strategic technology decisions."

# For developers
node src/cli.js analyze --prompt "Generate detailed technical documentation for developers, including implementation patterns, code organization, design decisions, and development guidelines."

# For operations teams
node src/cli.js analyze --prompt "Document operational aspects including deployment procedures, monitoring requirements, troubleshooting guides, and maintenance workflows."
```

### Technology-Specific Analysis
```bash
# For specific frameworks
node src/cli.js analyze --prompt "Analyze this React application showing component architecture, state management with Redux, routing patterns, and performance optimization techniques."

node src/cli.js analyze --prompt "Document this Spring Boot application showing bean configuration, dependency injection, security configuration, and data access patterns."

# For specific languages
node src/cli.js analyze --prompt "Analyze this Python codebase focusing on module organization, class hierarchies, async/await patterns, and package dependencies."
```

Remember: The AI enhancement system will automatically adapt these prompts to your specific codebase, adding relevant technical details and domain-specific components. Start with these templates and let the system enhance them for optimal results!
