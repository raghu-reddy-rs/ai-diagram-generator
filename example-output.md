# System Architecture & Data Flow: Diagram Generator CLI

This document provides a detailed architectural overview of the Diagram Generator CLI, a Node.js application designed to analyze codebases and generate Mermaid diagrams using a Large Language Model (LLM).

The system is architected as a sophisticated wrapper around the Gemini CLI, orchestrating a multi-step pipeline involving prompt engineering, AI-driven analysis, validation, and iterative refinement.

## 1. Component Legend

The following color and shape scheme is used in the diagrams to represent different types of components within the system:

```mermaid
graph TD
    subgraph "Legend"
        direction LR
        User["fa:fa-user User"]:::actor
        CLI(fa:fa-terminal CLI Application):::cli
        Orchestrator{Core Logic / Orchestrator}:::orchestrator
        FileSystem[/fa:fa-folder File System/]:::storage
        LLM_Service[(fa:fa-brain LLM / AI Service)]:::external
        PromptEngine((Prompt Engineering)):::process
        MarkdownOutput[[fa:fa-file-alt Generated Markdown]]:::artifact
    end

    classDef actor fill:#d4edda,stroke:#c3e6cb,stroke-width:2px
    classDef cli fill:#cce5ff,stroke:#b8daff,stroke-width:2px
    classDef orchestrator fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px
    classDef storage fill:#fff3cd,stroke:#ffeeba,stroke-width:2px
    classDef external fill:#e2e3e5,stroke:#d6d8db,stroke-width:2px
    classDef process fill:#d1ecf1,stroke:#bee5eb,stroke-width:2px
    classDef artifact fill:#fefefe,stroke:#ddd,stroke-width:2px
```

## 2. High-Level System Architecture

The application operates as a command-line tool that takes a user's request, analyzes a local codebase, interacts with an LLM to generate architectural documentation, and saves the result as a markdown file.

```mermaid
graph TD
    subgraph "Diagram Generator CLI"
        direction TB
        CLI(fa:fa-terminal CLI Entrypoint<br>src/cli.js)
        Orchestrator{Main Orchestrator<br>src/index.js}
        PromptEngine((Prompt Engineering))
        LLM_Interaction(LLM Interaction Layer)
    end

    User["fa:fa-user User"] -- Invokes with prompt --> CLI
    CLI -- Initiates analysis --> Orchestrator
    Orchestrator -- Reads codebase --> FileSystem[/fa:fa-folder Local Codebase/]
    FileSystem -- Returns file contents --> Orchestrator
    Orchestrator -- Uses --> PromptEngine
    PromptEngine -- Creates structured prompt --> Orchestrator
    Orchestrator -- Sends prompt via --> LLM_Interaction
    LLM_Interaction -- Queries --> LLM_Service[(fa:fa-brain Gemini LLM)]
    LLM_Service -- Returns analysis & diagrams --> LLM_Interaction
    LLM_Interaction -- Forwards response --> Orchestrator
    Orchestrator -- Writes to --> FinalOutput[[fa:fa-file-alt analysis-output.md]]

    style User fill:#d4edda,stroke:#c3e6cb
    style FinalOutput fill:#e2e3e5,stroke:#d6d8db
    style FileSystem fill:#fff3cd,stroke:#ffeeba
    style LLM_Service fill:#cce5ff,stroke:#b8daff
```

## 3. Core Components & Responsibilities

### 3.1. CLI Entrypoint (`src/cli.js`)
- **Responsibility:** Serves as the primary interface for the user.
- **Functionality:**
    - Parses command-line arguments and flags.
    - Handles user input, such as the initial analysis prompt.
    - Invokes the `Main Orchestrator` to start the generation process.
    - Displays status updates, progress indicators, and final output location to the user.

### 3.2. Main Orchestrator (`src/index.js`)
- **Responsibility:** The core of the application, managing the entire workflow from start to finish.
- **Functionality:**
    - Receives the initial request from the `CLI Entrypoint`.
    - Scans the target directory to gather context on the codebase structure and files.
    - Manages the state of the analysis, including intermediate steps and refinement loops.
    - Coordinates between the `Prompt Engineering` module, `LLM Interaction` layer, and the file system.
    - Handles the final output generation, writing the markdown received from the LLM to a file.

### 3.3. Prompt Engineering
- **Responsibility:** Constructs the detailed, context-rich prompts required by the LLM for accurate analysis.
- **Functionality:**
    - Gathers codebase context (file listings, key file contents).
    - Integrates the user's specific request.
    - Formats the information into a structured prompt that instructs the LLM to generate a markdown document with embedded Mermaid diagrams.

### 3.4. LLM Interaction Layer
- **Responsibility:** Manages all communication with the external Gemini LLM service.
- **Functionality:**
    - Wraps the Gemini CLI or API.
    - Sends the structured prompt to the LLM.
    - Handles responses, including streaming output and error management.
    - Validates or sanitizes the LLM output before passing it back to the `Main Orchestrator`.

## 4. Detailed Process & Data Flow

The following sequence diagram illustrates the step-by-step interaction between the components during a typical execution.

```mermaid
sequenceDiagram
    actor User
    participant CLI as CLI (src/cli.js)
    participant Orchestrator as Orchestrator (src/index.js)
    participant FileSystem as File System
    participant LLM as Gemini LLM Service

    User->>+CLI: Executes command with a prompt (e.g., "Analyze the auth flow")
    CLI->>+Orchestrator: startAnalysis(prompt)
    Orchestrator->>+FileSystem: scanDirectory(./)
    FileSystem-->>-Orchestrator: return file tree & contents
    Orchestrator->>Orchestrator: buildComprehensivePrompt(userPrompt, fileContext)
    Orchestrator->>+LLM: sendAnalysisRequest(comprehensivePrompt)
    LLM-->>LLM: Processes code, generates analysis and Mermaid diagrams
    LLM-->>-Orchestrator: streamMarkdownResponse()
    Orchestrator->>+FileSystem: writeToFile("analysis-output.md", markdownChunk)
    FileSystem-->>-Orchestrator: success
    Note right of Orchestrator: This may loop for streaming responses.
    Orchestrator-->>-CLI: analysisComplete("analysis-output.md")
    CLI-->>-User: Displays "Analysis complete. Output written to analysis-output.md"
```

This entire process enables a powerful, automated workflow for generating high-quality architectural documentation directly from a project's source code, driven by the analytical capabilities of a large language model.