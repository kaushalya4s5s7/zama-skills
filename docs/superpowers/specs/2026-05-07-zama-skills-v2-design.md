# Zama Skills v2 — Design Specification

**Date:** 2026-05-07
**Status:** PENDING DEVELOPER REVIEW — Do not implement until approved
**Source:** Synthesized from production zama build analysis + zama-skills v1 audit

---

## Overview

Zama Skills is a markdown-first skill system for Claude Code and AI agents that guides developers through building fhEVM (Fully Homomorphic Encryption on EVM) applications — from privacy specification through contract, testing, deployment, backend, and frontend. Version 1 was validated against a reference options trading protocol. This v2 specification is driven by production build findings that exposed three categories of failure.

---

## Section 1: Problem Summary

### Category A — Breaking SDK Mismatch

**Frontend:** `SKILL-FRONTEND.md` and `fhevm-frontend-hooks-scaffold.ts` import from `@zama-fhe/relayer-sdk ^0.4.3` and call `createInstance()` with zero parameters. Production builds use `fhevmjs ^0.6.2`, which requires five explicit config parameters:

```
createInstance({ kmsContractAddress, aclContractAddress, chainId, networkUrl, gatewayUrl })
```

The reencrypt pattern is entirely absent. Current skills reference a TODO placeholder. Production uses `instance.generateKeypair()` + `instance.createEIP712()` + `instance.reencrypt()` — a three-step ephemeral keypair flow.

**Backend:** `SKILL-BACKEND.md` and `keeper-service-scaffold.ts` reference `@zama-fhe/relayer-sdk/node` and `ethers.JsonRpcProvider`. Production backends use `viem ^2.0.0` with NestJS, with two separate transports: WebSocket for event subscription, HTTP for writes. `watchContractEvent` requires WebSocket.

**Severity:** Any developer following current skills to build a frontend or backend will produce non-functional code against real Sepolia infrastructure.

### Category B — Missing Production Patterns (10 gaps)

1. `encryptTwo64` — batch encryption of two uint64 values sharing a single `inputProof`
2. Phase-based ACL with `FINALITY_BLOCKS=96` — no scaffold demonstrates this
3. `FHE.allowTransient` vs `FHE.allow` cross-tx distinction — the #1 production bug hit
4. Explicit `gasLimit` override — fhEVM hardhat plugin estimateGas interceptor breaks without it
5. `reencrypt` pattern — user-specific decryption using ephemeral keypair + EIP-712
6. Bilateral reveal — two-party consent before `makePubliclyDecryptable` fires
7. Oblivious collateral check — `FHE.ge` + `FHE.select`, never reverts
8. Portfolio FHE aggregation — `FHE.max` across encrypted position array
9. fhEVM constructor restriction — `FHE.asEuint64(0)` in constructor reverts on live networks
10. NestJS keeper: WebSocket for events + HTTP for writes — two separate transport clients

### Category C — Missing Self-Improvement Infrastructure

- No error registry (errors are forgotten across sessions)
- No antipattern catalogue (code that looks correct but fails is re-invented)
- No pre-code design challenge (most FHE bugs are design bugs, not code bugs)
- No session state persistence across Claude Code sessions
- No automated version drift detection

---

## Section 2: New Directory Structure

