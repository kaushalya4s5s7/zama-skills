# SKILL-TYPES — Encrypted Type System
<!-- Validated against: @fhevm/solidity ^0.11.1 | Source: docs.zama.ai/protocol/solidity-guides/smart-contract/types | 2026-05-07 -->

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
| `euint8` | 8 | Full arithmetic + bitwise + comparison + rand | Counters, grades, small amounts |
| `euint16` | 16 | Full arithmetic + bitwise + comparison + rand | Prices, scores, enumerations |
| `euint32` | 32 | Full arithmetic + bitwise + comparison + rand | IDs, timestamps, medium amounts |
| `euint64` | 64 | Full arithmetic + bitwise + comparison + rand | **Token balances (recommended)** |
| `euint128` | 128 | Full arithmetic + bitwise + comparison + rand | Large DeFi values |
| `euint160` / `eaddress` | 160 | eq, ne, select only | Encrypted Ethereum addresses |
| `euint256` | 256 | bitwise + shift + eq/ne + rand (no div/rem) | Max-precision; no division |

> **div/rem**: Only supported when right-hand side is a **plaintext** value. Encrypted rhs panics.

## External Input Types (User Inputs — Never Store These)
```
externalEbool  externalEuint8  externalEuint16  externalEuint32
externalEuint64  externalEuint128  externalEuint256  externalEaddress
```
These are `bytes32` handles from user-submitted proofs. Convert immediately via `FHE.fromExternal`.

## Type Conversion (Casting)
```solidity
euint64 big   = FHE.asEuint64(smallValue);   // widen
euint32 small = FHE.asEuint32(bigHandle);    // narrow (truncates)
eaddress addr = FHE.asEaddress(euint160Val); // alias cast
```

## Random Value Generation
```solidity
ebool   r1 = FHE.randEbool();
euint8  r2 = FHE.randEuint8();
euint64 r3 = FHE.randEuint64();
euint64 r4 = FHE.randBoundedEuint64(maxVal); // bounded random (plaintext max)
```

## Initialization Check
```solidity
bool isSet = FHE.isInitialized(handle); // returns false for zero-value handle
```

## Type Decision Guide
- **Token balance**: `euint64` (matches ERC-7984 standard)
- **Address**: `eaddress` (alias for `euint160`)
- **Boolean flag**: `ebool`
- **Need division**: use `euint8`–`euint128` with plaintext divisor only
- **Max precision, no math**: `euint256`
