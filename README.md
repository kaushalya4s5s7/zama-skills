# Zama Skills — The FHEVM Agentic Framework

> A battle-hardened, multi-phase framework for AI agents to build, test, and deploy production-grade Fully Homomorphic Encryption (FHE) applications on the Zama protocol.

[![Validated: 2026-05-08](https://img.shields.io/badge/Validated-2026--05--08-brightgreen)](./CONTEXT.md)
[![SDK: Relayer ^0.4.2](https://img.shields.io/badge/Relayer--SDK-^0.4.2-blue)](./CONTEXT.md)
[![Solidity: 0.11.1](https://img.shields.io/badge/Solidity-^0.11.1-blue)](./CONTEXT.md)

---

## 🏗️ Architecture: The Three Pillars

Zama Skills is built on a tripartite architecture designed to eliminate the friction between "AI Ideation" and "Production Reality."

### 1. Directives (The Specialized Brain)
A library of granular, context-optimized knowledge files that dictate exact implementation patterns for every FHEVM domain:
- **`choose-encrypted-types.md`**: Precision selection of `ebool`, `euint64`, or `eaddress`.
- **`apply-fhe-operations.md`**: Oblivious logic via `FHE.select` and `FHE.cmux`.
- **`grant-acl-access.md`**: Two-phase `FHE.allow` patterns for secure decryption.
- **`manage-gas-limits.md`**: Deterministic gas overrides (500k/1.5M) for Sepolia.

### 2. Orchestration (The Guardrailed Workflow)
A strict, **5-Phase Sequential Flow** that prevents agents from skipping critical safety steps:
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

## 🚀 For Founders & Developers

### Why Founders Choose Zama Skills
- **Reduced Time-to-Market**: Move from "Idea" to "Deployed Prototype" in hours, not weeks.
- **Guaranteed Privacy Bounds**: The `Privacy-Spec-Template.md` ensures data visibility is architected before a single line of code is written.
- **Production-Level Integrity**: Not just "scripts," but a full-stack architecture with proper directory segregation.

### Why Developers Love It
- **Zero Hallucinations**: Every instruction is grounded in real-world FHEVM constraints (e.g., "No FHE in Constructors").
- **Drop-in Scaffolds**: Pre-built templates for Sealed-Bid Auctions, Confidential Tokens (ERC-7984), and Voting.
- **Continuous Improvement**: The `UPDATE-MAP.md` allows the framework to learn from every session, fixing bugs once and for all.

---

## 💎 Optimization Vectors

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
> "I want to build a confidential [Project Name]. Start Phase 0."

### 3. The 12-Invariant Shield
Before the agent hands you a contract, it will perform this check:
1. `FHE.allowThis` after every write?
2. Zero `if/require` on FHE handles?
3. Zero synchronous `FHE.decrypt`?
4. `FHE.fromExternal` before every use?
... (and 8 more)

---

## 📦 Project Structure
```bash
/
├── contracts/        # Hardhat, pnpm, and 12-invariant contracts
├── frontend/         # Next.js with Relayer-SDK/Web
├── backend/          # NestJS with Relayer-SDK/Node
├── .fhevm/           # The Framework Engine (Orchestration/Invariants)
└── templates/        # Scaffold library
```

---

## 📜 Documentation
- [Installation Guide](./INSTALL.md)
- [Architecture Deep Dive](./.fhevm/directives/understand-fhevm-architecture.md)
- [Privacy Spec Template](./.fhevm/PRIVACY-SPEC-TEMPLATE.md)

---

Built by developers, for the next generation of privacy-preserving applications on **Zama**.