```
zama-skills/
├── .fhevm/
│   ├── CLAUDE.md                         # v2 — updated entry point (~1100 tokens)
│   ├── ORCHESTRATION.md                  # updated — Phase 0.5 Interrogation Gate added
│   ├── INVARIANTS.md                     # updated — 2 new invariants (11, 12)
│   ├── PRIVACY-SPEC-TEMPLATE.md          # unchanged
│   ├── UPDATE-MAP.md                     # updated — fhevmjs + viem columns
│   ├── ERROR-PATTERNS.md                 # NEW — 8 pre-populated production bugs
│   ├── ANTIPATTERNS.md                   # NEW — 6 pre-populated antipatterns
│   ├── INTERROGATION-GATE.md             # NEW — 5D design interrogation, 15 questions
│   ├── SESSION-STATE.md                  # NEW — per-project session template
│   └── directives/
│       ├── SKILL-ACL.md                  # updated — transient vs allow distinction
│       ├── SKILL-TYPES.md                # unchanged
│       ├── SKILL-OPERATIONS.md           # unchanged
│       ├── SKILL-INPUTS.md               # updated — encryptTwo64 pattern added
│       ├── SKILL-DECRYPTION.md           # updated — reencrypt flow added
│       ├── SKILL-TESTING.md              # unchanged
│       ├── SKILL-DEPLOY.md               # updated — explicit gasLimit added
│       ├── SKILL-FRONTEND.md             # BREAKING FIX — fhevmjs ^0.6.2 APIs
│       ├── SKILL-BACKEND.md              # BREAKING FIX — viem + NestJS pattern
│       ├── SKILL-ERC7984.md              # unchanged
│       └── SKILL-GASMODEL.md             # NEW — gas model, interceptor, gasLimit table
│
├── fingerprints/
│   ├── fhevm-solidity-api.md             # NEW — all FHE.* signatures (<300 tokens)
│   ├── fhevmjs-client-api.md             # NEW — browser SDK exact API
│   ├── viem-keeper-api.md                # NEW — viem patterns for backend
│   ├── nestjs-keeper-api.md              # NEW — NestJS module structure
│   └── wagmi-hooks-api.md                # NEW — wagmi v3 hooks
│
├── templates/
│   ├── confidential-token-scaffold.sol   # unchanged
│   ├── confidential-vote-scaffold.sol    # unchanged
│   ├── sealed-bid-auction-scaffold.sol   # unchanged
│   ├── acl-value-scaffold.sol            # PATCHED — remove FHE.asEuint32(0) from constructor
│   ├── public-decrypt-scaffold.sol       # unchanged
│   ├── fhevm-test-scaffold.ts            # unchanged
│   ├── deploy-scaffold.ts                # PATCHED — add explicit gasLimit
│   ├── fhevm-frontend-hooks-scaffold.ts  # BREAKING FIX — fhevmjs ^0.6.2
│   ├── keeper-service-scaffold.ts        # BREAKING FIX — viem dual transport
│   ├── phase-acl-ledger-scaffold.sol     # NEW
│   ├── oblivious-collateral-scaffold.sol # NEW
│   ├── bilateral-reveal-scaffold.sol     # NEW
│   ├── multi-contract-fhe-scaffold.sol   # NEW
│   ├── portfolio-aggregation-scaffold.sol # NEW
│   ├── fhevm-client-scaffold.ts          # NEW — full fhevmjs init + encryptTwo64 + reencrypt
│   ├── keeper-service-nestjs-scaffold.ts # NEW — NestJS keeper with dual viem transport
│   ├── wagmi-config-scaffold.ts          # NEW — wagmi v3 + viem + sepolia
│   └── contract-addresses-scaffold.ts    # NEW — addresses template
│
├── scripts/
│   └── check-versions.js                 # NEW — local version check tool
│
├── .github/
│   └── workflows/
│       └── version-check.yml             # NEW — weekly npm version CI
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-07-zama-skills-v2-design.md  # THIS FILE
```

---

## Section 3: Layer 1 — Critical Fixes (Breaking Issues)

These 8 fixes must complete before any other v2 work.

### Fix 1: `SKILL-FRONTEND.md` — SDK Package and All APIs

Version header: `@zama-fhe/relayer-sdk ^0.4.3` → `fhevmjs ^0.6.2`

Import:
```typescript
// BEFORE
import { createInstance, FhevmInstance, PublicDecryptResults } from "@zama-fhe/relayer-sdk";
// AFTER
import { createInstance, FhevmInstance } from "fhevmjs";
```

createInstance call:
```typescript
// BEFORE — zero params, does not match real API
const inst = await createInstance();
// AFTER — 5 required params (Sepolia constants hardcoded)
const SEPOLIA_ACL     = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const SEPOLIA_KMS     = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const SEPOLIA_GATEWAY = "https://gateway.sepolia.zama.ai";
const inst = await createInstance({
  kmsContractAddress: SEPOLIA_KMS,
  aclContractAddress: SEPOLIA_ACL,
  chainId: 11155111,
  networkUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  gatewayUrl: SEPOLIA_GATEWAY,
});
```

Reencrypt (replace placeholder TODO with real 3-step flow):
```typescript
// generateKeypair → createEIP712 → signTypedData (user) → reencrypt
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(publicKey, contractAddress);
const signature = await signer.signTypedData(eip712.domain, eip712.types, eip712.message);
const clearValue = await instance.reencrypt(handle, privateKey, publicKey, signature, contractAddress, userAddress);
```

### Fix 2: `SKILL-BACKEND.md` — viem Dual Transport Pattern

Version header: `@zama-fhe/relayer-sdk` → `viem ^2.0.0 | @nestjs/event-emitter`

Two-transport setup (replace single ethers provider):
```typescript
// WebSocket — ONLY for watchContractEvent
const wsClient = createPublicClient({ chain: sepolia, transport: webSocket(process.env.RPC_URL!) });
// HTTP — for reads and writes
const httpClient = createPublicClient({ chain: sepolia, transport: http(process.env.HTTP_RPC_URL!) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(process.env.HTTP_RPC_URL!) });
```

Env vars:
```bash
# BEFORE — single URL
RPC_URL=https://sepolia.infura.io/v3/KEY
# AFTER — two separate URLs (WebSocket + HTTP)
RPC_URL=wss://sepolia.infura.io/ws/v3/KEY
HTTP_RPC_URL=https://sepolia.infura.io/v3/KEY
```

### Fix 3: `fhevm-frontend-hooks-scaffold.ts` — Full Rewrite

Rewrite `useFhevm` with correct 5-param createInstance. Add `encryptTwo64` method (one input, two add64 calls, shared proof). Replace user-decrypt section with full reencrypt three-step flow.

### Fix 4: `keeper-service-scaffold.ts` — viem Transport Rewrite

