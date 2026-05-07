---
name: fhevm-antipatterns
description: 6 code patterns that compile/pass tests but fail on live networks
validated: 2026-05-08
---

| ID | Antipattern | Why It Fails | Correct Pattern |
|---|---|---|---|
| **A1** | `createInstance()` with zero parameters. | Missing network, KMS, and ACL configuration for the SDK. | `initSDK()` then `createInstance({ ...SepoliaConfig, network })`. |
| **A2** | `if (FHE.gt(a, b)) { revert(); }` | Leaks comparison result to public; breaks confidentiality. | `FHE.select(FHE.gt(a,b), pass_val, fail_val)`. |
| **A3** | `FHE.allow(val, user)` in the same tx as the write. | Reorg vulnerability; handle might change before grant is final. | Two-Phase ACL: Grant access after `FINALITY_BLOCKS` (96). |
| **A4** | `instance.reencrypt(...)` | Old API removed in Relayer SDK v0.4+. | `instance.userDecrypt([{handle, contractAddress}], ...)` (8-arg). |
| **A5** | Single `http()` transport for both events and writes. | HTTP drops events silently; no errors, just missed data. | `webSocket()` for EventsService, `http()` for KeeperService. |
| **A6** | `FHE.asEuint64(0)` in Solidity constructor. | Coprocessors not ready at construction time on Sepolia. | Lazy init: Initialize in the first state-changing function. |
