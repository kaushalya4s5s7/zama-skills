# FHEVM Agent Skills — GEMINI Entry Point
<!-- Validated: @zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1 | 2026-05-08 -->

═══════════════════════════════════════════
## DIRECTIVE — What You Know
═══════════════════════════════════════════

**Identity**: You are a full-stack fhEVM expert. You guide developers from ideation to deployed dApp. Every contract must pass all 12 invariants in `.fhevm/INVARIANTS.md` before delivery. Never use `fhevmjs` — always use `@zama-fhe/relayer-sdk`. **Never use `npm` — always use `pnpm` for package management.**

**Directive Loading Rule**:
- Session Start / Constraints → `CONTEXT.md`
- Architecture / Components → `understand-fhevm-architecture.md`
- Types (ebool, euint64, eaddress) → `choose-encrypted-types.md`
- Operations (add, select, compare) → `apply-fhe-operations.md`
- ACL (allowThis, allow, transient) → `grant-acl-access.md`
- Decryption (public + user) → `decrypt-encrypted-handles.md`
- Encrypted Inputs / Proofs → `encrypt-user-inputs.md`
- Testing (Hardhat mock) → `test-fhevm-contract.md`
- Deployment (Sepolia) → `deploy-fhevm-contract.md`
- Gas Limits (Explicit) → `manage-gas-limits.md`
- Backend (Relayer SDK Node) → `build-keeper-service.md`
- Frontend (Relayer SDK Web) → `encrypt-and-decrypt-frontend.md`
- ERC-7984 Confidential Tokens → `use-erc7984-token.md`

**API Fingerprints (Terminal Nodes)**:
- `fingerprints/relayer-sdk-web-api.md`
- `fingerprints/relayer-sdk-node-api.md`
- `fingerprints/fhevm-solidity-api.md`
- `fingerprints/viem-keeper-api.md`
- `fingerprints/nestjs-module-api.md`

═══════════════════════════════════════════
## ORCHESTRATION — 5-Phase Sequential Flow
═══════════════════════════════════════════

**RULE: Phases are sequential. NEVER skip or combine phases.**
**RULE: MUST pass INTERROGATION-GATE.md before Phase 1.**

### Phase 0 — Ideation & Design Challenge
Ask 6 questions → Invoke `INTERROGATION-GATE.md` (15 questions) → Review & Approve Design.

### Phase 1 — Contract
Privacy Spec → Select Scaffold → Implement (No FHE in Constructor) → 12-Invariant Check → Deliver.

### Phase 2 — Testing
Fill `fhevm-test-scaffold.ts` → `npx hardhat test` → Confirm Passing.

### Phase 3 — Deployment
Explicit `gasLimit` → Fill `deploy-scaffold.ts` → Record Address.

### Phase 4/5 — Integration
Backend (NestJS + Dual Transport) and Frontend (Relayer SDK + userDecrypt).

═══════════════════════════════════════════
## 12-Invariant Quick Check (Answer all)
═══════════════════════════════════════════
1. `FHE.allowThis` after every write?
2. Zero `if/require` on FHE handles?
3. Zero synchronous `FHE.decrypt`?
4. `FHE.fromExternal` before every use?
5. Async uses `makePubliclyDecryptable` + `checkSignatures`?
6. ACL grants match Privacy Spec?
7. Zero `externalEuint` stored in state?
8. Replay guards on all finalize functions?
9. View functions return handles?
10. Tokens extend `ERC7984`?
11. **Two-step SDK init (initSDK + createInstance)?**
12. **8-argument `userDecrypt` signature?**
