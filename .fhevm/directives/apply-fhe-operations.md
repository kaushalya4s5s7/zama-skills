---
name: apply-fhe-operations
description: FHE arithmetic, comparisons, and oblivious logic — avoiding plaintext leaks
version: "@fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Core Constraint: No Branching (A2)
You **CANNOT** use encrypted values (`ebool`, `euintXX`) in Solidity `if` statements or `require` conditions. This would leak the encrypted value to the public. Instead, use "oblivious logic" with `FHE.select`.

```solidity
// ❌ WRONG — leaks condition result
if (FHE.decrypt(FHE.gt(a, b))) { ... } 

// ✅ CORRECT — oblivious branch
euint64 result = FHE.select(FHE.gt(a, b), ifTrueValue, ifFalseValue);
```

## Operation Reference
| Category | Functions |
|---|---|
| Arithmetic | `add`, `sub`, `mul`, `div`, `rem`, `min`, `max` |
| Bitwise | `and`, `or`, `xor`, `not`, `shl`, `shr` |
| Comparison | `eq`, `ne`, `lt`, `le`, `gt`, `ge` |
| Logic | `select(ebool, valIfTrue, valIfFalse)` |

## Oblivious Collateral Pattern
Use `FHE.select` and comparisons to handle "revert-like" behavior without actually reverting.
```solidity
// Instead of: require(balance >= amount)
ebool hasEnough = FHE.ge(balance, amount);
euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
// logic continues with transferAmount (may be 0)
```

## Division and Remainder
- **Plaintext divisor:** Supported and safe.
- **Encrypted divisor:** Will cause a panic. Always ensure the right-hand side is a plaintext `uint64`.

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`

## Common Pitfalls
- **A2:** Attempting to branch on FHE results.
- **E1:** Forgetting `FHE.allowThis` after computing a new value via operations.
