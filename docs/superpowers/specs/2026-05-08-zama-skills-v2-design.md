# Zama Skills v2 — Design Specification (Revised)

**Date:** 2026-05-08
**Status:** PENDING DEVELOPER REVIEW — Do not implement until approved
**Replaces:** `2026-05-07-zama-skills-v2-design.md` (had wrong SDK section)
**Source:** Post-pull production audit of `/Users/kaushalchaudhari/Desktop/web3/projects/zama`

---

## Overview

Zama Skills is a markdown-first skill system for Claude Code that guides developers through full-stack fhEVM applications. This v2 revision is grounded in a post-`git pull` audit of the real production build. The previous draft incorrectly identified `fhevmjs` as the correct frontend SDK — the actual production uses `@zama-fhe/relayer-sdk ^0.4.2` with a two-step init pattern. This document supersedes the previous spec.

---

## Section 1: What Changed After the Pull (Critical Corrections)

### A — SDK Is `@zama-fhe/relayer-sdk` (Not `fhevmjs` Directly)

Production `frontend/lib/fhevm-client.ts` after pull:
```typescript
// Frontend imports from @zama-fhe/relayer-sdk/web
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";

// TWO-STEP INIT (old skills use zero-param createInstance — WRONG)
await initSDK({ tfheParams: "/wasm/tfhe_bg.wasm", kmsParams: "/wasm/kms_lib_bg.wasm" });
instance = await createInstance({ ...SepoliaConfig, network: process.env.NEXT_PUBLIC_RPC_URL });
```

Backend `keeper.service.ts` uses:
```typescript
// Node entrypoint — lazy require to avoid startup crash
const sdk = require("@zama-fhe/relayer-sdk/node");
const instance = await sdk.createInstance({ ...sdk.SepoliaConfig, network: HTTP_RPC_URL });
```

`SepoliaConfig` is pre-bundled in the SDK — it already includes `kmsContractAddress`, `aclContractAddress`, `inputVerifierContractAddress`, `relayerUrl`, `chainId`. Developers MUST NOT hardcode these values.

**Rule for all skills:** Use `@zama-fhe/relayer-sdk`. Never import from `fhevmjs` directly. Never import from `@fhevm/relayer-sdk` (wrong package name). The split is:
- Browser: `@zama-fhe/relayer-sdk/web`
- Node/Server: `@zama-fhe/relayer-sdk/node`

### B — `userDecrypt` Replaces `reencrypt`

Old skills had a TODO placeholder for decryption. Production uses `userDecrypt` — a 8-argument function, not the old `reencrypt` 6-argument call:

```typescript
// CORRECT: userDecrypt (NOT instance.reencrypt)
const { publicKey, privateKey } = instance.generateKeypair();
const now = Math.floor(Date.now() / 1000);
const eip712 = instance.createEIP712(publicKey, [contractAddress], now, 1); // startTimestamp, durationDays
const signature = await walletClient.signTypedData({ account: address, ...eip712 });
const results = await instance.userDecrypt(
  [{ handle: handleHex, contractAddress }],
  privateKey, publicKey, signature,
  [contractAddress], address, now, 1
); // returns Record<handle, bigint|boolean|`0x${string}`>
```

Multi-handle decrypt batches in one signature:
```typescript
const uniqueContracts = [...new Set(items.map(i => i.contractAddress))];
const eip712 = instance.createEIP712(publicKey, uniqueContracts, now, 1);
// ONE signTypedData call covers all handles across all contracts
const results = await instance.userDecrypt(items, privKey, pubKey, sig, uniqueContracts, address, now, 1);
```

### C — Backend Keeper Transport (Already Correct in v1, Staying)

Events: `webSocket(RPC_URL)` → `watchContractEvent`
Writes: `http(HTTP_RPC_URL)` → `writeContract`, `readContract`
Decryption: `@zama-fhe/relayer-sdk/node` → `userDecrypt` (Keeper signs as itself)

