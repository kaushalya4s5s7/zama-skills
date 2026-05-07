---
name: test-fhevm-contract
description: Testing FHEVM contracts — Hardhat mock mode vs. Sepolia integration
version: "@fhevm/hardhat-plugin ^0.4.2"
validated: 2026-05-08
---

## Required Setup
```typescript
import "@fhevm/hardhat-plugin"; // Required in hardhat.config.ts
import { fhevm, ethers } from "hardhat";
```

## 1. Encrypting Inputs for Tests
Use the `fhevm` object injected by the Hardhat plugin.
```typescript
const input = fhevm.createEncryptedInput(contractAddress, alice.address);
input.add64(42n);
const enc = await input.encrypt();

await contract.connect(alice).storeValue(enc.handles[0], enc.inputProof);
```

## 2. Decrypting in Mock Mode
In local Hardhat tests, you can decrypt values synchronously to verify logic. **This is NOT possible in production.**
```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";

const handle = await contract.getEncryptedValue();
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64,
  handle,
  contractAddress,
  alice // Signer with ACL permission
);
expect(clear).to.equal(42n);
```

## 3. Testing ACL Permissions
Tests should verify that only authorized users can decrypt.
```typescript
// Authorized user succeeds
await expect(fhevm.userDecryptEuint(...)).to.eventually.equal(42n);

// Unauthorized user reverts (ACL failure)
await expect(fhevm.userDecryptEuint(..., bob)).to.be.rejected;
```

## 4. Integration Testing (Sepolia)
When running tests against Sepolia (`--network sepolia`), you must use explicit gas limits.
```typescript
await contract.storeValue(h, p, { gasLimit: 500_000n });
```

## Mock vs. Network Summary
| Feature | Mock (Local) | Sepolia |
|---|---|---|
| Decrypt Helper | `fhevm.userDecryptEuint` | Use `relayer-sdk` off-chain |
| Speed | Fast (ms) | Slow (blocks) |
| Gas | Automatic | **MUST** be explicit |

## Fingerprint Reference
- `fingerprints/relayer-sdk-web-api.md` (for integration test patterns)
- `manage-gas-limits.md`

## Common Pitfalls
- **E3:** Forgetting `gasLimit` when running tests on Sepolia.
- **Mock-only:** Relying on `fhevm.userDecryptEuint` in production frontend code.
