# NEXUS IDE

The Universal AI Workspace Shell

Product Requirements Document &bull; v0.2 &bull; 2026

Revised: Primitive Pack Architecture

Confidential — Concept Stage

## 1. What Changed in v0.2

Version 0.1 introduced the concept of domain workspaces — pre-configured environments for specific fields like actuarial science or physics. While this proved the universal shell concept, it imposed an assumption NEXUS should never make: that it knows what domain the user works in.

The insight that drove this revision: every domain is just a different combination of the same primitives. An actuary and a data scientist both use tables and charts. A physicist and an engineer both use equations and 3D objects. A developer and a data engineer both use code editors and terminals.

VSCode does not tell you what programming language to use. It gives you a blank canvas and gets out of the way. NEXUS should do the same.

v0.2 replaces domain workspaces with a Primitive Pack architecture. The user composes their own environment from primitive packs. NEXUS never assumes the domain.

## 2. Vision & Problem Statement

### 2.1 The Problem

Every knowledge domain deserves the same relationship with AI that software development has with VSCode. But today professionals interact with AI through a chatbox. Input goes in, output comes out. The process is invisible. The reasoning is hidden. Trust is low.

Beyond the AI problem, no general purpose visual workspace exists for non-developers. A physicist, actuary, statistician, or engineer has no environment where they can load data, run calculations, render domain-native visualizations, and work alongside an AI agent — all in one place.

### 2.2 The Vision

NEXUS IDE is a universal desktop workspace shell where humans and AI agents work visibly together. The user assembles their environment from primitive packs — visual and computational building blocks. The AI agent sees the same workspace and drives it through the same primitive mechanism.

The shell does not know or care what domain the user works in. It provides the environment. The user provides the intent.

### 2.3 The Core Principles

- The shell never assumes the user's domain
- Visualization is not optional — every action should be visible
- The workspace is useful without an agent — the agent is an enhancement not a dependency
- Primitive packs are the unit of extension — not domain workspaces
- Local first — built on Electron, runs on the user's machine, works offline

## 3. System Architecture

NEXUS is built on five layers. Each layer has a single clear responsibility.

### 3.1 Layer 1 — The Shell (Electron)

The desktop wrapper. Built on Electron — the same technology powering VSCode, Slack, and Figma. Packages the application as a native desktop app running on Windows, macOS, and Linux.

In the current development phase the shell runs as a React web app in the browser. The Electron wrapper is applied after the core functionality is complete. The architecture is identical in both environments.

Shell responsibilities:

- Application lifecycle management
- File system access — load any file type from disk
- Primitive pack installation and management
- Housing the rendering engine and computation layer
- Agent communication via MCP protocol

### 3.2 Layer 2 — The Rendering Engine (React)

A React-based UI inside the Electron shell. The rendering engine maintains a library of primitive components. Each primitive is a draggable, resizable, closeable block on the canvas.

Primitives are invoked by three mechanisms — all converging on the same canvas block array:

- Manual — user clicks a toolbar button
- File load — user opens a file, NEXUS renders appropriate primitive
- Agent — AI pushes render instructions as JSON, NEXUS renders them

This convergence is deliberate. The agent does not have special canvas access. It uses the exact same mechanism as a toolbar button click.

### 3.3 Layer 3 — The Computation Layer

The computational backbone of NEXUS. All code execution, formula evaluation, and data processing routes through a single interface: `runCode(language, code, data)`.

In browser development mode this returns mock results. In Electron production it spawns real language runtimes as child processes — Python, R, Node.js, or any installed language on the user's machine.

Computation results can push primitive blocks directly onto the canvas — a print statement becomes a text block, a dataframe becomes a table, a plot becomes a chart.

### 3.4 Layer 4 — The Agent Protocol (MCP)

Model Context Protocol is the communication standard between NEXUS and AI agents. Any agent that speaks MCP can plug into NEXUS without custom integration.

The agent communication flow:

1. User sends a prompt via the Agent panel chat
2. NEXUS sends context — active packs, canvas state, loaded data — to the agent
3. Agent responds with a conversational message and structured JSON render instructions
4. NEXUS parses the instructions and pushes blocks onto the canvas
5. User observes, intervenes, or redirects

### 3.5 Layer 5 — The Pack Registry

The extension system. Primitive packs are distributed through a central registry. In the current development phase the registry is a local JSON file. In production it connects to a remote registry — the seam is clearly marked in the codebase.

## 4. Primitive Pack Architecture

This is the core architectural change from v0.1. Domain workspaces are replaced by primitive packs — modular collections of related rendering and computation primitives that users install and combine freely.

### 4.1 What a Primitive Pack Contains

- One or more primitive components — visual building blocks
- Optional computation capabilities — formula engines, language runtimes
- Optional file type handlers — CSV, JSON, custom formats
- Registry metadata — id, name, version, author, description

### 4.2 Core Primitive Packs