### D — Batch Encryption (Both Handles Share One Proof)

```typescript
// ONE input.encrypt() call for multiple handles → ONE inputProof
const input = inst.createEncryptedInput(contractAddress, userAddress);
input.add64(value1);
input.add64(value2);   // or input.addBool(flag)
const encrypted = await input.encrypt();
// encrypted.handles[0], encrypted.handles[1], encrypted.inputProof
return {
  handle1: toHex(encrypted.handles[0]),
  handle2: toHex(encrypted.handles[1]),
  inputProof: toHex(encrypted.inputProof),
};
```

---

## Section 2: What Stays the Same (Validated Against Production)

- Solidity: `@fhevm/solidity ^0.11.1`, `ZamaEthereumConfig`, `FHE.allowThis`, `FHE.allowTransient`, `FHE.allow`
- Wagmi: `wagmi ^3.6.9` + `viem ~2.48.8` (frontend)
- Backend: `viem ^2.0.0` + `@nestjs ^11.0.0` + `@nestjs/event-emitter ^3.0.0`
- Hardhat: `@fhevm/hardhat-plugin ^0.4.2`, explicit `gasLimit` required
- All 5 phases (Ideation → Contract → Test → Deploy → Backend/Frontend)
- 10-invariant checklist (adding 2 new invariants)
- Two-phase ACL (allowThis in tx, allow(user) after FINALITY_BLOCKS)
- Oblivious collateral: `FHE.ge` + `FHE.select`, never reverts
- gasLimit: `500_000n` default, `1_500_000n` for `acceptMatch`

---

## Section 3: New Design Requirements (User-Requested)

### Req 1 — YAML Frontmatter on Every Skill File

Every `.md` file in the skill system must start with YAML frontmatter:

```yaml
---
name: action-verb-noun          # kebab-case, action-based (e.g., "grant-acl-access")
description: One-line — when to load this file and what it solves
version: "@zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---
```

**Naming convention — action-based** (not noun-only):
| Old name | New action name |
|---|---|
| `SKILL-ACL.md` | `grant-acl-access.md` |
| `SKILL-FRONTEND.md` | `encrypt-and-decrypt-frontend.md` |
| `SKILL-BACKEND.md` | `build-keeper-service.md` |
| `SKILL-INPUTS.md` | `encrypt-user-inputs.md` |
| `SKILL-DECRYPTION.md` | `decrypt-encrypted-handles.md` |
| `SKILL-DEPLOY.md` | `deploy-fhevm-contract.md` |
| `SKILL-TESTING.md` | `test-fhevm-contract.md` |
| `SKILL-TYPES.md` | `choose-encrypted-types.md` |
| `SKILL-OPERATIONS.md` | `apply-fhe-operations.md` |
| `SKILL-GASMODEL.md` (new) | `manage-gas-limits.md` |

### Req 2 — CONTEXT.md (Session Starter)

Each skill distribution ships a `CONTEXT.md` at root. When Claude starts a new session for a developer using these skills, it reads `CONTEXT.md` first. The file serves three purposes:

1. **Brief orient** — what fhEVM is, what the chain supports today
2. **Known active bugs** — temporary SDK bugs or API gaps (with workarounds)
3. **Temporary constraints** — e.g., "Sepolia only — Mainnet not supported as of May 2026"

Structure:
```markdown
---
name: fhevm-context
description: Read at session start — chain constraints, known bugs, current SDK status
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Current SDK Status
- SDK: `@zama-fhe/relayer-sdk ^0.4.2` (web + node entrypoints)
- Solidity: `@fhevm/solidity ^0.11.1`
- Networks: **Sepolia testnet only** (Mainnet not yet supported)
- Coprocessors: Async — no same-tx decrypt in production (mock only)

## Active Constraints
- `FHE.asEuint64(0)` in Solidity constructors REVERTS on Sepolia — use lazy init pattern
- `watchContractEvent` requires WebSocket transport — HTTP transport silently drops events
- gasLimit MUST be explicit — fhEVM Hardhat plugin intercepts estimateGas and returns wrong values
- `acceptMatch` (or similar multi-ACL functions) needs `1_500_000n` gasLimit minimum

## Known Bugs (as of 2026-05-08)
[Update this section when new bugs are discovered — include workaround and date found]
```

