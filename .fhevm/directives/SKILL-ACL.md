# SKILL-ACL — Access Control List
<!-- Validated against: @fhevm/solidity ^0.11.1 | Source: docs.zama.ai/protocol/solidity-guides/smart-contract/acl | 2026-05-07 -->

## Fundamental Model
Every encrypted value is **inaccessible by default** — including to the contract that holds it. Without an explicit ACL grant, even `address(this)` cannot reuse a ciphertext handle across transactions. ACL failures are **silent at runtime**: operations appear to succeed but produce garbage results.

## ACL Functions — Grant
| Function | Scope | When to Use |
|---|---|---|
| `FHE.allowThis(val)` | `address(this)` permanent | **After every encrypted storage write** |
| `FHE.allow(val, addr)` | Specific address, permanent | Grant persistent user/contract access |
| `FHE.allowTransient(val, addr)` | Specific address, current tx only | Pass ciphertext to external function |
| `FHE.makePubliclyDecryptable(val)` | Anyone, permanent | Signal value ready for public reveal |

## ACL Functions — Verify
```solidity
FHE.isAllowed(handle, addr)        // bool — specific address check
FHE.isSenderAllowed(handle)        // bool — msg.sender shorthand
FHE.isPubliclyDecryptable(handle)  // bool — public decrypt status
FHE.checkSignatures(handles[], abiEncoded, proof) // revert if proof invalid
```

## Critical Pattern: allowThis on Every Storage Write
```solidity
// ✅ CORRECT
function updateBalance(euint64 newBal) internal {
    _balance = newBal;
    FHE.allowThis(_balance); // REQUIRED — without this, next tx cannot use _balance
    FHE.allow(_balance, owner()); // grant user access if needed
}

// ❌ WRONG — next transaction cannot read _balance
function updateBalance(euint64 newBal) internal {
    _balance = newBal; // NO allowThis → silent failure next tx
}
```

## ACL Propagation for Derived Values
When you compute a new encrypted value from existing ones, the **new value needs its own ACL grants**:
```solidity
euint64 newTotal = FHE.add(balanceA, balanceB);
FHE.allowThis(newTotal);      // new handle, new grant required
FHE.allow(newTotal, user);    // propagate user access to derived value
```

## transient vs. permanent
- **`allowTransient`**: stored in EIP-1153 transient storage, zeroed at end of tx. Gas-cheaper. Use for cross-contract calls within one tx.
- **`allow`**: stored in dedicated ACL contract. Persists across txs. Required for state variables.

## Common Mistakes & Symptoms
| Mistake | Runtime Symptom |
|---|---|
| Missing `allowThis` on storage write | Revert or wrong value in next transaction's FHE op |
| Missing `allow(val, user)` before user decryption | `userDecryptEuint` returns 0 or reverts |
| Derived value not re-granted | Operations on derived ciphertext silently return 0 |
| Using `allowTransient` for state that persists | Works in same tx, breaks in future tx |
| Passing external input handle to cross-contract without `allowTransient` | Cross-contract call reverts |

## ACL Map Template (fill for every contract you generate)
| Variable | Created In | allowThis? | allow(addr)? | When Granted |
|---|---|---|---|---|
| `_balance` | `_update()` | ✓ | `FHE.allow(_balance, from)` `FHE.allow(_balance, to)` | Every `_update` call |
| *(add rows)* | | | | |
