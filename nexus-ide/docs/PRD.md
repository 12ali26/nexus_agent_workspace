# NEXUS IDE

The Universal AI Workspace

Product Requirements Document &bull; v0.1 &bull; 2026

Confidential — Concept Stage

## 1. Vision & Problem Statement

### 1.1 The Problem

Every knowledge domain — actuarial science, physics, statistics, engineering, law — deserves the same relationship with AI that software development has with VSCode. But today, professionals in those fields interact with AI through a chatbox. Input goes in, output comes out. The process is invisible. The reasoning is hidden. Trust is low.

The software development world solved this with IDEs and agentic coding tools. A developer can watch the AI write code, intervene at any step, edit the result, and direct the next action. The human and the AI share a visible workspace.

No equivalent exists for any other domain.

### 1.2 The Vision

NEXUS IDE is a universal desktop workspace shell — built on Electron — where AI agents work visibly alongside humans across any knowledge domain. The same way VSCode adapts to Python, Rust, or Go through extensions, NEXUS adapts to actuarial science, physics, statistics, or law through domain workspaces and pluggable agents.

The AI is the engine. NEXUS is the cockpit.

### 1.3 The Core Insight

Visualization is not a nice-to-have. It is how humans operate. Even in science fiction, Tony Stark's JARVIS — one of the most advanced AI systems imagined — still worked through holographic visualizations. Humans need to see what is happening to trust it, direct it, and collaborate with it.

NEXUS is built on this principle: every AI action should be rendered as a domain-native visual artifact in real time.

## 2. Market Positioning

| Product | Domain | Agent Support | Visual Workspace |
| --- | --- | --- | --- |
| VSCode + Copilot | Code only | Yes | Code only |
| Jupyter Notebook | Data / Python | No | Partial |
| Wolfram Alpha | Math only | No | Math only |
| ChatGPT / Claude | Any | Partial | None |
| NEXUS IDE | Any domain | Yes — pluggable | Domain-native |

## 3. System Architecture

NEXUS is built on four distinct layers. Each layer is independent. Each has a clear responsibility.

### 3.1 Layer 1 — The Shell (Electron)

The shell is the desktop wrapper. It is built using Electron, the same technology that powers VSCode, Slack, Figma, and Notion desktop. Electron takes a web-based UI and packages it as a native desktop application that runs on Windows, macOS, and Linux without any changes.

The shell is responsible for:

- Launching and managing the application lifecycle
- Providing file system access for loading domain data
- Installing and managing domain workspaces and agents
- Housing the rendering engine and the agent communication layer

The shell itself is domain agnostic. It does not know or care whether the active workspace is actuarial science or structural engineering. It simply provides the environment.

### 3.2 Layer 2 — The Rendering Engine (React)

Inside the Electron shell lives a React-based UI. This is where everything visible happens. The rendering engine maintains a library of render primitives — visual building blocks that any domain workspace or agent can invoke.

#### Core Render Primitives

| Primitive | Description | Example Use |
| --- | --- | --- |
| Table | Structured data grid with highlight support | Mortality tables, datasets |
| Equation | Rendered math formula with resolved value | Reserve calculations, physics formulas |
| Chart | Line, bar, scatter, distribution plots | Survival curves, regression outputs |
| 3D Object | Interactive three-dimensional model | Structural models, molecular diagrams |
| Assumption Flag | Highlighted callout for agent assumptions | Actuarial assumptions, model parameters |
| Progress Step | Sequential step tracker showing AI process | Any multi-step calculation |
| Annotation | Text callout attached to any artifact | Notes, audit comments |

Render primitives are invoked via a JSON instruction vocabulary. Agents do not draw anything directly. They emit structured JSON messages describing what should be rendered, and the rendering engine draws it.

### 3.3 Layer 3 — The Agent Protocol (MCP)

MCP — Model Context Protocol — is the emerging standard for how AI agents communicate with external environments. Anthropic developed and published MCP, and it is gaining adoption across the AI tooling ecosystem. NEXUS adopts MCP as its native agent protocol.

This means any agent that speaks MCP can plug into NEXUS without custom integration work. The agent connects, declares its capabilities, and begins emitting render instructions as it works.

The communication flow is:

1. Shell receives user input or file upload
2. Shell passes context to the active agent via MCP
3. Agent processes and emits JSON render instructions
4. Rendering engine draws each instruction in real time
5. Human observes, intervenes, or redirects
6. Agent receives updated context and continues

### 3.4 Layer 4 — The Extension System

NEXUS has a three-tier extension system. Extensions are installed from a central registry, similar to the VSCode marketplace.

#### Tier 1 — Renderers