### Req 3 — Template App Structure

The `templates/` directory must include a reference app skeleton matching the production build:

```
templates/
├── app/                        # Full app template — mirrors production zama/
│   ├── contracts/
│   │   ├── contracts/
│   │   │   └── MyConfidentialContract.sol   # filled from nearest scaffold
│   │   ├── hardhat.config.ts
│   │   ├── package.json                      # @fhevm/solidity ^0.11.1 + hardhat
│   │   └── scripts/
│   │       └── deploy.ts                     # from deploy-scaffold.ts
│   ├── frontend/
│   │   ├── app/                              # Next.js 16 App Router
│   │   ├── hooks/
│   │   │   ├── use-fhevm.ts                  # encrypt + userDecrypt
│   │   │   └── use-wallet.ts                 # wagmi useAccount + useWalletClient
│   │   ├── lib/
│   │   │   ├── fhevm-client.ts               # initSDK + createInstance + encryptBatch
│   │   │   ├── contracts.ts                  # viem getContract + inline ABIs
│   │   │   ├── contract-addresses.ts         # deployed addresses
│   │   │   └── wagmi-config.ts               # createConfig + fallback transports
│   │   └── package.json                      # wagmi ^3 + viem ~2.48.8 + relayer-sdk ^0.4.2
│   └── backend/
│       └── src/
│           ├── config/
│           │   └── config.schema.ts          # Zod: RPC_URL(wss) + HTTP_RPC_URL + KEEPER_PRIVATE_KEY
│           ├── events/
│           │   └── events.service.ts         # webSocket watchContractEvent
│           ├── keeper/
│           │   └── keeper.service.ts         # http writeContract + userDecrypt via relayer-sdk/node
│           └── app.module.ts
│
├── contracts/                  # Solo scaffold files (unchanged from v1 structure)
│   ├── acl-value-scaffold.sol
│   ├── sealed-bid-auction-scaffold.sol
│   └── ...
└── typescript/                 # Solo TypeScript scaffolds
    ├── fhevm-client-scaffold.ts
    ├── keeper-service-nestjs-scaffold.ts
    └── ...
```

### Req 4 — Depth-1 Reference Rule

Every skill file may reference at most ONE other file. No chains like "see X → which loads Y → which loads Z". This is enforced by convention:

- `SKILL.md` (entry point) → references directive files directly
- Directive files → may reference ONE fingerprint file only
- Fingerprint files → no references (terminal nodes)
- CONTEXT.md → no references (self-contained)

This prevents context-window blowup from recursive loading.

### Req 5 — Version Freshness via MCP or Web Fetch

For version checking, the CI script uses `npm view` locally. For agents running live, the skill system should advise using:

```
context7 MCP: resolve-library-id("@zama-fhe/relayer-sdk") → get-library-docs(id)
```

If context7 is not available, agents should use web fetch to `https://registry.npmjs.org/@zama-fhe/relayer-sdk/latest` to get the current version before advising installs.

The version header in each skill file acts as the ground truth — agents should compare the developer's `package.json` against the version in the skill's frontmatter.

---

## Section 4: Directory Structure (Updated)

