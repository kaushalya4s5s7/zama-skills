---
name: test-fhevm-contract
description: Testing FHEVM contracts — Hardhat mock mode vs. Sepolia integration
version: "@fhevm/hardhat-plugin ^0.4.2"
validated: 2026-05-08
---

## Project Location
**Rule:** All testing files must reside in the `contracts/` directory. NEVER place `test/` or `hardhat.config.ts` at the project root.

## Required Setup
```typescript
// contracts/hardhat.config.ts
import "@fhevm/hardhat-plugin"; 
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

## 3. Run Instructions
```bash
# Run tests from within the contracts/ directory
cd contracts
pnpm test
```

## 4. Integration Testing (Sepolia)
When running tests against Sepolia (`--network sepolia`), you must use explicit gas limits.
```typescript
await contract.storeValue(h, p, { gasLimit: 500_000n });
```

## 5. Verification Patterns: Store and Getter
Since you cannot branch on `ebool` or `euintXX` results, verification often requires storing the result handle in contract state and providing a getter for the test to fetch and decrypt.

```solidity
// contracts/contracts/MyContract.sol
mapping(address => ebool) private _verificationResults;
function verifySomething(...) external {
    ebool result = FHE.gt(val1, val2);
    _verificationResults[msg.sender] = result;
    FHE.allowThis(result);
}
function getResult() external view returns (ebool) {
    return _verificationResults[msg.sender];
}

// contracts/test/MyContract.test.ts
await contract.verifySomething(h, p);
const handle = await contract.getResult();
const clear = await fhevm.userDecryptEbool(handle, addr, alice);
expect(clear).to.be.true;
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
- **E12:** Running tests from the project root instead of the `contracts/` directory.
