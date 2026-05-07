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

## Project Segregation Mandate
- **NEVER** place `package.json`, `hardhat.config.ts`, `test/`, or `scripts/` at the project root.
- **ALWAYS** segregate into three top-level folders:
  - `contracts/`: Contains Hardhat environment, `package.json`, `hardhat.config.ts`, `contracts/`, `test/`, and `scripts/`.
  - `frontend/`: Contains Next.js/React code and `package.json`.
  - `backend/`: Contains NestJS code and `package.json`.

## Package Management Mandate
- **NEVER use `npm` or `yarn`.**
- **ALWAYS use `pnpm`** for all installations (`pnpm add`, `pnpm install`).
- **Critical for pnpm:** You must manually add the peer dependency `encrypted-types` to avoid `HH411` errors: `pnpm add -D encrypted-types` (run inside `contracts/`).

## TypeScript Configuration (The "Strict" Hurdles)
- Use `moduleResolution: "node"` in `tsconfig.json`.
- Add `"ignoreDeprecations": "6.0"` to `compilerOptions` to silence legacy warnings.
- Explicitly set `"rootDir": "."` to prevent common source directory errors (TS5011).

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
- 2026-05-08 — `FHE.asEuint64(0)` in Solidity constructors REVERTS on Sepolia — use lazy init pattern.
- 2026-05-08 — `watchContractEvent` requires WebSocket transport — HTTP transport silently drops events.
- 2026-05-08 — gasLimit MUST be explicit — fhEVM Hardhat plugin intercepts estimateGas and returns wrong values.
