# SKILL-DECRYPTION — Decryption Patterns
<!-- Validated against: @fhevm/solidity ^0.11.1 | @zama-fhe/relayer-sdk ^0.4.1 | Source: docs.zama.ai/protocol/solidity-guides/smart-contract/oracle | 2026-05-07 -->

## Core Principle
**FHEVM does not support synchronous on-chain decryption in production.** Direct decryption is only available in mock/test environments via `fhevm.userDecryptEuint`. In production contracts, all decryption is asynchronous and off-chain.

## Public Decryption — 3-Step Async Flow

### Step 1: On-Chain — Mark as Decryptable
```solidity
// Contract must have allowThis for the handle first
FHE.makePubliclyDecryptable(_encryptedResult); // signals readiness
emit ResultReady(_encryptedResult);            // notify off-chain client
```

### Step 2: Off-Chain — Decrypt via Relayer SDK
```typescript
import { createInstance, FhevmInstance, PublicDecryptResults } from "@zama-fhe/relayer-sdk";
const instance: FhevmInstance = await createInstance();
// ⚠️ Handle order in array = proof binding order — order is critical
const results: PublicDecryptResults = await instance.publicDecrypt([handle1, handle2]);
// results.clearValues       — Record<handle, bigint|boolean>
// results.abiEncodedClearValues — bytes for on-chain submission
// results.decryptionProof   — KMS signatures
```

### Step 3: On-Chain — Verify Proof and Execute Logic
```solidity
function finalizeResult(
    uint64 clearValue,
    bytes memory decryptionProof
) external {
    require(!_finalized, "already finalized"); // replay guard
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = FHE.toBytes32(_encryptedResult);
    // ⚠️ Order in abi.encode must match order in handles array
    bytes memory abiClear = abi.encode(clearValue);
    FHE.checkSignatures(handles, abiClear, decryptionProof); // reverts if invalid
    _finalized = true;
    _executeClearLogic(clearValue);
}
```

## FHE.checkSignatures Signature
```solidity
function checkSignatures(
    bytes32[] memory handlesList,
    bytes memory abiEncodedCleartexts,
    bytes memory decryptionProof
) internal // reverts on invalid proof, no return value
```

## FHE.makePubliclyDecryptable Signatures
```solidity
function makePubliclyDecryptable(ebool value) internal;
function makePubliclyDecryptable(euint8 value) internal;
// ... euint16, euint32, euint64, euint128, euint256 — all supported
```

## Replay Protection Pattern
Always include a boolean guard that prevents `finalize*` from being called twice. This prevents a malicious actor from submitting a valid proof a second time with different calldata.

## Multi-Value Decryption
- Pass all handles in one `publicDecrypt([h1, h2, h3])` call
- Same ordering constraint: `abi.encode(v1, v2, v3)` must match `[h1, h2, h3]`
- The proof is cryptographically bound to the exact handle order

## Public vs. User Decryption
| | Public Decrypt | User Decrypt |
|---|---|---|
| Who sees result | Anyone | Only authorized user |
| On-chain mechanism | `makePubliclyDecryptable` + `checkSignatures` | Off-chain via `fhevm.userDecryptEuint` |
| Use case | Reveal election results, auction winner | Show user their own balance |
