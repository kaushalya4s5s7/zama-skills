# SKILL-TESTING — Testing FHEVM Contracts
<!-- Validated against: @fhevm/hardhat-plugin ^0.4.2 | @fhevm/mock-utils ^0.4.2 | Source: docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test | 2026-05-07 -->

## hardhat.config.ts — Required Import
```typescript
import "@fhevm/hardhat-plugin"; // enables fhevm on hre
```

## Accessing the FHEVM Test API
```typescript
import { fhevm } from "hardhat";
import { ethers } from "hardhat";
// or: import * as hre from "hardhat"; then hre.fhevm
```

## Encrypting Test Inputs
```typescript
const input = fhevm.createEncryptedInput(contractAddress, signer.address);
input.add64(1000n);           // euint64
input.addBool(true);          // ebool
const enc = await input.encrypt();

await contract.myFunc(enc.handles[0], enc.handles[1], enc.inputProof);
```

## Decrypting Values in Tests (Mock Mode Only)
Decryption helpers require that both the **contract** and the **signer** have ACL permission for the handle.

```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";

// Retrieve handle from contract
const handle: bigint = await contract.getEncryptedBalance(user.address);

// Decrypt (euintXX)
const clear: bigint = await fhevm.userDecryptEuint(
  FhevmType.euint64, // must match Solidity type exactly
  handle,
  contractAddress,
  signer             // wallet with ACL permission
);

// Decrypt (ebool)
const clearBool: boolean = await fhevm.userDecryptEbool(handle, contractAddress, signer);

// Decrypt (eaddress)
const clearAddr: string = await fhevm.userDecryptEaddress(handle, contractAddress, signer);
```

## Testing ACL Correctness
```typescript
// Verify owner can decrypt their balance
const ownerBalance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, addr, ownerSigner);
expect(ownerBalance).to.equal(expectedAmount);

// Verify unauthorized address cannot decrypt (should throw)
await expect(
  fhevm.userDecryptEuint(FhevmType.euint64, handle, addr, otherSigner)
).to.be.rejected; // ACL check enforced
```

## Simulating Public Decryption in Tests
```typescript
// In mock mode, publicDecrypt is available via the hardhat plugin
import { createInstance } from "@zama-fhe/relayer-sdk";
// OR: use fhevm mock utilities directly — check @fhevm/mock-utils for helpers
```

## Mock vs. Testnet
| | Mock (local Hardhat) | Sepolia testnet |
|---|---|---|
| Run command | `npx hardhat test` | `npx hardhat test --network sepolia` |
| Gateway | Simulated in-process | Real Zama gateway |
| `userDecryptEuint` | Available | Requires relayer-sdk off-chain flow |
| Speed | Fast (seconds) | Slow (minutes, tx confirmations) |
| ACL enforcement | ✓ enforced | ✓ enforced |

## Test File Structure
```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("MyContract", function () {
  let contract: any;
  let owner: any, alice: any;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    contract = await ethers.deployContract("MyContract", [owner.address]);
  });

  it("should encrypt and store a value", async function () {
    const input = fhevm.createEncryptedInput(await contract.getAddress(), alice.address);
    input.add64(42n);
    const enc = await input.encrypt();
    await contract.connect(alice).storeValue(enc.handles[0], enc.inputProof);
    // TODO: add assertions
  });
});
```