```
zama-skills/
├── SKILL.md                               # Entry point — YAML frontmatter + 5-phase flow
├── CONTEXT.md                             # NEW — session starter, constraints, known bugs
├── CLAUDE.md                              # Slim orchestration (compressed from SKILL.md)
├── GEMINI.md                              # Slim orchestration
│
├── .fhevm/
│   ├── ORCHESTRATION.md                   # Full 5-phase gate logic
│   ├── INVARIANTS.md                      # 10 + 2 new invariants
│   ├── PRIVACY-SPEC-TEMPLATE.md           # Unchanged
│   ├── UPDATE-MAP.md                      # Updated — relayer-sdk columns
│   ├── INTERROGATION-GATE.md              # NEW — 5D pre-build challenge
│   ├── ERROR-PATTERNS.md                  # NEW — 8 production bugs with workarounds
│   ├── ANTIPATTERNS.md                    # NEW — 6 antipatterns with correct replacements
│   └── directives/                        # All renamed to action-based names
│       ├── choose-encrypted-types.md      # (was SKILL-TYPES.md)
│       ├── apply-fhe-operations.md        # (was SKILL-OPERATIONS.md)
│       ├── grant-acl-access.md            # (was SKILL-ACL.md) — UPDATED transient distinction
│       ├── encrypt-user-inputs.md         # (was SKILL-INPUTS.md) — ADD encryptBatch
│       ├── decrypt-encrypted-handles.md   # (was SKILL-DECRYPTION.md) — FIX: userDecrypt API
│       ├── test-fhevm-contract.md         # (was SKILL-TESTING.md)
│       ├── deploy-fhevm-contract.md       # (was SKILL-DEPLOY.md) — ADD gasLimit table
│       ├── build-keeper-service.md        # (was SKILL-BACKEND.md) — FIX: viem + relayer-sdk/node
│       ├── encrypt-and-decrypt-frontend.md # (was SKILL-FRONTEND.md) — FIX: relayer-sdk/web + userDecrypt
│       ├── use-erc7984-token.md           # (was SKILL-ERC7984.md)
│       └── manage-gas-limits.md           # NEW
│
├── fingerprints/                          # NEW — compact API signatures (<300 tokens each)
│   ├── relayer-sdk-web-api.md             # initSDK, createInstance, createEncryptedInput, userDecrypt
│   ├── relayer-sdk-node-api.md            # node entrypoint patterns
│   ├── fhevm-solidity-api.md              # FHE.* function signatures only
│   ├── viem-keeper-api.md                 # createPublicClient, createWalletClient, watchContractEvent
│   └── nestjs-module-api.md              # @Injectable, @OnEvent, @Inject patterns
│
├── templates/
│   ├── app/                               # NEW — full reference app skeleton
│   │   ├── contracts/                     # hardhat project scaffold
│   │   ├── frontend/                      # Next.js 16 scaffold
│   │   └── backend/                       # NestJS keeper scaffold
│   ├── contracts/                         # Solidity scaffolds (renamed from flat)
│   │   ├── acl-value-scaffold.sol         # PATCHED — remove constructor FHE init
│   │   ├── sealed-bid-auction-scaffold.sol
│   │   ├── confidential-token-scaffold.sol
│   │   ├── confidential-vote-scaffold.sol
│   │   ├── public-decrypt-scaffold.sol
│   │   ├── phase-acl-ledger-scaffold.sol  # NEW
│   │   ├── oblivious-collateral-scaffold.sol # NEW
│   │   └── bilateral-reveal-scaffold.sol  # NEW
│   └── typescript/                        # TypeScript scaffolds
│       ├── fhevm-client-scaffold.ts       # NEW — relayer-sdk/web, initSDK, userDecrypt
│       ├── keeper-service-nestjs-scaffold.ts # REWRITTEN — viem + relayer-sdk/node
│       ├── wagmi-config-scaffold.ts       # NEW
│       ├── contract-addresses-scaffold.ts # NEW
│       ├── deploy-scaffold.ts             # PATCHED — explicit gasLimit
│       └── fhevm-test-scaffold.ts         # Unchanged
│
├── scripts/
│   └── check-versions.js                  # NEW — npm view version comparison
│
└── .github/
    └── workflows/
        └── version-check.yml              # NEW — weekly CI
```

---

## Section 5: Fingerprint Files (Compact API References)

Each fingerprint file is a terminal node — no further references. Target: <300 tokens.

### `fingerprints/relayer-sdk-web-api.md`