Replace all ethers imports with viem. Add dual transport setup. Replace `contract.on(...)` with `wsClient.watchContractEvent(...)`. Replace `contract.finalizeResult(...)` with `walletClient.writeContract(...)`.

### Fix 5: `acl-value-scaffold.sol` — Constructor FHE Restriction

```solidity
// BEFORE — reverts on Sepolia (coprocessor not live in constructor)
constructor(address admin) Ownable(admin) {
    _encryptedState = FHE.asEuint32(0);
    FHE.allowThis(_encryptedState);
}
// AFTER — lazy initialization on first write
bool private _initialized;
function _ensureInit() internal {
    if (!_initialized) {
        _encryptedState = FHE.asEuint32(0);
        FHE.allowThis(_encryptedState);
        _initialized = true;
    }
}
```

### Fix 6: `SKILL-DECRYPTION.md` — Remove relayer-sdk, Add reencrypt

Replace the off-chain user decrypt section with the full reencrypt flow. Remove publicDecryptResults references that assume relayer-sdk shape.

### Fix 7: `deploy-scaffold.ts` — Explicit gasLimit

```typescript
// BEFORE
const contract = await Factory.deploy(...args);
// AFTER — fhEVM hardhat plugin estimateGas interceptor breaks without explicit gasLimit
const contract = await Factory.deploy(...args, { gasLimit: 3_000_000n });
// Also for write calls:
await contract.myFheFunction(...args, { gasLimit: 500_000n });
```

### Fix 8: `UPDATE-MAP.md` — Package Columns

Add `fhevmjs ^0.6.2` column (affects SKILL-FRONTEND.md, fhevm-frontend-hooks-scaffold.ts).
Add `viem ^2.0.0` column (affects SKILL-BACKEND.md, keeper scaffolds).
Remove `@zama-fhe/relayer-sdk` column.

---

## Section 4: Layer 2 — New Scaffolds

### 4.1 `phase-acl-ledger-scaffold.sol`
**Pattern:** Finality-based bilateral ACL grant. Phase 1 = allowThis only. Phase 2 (after 96 blocks) = FHE.allow(buyer) + FHE.allow(writer).
**Pre-implemented:** `FINALITY_BLOCKS = 96`, `blockGranted[positionId]` storage, `_isInFinalityWindow()` view, `grantFinalityAccess()` with block check + FHE.allow calls, allowThis on all Phase 1 writes.
**AI fills:** business field names, Phase 1 write logic, Phase 2 business actions.
**Concepts:** EIP-1153 transient vs persistent ACL, block-number finality windows, bilateral access.

### 4.2 `oblivious-collateral-scaffold.sol`
**Pattern:** FHE comparison + FHE.select for collateral checks that never revert.
**Pre-implemented:** `euint64 private _lockedCollateral`, `_obliviousCheck(requested, available)` returning `FHE.select(FHE.ge(available, requested), requested, available)`, full FHE.ge → FHE.select pattern, comment explaining why require is forbidden.
**AI fills:** collateral source variable, business action on check result, event names.
**Concepts:** Oblivious computation, FHE.ge semantics, FHE.select as encrypted ternary, privacy via no-revert.

### 4.3 `bilateral-reveal-scaffold.sol`
**Pattern:** Two-party consent gate before makePubliclyDecryptable fires.
**Pre-implemented:** `bool private _buyerRevealed`, `bool private _writerRevealed`, `setBuyerReveal()`, `setWriterReveal()` with onlyBuyer/onlyWriter modifiers, `_tryMakePubliclyDecryptable()` checking both flags.
**AI fills:** handle being revealed, post-reveal business logic, event structure.
**Concepts:** Multi-party consent, bilateral reveal gate, makePubliclyDecryptable semantics.

### 4.4 `multi-contract-fhe-scaffold.sol`
**Pattern:** Cross-contract FHE using allowTransient (same tx) and FHE.allow (cross tx) — the exact boundary between them.
**Pre-implemented:** ContractA using `FHE.allowTransient(handle, settlementContract)` for same-tx cross-contract call. ContractA using `FHE.allow(handle, addr)` for future-tx persistent grant. Annotated comments showing which applies when.
**AI fills:** business logic per contract, actual handle being passed, method signatures.
**Concepts:** EIP-1153 transient lifetime, cross-contract ACL decision tree, when transient silently fails.

### 4.5 `portfolio-aggregation-scaffold.sol`
**Pattern:** Iterate array of encrypted position handles, compute FHE.max across all.
**Pre-implemented:** `euint64[] private _positionHandles`, `addPosition(externalEuint64, bytes)` with fromExternal + allowThis + push, `recomputePortfolioMax()` loop using FHE.max with allowThis after each iteration, gas warning comment (cap at ~20 positions).
**AI fills:** position struct shape, aggregation metric choice (max/add), business context.
**Concepts:** FHE array iteration, FHE.max semantics, gas cost awareness, ACL on dynamic aggregates.