New visual primitives that expand what the shell can display. A third party could build a DNA strand renderer, a circuit diagram renderer, or a legal timeline renderer. Once installed, any agent or workspace can invoke that renderer.

#### Tier 2 — Domain Workspaces

A curated environment for a specific field. A domain workspace pre-loads the relevant renderers, sets the appropriate layout, and configures the workspace defaults. An actuary installs the actuarial workspace and the environment immediately feels native to their discipline.

#### Tier 3 — Agents

The AI layer. Agents are installed independently of workspaces. This means a general-purpose Claude agent and a specialized mortality modeling agent can both operate inside the same actuarial workspace. Renderers, workspaces, and agents are deliberately decoupled so they can be mixed and matched freely.

## 4. Human and Agent Modes

NEXUS does not require an agent to be useful. This is a critical design principle. The shell must be fully functional as a human workspace before any agent is introduced.

| Mode | Description | Analogy |
| --- | --- | --- |
| Shell Only | Human uses the workspace manually. Loads data, renders equations, builds visualizations by hand. | VSCode without Copilot |
| Shell + Workspace | Domain-specific environment active. Tools and layout are native to the field. | VSCode with Python extension |
| Shell + Workspace + Agent | Agent works visibly inside the domain environment. Human observes, intervenes, and directs. | VSCode + Claude Code |

Each mode adds value. None requires the next. This is what separates NEXUS from AI-first tools that collapse without the AI layer.

## 5. Proof of Concept — Two Domains

To validate the universal workspace paradigm, the initial proof of concept targets two domains chosen for maximum visual contrast. If the same shell adapts convincingly to both, the domain-agnostic claim is demonstrated.

### 5.1 Domain 1 — Actuarial / Statistics

This domain was selected because of existing subject matter knowledge and because professional auditability requirements make AI visualization genuinely mission-critical, not just a UX preference.

Render primitives used:

- Table — mortality datasets, experience data
- Equation — reserve formulas, probability calculations
- Chart — survival curves, loss distributions
- Assumption Flag — highlighting model assumptions for audit trail
- Progress Step — showing calculation sequence

Target demo scenario: Load a mortality dataset. Agent runs a basic reserve calculation. Every formula renders live. Every assumption is flagged. Human adjusts one assumption mid-process. Agent recalculates. Output is fully traceable.

### 5.2 Domain 2 — Physics / 3D Engineering

This domain was selected because its primary visual language — three-dimensional models, force vectors, and motion — is entirely different from Domain 1. There is no overlap in render primitives used.

Render primitives used:

- 3D Object — structural models, rigid body simulations
- Equation — force equations, energy calculations
- Chart — motion over time, stress distributions
- Annotation — labeling forces and constraints

Target demo scenario: Load a simple structural problem. Agent models the geometry in 3D. Applies forces. Renders stress distribution. Human repositions a load point. Agent recalculates and updates the model live.

## 6. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Shell | Electron | Desktop wrapper, OS access, file system |
| UI Framework | React | Component rendering, workspace layout |
| 3D Rendering | Three.js | 3D object and spatial visualization |
| Math Rendering | MathJax / KaTeX | Equation display and resolution |
| Charts | Recharts / D3 | Data visualization, statistical plots |
| Agent Protocol | MCP | Standardized agent communication |
| Build Tooling | Vite + Electron Builder | Development and packaging |
| AI Agents | Claude / GPT / any MCP agent | Domain intelligence layer |

## 7. The Competitive Moat

The moat in NEXUS is not the shell. It is not the agents. It is the protocol — the standardized rendering vocabulary and agent communication standard that any domain workspace must conform to.

The more domain workspaces and renderers built on NEXUS, the more indispensable the standard becomes. This is the same network effect that made VSCode dominant — not because Microsoft built the best features, but because the extension ecosystem became too valuable to leave.

First mover advantage here is significant. The team that defines the rendering vocabulary defines what domain-native AI workspaces look like for the next decade.

## 8. Success Metrics — Proof of Concept

- Shell installs and launches cleanly on macOS and Windows
- Actuarial workspace loads and renders all five primitive types correctly
- Physics workspace loads and renders a live 3D model with agent interaction
- Agent intervention mid-process works in both domains without shell restart
- Human-only mode functional in both domains without any agent connected
- Total demo duration under 5 minutes per domain

## 9. Open Questions

- Renderer packaging format — how are custom renderers distributed and sandboxed
- Agent authentication — how does the shell verify and trust installed agents
- Offline capability — which features work without internet access
- Workspace data persistence — how does the shell save and restore workspace state
- Monetization model — open core, marketplace revenue share, or subscription

NEXUS IDE &bull; Concept Stage &bull; Not for distribution
