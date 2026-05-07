# SKILL-OPERATIONS — FHE Operations Reference
<!-- Validated: @fhevm/solidity ^0.11.1 | Source: docs.zama.ai/protocol/solidity-guides/smart-contract/operations | 2026-05-07 -->

## Import
```solidity
import { FHE } from "@fhevm/solidity/lib/FHE.sol";
```

## Arithmetic Operations
```solidity
euint64 sum  = FHE.add(a, b);   // a + b (wraps on overflow — unchecked by design)
euint64 diff = FHE.sub(a, b);   // a - b
euint64 prod = FHE.mul(a, b);   // a * b
euint64 quot = FHE.div(a, 5);   // a / 5  ← rhs MUST be plaintext (not encrypted)
euint64 rem  = FHE.rem(a, 10);  // a % 10 ← rhs MUST be plaintext
euint64 neg  = FHE.neg(a);      // -a (two's complement)
```

> ⚠️ **div and rem**: right-hand side MUST be a plaintext literal. Encrypted rhs panics.

## Comparison Operations (return ebool)
```solidity
ebool eq = FHE.eq(a, b);   // a == b
ebool ne = FHE.ne(a, b);   // a != b
ebool gt = FHE.gt(a, b);   // a >  b
ebool ge = FHE.ge(a, b);   // a >= b
ebool lt = FHE.lt(a, b);   // a <  b
ebool le = FHE.le(a, b);   // a <= b
```
> ⚠️ **NEVER branch on ebool**: `if (FHE.gt(a, b))` is WRONG — ebool is a handle, not a bool.

## Conditional Logic (FHE.select — the if/else replacement)
```solidity
// FHE.select(condition: ebool, ifTrue: T, ifFalse: T) → T
euint64 max   = FHE.select(FHE.gt(a, b), a, b);        // max(a, b)
euint64 clamped = FHE.select(FHE.gt(a, limit), limit, a); // min(a, limit)
eaddress winner = FHE.select(FHE.gt(bid, highBid), FHE.asEaddress(msg.sender), currentWinner);
```

## Bitwise Operations
```solidity
euint64 and  = FHE.and(a, b);
euint64 or   = FHE.or(a, b);
euint64 xor  = FHE.xor(a, b);
euint64 not  = FHE.not(a);      // bitwise NOT
euint64 shl  = FHE.shl(a, 3);   // shift left by 3 (plaintext shift)
euint64 shr  = FHE.shr(a, 2);   // shift right by 2
euint64 rotl = FHE.rotl(a, 4);  // rotate left
euint64 rotr = FHE.rotr(a, 4);  // rotate right
```

## Boolean Operations (ebool)
```solidity
ebool band = FHE.and(flagA, flagB);
ebool bor  = FHE.or(flagA, flagB);
ebool bxor = FHE.xor(flagA, flagB);
ebool bnot = FHE.not(flag);
```

## Min / Max
```solidity
euint64 minimum = FHE.min(a, b);
euint64 maximum = FHE.max(a, b);
```

## Random Values
```solidity
ebool   r1 = FHE.randEbool();
euint8  r2 = FHE.randEuint8();
euint32 r3 = FHE.randEuint32();
euint64 r4 = FHE.randEuint64();
euint64 r5 = FHE.randBoundedEuint64(maxVal); // plaintext upper bound
```

## Type Casting
```solidity
euint64 big   = FHE.asEuint64(plainUint64);   // plaintext → encrypted
euint32 small = FHE.asEuint32(euint64Handle); // narrow cast (truncates)
euint64 wide  = FHE.asEuint64(euint32Handle); // widen cast
eaddress addr = FHE.asEaddress(euint160Val);  // alias cast
```

## Initialization Check
```solidity
bool init = FHE.isInitialized(handle); // false if handle is zero (unset)
```

## Handle Extraction
```solidity
bytes32 raw = FHE.toBytes32(euint64Handle); // needed for FHE.checkSignatures
```

## Operation Availability by Type
| Type | add/sub/mul | div/rem | comparison | bitwise | select | rand |
|---|---|---|---|---|---|---|
| `ebool` | ✗ | ✗ | eq/ne | and/or/xor/not | ✓ | ✓ |
| `euint8`–`euint128` | ✓ | plaintext rhs only | all 6 | full | ✓ | ✓ |
| `euint160`/`eaddress` | ✗ | ✗ | eq/ne | ✗ | ✓ | ✗ |
| `euint256` | ✗ | ✗ | eq/ne | bitwise+shift | ✓ | ✓ |
