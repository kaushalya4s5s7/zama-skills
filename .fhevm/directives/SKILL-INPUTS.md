# SKILL-INPUTS — Encrypted Inputs & Input Proofs
<!-- Validated against: @fhevm/solidity ^0.11.1 | @fhevm/hardhat-plugin ^0.4.2 | Source: docs.zama.ai/protocol/solidity-guides/smart-contract/inputs | 2026-05-07 -->

## Why Input Proofs Exist
Without input proofs, a malicious user could submit any `bytes32` ciphertext handle — including one they don't own, one crafted to exploit the contract, or one copied from another user's transaction. Input proofs are **Zero-Knowledge Proofs of Knowledge (ZKPoKs)** that cryptographically prove the submitter knows the plaintext of the ciphertext they're submitting.

## Solidity — Receiving Encrypted Inputs
```solidity
// ✅ Correct pattern — externalEuintXX + single shared inputProof
function transfer(
    address to,
    externalEuint64 encryptedAmount, // bytes32 handle index
    bytes calldata inputProof        // shared ZKPoK for all params in this call
) public {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof); // validates + converts
    // Now safe to use `amount` in FHE operations
    FHE.allowThis(amount);
}

// Multiple encrypted params — one shared inputProof
function exampleMulti(
    externalEbool   param1,
    externalEuint64 param2,
    externalEuint8  param3,
    bytes calldata  inputProof
) public {
    ebool   p1 = FHE.fromExternal(param1, inputProof);
    euint64 p2 = FHE.fromExternal(param2, inputProof);
    euint8  p3 = FHE.fromExternal(param3, inputProof);
}
```

## Key Conversion Functions
```solidity
FHE.fromExternal(externalEuintXX, inputProof) → euintXX
FHE.fromExternal(externalEbool,   inputProof) → ebool
FHE.fromExternal(externalEaddress,inputProof) → eaddress
```

## TypeScript — Generating Inputs (Hardhat)
```typescript
import { fhevm } from "hardhat";

const input = fhevm.createEncryptedInput(contractAddress, signer.address);
input.addBool(true);       // index 0 → externalEbool
input.add64(1000n);        // index 1 → externalEuint64
input.add8(5);             // index 2 → externalEuint8
const enc = await input.encrypt();

await contract.exampleMulti(
  enc.handles[0], // externalEbool
  enc.handles[1], // externalEuint64
  enc.handles[2], // externalEuint8
  enc.inputProof  // shared proof
);
```

## Add Methods Reference
| TypeScript call | Solidity param type |
|---|---|
| `input.addBool(val)` | `externalEbool` |
| `input.add8(val)` | `externalEuint8` |
| `input.add16(val)` | `externalEuint16` |
| `input.add32(val)` | `externalEuint32` |
| `input.add64(val)` | `externalEuint64` |
| `input.add128(val)` | `externalEuint128` |
| `input.add256(val)` | `externalEuint256` |
| `input.addAddress(val)` | `externalEaddress` |

## Anti-Patterns
```solidity
// ❌ NEVER store externalEuintXX directly — unvalidated foreign ciphertext
mapping(address => externalEuint64) public balances; // WRONG

// ❌ NEVER skip fromExternal validation
euint64 amount = externalEuint64.unwrap(rawInput); // WRONG — bypasses ZKPoK check
```
