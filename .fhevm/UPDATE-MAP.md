# UPDATE-MAP — Directive Maintenance Guide
<!-- Tracks which Zama packages affect each directive file and how to update them -->

---

## Version Compatibility Matrix
| Directive File | `@fhevm/solidity` | `@fhevm/hardhat-plugin` | `@openzeppelin/confidential-contracts` | `@zama-fhe/relayer-sdk` |
|---|---|---|---|---|
| `SKILL-TYPES.md` | ^0.11.1 | — | — | — |
| `SKILL-ACL.md` | ^0.11.1 | — | — | — |
| `SKILL-DECRYPTION.md` | ^0.11.1 | — | — | ^0.4.1 |
| `SKILL-INPUTS.md` | ^0.11.1 | ^0.4.2 | — | — |
| `SKILL-TESTING.md` | ^0.11.1 | ^0.4.2 | — | ^0.4.1 |
| `SKILL-FRONTEND.md` | — | — | — | ^0.4.1 |
| `SKILL-ERC7984.md` | ^0.11.1 | — | latest | — |

---

## Package → Directive Dependency Map

### `@fhevm/solidity` (Solidity library)
Affects: `SKILL-TYPES.md`, `SKILL-ACL.md`, `SKILL-DECRYPTION.md`, `SKILL-INPUTS.md`, `SKILL-ERC7984.md`

**Update required when**:
- New encrypted types added (e.g., `euint512`)
- `FHE.*` function signatures change (e.g., `fromExternal` renamed, parameters reordered)
- New ACL functions added or existing ones deprecated
- `makePubliclyDecryptable` / `checkSignatures` signatures change
- `ZamaEthereumConfig` import path changes

**Verification checklist**:
- [ ] Compare all `FHE.*` function signatures in new version vs. directive code snippets
- [ ] Check if any type names were renamed or deprecated
- [ ] Verify import paths haven't changed

---

### `@fhevm/hardhat-plugin` (Test tooling)
Affects: `SKILL-TESTING.md`, `SKILL-INPUTS.md`

**Update required when**:
- `fhevm.createEncryptedInput` API changes (parameter order, return shape)
- `fhevm.userDecryptEuint` / `userDecryptEbool` / `userDecryptEaddress` signatures change
- `FhevmType` enum values change
- New add* methods added to input builder (e.g., `add512`)

**Verification checklist**:
- [ ] Check `@fhevm/hardhat-plugin` changelog on npm/GitHub
- [ ] Run template tests in hardhat-template repo to confirm API compatibility

---

### `@zama-fhe/relayer-sdk` (Off-chain client)
Affects: `SKILL-DECRYPTION.md`, `SKILL-FRONTEND.md`, `SKILL-TESTING.md`

**Update required when**:
- `createInstance` API changes
- `publicDecrypt` return type changes (field names in `PublicDecryptResults`)
- `FhevmInstance` interface changes

**Verification checklist**:
- [ ] Check `PublicDecryptResults` type definition in new version
- [ ] Verify `instance.publicDecrypt(handles[])` call signature unchanged

---

### `@openzeppelin/confidential-contracts`
Affects: `SKILL-ERC7984.md`, `confidential-token-scaffold.sol`

**Update required when**:
- `ERC7984` base contract interface changes (e.g., `confidentialTransfer` signature)
- `ERC20ConfidentialWrapper` API changes
- New confidential contract variants added
- Import paths change

**Verification checklist**:
- [ ] Check `ERC7984` constructor signature
- [ ] Verify `_mint`, `_burn`, `_update` hook signatures unchanged
- [ ] Check `confidentialBalanceOf` return type

---

## Update Procedure

### Manual Update Steps
1. Check changelog for each affected package at their npm/GitHub release pages
2. For each changed API, locate the code snippet in the relevant directive file
3. Update the version header at the top of the directive file
4. Update the code snippet to match the new API
5. Update this `UPDATE-MAP.md` version compatibility matrix
6. Update scaffold files if any structural patterns changed

### Conceptual: `npx fhevm-skill update` (Future Tooling)
If this script existed, it would:
1. Read `package.json` from the developer's project
2. Compare installed versions against the compatibility matrix in this file
3. For each version mismatch, flag which directive files and scaffolds may be outdated
4. Optionally fetch latest directives from the skill repository and diff them
5. Report: "SKILL-TYPES.md validated for @fhevm/solidity 0.11.x — you have 0.12.x installed. Please review type additions."

### Version Bump Checklist (perform after any package major/minor upgrade)
- [ ] Read official release notes
- [ ] Search all directive files for any function name that appears in the changelog
- [ ] Update version headers in affected files
- [ ] Run `npx hardhat test` in a test project using the new version + these scaffolds
- [ ] Update compatibility matrix in this file
- [ ] Commit with message: `chore: update skill directives for @fhevm/solidity vX.Y.Z`

---

## Source References for Manual Research
| Source | What to Check |
|---|---|
| https://docs.zama.ai/protocol/solidity-guides/smart-contract/types | Type list and operations |
| https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl | ACL function signatures |
| https://docs.zama.ai/protocol/solidity-guides/smart-contract/oracle | Decryption function signatures |
| https://docs.zama.ai/protocol/solidity-guides/smart-contract/inputs | Input proof patterns |
| https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test | Test API |
| https://docs.zama.ai/protocol/examples/openzeppelin-confidential-contracts/erc7984 | ERC-7984 patterns |
| https://github.com/zama-ai/fhevm-hardhat-template | Working reference implementation |
