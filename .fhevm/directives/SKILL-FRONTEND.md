# SKILL-FRONTEND — Frontend Integration
<!-- Validated against: @zama-fhe/relayer-sdk ^0.4.3 | Source: docs.zama.ai/protocol/sdk | 2026-05-07 -->

## SDK Import (React / TypeScript)
```typescript
import { createInstance, FhevmInstance, PublicDecryptResults } from "@zama-fhe/relayer-sdk";
```

## Instance Initialization
```typescript
// Call once at app startup (e.g., in a context provider or hook)
let instance: FhevmInstance;

async function initFhevm(): Promise<FhevmInstance> {
  instance = await createInstance();
  return instance;
}
```

## Creating Encrypted Inputs with Proof (User Action)
```typescript
// contractAddress: the target contract
// userAddress: the connected wallet (msg.sender for the tx)
async function encryptBid(
  contractAddress: string,
  userAddress: string,
  bidAmount: bigint
): Promise<{ handle: Uint8Array; inputProof: Uint8Array }> {
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(bidAmount);
  const enc = await input.encrypt();
  return { handle: enc.handles[0], inputProof: enc.inputProof };
}
```

## Public Decryption — Reading Revealed Results
```typescript
// Use AFTER contract calls FHE.makePubliclyDecryptable on-chain
async function readPublicResult(handles: string[]): Promise<PublicDecryptResults> {
  const results = await instance.publicDecrypt(handles);
  // results.clearValues: Record<handle, bigint | boolean>
  // results.abiEncodedClearValues: bytes for on-chain submission
  // results.decryptionProof: KMS proof bytes
  return results;
}
```

## User Decryption — Reading Own Encrypted Balance
User must have ACL permission (`FHE.allow(balance, userAddr)` in contract).
```typescript
// This returns the raw cleartext via KMS — no on-chain tx needed
// Implemented via EIP-712 signing flow handled internally by SDK
async function readMyBalance(
  contractAddress: string,
  balanceHandle: bigint, // bytes32 from contract getter
  signer: ethers.Signer
): Promise<bigint> {
  // TODO: use fhevm.userDecryptEuint in Hardhat test context
  // In production frontend: instance handles EIP-712 permit internally
  // Refer to @zama-fhe/relayer-sdk documentation for userDecrypt flow
  return 0n; // placeholder — fill with SDK userDecrypt call
}
```

## React Hook Pattern — Encrypted Input
```typescript
function useEncryptedInput(contractAddress: string) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);

  useEffect(() => {
    createInstance().then(setInstance);
  }, []);

  const encrypt = useCallback(async (value: bigint, userAddress: string) => {
    if (!instance) throw new Error("FHEVM not initialized");
    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.add64(value);
    return input.encrypt();
  }, [instance, contractAddress]);

  return { encrypt, ready: !!instance };
}
```

## Async Timing — Tx + Gateway
FHE operations are asynchronous at two levels:
1. **Blockchain confirmation**: await tx.wait() after submitting
2. **Off-chain computation**: FHE ops processed by coprocessor, then result available

Pattern: emit an event when on-chain confidential logic completes → frontend listens → calls `publicDecrypt`.

## Common Pitfalls
- `instance.createEncryptedInput` requires the **exact** contract address (use `await contract.getAddress()`)
- User address must be the **actual signer** of the transaction, not a relayer
- `publicDecrypt` handles must correspond to values marked `makePubliclyDecryptable` on-chain