### 4.6 `fhevm-client-scaffold.ts`
**Pattern:** Complete fhevmjs ^0.6.2 client — correct init, encryptUint64, encryptTwo64, reencrypt.
**Pre-implemented:** `initFhevmInstance()` with Sepolia constants pre-filled, `encryptUint64()`, `encryptTwo64()` (both values share one `input.encrypt()` call → one proof), full `reencryptHandle()` three-step flow.
**AI fills:** which values to encrypt, which contract address, wagmi signing integration.
**Concepts:** Why encryptTwo64 needs shared proof, reencrypt vs publicDecrypt distinction, EIP-712 domain.

### 4.7 `keeper-service-nestjs-scaffold.ts`
**Pattern:** NestJS keeper with WebSocket events + HTTP writes, @OnEvent decorator, pending queue with retry.
**Pre-implemented:** `@Injectable` KeeperService class, WebSocket wsClient for watchContractEvent in onModuleInit, HTTP walletClient for writeContract on finalize, @OnEvent handler with pending queue, retry with exponential backoff, onModuleDestroy cleanup.
**AI fills:** ABI fragment, event name, function name, handle extraction from log args.
**Concepts:** NestJS event bus pattern, module lifecycle hooks, two-transport viem requirement, keeper resilience.

### 4.8 `wagmi-config-scaffold.ts`
**Pattern:** wagmi v3 + viem + Sepolia configuration for Next.js frontend.
**Pre-implemented:** `createConfig` with sepolia chain + http transport, WagmiProvider wrapper, QueryClient from @tanstack/react-query, Sepolia constants block, `createFhevmInstance()` using wagmi's transport URL.
**AI fills:** additional chains if needed, custom RPC config, app-level provider wrapping.
**Concepts:** wagmi v3 QueryClient requirement, how to source networkUrl from wagmi, Sepolia constants integration.

### 4.9 `contract-addresses-scaffold.ts`
**Pattern:** Auto-generated contract addresses file, regenerated by deploy script.
**Pre-implemented:** Sepolia ACL/KMS/Gateway constants, `CONTRACT_ADDRESSES` typed object, `getContractAddress(network, name)` helper, comment: "auto-generated by scripts/deploy.ts — do not edit manually".
**AI fills:** actual contract names and deployed addresses after Phase 3.

---

## Section 5: Layer 3 — Fingerprint System

### Design Principles

Fingerprint files = compact API references. Function signatures, types, parameter names, constants only. No implementation code. No explanation prose. Under 300 tokens each.

**Directive vs Fingerprint:**
- **Directives (`SKILL-*.md`):** Conceptual model, when to use each function, common mistakes. Read for understanding.
- **Fingerprints (`fingerprints/*.md`):** Exact signatures. Read for implementation lookup.

**CLAUDE.md v2 loading rule:**
```
When writing implementation code: load fingerprint for exact signatures + directive for conceptual guidance.
- Solidity FHE code → fingerprints/fhevm-solidity-api.md
- Frontend code     → fingerprints/fhevmjs-client-api.md
- viem backend      → fingerprints/viem-keeper-api.md
- NestJS keeper     → fingerprints/nestjs-keeper-api.md
- wagmi hooks       → fingerprints/wagmi-hooks-api.md
```

### 5.1 `fingerprints/fhevm-solidity-api.md` (~220 tokens)
All FHE.* function signatures grouped by: ACL (allowThis, allow, allowTransient, makePubliclyDecryptable, isAllowed), Input (fromExternal, toBytes32), Arithmetic (add, sub, mul, div, neg), Comparison→ebool (eq, ne, gt, ge, lt, le), Conditional (select), Aggregation (max, min), Cast (asEuint64, asEbool, asEaddress), Verify (checkSignatures). Plus canonical import lines.

### 5.2 `fingerprints/fhevmjs-client-api.md` (~240 tokens)
createInstance (all 5 params with Sepolia values), createEncryptedInput, add64/add8/addBool, encrypt() return shape, generateKeypair, createEIP712, reencrypt, publicDecrypt. Import line. Critical note on shared inputProof.

### 5.3 `fingerprints/viem-keeper-api.md` (~230 tokens)
Two-transport setup (WebSocket for events, HTTP for reads/writes), watchContractEvent, readContract, writeContract, parseAbiItem, privateKeyToAccount. All imports.

### 5.4 `fingerprints/nestjs-keeper-api.md` (~190 tokens)
@Module declaration, @Injectable KeeperService with OnModuleInit/OnModuleDestroy, @OnEvent decorator usage, EventEmitter2 + EventEmitterModule imports, ConfigService get pattern. Package install line.

### 5.5 `fingerprints/wagmi-hooks-api.md` (~210 tokens)
createConfig + WagmiProvider + QueryClient setup, useAccount, useChainId, usePublicClient, useWalletClient, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData. All imports.

---

## Section 6: Layer 4 — Self-Improvement System

### 6A: `ERROR-PATTERNS.md` — Production Bug Registry

Format per entry (exactly 4 fields):
```
### EP-N: [Short Name]
SYMPTOM: [Exact error or observable behavior]
ROOT CAUSE: [One sentence — mechanical reason]
FIX: [Before/after code]
INVARIANT VIOLATED: [Invariant N — name] | NEW | None
```

