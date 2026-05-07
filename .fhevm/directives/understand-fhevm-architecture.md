---
name: understand-fhevm-architecture
description: High-level overview of fhEVM — Co-processor, KMS, and Relayer SDK
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Component Map
fhEVM extends the Ethereum Virtual Machine with a specialized co-processor and Key Management System (KMS).

1. **Relayer SDK:** Frontend/Backend library for encrypting inputs (with ZK proofs) and decrypting results (via EIP-712).
2. **fhEVM Co-processor:** Off-chain engine that executes FHE operations (add, select, etc.) without seeing the underlying data.
3. **KMS:** Secure system holding the network's master FHE keys; it only decrypts values if the ACL contract permits.
4. **ACL Contract:** On-chain registry that controls which users or contracts can access which encrypted handles.

## Transaction Lifecycle
1. **Encrypt:** User encrypts data locally using the Relayer SDK → produces a `handle` and an `inputProof`.
2. **Submit:** User submits the `handle` and `inputProof` to the smart contract.
3. **Validate:** Contract calls `FHE.fromExternal` → validates the proof and converts it to an internal FHE type.
4. **Compute:** Contract performs FHE operations. These are queued for the co-processor.
5. **Finalize:** Co-processor computes the result handle and posts it back on-chain.
6. **Decrypt:**
   - **User Decrypt:** User requests a private reveal via the Relayer SDK (EIP-712 signing).
   - **Public Decrypt:** Contract marks handle as `makePubliclyDecryptable` → Keeper/Relayer fetches cleartext + proof → Contract verifies with `FHE.checkSignatures`.

## Security Model
- **ZKPoKs:** Prove the submitter knows the plaintext of their encrypted input (prevents handle-stealing).
- **ACL:** Enforces that only authorized parties can request decryptions or reuse handles.
- **Master Key:** The network's private key is fragmented across multiple KMS nodes (MPC).

## Fingerprint Reference
- `fingerprints/relayer-sdk-web-api.md`
- `fingerprints/fhevm-solidity-api.md`
