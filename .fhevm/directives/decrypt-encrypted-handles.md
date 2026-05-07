---
name: decrypt-encrypted-handles
description: Asynchronous decryption patterns — Public reveal vs. User private decryption
version: "@zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Core Principle: Async Only
**fhEVM does not support synchronous on-chain decryption.** All decryptions must be processed off-chain by the KMS/Coprocessor and the results submitted back in a separate transaction (Public) or viewed off-chain (User).

## 1. Public Decryption (Reveal to Everyone)
Use this when a value needs to be known by all participants (e.g., winner of an auction).

### Step 1: On-Chain (Mark for Reveal)
```solidity
import { FHE } from "@fhevm/solidity/lib/FHE.sol";

function revealWinner(euint64 winnerId) public {
    FHE.allowThis(winnerId);
    FHE.makePubliclyDecryptable(winnerId);
    emit ResultReady(winnerId);
}
```

### Step 2: Off-Chain (Fetch Cleartext + Proof)
```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
// ... init instance ...
const results = await instance.publicDecrypt([handle]);
// returns { clearValues, abiEncodedClearValues, decryptionProof }
```

### Step 3: On-Chain (Finalize with Proof)
```solidity
function finalize(uint64 value, bytes calldata proof) public {
    require(!_finalized, "Replay guard");
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = FHE.toBytes32(_encryptedValue);
    
    FHE.checkSignatures(handles, abi.encode(value), proof);
    
    _finalized = true;
    _value = value;
}
```

## 2. User Decryption (Private View)
Use this for a user to see their own encrypted data (e.g., private balance).
- Requires `userDecrypt` API (8 arguments).
- Requires EIP-712 signature from the user.
- See `encrypt-and-decrypt-frontend.md` for full implementation.

## Comparison
| Feature | Public Decrypt | User Decrypt |
|---|---|---|
| Visibility | Everyone | Only the User |
| Solidity API | `makePubliclyDecryptable` | `FHE.allow(handle, user)` |
| Verification | `FHE.checkSignatures` | Off-chain only |
| Relayer SDK | `instance.publicDecrypt` | `instance.userDecrypt` |

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`
- `fingerprints/relayer-sdk-web-api.md`

## Common Pitfalls
- **E5:** Calling `checkSignatures` without a replay guard.
- **E6:** Mismatching handle order between `publicDecrypt` array and `abi.encode` in `checkSignatures`.
- **A4:** Attempting to use `instance.reencrypt` (removed) for user data.