**8 pre-populated entries from production:**

**EP-1: allowTransient Used Where Cross-Tx Allow Needed**
- SYMPTOM: Function executes without revert, but encrypted handle produces garbage/zero value in next tx. Silent failure.
- ROOT CAUSE: `FHE.allowTransient` uses EIP-1153 transient storage — zeroed at end of tx. Next tx has no ACL grant.
- FIX: Replace `FHE.allowTransient(handle, addr)` with `FHE.allow(handle, addr)` when next-tx access is needed.
- INVARIANT VIOLATED: Invariant 1 (allowThis on Every Write) — extended to cross-tx allow requirement.

**EP-2: fhEVM estimateGas Interceptor Fails Without Explicit gasLimit**
- SYMPTOM: Deploy hangs or throws UNPREDICTABLE_GAS_LIMIT. FHE function calls revert with gas estimation error.
- ROOT CAUSE: `@fhevm/hardhat-plugin` installs an estimateGas interceptor that calls the coprocessor. Fails for FHE calls without on-chain context.
- FIX: `Factory.deploy(...args, { gasLimit: 3_000_000n })` for deploy; `contract.fn(...args, { gasLimit: 500_000n })` for writes.
- INVARIANT VIOLATED: NEW → Invariant 11: All fhEVM transactions must specify explicit gasLimit.

**EP-3: FHE.asEuint64(0) in Constructor Reverts on Live Network**
- SYMPTOM: Deploy succeeds on local mock, reverts silently on Sepolia.
- ROOT CAUSE: FHE coprocessor not available during contract construction on live networks. Any coprocessor call in constructor reverts.
- FIX: Lazy initialization — initialize on first function call that writes the state variable.
- INVARIANT VIOLATED: NEW → Invariant 12: No FHE coprocessor calls in constructors.

**EP-4: TypeScript BigInt Literals Fail**
- SYMPTOM: `SyntaxError: Cannot use BigInt literal in ES2017 mode` or silent NaN.
- ROOT CAUSE: BigInt literal syntax (`1000n`) requires ES2020+.
- FIX: `tsconfig.json` → `"target": "ES2020"`.
- INVARIANT VIOLATED: None (TypeScript config issue).

**EP-5: Events Silently Drop — WebSocket vs HTTP Confusion**
- SYMPTOM: Keeper starts without error. Events never received. On-chain reveals go unprocessed.
- ROOT CAUSE: `watchContractEvent` in viem requires WebSocket transport. HTTP URL silently fails to subscribe.
- FIX: `RPC_URL=wss://...` for WebSocket client; `HTTP_RPC_URL=https://...` for wallet client.
- INVARIANT VIOLATED: None (infrastructure config issue).

**EP-6: fhevmjs createInstance Called With Zero Params**
- SYMPTOM: `TypeError: kmsContractAddress is required` or instance created but all encrypt/decrypt calls fail.
- ROOT CAUSE: fhevmjs ^0.6.2 requires 5 explicit config params. Old SDK accepted zero.
- FIX: See `fingerprints/fhevmjs-client-api.md` — all 5 params with Sepolia constants.
- INVARIANT VIOLATED: None (SDK config issue).

**EP-7: Batch Encryption Generates Two Separate Proofs**
- SYMPTOM: Contract receiving two encrypted inputs reverts with `InvalidProof` or `ProofMismatch`.
- ROOT CAUSE: Two separate `createEncryptedInput` → `encrypt()` calls produce two separate proofs. ZKPoK is bound to all inputs in a single EncryptedInput. Individual handles fail with each other's proof.
- FIX: `const input = instance.createEncryptedInput(addr, user); input.add64(a); input.add64(b); const enc = await input.encrypt();` — one proof for both handles.
- INVARIANT VIOLATED: Invariant 4 (Input Proofs) — extended: all inputs for one function call must share one EncryptedInput.

**EP-8: Next.js 16 Async Params Not Awaited**
- SYMPTOM: `params.id` is a Promise object, not a string. Silent type coercion downstream.
- ROOT CAUSE: Next.js 16 made route params async. Must `await params` before destructuring.
- FIX: `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`
- INVARIANT VIOLATED: None (Next.js version migration).

---

### 6B: `ANTIPATTERNS.md` — Code That Looks Correct But Isn't

Format per entry (4 fields):
```
### AP-N: [Antipattern Name]
LOOKS LIKE: [Code that appears correct]
ACTUALLY WRONG BECAUSE: [One sentence — the subtle reason]
CORRECT PATTERN: [What to write instead]
```

**6 pre-populated antipatterns:**

**AP-1: allowTransient for State That Persists**
- LOOKS LIKE: `FHE.allowTransient(encPosition, counterparty);` — granting counterparty access for acceptMatch
- ACTUALLY WRONG BECAUSE: allowTransient zeroes at end of tx (EIP-1153). Next tx (acceptMatch) has no ACL grant → silent zero.
- CORRECT PATTERN: `FHE.allow(encPosition, counterparty);` — persistent grant survives across txs.