```
---
name: relayer-sdk-web-api
description: Exact @zama-fhe/relayer-sdk/web API signatures — load before any frontend FHE code
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Import
import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from "@zama-fhe/relayer-sdk/web";

## Init (two steps — ALWAYS both)
await initSDK({ tfheParams: string, kmsParams: string });
instance = await createInstance({ ...SepoliaConfig, network: string });

## Encrypt
const input = instance.createEncryptedInput(contractAddress: string, userAddress: string);
input.add64(value: bigint): void
input.addBool(flag: boolean): void
const { handles: Uint8Array[], inputProof: Uint8Array } = await input.encrypt();
// Wrap with viem toHex(): toHex(handles[0]), toHex(inputProof)

## Decrypt (userDecrypt — NOT reencrypt)
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(pubKey: string, contracts: string[], startTs: number, days: number);
// Sign: walletClient.signTypedData({ account, ...eip712 })
const results: Record<string, bigint|boolean|`0x${string}`> = await instance.userDecrypt(
  items: Array<{handle: string, contractAddress: string}>,
  privateKey: string, publicKey: string, signature: string,
  contractAddresses: string[], userAddress: string,
  startTimestamp: number, durationDays: number
);
```

### `fingerprints/relayer-sdk-node-api.md`

```
---
name: relayer-sdk-node-api
description: Exact @zama-fhe/relayer-sdk/node patterns — backend keeper decryption only
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Lazy require (avoid startup crash)
const sdk = require("@zama-fhe/relayer-sdk/node");

## Init
const instance = await sdk.createInstance({ ...sdk.SepoliaConfig, network: HTTP_RPC_URL });

## Same userDecrypt API as web (keeper signs as itself)
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(pubKey, [contractAddr], startTs, durationDays);
const sig = await walletClient.signTypedData({ domain, types, primaryType, message });
const result = await instance.userDecrypt(
  [{ handle, contractAddress }], privKey, pubKey, sig,
  [contractAddress], keeperAddress, startTs, durationDays
);
// eaddress: result[handle].toString(16).padStart(40, '0') → getAddress(`0x${...}`)
```

### `fingerprints/fhevm-solidity-api.md`

```
---
name: fhevm-solidity-api
description: All FHE.* Solidity function signatures — load before any contract FHE code
version: "@fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Import
import { FHE, euint64, ebool, eaddress, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
contract C is ZamaEthereumConfig { ... }

## Inputs
FHE.fromExternal(externalEuint64, bytes inputProof) → euint64
FHE.fromExternal(externalEbool, bytes inputProof) → ebool
FHE.fromExternal(externalEaddress, bytes inputProof) → eaddress

## ACL
FHE.allowThis(handle)             // REQUIRED after every storage write
FHE.allow(handle, address)        // persistent grant to specific address
FHE.allowTransient(handle, addr)  // single-tx grant (cross-contract pass)
FHE.makePubliclyDecryptable(handle) // signal for public reveal

## Arithmetic
FHE.add(a, b) FHE.sub(a, b) FHE.mul(a, b) FHE.div(a, b) FHE.rem(a, b)
FHE.min(a, b) FHE.max(a, b)
FHE.and(a, b) FHE.or(a, b) FHE.xor(a, b) FHE.not(a)
FHE.shl(a, shift) FHE.shr(a, shift)

## Comparison → ebool
FHE.eq(a, b) FHE.ne(a, b) FHE.lt(a, b) FHE.le(a, b) FHE.gt(a, b) FHE.ge(a, b)

## Oblivious selection
FHE.select(ebool cond, euint64 ifTrue, euint64 ifFalse) → euint64

## Convert
FHE.asEuint64(uint64 plaintext) → euint64  // DO NOT use in constructor on live networks
FHE.toBytes32(euint64) → bytes32           // for public storage / return values
```

### `fingerprints/viem-keeper-api.md`

