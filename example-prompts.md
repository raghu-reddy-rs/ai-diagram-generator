# Example Prompts for Analyzer

Here are some useful prompts you can use with the analyzer tool:

## Payment Flow Analysis
```bash
analyzer analyze --prompt "Analyze this codebase for payment processing flows and generate a sequence diagram showing the payment lifecycle from initiation to completion. Include user interactions, API calls, database operations, external service integrations (Stripe, PayPal, etc.), error handling flows, and webhook processing."
```

## System Architecture
```bash
analyzer analyze --prompt "Create a component diagram showing the system architecture. Highlight main application modules/components, dependencies between components, data flow directions, external integrations, database connections, and API endpoints."
```

## Database Schema
```bash
analyzer analyze --prompt "Analyze database models and relationships, then generate an entity-relationship diagram. Include database tables/models, relationships (one-to-one, one-to-many, many-to-many), key fields and constraints, indexes if apparent, and foreign key relationships."
```

## API Flow
```bash
analyzer analyze --prompt "Generate a sequence diagram showing API request/response flows. Include authentication, request validation, business logic processing, database interactions, and response formatting."
```

## Class Relationships
```bash
analyzer analyze --prompt "Create a class diagram showing the object-oriented structure of this codebase. Include classes, interfaces, inheritance relationships, composition relationships, and key methods."
```

## Workflow Analysis
```bash
analyzer analyze --prompt "Analyze the codebase for business workflows and processes. Create a flowchart showing process entry points, decision points and conditions, process steps and actions, error handling paths, success/completion paths, and integration points."
```

## Security Flow
```bash
analyzer analyze --prompt "Analyze the security aspects of this codebase and create a diagram showing authentication flows, authorization checks, data validation points, security middleware, and potential security boundaries."
```

## Data Flow
```bash
analyzer analyze --prompt "Create a data flow diagram showing how data moves through the system. Include data sources, processing steps, transformations, storage points, and data outputs."
```

## Microservices Architecture
```bash
analyzer analyze --prompt "If this is a microservices architecture, create a diagram showing service boundaries, inter-service communication, shared databases, message queues, and external dependencies."
```

## Testing Strategy
```bash
analyzer analyze --prompt "Analyze the testing structure and create a diagram showing test types (unit, integration, e2e), test coverage areas, mocking strategies, and test data flow."
```