**AP-2: if/require on FHE Comparison Result**
- LOOKS LIKE: `require(FHE.ge(collateral, required), "insufficient");`
- ACTUALLY WRONG BECAUSE: `FHE.ge` returns `ebool` handle (ciphertext integer), not a plaintext bool. Branching on it always takes one path, ignoring the actual encrypted comparison.
- CORRECT PATTERN: `euint64 actual = FHE.select(FHE.ge(collateral, required), required, collateral);`

**AP-3: Two Separate EncryptedInputs for One Function Call**
- LOOKS LIKE: Two separate `createEncryptedInput` → `encrypt()` calls, passing both handles and both proofs.
- ACTUALLY WRONG BECAUSE: ZKPoK is cryptographically bound to all inputs in one EncryptedInput. Separate inputs produce proofs that individually fail to validate the combined handle set.
- CORRECT PATTERN: One `createEncryptedInput`, multiple `add64/addBool` calls, one `await input.encrypt()`, one shared inputProof.

**AP-4: FHE.asEuint64(0) in Constructor**
- LOOKS LIKE: `constructor() { _state = FHE.asEuint64(0); FHE.allowThis(_state); }` — seems like clean initialization.
- ACTUALLY WRONG BECAUSE: Coprocessor not active during construction on live networks. Works in Hardhat mock, fails on Sepolia.
- CORRECT PATTERN: Lazy `_ensureInit()` function called on first write, not in constructor.

**AP-5: Forgetting allowThis After FHE Arithmetic**
- LOOKS LIKE: `_balance = FHE.add(_balance, deposit); FHE.allow(_balance, msg.sender);` — grants user, seems complete.
- ACTUALLY WRONG BECAUSE: `FHE.add` returns a new handle. Contract itself loses access (`allowThis` not called). Next call using `_balance` silently gets garbage.
- CORRECT PATTERN: `_balance = FHE.add(...); FHE.allowThis(_balance); FHE.allow(_balance, user);` — allowThis ALWAYS first.

**AP-6: ethers.JsonRpcProvider for Event Watching**
- LOOKS LIKE: `const provider = new ethers.JsonRpcProvider(RPC_URL); contract.on("RevealRequested", handler);`
- ACTUALLY WRONG BECAUSE: HTTP polling misses events in high-throughput scenarios. viem's `watchContractEvent` specifically requires WebSocket transport.
- CORRECT PATTERN: `const wsClient = createPublicClient({ transport: webSocket(WS_URL) }); wsClient.watchContractEvent({ ..., onLogs: handler });`

---

### 6C: `INTERROGATION-GATE.md` — 5D Design Challenge

Runs AFTER Phase 0, BEFORE Phase 1. Agent must answer all 15 questions, show analysis to developer, get explicit approval, THEN start Phase 1.

**Dimension 1: Forward Effects** — What does this design enable beyond what was asked for?
- Q1.1: What second-order capabilities does this design create that the developer did not explicitly request?
- Q1.2: Who benefits from the privacy guarantees in ways not accounted for — including parties not in the actor list?
- Q1.3: At 10x expected scale, what emergent behaviors appear that weren't designed for?

**Dimension 2: Backward Causes** — What assumptions are baked in that could be wrong?
- Q2.1: What must be true about the network, users, and coprocessor for this to function? List every assumption.
- Q2.2: Which assumption is most likely to be violated in the first 30 days? What breaks?
- Q2.3: What attack surface exists where confidential data could be inferred indirectly (without decryption)?

**Dimension 3: Hidden Dependencies** — What external systems does this silently rely on?
- Q3.1: List every off-chain system this contract depends on — RPC providers, gateways, keeper wallets, oracles.
- Q3.2: Which dependency is a single point of failure? What happens to user funds if it goes down?
- Q3.3: What happens if the Zama KMS becomes temporarily unreachable? Degradation mode or full halt?

**Dimension 4: Failure Modes** — What breaks first under stress or attack?
- Q4.1: Adversary with full plaintext knowledge (no FHE key) tries to manipulate this contract. Best attack vector?
- Q4.2: Largest gas cost in this contract? What happens if called in a loop? DOS vector?
- Q4.3: If keeper crashes after `makePubliclyDecryptable` but before `checkSignatures`, what is the recovery path?

**Dimension 5: Reversals** — What if we got the encryption decisions backwards?
- Q5.1: We chose to encrypt [specific fields]. Challenge: is there a simpler design achieving same privacy by encrypting fewer things?
- Q5.2: Are any "encrypted" fields actually observable through public state changes, events, or tx patterns?
- Q5.3: We chose NOT to encrypt [public fields]. Challenge: does revealing those fields create an unconsidered privacy violation?

**Completion format:**
```
═══════════════════════════════════════════════════
  INTERROGATION GATE COMPLETE
═══════════════════════════════════════════════════
DIMENSIONS ANALYZED: 5
FLAGS RAISED: [N]
[List each FLAG with dimension + question number]
RECOMMENDATION: [proceed | adjust design on [specific item]]
Shall I proceed to Phase 1 (Privacy Specification), or would you like to adjust the design?
```

