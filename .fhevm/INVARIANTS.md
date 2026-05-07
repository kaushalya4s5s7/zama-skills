# FHEVM Contract Invariants
<!-- 10 yes/no invariants — answer all before delivering any FHEVM contract -->

---

## Invariant 1: allowThis on Every Encrypted Storage Write
**Question**: Is `FHE.allowThis(value)` called immediately after every write to an encrypted state variable?

**Failure Symptom (if No)**: Next transaction that reads the state variable and performs FHE operations on it will silently produce a garbage result or revert with an unexpected error. The write tx itself appears to succeed.

**Fix Pattern**:
```solidity
// After EVERY: balances[addr] = newValue; / _state = computed;
FHE.allowThis(newValue);
```

---

## Invariant 2: No Branching on FHE Comparison Results
**Question**: Are there zero `if`, `require`, or `assert` statements that branch on the result of an FHE comparison (`FHE.eq`, `FHE.lt`, `FHE.gt`, etc.)?

**Failure Symptom (if No)**: The comparison returns an `ebool` handle, not a plaintext bool. Branching on it either causes a compile error or (if cast) always evaluates one path, breaking contract logic entirely.

**Fix Pattern**:
```solidity
// ❌ WRONG
if (FHE.gt(amount, limit)) { ... }

// ✅ CORRECT — use FHE.select for conditional encrypted values
euint64 result = FHE.select(FHE.gt(amount, limit), amount, limit);
```

---

## Invariant 3: No Synchronous Decrypt in Production Code
**Question**: Are there zero calls to `FHE.decrypt` or direct synchronous decryption in non-test code?

**Failure Symptom (if No)**: Will revert on live networks (Sepolia, Mainnet) because the coprocessor processes FHE ops asynchronously. Works only in mock mode, giving false confidence during testing.

**Fix Pattern**: Replace any synchronous decrypt with the async public decryption flow: `FHE.makePubliclyDecryptable` → off-chain `publicDecrypt` → `FHE.checkSignatures`.

---

## Invariant 4: Input Proofs Validated Before Use
**Question**: Is `FHE.fromExternal(input, proof)` called before any use of every `externalEuintXX` parameter?

**Failure Symptom (if No)**: Unvalidated external inputs allow attackers to submit crafted ciphertexts they don't own, enabling replay attacks and cryptographic exploits.

**Fix Pattern**:
```solidity
function transfer(address to, externalEuint64 encAmount, bytes calldata proof) public {
    euint64 amount = FHE.fromExternal(encAmount, proof); // validate first
    // use amount from here
}
```

---

## Invariant 5: Async Decryption Uses makePubliclyDecryptable + checkSignatures
**Question**: Does every public decryption flow use `FHE.makePubliclyDecryptable` on-chain and `FHE.checkSignatures` in the finalization function?

**Failure Symptom (if No)**: Either decryption never completes (missing on-chain signal) or the contract accepts unverified plaintext values, enabling anyone to submit false results.

**Fix Pattern**: See `SKILL-DECRYPTION.md` 3-step async flow. Always pair `makePubliclyDecryptable` (Step 1) with `checkSignatures` (Step 3).

---

## Invariant 6: ACL Grants Match Privacy Specification
**Question**: Do all `FHE.allow(value, addr)` calls in the contract exactly match what the Privacy Specification's Visibility Matrix declared?

**Failure Symptom (if No)**: Either users who should have access cannot decrypt their data (UX failure), or users who shouldn't have access can decrypt data they shouldn't see (privacy breach).

**Fix Pattern**: Review the ACL Map in the Privacy Spec. For each encrypted variable, verify the recipient list in code matches the spec. Add or remove `FHE.allow` calls accordingly.

---

## Invariant 7: No Raw externalEuintXX Stored in State
**Question**: Are there zero state variables of type `externalEuintXX` / `externalEbool` / `externalEaddress`?

**Failure Symptom (if No)**: Storing an unvalidated external handle allows an attacker to later use a ciphertext handle they don't control, bypassing the ZKPoK verification entirely.

**Fix Pattern**:
```solidity
// ❌ WRONG
mapping(address => externalEuint64) public balances;

// ✅ CORRECT — convert immediately, store in-contract type
mapping(address => euint64) public balances;
// In function: balances[user] = FHE.fromExternal(extInput, proof);
```

---

## Invariant 8: Finalization Functions Protected Against Replay
**Question**: Are all functions that call `FHE.checkSignatures` guarded by a boolean flag that prevents them from being called more than once?

**Failure Symptom (if No)**: A valid decryption proof can be resubmitted by anyone to re-trigger the finalization logic (e.g., re-transferring funds, re-recording a result).

**Fix Pattern**:
```solidity
bool private _finalized;
function finalize(...) external {
    require(!_finalized, "already finalized"); // replay guard
    FHE.checkSignatures(...);
    _finalized = true;
    _executeFinalLogic();
}
```

---

## Invariant 9: View Functions Return Handles, Not Decrypted Values
**Question**: Do all `view` functions that expose encrypted state return the encrypted handle (e.g., `euint64`) rather than attempting to decrypt it?

**Failure Symptom (if No)**: On-chain decryption is not available in production FHEVM. The function will revert or return incorrect data on live networks.

**Fix Pattern**:
```solidity
// ✅ CORRECT — return handle, user decrypts off-chain
function confidentialBalanceOf(address user) public view returns (euint64) {
    return _balances[user];
}
// ❌ WRONG — cannot decrypt on-chain in production
function getBalance(address user) public view returns (uint64) {
    return FHE.decrypt(_balances[user]); // ONLY works in mock mode
}
```

---

## Invariant 10: ERC-7984 Compliance for Token Contracts
**Question**: If the contract provides token functionality (balances, transfers), does it inherit from `ERC7984` in `@openzeppelin/confidential-contracts` rather than implementing custom FHE token logic?

**Failure Symptom (if No)**: Custom implementations typically miss ACL propagation in `_update`, correctness of `confidentialTransfer`, or the standard interface (breaking wallets and DEXes).

**Fix Pattern**:
```solidity
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
contract MyToken is ZamaEthereumConfig, ERC7984, Ownable2Step { ... }
```

---

## Invariant 11: Two-Step SDK Initialization
**Question**: Does every usage of `@zama-fhe/relayer-sdk/web` call `initSDK()` (to load WASM binaries) before calling `createInstance()`?

**Failure Symptom (if No)**: The FHEVM instance will fail to initialize or crash silently when attempting to perform cryptographic operations like encryption or key generation.

**Fix Pattern**:
```typescript
await initSDK({ tfheParams: "/wasm/tfhe_bg.wasm", kmsParams: "/wasm/kms_lib_bg.wasm" });
instance = await createInstance({ ...SepoliaConfig, network });
```

---

## Invariant 12: Correct userDecrypt Signature (8-arg)
**Question**: Does every call to `instance.userDecrypt` pass exactly 8 arguments, including `startTimestamp` and `durationDays`?

**Failure Symptom (if No)**: Compilation error or runtime crash. The old 6-argument `reencrypt` signature was removed in Relayer SDK v0.4+.

**Fix Pattern**:
```typescript
const results = await instance.userDecrypt(
  items, privKey, pubKey, signature, 
  contractAddresses, userAddress, 
  now, 1 // startTimestamp and durationDays REQUIRED
);
```
