---
name: choose-encrypted-types
description: fhEVM encrypted type system — bitwidths, operations, and initialization rules
version: "@fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Import
```solidity
import { FHE, ebool, euint8, euint16, euint32, euint64, euint128, euint160, euint256, eaddress,
         externalEbool, externalEuint8, externalEuint16, externalEuint32, externalEuint64,
         externalEuint128, externalEuint256, externalEaddress } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
```

## Complete Type Table
| In-Contract Type | Bits | Supported Operations | Use When |
|---|---|---|---|
| `ebool` | 1 | and, or, xor, eq, ne, not, select, rand | Boolean flags, conditions |
| `euint8`–`euint64`| 8–64 | Full arithmetic + comparison + rand | **euint64 is standard for balances** |
| `euint128` | 128 | Full arithmetic + comparison + rand | Large DeFi values |
| `eaddress` | 160 | eq, ne, select only | Encrypted Ethereum addresses |
| `euint256` | 256 | bitwise + shift + eq/ne + rand | Max-precision; **no div/rem** |

## Critical Constraint: No FHE in Constructors (A6, E5)
**Plaintext-to-Encrypted conversion (e.g., `FHE.asEuint64(0)`) in a Solidity constructor will REVERT on Sepolia.**
Pattern: Use a "lazy init" or "setup" function, or initialize in the first write transaction.

```solidity
// ❌ WRONG — Reverts on Sepolia
constructor() {
    _balance = FHE.asEuint64(0);
}

// ✅ CORRECT — Lazy init
function deposit() public {
    if (!FHE.isInitialized(_balance)) {
        _balance = FHE.asEuint64(0);
    }
    // ... logic ...
}
```

## External Input Types (externalEuintXX)
These are `bytes32` handles submitted by users. **Never store them directly.** Convert immediately via `FHE.fromExternal(handle, proof)`.

## Type Conversion (Casting)
```solidity
euint64 big   = FHE.asEuint64(smallValue);   // widen
euint32 small = FHE.asEuint32(bigHandle);    // narrow (truncates)
eaddress addr = FHE.asEaddress(euint160Val); // alias cast
```

## Initialization Check
```solidity
bool isSet = FHE.isInitialized(handle); // returns false for zero-value handle
```

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`

## Common Pitfalls
- **E5:** Initializing encrypted state variables in the constructor.
- **A6:** Using `FHE.asEuint64(0)` in constructor logic.