---

### 6D: `SESSION-STATE.md` — Per-Project Session Template

Developer copies to their project as `.fhevm/SESSION.md`. Agent reads at session start, updates after each gate.

Fields:
- **Project Identity:** System name, network, contract name
- **Current Phase:** 0–5 or COMPLETE, last gate completed, next action
- **Privacy Spec Summary:** One paragraph after Gate 1-A approval, visibility matrix hash
- **Deployed Addresses:** Contract | Network | Address | Date table
- **Errors Hit + Fixes:** Error Pattern | Fix Applied | Phase table (grows over time)
- **Decisions Made + Rationale:** Decision | Rationale | Phase table
- **Interrogation Gate Results:** Flags raised, key findings, developer approved YES/NO

**Agent instruction in SESSION-STATE.md:**
```
At session start: Read this file. Resume from Current Phase and Next Action.
After each gate: Update Current Phase, Last Gate Completed, Next Action.
After each error: Add row to Errors Hit.
After each decision: Add row to Decisions Made.
After deployment: Fill Deployed Addresses.
```

---

## Section 7: Layer 5 — Version Automation

### 7A: `.github/workflows/version-check.yml`

Weekly cron (Monday 9:00 UTC) + manual dispatch. Runs `scripts/check-versions.js --output=json`. If any package has a new minor/major version, opens a GitHub issue with:
- Table: package | in-skills version | latest npm | status | affected directives
- Checklist: `- [ ] Review SKILL-X.md for API changes` per affected directive
- Labels: `maintenance`, `skill-update`

### 7B: `scripts/check-versions.js`

Reads version compatibility matrix from `UPDATE-MAP.md` via regex. Fetches latest version from npm registry API for each tracked package. Compares with semver (major.minor comparison). Outputs table (human) or JSON (CI).

```
Usage:
  node scripts/check-versions.js           # formatted table
  node scripts/check-versions.js --output=json  # JSON for CI

Output:
  Package                           | In Skills | Latest npm | Status
  @fhevm/solidity                   | ^0.11.1   | 0.12.0     | OUTDATED (minor)
  fhevmjs                           | ^0.6.2    | 0.6.5      | OUTDATED (patch)
  viem                              | ^2.0.0    | 2.18.0     | OUTDATED (minor)

Exit code: 0 = OK, 1 = any outdated package
```

JSON output fields: `packages[]` (package, inSkills, latestNpm, status, directives[]), `outdated[]`, `timestamp`.

### 7C: `scripts/sync-docs.js` — Future Concept (Design Only)

**Sources:** Zama docs pages (types, ACL, operations, oracle) + `github.com/zama-ai/fhevm/blob/main/lib/FHE.sol` as source of truth.

**Parse approach:** Fetch pages, extract fenced Solidity code blocks, parse `FHE.[a-zA-Z]+\(` signatures, normalize to `FHE.functionName(paramTypes) → returnType` form.

**Comparison:** Against `fingerprints/fhevm-solidity-api.md`. Flag: `NEW_FUNCTION` (in docs, not in fingerprint), `POSSIBLY_REMOVED` (in fingerprint, not in docs).

**Contract:** Read-only, never auto-updates, outputs human report + optional JSON. Run before any SDK version bump review.

---

## Section 8: Updated CLAUDE.md Design (7 Changes, ≤1200 tokens total)

| Change | Content | Token Delta |
|---|---|---|
| 1 | Fix SDK: fhevmjs ^0.6.2 (frontend), viem ^2.0.0 (backend) | +10 |
| 2 | Phase 0.5 Interrogation Gate: load INTERROGATION-GATE.md, 15 questions, await approval | +40 |
| 3 | Top 3 antipattern quick reference (allowTransient, if/require on ebool, two separate proofs) | +50 |
| 4 | Gas model note: explicit gasLimit required, 3M deploy / 500K-1.5M writes / see SKILL-GASMODEL.md | +30 |
| 5 | Session state instruction: read SESSION.md at start, update after each gate | +50 |
| 6 | Fingerprint loading rule: fingerprints/ for signatures, SKILL-*.md for concepts | +40 |
| 7 | Step 0 in debug: check ERROR-PATTERNS.md by symptom before debugging | +25 |

Estimated v2 total: 700-950 (base) + 245 = **945-1195 tokens** — within 1200 target.

---

## Section 9: Implementation Order

### Phase A: Critical SDK Fixes (Blocking — Must Complete First)
Files: SKILL-FRONTEND.md, SKILL-BACKEND.md, SKILL-DECRYPTION.md, fhevm-frontend-hooks-scaffold.ts, keeper-service-scaffold.ts, acl-value-scaffold.sol, deploy-scaffold.ts, UPDATE-MAP.md
**Review gate:** Test updated frontend scaffold against live Sepolia fhevmjs ^0.6.2. Test keeper scaffold with viem WebSocket event watching. Deploy without gasLimit error.