| Pack | Primitives | Use Cases |
| --- | --- | --- |
| Data Pack | Table, Chart, CSV loader | Any data analysis, statistics, reporting |
| Math Pack | Equation, Formula engine | Actuarial, physics, engineering calculations |
| Code Pack | Monaco Editor, Terminal Output | Software development, scripting, automation |
| 3D Pack | Three.js Object, Annotation | Engineering, physics, architecture, design |
| Audit Pack | Assumption Flag, Progress Step | Actuarial, compliance, regulated industries |

### 4.3 How Users Compose Their Environment

NEXUS opens to a blank canvas with an empty toolbar. The user installs the packs they need from the Extensions panel. Each installed pack adds its primitives to the toolbar. The user then builds their workspace by adding primitives to the canvas.

Example compositions:

- Actuary: Data Pack + Math Pack + Audit Pack
- Physicist: Math Pack + 3D Pack + Data Pack
- Data Engineer: Code Pack + Data Pack
- Full Stack Developer: Code Pack only
- Research Scientist: Data Pack + Math Pack + Code Pack + Audit Pack

None of these are prescribed by NEXUS. The user decides. NEXUS just renders.

### 4.4 Third Party Packs

The registry is open. Third parties can publish primitive packs for any domain. Examples:

- Bio Pack — DNA strand renderer, protein structure viewer, sequence alignment
- Finance Pack — Candlestick chart, order book renderer, risk matrix
- Legal Pack — Timeline renderer, clause comparator, citation tracker
- GIS Pack — Map renderer, coordinate tools, spatial analysis

Third parties build primitives. NEXUS renders them. The shell never needs to know what domain a pack serves.

## 5. Canvas Model

The canvas is a free-form infinite workspace. Primitive blocks sit on it like windows on a desktop.

| Property | Behavior |
| --- | --- |
| Positioning | Freely draggable anywhere on canvas |
| Sizing | Resizable from any edge or corner, minimum 300x200px |
| Z-order | Click any block to bring to front — full window management |
| Persistence | Canvas state saves to localStorage per pack composition, restored on reload |
| Multi-block | Unlimited blocks on canvas simultaneously, any mix of primitive types |
| Data flow | Loaded data is available to all blocks and to the computation layer |

## 6. Human and Agent Modes

NEXUS does not require an agent. This is non-negotiable. The shell must be fully useful as a human workspace before any agent is introduced.

| Mode | Description | Analogy |
| --- | --- | --- |
| Shell only | User installs packs, builds canvas manually, loads files, runs computations | VSCode without Copilot |
| Shell + Agent | Agent works visibly inside the canvas. Human observes, intervenes, redirects | VSCode + Claude Code |

## 7. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Shell | Electron | Desktop wrapper, OS access, file system |
| UI Framework | React + Vite | Component rendering, canvas, toolbar |
| Code Editor | Monaco Editor | Multi-language code editing primitive |
| 3D Rendering | Three.js + React Three Fiber | 3D object primitive |
| Math Rendering | KaTeX | Equation primitive |
| Charts | Recharts | Chart primitive |
| Tables | TanStack Table | Table primitive with sort, filter, pagination |
| Drag & Resize | react-rnd | Canvas block positioning |
| File Parsing | PapaParse | CSV file loading |
| Computation | child_process (Electron) | Real language runtime execution |
| Agent Protocol | MCP | Standardized agent communication |
| AI Agents | Claude / GPT / any MCP agent | Domain intelligence layer |

## 8. Current Build Status

### 8.1 Completed

- Electron-ready shell running as React web app in Codespaces
- Activity bar with all four panels — Workspaces, Extensions, Agent, Settings
- Pack registry pattern with local JSON — remote registry seam marked
- Free canvas with draggable, resizable, z-managed primitive blocks
- Data Pack primitives — Table (sort, filter, pagination, column resize), Chart, Equation
- Audit Pack primitives — Assumption Flag with approve/challenge, Progress Step
- 3D Pack primitives — Three.js object with orbit controls, Annotation
- Code Pack primitives — Monaco Editor with language selector, Terminal Output
- Computation layer stub — `src/computation/runner.js` with Electron seams marked
- File loading — CSV and JSON parsed and rendered as appropriate primitives
- Canvas persistence — save and restore per pack composition via localStorage
- Settings — theme toggle, agent model selection, registry source

### 8.2 Next Steps

- Refactor registry from domain workspaces to primitive packs
- Electron packaging — wrap React app in Electron shell
- Computation layer — wire child_process to Monaco Editor Run button
- Agent connection — Anthropic API via MCP when API key available
- Remote registry — connect Extensions panel to remote pack registry

## 9. The Competitive Moat

The moat is the primitive pack standard — the rendering vocabulary and agent communication protocol that any pack must conform to.

The more packs published against the NEXUS standard, the more indispensable the standard becomes. This is the same network effect that made VSCode dominant — not because of Microsoft's features but because the extension ecosystem became too valuable to leave.

The team that defines what domain-native AI workspaces look like defines the category.

NEXUS IDE &bull; v0.2 &bull; Primitive Pack Architecture &bull; Not for distribution
