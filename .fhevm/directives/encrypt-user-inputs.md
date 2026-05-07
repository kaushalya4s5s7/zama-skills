---
name: encrypt-user-inputs
description: Encrypted inputs and ZK proofs — handling user-submitted ciphertexts safely
version: "@zama-fhe/relayer-sdk ^0.4.2 | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## Security: Why Proofs Matter
Input proofs (ZKPoKs) ensure that the user actually knows the plaintext of the handle they are submitting. This prevents "handle-stealing" where an attacker copies a valid handle from the mempool and uses it as their own.

## Solidity Pattern (Receiving Inputs)
Always use `externalEuintXX` types for parameters and convert immediately via `FHE.fromExternal`.

```solidity
function deposit(
    externalEuint64 encryptedAmount, 
    bytes calldata inputProof
) public {
    // Validates proof + converts to usable euint64
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
    
    _balance = FHE.add(_balance, amount);
    FHE.allowThis(_balance);
}
```

## TypeScript Pattern (Submitting Inputs)
Use the `@zama-fhe/relayer-sdk/web` to generate inputs. You can batch multiple values into a single proof.

```typescript
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import { toHex } from "viem";

async function prepareInputs(contractAddress: string, userAddress: string) {
  const instance = await createInstance({ ...SepoliaConfig, network: RPC_URL });
  
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(100n); // value 1
  input.add64(200n); // value 2
  
  const encrypted = await input.encrypt();
  
  return {
    handle1: toHex(encrypted.handles[0]),
    handle2: toHex(encrypted.handles[1]),
    inputProof: toHex(encrypted.inputProof) // Shared proof for both handles
  };
}
```

## Batching Rules
- All values in a single `input.encrypt()` call must be destined for the **same contract** and the **same sender**.
- Batching multiple values into one proof saves gas on-chain as the proof is only validated once.

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`
- `fingerprints/relayer-sdk-web-api.md`

## Common Pitfalls
- **E7:** Generating separate proofs for values passed in the same transaction call (inefficient/wrong).
- **A1:** Using zero-param `createInstance()` in the SDK.
- **Security:** Storing `externalEuintXX` values in contract state (unvalidated and insecure).
