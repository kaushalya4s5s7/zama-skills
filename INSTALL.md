# FHEVM Skill System — Installation Guide

## What This Skill System Does
This skill system enables AI coding agents (Claude Code, Cursor, Windsurf) to autonomously generate, test, and deploy **FHEVM (Fully Homomorphic Encryption VM) confidential smart contracts** that correctly implement:

- Encrypted state variables with proper ACL permissions
- ZKPoK input proof validation
- Async public decryption via the 3-step KMS flow
- ERC-7984 confidential token standard
- Hardhat test patterns with encryption/decryption helpers
- React frontend hooks for confidential transactions

---

## Prerequisites
- Node.js >= 20
- Hardhat ^2.24
- Access to an FHEVM-enabled network (local mock or Ethereum Sepolia)

---

## Installation by Agent (Claude Code / Cursor / Windsurf)

### Step 1: Install Required Packages
```bash
npm install @fhevm/solidity@^0.11.1 @fhevm/hardhat-plugin@^0.4.2 @openzeppelin/confidential-contracts
npm install --save-dev @fhevm/mock-utils@^0.4.2
npm install @zama-fhe/relayer-sdk@^0.4.1
```

### Step 2: Configure Hardhat
Add to `hardhat.config.ts`:
```typescript
import "@fhevm/hardhat-plugin";
```

### Step 3: Copy Scaffolds to Your Project
```bash
# Copy Solidity scaffolds to your contracts directory
cp .fhevm-skills/templates/*.sol contracts/

# Copy TypeScript scaffolds to your test/src directory
cp .fhevm-skills/templates/fhevm-test-scaffold.ts test/
cp .fhevm-skills/templates/fhevm-frontend-hooks-scaffold.ts src/hooks/
```

### Step 4: Verify Packages Match Expected Versions
Check your `package.json` against the versions in each directive's header comment.
If versions differ, consult `.fhevm/UPDATE-MAP.md` for what may have changed.

---

## File Structure
```
.fhevm/
├── ORCHESTRATION.md          — Full agent thinking & gate logic
├── INVARIANTS.md             — 10 yes/no safety checks
├── PRIVACY-SPEC-TEMPLATE.md  — Fill before writing any contract
├── UPDATE-MAP.md             — Version compatibility & update procedures
└── directives/
    ├── SKILL-TYPES.md        — Encrypted type reference
    ├── SKILL-ACL.md          — ACL patterns & common mistakes
    ├── SKILL-DECRYPTION.md   — 3-step async decryption
    ├── SKILL-INPUTS.md       — Input proofs & external types
    ├── SKILL-TESTING.md      — Hardhat test API
    ├── SKILL-FRONTEND.md     — Relayer SDK + React hooks
    └── SKILL-ERC7984.md      — Confidential token standard

templates/
├── confidential-token-scaffold.sol      — ERC-7984 token
├── confidential-vote-scaffold.sol       — Encrypted voting
├── sealed-bid-auction-scaffold.sol      — Sealed-bid auction
├── acl-value-scaffold.sol               — General encrypted storage
├── public-decrypt-scaffold.sol          — Public result reveal
├── fhevm-test-scaffold.ts               — Hardhat test template
└── fhevm-frontend-hooks-scaffold.ts     — React hooks template

CLAUDE.md                    — Claude Code auto-read entry point
.cursorrules                 — Cursor integration
.windsurfrules               — Windsurf integration
INSTALL.md                   — This file
```

---

## Agent Onboarding Instructions

### For Claude Code
1. Place `CLAUDE.md` in the project root (or monorepo package root)
2. Claude Code automatically reads `CLAUDE.md` at session start
3. The entry point will load the relevant `SKILL-*.md` directives as needed

### For GEMINI
1. Place `GEMINI.md` in the project root (or monorepo package root)
2. Gemini automatically reads `GEMINI.md` at session start
3. The entry point will load the relevant `SKILL-*.md` directives as needed

### For Cursor
1. Place `.cursorrules` in the project root
2. Content in `.cursorrules` is automatically prepended to every AI prompt

### For Windsurf
1. Place `.windsurfrules` in the project root
2. Content is read as project context for Cascade

---

## Running Tests
```bash
# Mock mode (fast — simulates FHE locally)
npx hardhat test

# Sepolia testnet (real FHE — requires PRIVATE_KEY and INFURA_API_KEY env vars)
npx hardhat test --network sepolia
```

---

## Verified Dependency Versions (May 2026)
| Package | Version |
|---|---|
| `@fhevm/solidity` | `^0.11.1` |
| `@fhevm/hardhat-plugin` | `^0.4.2` |
| `@fhevm/mock-utils` | `^0.4.2` |
| `@zama-fhe/relayer-sdk` | `^0.4.1` |
| `@openzeppelin/confidential-contracts` | `latest` |

---

## Documentation References
- Solidity Guide: https://docs.zama.ai/protocol/solidity-guides
- ACL Reference: https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl
- Decryption: https://docs.zama.ai/protocol/solidity-guides/smart-contract/oracle
- ERC-7984: https://docs.zama.ai/protocol/examples/openzeppelin-confidential-contracts/erc7984
- Hardhat Template: https://github.com/zama-ai/fhevm-hardhat-template
