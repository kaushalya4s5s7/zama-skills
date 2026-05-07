# SKILL-ARCHITECTURE — FHEVM On-Chain Architecture
<!-- Validated: docs.zama.ai/protocol | 2026-05-07 -->

## What Is FHEVM?
FHEVM (Fully Homomorphic Encryption VM) is a blockchain execution environment where smart contracts can compute on **encrypted data without ever decrypting it**. The EVM runs FHE operations via a co-processor that processes ciphertext operations off-chain and posts results back on-chain.

## Component Map
```
Developer/User
     │
     │ (1) Encrypt inputs locally with FHE public key + ZKPoK proof
     ▼
Smart Contract (on-chain EVM)
     │
     │ (2) FHE.fromExternal validates proof → euint handle stored on-chain
     │ (3) FHE operations (add, mul, select) → new ciphertext handles
     │ (4) FHE.allowThis / FHE.allow → ACL contract records permissions
     ▼
FHE Co-processor (off-chain, operated by Zama)
     │
     │ Receives FHE operation requests
     │ Computes on ciphertexts using server FHE keys
     │ Posts result ciphertext handles back on-chain
     ▼
KMS / Relayer (off-chain, Zama-operated)
     │
     │ (5) publicDecrypt: decrypts handle → cleartext + KMS proof
     │ (6) userDecrypt: returns cleartext only to authorized user (EIP-712)
     ▼
Smart Contract (back on-chain)
     │ (7) FHE.checkSignatures validates KMS proof → execute business logic
```

## Key Concepts
| Concept | What it is |
|---|---|
| **Ciphertext handle** | `bytes32` on-chain reference to an encrypted value — not the ciphertext itself |
| **FHE co-processor** | Off-chain engine that executes FHE ops, posts result handles on-chain |
| **KMS** | Key Management System — holds the server FHE secret key for decryption |
| **Relayer** | Off-chain service that submits decryption requests to KMS |
| **ACL contract** | On-chain registry of who can access which ciphertext handles |
| **ZKPoK** | Zero-Knowledge Proof of Knowledge — proves user knows the plaintext they encrypted |

## Transaction Lifecycle
1. **User encrypts** value locally → gets `handle + inputProof`
2. **User calls** contract function with handle + inputProof
3. **Contract calls** `FHE.fromExternal` → validates ZKPoK → gets `euint` handle
4. **Contract calls** `FHE.add / FHE.select / etc.` → co-processor queued to compute
5. **Contract calls** `FHE.allowThis` → ACL records contract can use the result
6. **Transaction confirms** → result handle now usable in future txs
7. *(If reveal needed)* Contract calls `FHE.makePubliclyDecryptable`
8. **Off-chain client** calls `instance.publicDecrypt(handles)` → KMS returns cleartext + proof
9. **Client submits** cleartext + proof to contract → `FHE.checkSignatures` validates → logic executes

## Networks
| Network | Type | Use |
|---|---|---|
| Hardhat (local) | Mock — FHE simulated in-process | Development & testing |
| Ethereum Sepolia | Real FHE co-processor + KMS | Integration testing |
| Ethereum Mainnet | Real FHE co-processor + KMS | Production |

## Development Setup
```bash
git clone https://github.com/zama-ai/fhevm-hardhat-template my-project
cd my-project && npm ci
```

`hardhat.config.ts` must include:
```typescript
import "@fhevm/hardhat-plugin";
```

Contract must inherit network config:
```solidity
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
contract MyContract is ZamaEthereumConfig { ... }
```
