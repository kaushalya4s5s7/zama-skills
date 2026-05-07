---
name: fhevm-error-patterns
description: Load when debugging — 8 real production bugs with symptoms, root causes, and fixes
validated: 2026-05-08
---

| ID | Symptom | Root Cause | Fix |
|---|---|---|---|
| **E1** | FHE operation returns garbage or 0 silently. | Missing `FHE.allowThis(handle)` after an encrypted state assignment. | Add `FHE.allowThis(variable)` after every write to state. |
| **E2** | `acceptMatch` or similar function reverts with out-of-gas. | `gasLimit` (e.g., 500k) is too low for operations with ≥5 ACL calls. | Use `gasLimit: 1_500_000n` for complex/multi-ACL functions. |
| **E3** | Cross-contract FHE operation returns garbage. | Used `FHE.allow` (persistent) instead of `FHE.allowTransient`. | Use `allowTransient` for handles passed between contracts in one tx. |
| **E4** | `watchContractEvent` receives no events (silence). | Using HTTP transport instead of WebSocket for the event client. | Use `webSocket(wss_url)` transport for the event-watching client. |
| **E5** | Contract deployment or constructor call reverts on Sepolia. | Using `FHE.asEuint64(0)` or other FHE ops in a Solidity constructor. | Use "lazy init" pattern; set encrypted state in the first write tx. |
| **E6** | `userDecrypt` returns unexpected key or empty result. | Handle hex case mismatch (e.g., `0xabc` vs `0xABC`). | Try exact key, then `.toLowerCase()`, or iterate keys to find match. |
| **E7** | `inputProof` mismatch or validation revert. | Generating multiple `input.encrypt()` calls for one transaction. | Use `input.add64()` multiple times, then a single `input.encrypt()`. |
| **E8** | `eaddress` reveal (winner address) fails or is garbled. | `eaddress` bigint not padded to 40 hex characters. | Use `bigInt.toString(16).padStart(40, '0')` then `getAddress`. |