```
---
name: viem-keeper-api
description: Exact viem v2 patterns for backend keeper — dual transport setup
version: "viem ^2.0.0"
validated: 2026-05-08
---

## Imports
import { createPublicClient, createWalletClient, webSocket, http, parseAbi, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

## Dual Transport (ALWAYS two clients)
// Events ONLY: WebSocket
const wsClient = createPublicClient({ chain: sepolia, transport: webSocket(RPC_URL_WSS) });
// Reads + Writes: HTTP
const httpClient = createPublicClient({ chain: sepolia, transport: http(HTTP_RPC_URL) });
const walletClient = createWalletClient({
  account: privateKeyToAccount(KEEPER_PRIVATE_KEY),
  chain: sepolia, transport: http(HTTP_RPC_URL)
});

## Watch Events
wsClient.watchContractEvent({ address, abi, eventName, onLogs: (logs) => { ... } });

## Read
await httpClient.readContract({ address, abi, functionName, args });

## Write
const hash = await walletClient.writeContract({ address, abi, functionName, args, chain: sepolia });
await httpClient.waitForTransactionReceipt({ hash });

## Parse ABI
parseAbi(["function myFn(uint256 id) external", "event MyEvent(uint256 indexed id)"])
parseAbiItem("event PositionOpened(uint256 indexed positionId, address buyer)")
```

### `fingerprints/nestjs-module-api.md`

```
---
name: nestjs-module-api
description: NestJS v11 module patterns for keeper services — event-driven architecture
version: "@nestjs/common ^11 | @nestjs/event-emitter ^3"
validated: 2026-05-08
---

## Service structure
@Injectable()
export class KeeperService implements OnModuleInit {
  constructor(@Inject("CONFIG") private readonly config: Config) {}
  async onModuleInit() { /* setup viem clients, start block loop */ }
  @OnEvent("position.materialized") handleEvent(e: MyEvent) { /* queue logic */ }
}

## Event emitter (EventsService emits, KeeperService handles)
constructor(private readonly emitter: EventEmitter2) {}
this.emitter.emit("position.materialized", { positionId, materializedBlock } satisfies MyEvent);

## Zod config validation (fail fast on startup)
export const ConfigSchema = z.object({
  RPC_URL: z.string().min(1),          // WebSocket: wss://
  HTTP_RPC_URL: z.string().url(),      // HTTP: https://
  KEEPER_PRIVATE_KEY: z.string().startsWith("0x").length(66),
  FINALITY_BLOCKS: z.coerce.number().default(96),
});
export type Config = z.infer<typeof ConfigSchema>;

## Module registration
@Module({ providers: [{ provide: "CONFIG", useValue: config }, KeeperService] })
```

---

## Section 6: Error Patterns (8 Production Bugs)

File: `.fhevm/ERROR-PATTERNS.md`

```
---
name: fhevm-error-patterns
description: Load when debugging — 8 real production bugs with symptoms, root causes, fixes
validated: 2026-05-08
---
```

| # | Symptom | Root Cause | Fix |
|---|---|---|---|
| E1 | FHE op returns garbage silently | Missing `FHE.allowThis` after write | Add after every encrypted state assignment |
| E2 | `acceptMatch` reverts with out-of-gas | `gasLimit: 500_000n` too low for multi-ACL | Use `gasLimit: 1_500_000n` for functions with ≥5 FHE.allow calls |
| E3 | Cross-contract FHE op garbage result | Used `FHE.allow` (persistent) instead of `FHE.allowTransient` | For same-tx passes, use `allowTransient` |
| E4 | `watchContractEvent` receives no events | Using HTTP transport for WebSocket-required call | Use `webSocket(wss_url)` transport for EventsService |
| E5 | Constructor reverts on Sepolia | `FHE.asEuint64(0)` in Solidity constructor | Use lazy init — set encrypted vars in first write function |
| E6 | `userDecrypt` returns wrong key | Handle hex case mismatch in result lookup | Try exact key, then `.toLowerCase()` match, then first result |
| E7 | inputProof mismatch revert | Two separate `input.encrypt()` calls for values passed in same tx | One `createEncryptedInput`, multiple `.add64()`, one `.encrypt()` |
| E8 | Winner reveal fails silently | `eaddress` bigint not padded to 40 hex chars | `bigInt.toString(16).padStart(40, '0')` then `getAddress(0x...)` |

