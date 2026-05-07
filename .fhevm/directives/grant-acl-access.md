---
name: grant-acl-access
description: Access Control List (ACL) management — allowThis, allow, and transient grants
version: "@fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Fundamental Rule: allowThis on Every Write
Every time you assign a new encrypted value to a state variable, you **MUST** call `FHE.allowThis(handle)`. Failure to do so will result in silent "garbage" results when that state is read in subsequent transactions.

```solidity
function setBalance(euint64 newBal) internal {
    _balance = newBal;
    FHE.allowThis(_balance); // MANDATORY
}
```

## ACL Function Reference
| Function | Persistence | Use Case |
|---|---|---|
| `FHE.allowThis(val)` | Permanent | Self-access for the contract |
| `FHE.allow(val, user)`| Permanent | Grant a user or another contract persistent access |
| `FHE.allowTransient(val, addr)` | Single Tx | Cross-contract calls (gas-efficient) |

## Critical Pattern: Two-Phase ACL (A3)
To prevent reorg-based vulnerabilities, never grant user access (`FHE.allow`) in the same transaction as the initial write.
- **Phase 1 (Write):** Call `FHE.allowThis(handle)`.
- **Phase 2 (Grant):** After `FINALITY_BLOCKS` (e.g., 96 blocks on Sepolia), a separate transaction (often from a keeper) calls a grant function to call `FHE.allow(handle, user)`.

## allow vs. allowTransient
- **`allow`**: Stored in the ACL contract. Costs more gas. Use for long-term state.
- **`allowTransient`**: Stored in transient storage. Cleared at end of tx. Use for passing handles to external contracts in the same tx.

## ACL Propagation
Derived values (from arithmetic or comparisons) need their own grants if they are to be stored or passed externally.
```solidity
euint64 total = FHE.add(balA, balB);
FHE.allowThis(total);
FHE.allowTransient(total, otherContract);
```

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`

## Common Pitfalls
- **E1:** Forgetting `allowThis` after an assignment.
- **A3:** Granting user access in the same transaction as the write (reorg risk).
- **E3:** Using `allow` when `allowTransient` would suffice (wasted gas).
