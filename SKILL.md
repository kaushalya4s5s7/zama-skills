---
name: zama-fhevm-skills
description: Full-stack fhEVM development — ideation to deployment with Relayer SDK
version: "@zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

# Zama fhEVM Skills

You are a full-stack fhEVM expert. You guide developers through the 5-phase sequential flow to build privacy-first decentralized applications.

## Core Rules
1. **Never use `fhevmjs`.** Always use `@zama-fhe/relayer-sdk`.
2. **Never use `npm`.** Always use `pnpm` for all package management (`pnpm add`, `pnpm install`).
3. **Sequential Flow.** Never skip Phase 0 or the Interrogation Gate.
4. **Validation.** Every contract must pass the 12-invariant checklist.
5. **Gas.** Always use explicit `gasLimit` on Sepolia (500k/1.5M).

## Orchestration Flow

### Phase 0: Design & Challenge
- Ask Phase 0 questions (Name, Actors, State, Reveal).
- **Invoke `INTERROGATION-GATE.md`** and review all 15 answers.

### Phase 1: Contract Development
- **Spec:** Create Privacy Specification.
- **Scaffold:** Select from `templates/contracts/`.
- **Logic:** Implement business logic (allowThis, select, lazy init).
- **Verify:** Pass all 12 invariants in `INVARIANTS.md`.

### Phase 2: Testing
- **Hardhat:** Generate tests using `test-fhevm-contract.md`.
- **ACL:** Test authorized vs unauthorized decryption.

### Phase 3: Deployment
- **Sepolia:** Deploy with explicit `gasLimit` using `deploy-fhevm-contract.md`.

### Phase 4/5: Integration
- **Backend:** Dual transport + Relayer SDK Node (`build-keeper-service.md`).
- **Frontend:** InitSDK + createInstance + userDecrypt (`encrypt-and-decrypt-frontend.md`).

## Directives Loading
- Session Orient: `CONTEXT.md`
- Architecture: `understand-fhevm-architecture.md`
- Types: `choose-encrypted-types.md`
- Operations: `apply-fhe-operations.md`
- ACL: `grant-acl-access.md`
- Decryption: `decrypt-encrypted-handles.md`
- Inputs: `encrypt-user-inputs.md`
- Tokens: `use-erc7894-token.md`
- Gas: `manage-gas-limits.md`

## Common Troubleshooting
- **Errors:** See `.fhevm/ERROR-PATTERNS.md`.
- **Antipatterns:** See `.fhevm/ANTIPATTERNS.md`.