---

## Section 7: Antipatterns (6 Patterns That Look Right But Fail)

File: `.fhevm/ANTIPATTERNS.md`

```
---
name: fhevm-antipatterns
description: 6 code patterns that compile/pass tests but fail on live networks
validated: 2026-05-08
---
```

| # | Antipattern | Why It Fails | Correct Pattern |
|---|---|---|---|
| A1 | `createInstance()` zero-param | Old API — missing network, KMS, ACL config | `initSDK()` then `createInstance({ ...SepoliaConfig, network })` |
| A2 | `if (FHE.gt(a, b)) revert(...)` | Leaks comparison result; should use oblivious branch | `FHE.select(FHE.ge(a,b), pass_val, fail_val)` |
| A3 | `FHE.allow(val, user)` in same tx as write | Reorg vulnerability; two-phase ACL required | Phase 1: `allowThis` only; Phase 2: `allow(user)` after FINALITY_BLOCKS |
| A4 | `instance.reencrypt(...)` | Old API removed in relayer-sdk v0.4+ | `instance.userDecrypt([{handle, contractAddress}], ...)` 8-arg form |
| A5 | Single `http()` transport for both events and writes | HTTP drops events silently (no error, just silence) | `webSocket()` for EventsService, `http()` for KeeperService |
| A6 | `FHE.asEuint64(0)` in Solidity constructor | Reverts on Sepolia — coprocessors not ready at construction | Lazy init — initialize in first state-changing function call |

---

## Section 8: Interrogation Gate (5D Design Challenge)

File: `.fhevm/INTERROGATION-GATE.md` — loaded before Phase 1 starts.

```
---
name: fhevm-interrogation-gate
description: 5D pre-build challenge — run before writing any contract code
validated: 2026-05-08
---
```

**When to invoke:** After Phase 0 (Ideation) completes, before Phase 1 (Contract) begins.

**5 Dimensions, 3 questions each:**

**D1 — Forward Effects** (what this design creates)
1. Which state changes are irreversible once encrypted?
2. Who can decrypt what, and when — trace each encrypted field end-to-end.
3. What happens when the coprocessor is slow and the user retries?

**D2 — Backward Causes** (what this design depends on)
1. What off-chain inputs must exist before any on-chain FHE op can succeed?
2. Which contracts must have called `allowThis` or `allowTransient` before your contract uses a handle?
3. What breaks if `FINALITY_BLOCKS` is read wrong or hardcoded?

