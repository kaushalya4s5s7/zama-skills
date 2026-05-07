---
name: fhevm-solidity-api
description: All FHE.* Solidity function signatures — load before any contract FHE code
version: "@fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Import
import { FHE, euint64, ebool, eaddress, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
contract C is ZamaEthereumConfig { ... }

## Inputs
FHE.fromExternal(externalEuint64, bytes inputProof) → euint64
FHE.fromExternal(externalEbool, bytes inputProof) → ebool
FHE.fromExternal(externalEaddress, bytes inputProof) → eaddress

## ACL
FHE.allowThis(handle)             // REQUIRED after every storage write
FHE.allow(handle, address)        // persistent grant to specific address
FHE.allowTransient(handle, addr)  // single-tx grant (cross-contract pass)
FHE.makePubliclyDecryptable(handle) // signal for public reveal

## Arithmetic
FHE.add(a, b) FHE.sub(a, b) FHE.mul(a, b) FHE.div(a, b) FHE.rem(a, b)
FHE.min(a, b) FHE.max(a, b)
FHE.and(a, b) FHE.or(a, b) FHE.xor(a, b) FHE.not(a)
FHE.shl(a, shift) FHE.shr(a, shift)

## Comparison → ebool
FHE.eq(a, b) FHE.ne(a, b) FHE.lt(a, b) FHE.le(a, b) FHE.gt(a, b) FHE.ge(a, b)

## Oblivious selection
FHE.select(ebool cond, euint64 ifTrue, euint64 ifFalse) → euint64

## Convert
FHE.asEuint64(uint64 plaintext) → euint64  // DO NOT use in constructor on live networks
FHE.toBytes32(euint64) → bytes32           // for public storage / return values
