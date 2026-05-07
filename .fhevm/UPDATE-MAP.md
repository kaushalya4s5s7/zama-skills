# UPDATE-MAP — Directive Maintenance Guide
<!-- Tracks package versions and their impact on directive files -->

---

## Version Compatibility Matrix (Validated: 2026-05-08)
| Directive File | `@fhevm/solidity` | `@fhevm/hardhat-plugin` | `@zama-fhe/relayer-sdk` |
|---|---|---|---|
| `choose-encrypted-types.md` | ^0.11.1 | — | — |
| `grant-acl-access.md` | ^0.11.1 | — | — |
| `decrypt-encrypted-handles.md`| ^0.11.1 | — | ^0.4.2 |
| `encrypt-user-inputs.md` | ^0.11.1 | ^0.4.2 | ^0.4.2 |
| `test-fhevm-contract.md` | — | ^0.4.2 | — |
| `deploy-fhevm-contract.md` | — | ^0.4.2 | — |
| `encrypt-and-decrypt-frontend.md`| — | — | ^0.4.2 |
| `build-keeper-service.md` | — | — | ^0.4.2 |
| `use-erc7984-token.md` | ^0.11.1 | — | — |

---

## Package → Directive Dependency Map

### `@zama-fhe/relayer-sdk` (Critical Update in V2)
Affects: `encrypt-and-decrypt-frontend.md`, `build-keeper-service.md`, `decrypt-encrypted-handles.md`

**Update required when**:
- `initSDK` or `createInstance` signatures change.
- `userDecrypt` signature changes (e.g., arguments 7 and 8 for timestamps).
- `SepoliaConfig` is updated with new contract addresses.

---

### `@fhevm/solidity`
Affects: `choose-encrypted-types.md`, `grant-acl-access.md`, `apply-fhe-operations.md`

**Update required when**:
- New `FHE.*` operations are added.
- `FHE.allowTransient` or `FHE.allow` behavior changes.
- `ZamaEthereumConfig` inheritance patterns change.

---

### `@fhevm/hardhat-plugin`
Affects: `test-fhevm-contract.md`, `deploy-fhevm-contract.md`, `manage-gas-limits.md`

**Update required when**:
- `fhevm.createEncryptedInput` API changes.
- `estimateGas` interceptor behavior changes (affecting gas limits).
- Mock decryption helpers in tests are updated.

---

## Update Procedure
1. **Changelog Audit:** Check Zama's npm/GitHub releases for major/minor version bumps.
2. **Signature Review:** Verify all code snippets in directives against new package versions.
3. **Version Stamp:** Update the `version` and `validated` fields in the YAML frontmatter of affected files.
4. **CI Check:** Run `node scripts/check-versions.js` to detect mismatches.