**D3 — Hidden Dependencies** (what isn't obvious)
1. Are there any functions that need `gasLimit` overrides? (List them.)
2. Does any function receive encrypted inputs from more than one source in one call?
3. Are there cross-contract FHE passes? Which require `allowTransient`?

**D4 — Failure Modes** (how this design breaks)
1. What happens if the Keeper never fires Phase 2 ACL? Is the user permanently locked out?
2. What happens if `userDecrypt` returns empty? Is there a fallback?
3. What happens if two users call the same finalize function simultaneously?

**D5 — Reversals** (what would invalidate this design)
1. If the encrypted result must be disclosed to a regulator, is there a path for that?
2. If a user's key is lost, can they still access their encrypted data?
3. If the contract must be migrated, which ACL grants survive and which don't?

Developer answers all 15 questions. Agent reviews answers and flags any "I don't know" or design gaps before allowing Phase 1 to proceed.

---

## Section 9: Updated Invariants (12 Total)

Add to existing 10:

**Invariant 11:** Every `@zama-fhe/relayer-sdk/web` usage calls `initSDK()` before `createInstance()`. Zero-param `createInstance()` is always wrong.

**Invariant 12:** `userDecrypt` receives `startTimestamp` and `durationDays` as the 7th and 8th arguments. Old `reencrypt` signature is banned.

---

## Section 10: CONTEXT.md Template

```markdown
---
name: fhevm-context
description: Session-start orient — chain constraints, SDK status, active bugs
version: "@zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## SDK Quick Reference
- Frontend: `@zama-fhe/relayer-sdk/web` — `initSDK()` + `createInstance({ ...SepoliaConfig, network })`
- Backend: `@zama-fhe/relayer-sdk/node` — same createInstance, lazy require
- Contracts: `@fhevm/solidity ^0.11.1` — `import { FHE } from "@fhevm/solidity/lib/FHE.sol"`
- Wagmi: `^3.6.9` + viem `~2.48.8`

## Network Constraints (as of 2026-05-08)
- **Supported:** Ethereum Sepolia testnet
- **Not supported:** Ethereum Mainnet (fhEVM not deployed)
- **SepoliaConfig** contains correct KMS + ACL + relayer addresses — never hardcode them

## Active Constraints
- Constructor FHE: `FHE.asEuint64(0)` in constructor REVERTS on Sepolia → use lazy init
- gasLimit: MUST be explicit (estimateGas interceptor returns wrong values for FHE calls)
  - Default writes: `500_000n`
  - Multi-ACL (≥5 FHE.allow): `1_500_000n`
- WebSocket: `watchContractEvent` REQUIRES webSocket transport — HTTP drops events silently
- userDecrypt: 8 arguments (added `startTimestamp`, `durationDays` in v0.4+) — old 6-arg reencrypt is gone

## Active Known Bugs
[Add entries here when bugs are encountered. Format: DATE — SYMPTOM — WORKAROUND]
```

---

## Section 11: CI and Version Checking

### `scripts/check-versions.js`

Node script that reads the skill frontmatter versions and compares against npm registry:

```javascript
const REQUIRED = {
  "@zama-fhe/relayer-sdk": "^0.4.2",
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.2",
};
// For each package: npm view <pkg> version
// Alert if latest major/minor exceeds pinned range
```

### `.github/workflows/version-check.yml`

Runs weekly on Monday at 09:00 UTC:
- Runs `check-versions.js`
- On mismatch: opens a GitHub Issue with `fhevm-version-drift` label
- Issue body includes: old pinned version, new available version, affected skill files

---

## Section 12: Implementation Phases

| Phase | Deliverable | Priority |
|---|---|---|
| A | Fix SDK patterns: `initSDK` + `createInstance({ ...SepoliaConfig })` + `userDecrypt` (8-arg) | BLOCKING |
| B | Add CONTEXT.md + rename all directives to action-based names with YAML frontmatter | HIGH |
| C | Create 5 fingerprint files | HIGH |
| D | Create ERROR-PATTERNS.md + ANTIPATTERNS.md + INTERROGATION-GATE.md | HIGH |
| E | Create template `app/` skeleton (contracts + frontend + backend) | MEDIUM |
| F | Invariants 11+12, CI version check | LOW |

**Phases execute sequentially. Do not start Phase B before Phase A is complete and verified.**

---

## Appendix: Correct Package Install Commands

```bash
# Contracts (Hardhat project)
pnpm add @fhevm/solidity@^0.11.1
pnpm add -D @fhevm/hardhat-plugin@^0.4.2 @fhevm/mock-utils@^0.4.2 hardhat@^3.4.4

# Frontend (Next.js)
pnpm add @zama-fhe/relayer-sdk@^0.4.2 viem@~2.48.8 wagmi@^3.6.9

# Backend (NestJS)
pnpm add @zama-fhe/relayer-sdk@^0.4.2 viem@^2.0.0 @nestjs/common@^11 @nestjs/event-emitter@^3

# NEVER use: fhevmjs directly, @fhevm/relayer-sdk (wrong name), ethers for keeper
```

---

*Pending: Developer review and approval before any implementation begins.*