### Phase B: Error Infrastructure
Files: ERROR-PATTERNS.md (8 entries), ANTIPATTERNS.md (6 entries), INVARIANTS.md (add 11 + 12)
**Review gate:** Each EP entry: ROOT CAUSE and FIX are technically precise. INVARIANT VIOLATED mapping is correct.

### Phase C: Fingerprint System
Files: fingerprints/ directory (5 files), CLAUDE.md (add Change 6 only)
**Review gate:** Each file ≤300 tokens. Every function signature matches production-verified API exactly.

### Phase D: New Scaffolds
Files: 9 new templates, ORCHESTRATION.md (update Gate 1-B scaffold selection table)
**Review gate:** Each Solidity scaffold compiles against @fhevm/solidity ^0.11.1. Each TypeScript scaffold type-checks. `phase-acl-ledger-scaffold.sol` deployed to local mock with finality logic verified.

### Phase E: Interrogation Gate + Session State
Files: INTERROGATION-GATE.md, SESSION-STATE.md, CLAUDE.md (Changes 1-5 + 7), ORCHESTRATION.md (Phase 0.5 gate)
**Review gate:** Run full Phase 0 + Phase 0.5 with a real developer. Gate must surface at least one unconsidered design issue. Session state persists correctly across two separate Claude Code sessions.

### Phase F: Version Automation
Files: scripts/check-versions.js, .github/workflows/version-check.yml, README.md update
**Review gate:** `node scripts/check-versions.js` outputs correct table. Trigger workflow manually with artificially downgraded version → confirm issue is created.

---

## Section 10: Composability and Distribution

### Installation Methods

**Manual copy (no tooling):**
```bash
cp -r zama-skills/.fhevm your-project/.fhevm
cp -r zama-skills/templates your-project/templates
cp -r zama-skills/fingerprints your-project/fingerprints
```
Add `.fhevm/CLAUDE.md` to project's Claude Code context.

**npx skill add (target):**
```bash
npx skills add fhevm-zama
```

**Git submodule (teams):**
```bash
git submodule add https://github.com/your-org/zama-skills .fhevm-skills
ln -s .fhevm-skills/.fhevm .fhevm
```

### Composability with Other Skills

| Skill | Composes With | How |
|---|---|---|
| `nestjs-best-practices` | keeper scaffolds | NestJS structural patterns + fhEVM transport patterns — no conflict |
| `superpowers:brainstorming` | Phase 0 ideation | Brainstorm design space, then Interrogation Gate narrows it |
| `playwright-e2e-testing` | frontend scaffolds | Playwright for test structure, fhEVM skill for encrypted input helpers |
| `superpowers:writing-plans` | this document | Implementation phases A-F are designed for executing-plans |
| `concept-interrogation` | Phase 0.5 | The Interrogation Gate IS concept-interrogation applied to FHE design |

### Versioning Contract

When Zama releases a new SDK version:
1. GitHub Actions detects drift within one week → opens issue with directive review checklist
2. Maintainer reviews using UPDATE-MAP.md dependency map
3. Directive files + fingerprints updated
4. Scaffolds recompiled/type-checked against new version
5. New error patterns from the update process added to ERROR-PATTERNS.md
6. Version headers updated across affected files
7. Commit: `chore: update skill directives for fhevmjs vX.Y.Z`

This creates a sustainable maintenance loop: drift detected → reviewed → fixed → error patterns grow.

---

## Appendix: Exact APIs From Production (Source of Truth)

### Sepolia Constants (hardcoded, production-verified)
```typescript
const SEPOLIA_ACL     = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const SEPOLIA_KMS     = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const SEPOLIA_GATEWAY = "https://gateway.sepolia.zama.ai";
```

### Solidity Imports (production-verified)
```solidity
import { FHE, euint64, ebool, eaddress, externalEuint64, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
```

### All FHE.* Functions Used in Production
```
FHE.fromExternal(externalHandle, inputProof) → euint64
FHE.allowThis(handle)
FHE.allowTransient(handle, contractAddr)    // EIP-1153, current tx only
FHE.allow(handle, addr)                     // persistent, across txs
FHE.asEuint64(uint64) → euint64
FHE.asEbool(bool) → ebool
FHE.asEaddress(address) → eaddress
FHE.select(ebool, euint64, euint64) → euint64
FHE.lt(a, b) → ebool
FHE.ge(a, b) → ebool
FHE.add(a, b) → euint64
FHE.sub(a, b) → euint64
FHE.mul(a, b) → euint64
FHE.max(a, b) → euint64
FHE.makePubliclyDecryptable(handle)
FHE.toBytes32(handle) → bytes32
FHE.checkSignatures(handles[], abiEncoded, proof)
```

### Package Versions (production-verified 2026-05-07)
```json
{
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.2",
  "@openzeppelin/confidential-contracts": "^0.4.0",
  "fhevmjs": "^0.6.2",
  "viem": "^2.0.0",
  "wagmi": "^3.6.9",
  "@nestjs/common": "^11.0.0",
  "@nestjs/event-emitter": "^3.0.0",
  "zod": "^3.22.0"
}
```
