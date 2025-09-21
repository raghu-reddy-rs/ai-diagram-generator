# Architectural Overview: Stripe and Payment Processing

This document outlines the payment processing architecture within the Tenant Portal Backend, focusing on one-time and recurring payment flows. The system primarily interacts with an internal Stessa API, which then mediates interactions with external payment gateways like Stripe and Plaid.

## Key Components

*   **Tenant Portal Backend (TPB)**: The application responsible for user-facing payment initiation and status updates.
*   **Internal Stessa API (ISA)**: An internal service that abstracts direct interactions with payment gateways.
*   **Stripe**: External payment gateway for credit card processing.
*   **Plaid**: External service for ACH (Automated Clearing House) bank transfers.
*   **Analytics Service**: Collects and processes payment-related events.
*   **RecurringPaymentJob**: A background job within the Tenant Portal Backend that handles scheduled recurring payments.
*   **stessa.com/stripe_payments webhook**: An external webhook endpoint called by the Internal Stessa API for Stripe-related events.

## System Overview

```mermaid
graph TD
    A[Tenant Portal Backend] --> B(Internal Stessa API)
    B --> C(Stripe)
    B --> D(Plaid)
    A --> E(Analytics Service)
    subgraph Tenant Portal Backend
        F[RecurringPaymentJob]
    end
    F --> B
    B -- Calls external webhook --> G(stessa.com/stripe_payments webhook)
```

## One-Time Payment Flow (Stripe)

This sequence diagram illustrates the process for a user initiating a one-time payment via Stripe.

```mermaid
sequenceDiagram
    participant User
    participant TPB as Tenant Portal Backend
    participant ISA as Internal Stessa API
    participant Stripe

    User->>TPB: Initiates One-Time Stripe Payment
    TPB->>ISA: Request Stripe Payment (amount, token)
    ISA->>Stripe: Process Payment
    Stripe-->>ISA: Payment Result
    ISA-->>TPB: Payment Confirmation/Failure
    TPB->>TPB: Update Payment Status
    TPB->>Analytics: Send Payment Event
```

## One-Time Payment Flow (ACH via Plaid)

This sequence diagram details the flow for a user making a one-time ACH payment through Plaid.

```mermaid
sequenceDiagram
    participant User
    participant TPB as Tenant Portal Backend
    participant ISA as Internal Stessa API
    participant Plaid

    User->>TPB: Initiates One-Time ACH Payment
    TPB->>ISA: Request Plaid ACH Payment (amount, account_info)
    ISA->>Plaid: Initiate ACH Transfer
    Plaid-->>ISA: ACH Transfer Status
    ISA-->>TPB: ACH Confirmation/Failure
    TPB->>TPB: Update Payment Status
    TPB->>Analytics: Send Payment Event
```

## Recurring Payment Flow (ACH via Plaid)

This diagram shows how recurring ACH payments are processed, initiated by the `RecurringPaymentJob`.

```mermaid
sequenceDiagram
    participant RecurringPaymentJob
    participant TPB as Tenant Portal Backend
    participant ISA as Internal Stessa API
    participant Plaid

    RecurringPaymentJob->>ISA: Request Recurring ACH Payment (subscription_id)
    ISA->>Plaid: Initiate ACH Transfer
    Plaid-->>ISA: ACH Transfer Status
    ISA-->>RecurringPaymentJob: ACH Confirmation/Failure
    RecurringPaymentJob->>TPB: Update Subscription Status
    TPB->>Analytics: Send Recurring Payment Event
```

## Note on Webhook Handling

It's important to note that the Tenant Portal Backend does not directly expose or handle Stripe webhooks. Asynchronous updates from Stripe are likely managed by the Internal Stessa API, which also makes outbound calls to an external `stessa.com/stripe_payments` webhook.