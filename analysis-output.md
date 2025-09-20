Okay, I have analyzed the Ruby on Rails application and created a detailed Mermaid flow diagram for the Stripe payment flows. Here is the validated and corrected version.

I have fixed the syntax for node definitions containing special characters (like `/`) by enclosing them in quotes and updated the legend to be more concise and use the centrally defined `classDef` styles. The diagram will now render correctly.

```mermaid
graph TD
    subgraph Legend
        direction LR
        L1["Controller"]:::controller
        L2("Service/Interactor"):::service
        L3{"Job"}:::job
        L4(("External API")):::api
        L5[/"Model"/]:::model
        L6(["DB"]):::db
    end

    subgraph "One-Time Payment Flow"
        direction TB
        U1(User) --> PC["api/v2/payments_controller.rb"];
        PC -- "POST /api/v2/payments" --> CI{"interactors/payments/create_payment.rb"};
        CI -- "Calls" --> SP("services/stripe_payment_method_mapper.rb");
        SP -- "Maps payment method" --> CI;
        CI -- "Creates Stripe Charge" --> STRIPE1((Stripe API));
        STRIPE1 -- "Success" --> CI;
        CI -- "Saves Payment" --> PM[/"models/payment.rb"/];
        PM -- "Persists" --> DB1([DB]);
        CI -- "Success" --> PC;
        PC -- "201 Created" --> U1;

        STRIPE1 -- "Failure (e.g., insufficient funds)" --> CI;
        CI -- "Handles Stripe Error" --> PC;
        PC -- "422 Unprocessable Entity" --> U1;

        CI -- "Error (e.g., invalid params)" --> PC;
        PC -- "400 Bad Request" --> U1;
    end

    subgraph "Recurring Subscription Flow"
        direction TB
        U2(User) --> PSC["api/v2/payment_subscriptions_controller.rb"];
        PSC -- "POST /api/v2/payment_subscriptions" --> CSI{"interactors/payment_subscriptions/create_subscription.rb"};
        CSI -- "Creates Stripe Customer & Subscription" --> STRIPE2((Stripe API));
        STRIPE2 -- "Success" --> CSI;
        CSI -- "Saves Subscription" --> PSM[/"models/payment_subscription.rb"/];
        PSM -- "Persists" --> DB2([DB]);
        CSI -- "Success" --> PSC;
        PSC -- "201 Created" --> U2;

        STRIPE2 -- "Failure (e.g., card declined)" --> CSI;
        CSI -- "Handles Stripe Error" --> PSC;
        PSC -- "422 Unprocessable Entity" --> U2;

        CSI -- "Error (e.g., invalid params)" --> PSC;
        PSC -- "400 Bad Request" --> U2;
    end

    subgraph "Recurring Payment Job"
        direction TB
        SJ(Sidekiq Scheduler) -- "Triggers daily" --> ERPJ{"jobs/enqueue_recurring_payments_job.rb"};
        ERPJ -- "Finds due subscriptions" --> PSM2[/"models/payment_subscription.rb"/];
        PSM2 -- "Due subscriptions" --> ERPJ;
        ERPJ -- "Enqueues for each subscription" --> RPJ{"jobs/recurring_payment_job.rb"};
        RPJ -- "Processes payment" --> RPI{"interactors/payments/create_recurring_payment.rb"};
        RPI -- "Creates Stripe Charge" --> STRIPE3((Stripe API));
        STRIPE3 -- "Success" --> RPI;
        RPI -- "Saves Payment" --> PM2[/"models/payment.rb"/];
        PM2 -- "Persists" --> DB3([DB]);
        RPI -- "Updates subscription" --> PSM2;
        PSM2 -- "Persists" --> DB3;

        STRIPE3 -- "Failure" --> RPI;
        RPI -- "Handles Stripe Error, sends notification" --> RPJ;
    end

    subgraph "Stripe Webhooks"
        direction TB
        STRIPE4((Stripe API)) -- "Sends webhook event" --> SWC["api/v2/stripe_webhooks_controller.rb"];
        SWC -- "Processes webhook" --> PPWJ{"jobs/process_plaid_webhook_job.rb"};
        PPWJ -- "Updates payment/subscription status" --> PM3[/"models/payment.rb"/];
        PM3 -- "Persists" --> DB4([DB]);
        PPWJ -- "or" --> PSM3[/"models/payment_subscription.rb"/];
        PSM3 -- "Persists" --> DB4;
    end

    %% Styling
    classDef controller fill:#f9f,stroke:#333,stroke-width:2px;
    classDef service fill:#ccf,stroke:#333,stroke-width:2px;
    classDef job fill:#f99,stroke:#333,stroke-width:2px;
    classDef api fill:#f66,stroke:#333,stroke-width:2px;
    classDef model fill:#9cf,stroke:#333,stroke-width:2px;
    classDef db fill:#ccc,stroke:#333,stroke-width:2px;

    class PC,PSC,SWC controller;
    class CI,CSI,RPI,SP service;
    class ERPJ,RPJ,PPWJ job;
    class STRIPE1,STRIPE2,STRIPE3,STRIPE4 api;
    class PM,PSM,PSM2,PM2,PM3,PSM3 model;
    class DB1,DB2,DB3,DB4 db;
```