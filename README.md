# Zama Skills — The Agentic Powerpack for FHEVM

> A battle-hardened, multi-phase powerpack framework for AI agents to build, test, and deploy production-grade Fully Homomorphic Encryption (FHE) applications on the Zama protocol autonomously.

[![Validated: 2026-05-08](https://img.shields.io/badge/Validated-2026--05--08-brightgreen)](./CONTEXT.md)
[![SDK: Relayer ^0.4.2](https://img.shields.io/badge/Relayer--SDK-^0.4.2-blue)](./CONTEXT.md)
[![Solidity: 0.11.1](https://img.shields.io/badge/Solidity-^0.11.1-blue)](./CONTEXT.md)

---

## ⚡ The Ultimate Powerpack for Zama Builders

Whether you are a **Founder** rapidly prototyping a new confidential DeFi protocol, or a **Developer** wrestling with the intricacies of Fully Homomorphic Encryption, Zama Skills is your unfair advantage. It transforms generic AI coding assistants (like Cursor, Windsurf, Claude Code, or Gemini) into seasoned FHEVM experts.

### 🏢 For Founders
- **Idea to DApp in Hours:** Bypass the steep learning curve of FHE math and SDK configurations. Go from a whitepaper concept to a functional, deployed prototype on Sepolia instantly.
- **Architectural Security by Default:** Don't worry if your AI agent is making privacy mistakes. The framework forces the generation of a strict `Privacy-Spec-Template.md` before a single line of code is written, ensuring data visibility boundaries are perfectly aligned with your business logic.
- **Production-Level Integrity:** Delivers a fully segregated, full-stack monorepo (`contracts/`, `backend/`, `frontend/`)—not just a collection of fragile scripts.

### 💻 For Developers
- **Zero Hallucination Guarantee:** Stop fighting AI agents that invent non-existent `fhevmjs` functions. Zama Skills enforces strict usage of the modern `@zama-fhe/relayer-sdk` and strictly bans known anti-patterns (like FHE ops in constructors or sync decryption).
- **The 12-Invariant Shield:** An automated safety net. Before delivering any smart contract, the agent must autonomously prove it passes 12 critical FHE invariants (e.g., proper ACL usage, `FHE.allowThis` enforcement).
- **Drop-in Scaffolds:** Instantly bootstrap complex primitives with drop-in templates for Sealed-Bid Auctions, Confidential ERC-7984 Tokens, and Blind Voting systems.

---

## 🏗️ Architecture: The Three Pillars

Zama Skills is built on a tripartite architecture designed to eliminate the friction between "AI Ideation" and "Production Reality." Every file we created has a specific significance:

### 1. Directives (The Specialized Brain)
A library of granular, context-optimized knowledge files that dictate exact implementation patterns for every FHEVM domain:
- **`choose-encrypted-types.md`**: Precision selection of `ebool`, `euint64`, or `eaddress`.
- **`apply-fhe-operations.md`**: Oblivious logic via `FHE.select` and `FHE.cmux`.
- **`grant-acl-access.md`**: Two-phase `FHE.allow` patterns for secure decryption.
- **`manage-gas-limits.md`**: Deterministic gas overrides (500k/1.5M) for Sepolia.

### 2. Orchestration (The Guardrailed Workflow)
A strict sequential flow that prevents agents from skipping critical safety steps:
- **Phase 0: Ideation & Design Challenge** — Passing the 15-question `INTERROGATION-GATE.md`.
- **Phase 1: Contract Development** — Privacy Spec generation and 12-Invariant validation.
- **Phase 2: Rigorous Testing** — Automated Hardhat test scaffolding.
- **Phase 3: Deterministic Deployment** — Precision script generation for Sepolia.
- **Phase 4/5: Full-Stack Integration** — NestJS Backend and React Frontend SDK setups.

### 3. Execution (The Multi-Agent Engine)
The framework is consumed natively by:
- **Gemini CLI / Claude Code**: Via `GEMINI.md` and `CLAUDE.md`.
- **Cursor / Windsurf**: Via `.cursorrules` and `.windsurfrules`.
- **Execution Mandate**: Every agent must pass the **12-Invariant Quick Check** before delivering code.

---

## 🔄 The User Flow: How It Works

As a user, you simply dictate the goal, and the framework ensures the agent doesn't skip critical steps.

### Step 1: Initialization
You inject the skills into your workspace and prompt your AI:
> *"I want to build a confidential sealed-bid auction. Start Phase 0."*

### Step 2: Phase 0 — The Interrogation Gate
The AI refuses to write code immediately. Instead, it asks you exactly **6 critical questions** about your app's mechanics, actor roles, and encrypted state based on the `INTERROGATION-GATE.md` checklist. 

### Step 3: Phase 1 — Contract & Privacy Spec
Once approved, the AI drafts the `Privacy-Spec-Template.md` detailing exactly who can see what. It then writes the Solidity contract and runs the **12-Invariant Quick Check** to guarantee no FHE rules are violated.

### Step 4: Phase 2 & 3 — Testing & Deployment
The AI automatically scaffolds Hardhat mock tests for your encrypted logic. Once tests pass, it generates the deterministic deployment scripts with exact gas limits (e.g., `gasLimit: 500000`) required for the Sepolia testnet.

### Step 5: Phase 4 & 5 — Full-Stack Integration
Finally, the AI wires up a React Frontend (with `Relayer-SDK/Web`) and a Node.js Keeper Backend (with `Relayer-SDK/Node`) to handle async decryptions and proofs seamlessly.

---

## 🧠 The Self-Improving Engine

Zama Skills isn't a static framework—it gets smarter over time. Every AI agent using these skills is instructed with a strict **Continuous Improvement Rule**:
- If the agent encounters a missing instruction, an outdated FHE pattern, or a general bug during development, it autonomously documents the issue and proposes a fix.
- These fixes are logged directly into the `proposals/` directory (e.g., `proposals/yourusername-01.md`).
- You, the developer, are then explicitly prompted to open a Pull Request back to the main `zama-skills` repository, enabling the entire ecosystem to continuously adapt and improve!

---

## 💎 Optimization Vectors: Why This Framework?

| Vector | Strategy | Benefit |
| :--- | :--- | :--- |
| **Token Efficiency** | Granular Directives + Surgical Reads | Minimal context window usage; cheaper and faster AI turns. |
| **Zero Hallucinations** | 12-Invariant Check + Interrogation Gate | Guaranteed valid FHE logic; no "hallucinated" SDK methods. |
| **Less Context Loss** | Top-Level Segregation (`contracts/`, `frontend/`) | Agents never get confused between backend/frontend/contract environments. |
| **Continuous Learning** | `UPDATE-MAP.md` + Version Validation | Framework adapts to protocol updates and newly discovered bugs automatically. |

---

## 🛠️ Quick Start

### 1. Installation
Run this inside any project to inject the Zama Skills framework:

```bash
npx skills add kaushalya4s5s7/zama-skills
```

### 2. Initialization
Open your preferred AI agent (Gemini, Claude, Cursor) and say:
> *"I want to build a confidential [Project Name]. Read the skills and start Phase 0."*

### 3. The 12-Invariant Shield
Before the agent hands you a contract, it will perform this check autonomously:
1. `FHE.allowThis` after every write?
2. Zero `if/require` on FHE handles?
3. Zero synchronous `FHE.decrypt`?
4. `FHE.fromExternal` before every use?
... (and 8 more)

---

## 📦 Project Structure
After a successful run, your repo will look like this:
```bash
/
├── contracts/        # Hardhat, pnpm, and 12-invariant validated contracts
├── frontend/         # React/Next.js with Relayer-SDK/Web integration
├── backend/          # Node.js/NestJS Keeper with Relayer-SDK/Node
├── .fhevm/           # The Framework Engine (Directives/Invariants)
└── templates/        # Scaffold library
```

---

## 📜 Documentation
- [Installation Guide](./INSTALL.md)
- [Architecture Deep Dive](./.fhevm/directives/understand-fhevm-architecture.md)
- [Privacy Spec Template](./.fhevm/PRIVACY-SPEC-TEMPLATE.md)

---

Built by developers, for the next generation of privacy-preserving applications on **Zama**.
