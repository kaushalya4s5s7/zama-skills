# FHEVM Agent Orchestration
<!-- 5-Phase Sequential Flow — DO NOT SKIP OR COMBINE PHASES -->

## Core Mandates
1. **SDK:** Always use `@zama-fhe/relayer-sdk`. NEVER use `fhevmjs` directly.
2. **Init:** Always follow the two-step `initSDK()` + `createInstance()` pattern for web.
3. **Decryption:** Always use the 8-argument `userDecrypt` for private data.
4. **Gas:** Always provide explicit `gasLimit` on Sepolia (500k/1.5M).
5. **Phase Gate:** Always pass the **Interrogation Gate** before writing any contract code.
6. **Validation:** Always pass all 12 invariants in `INVARIANTS.md` before delivery.
7. **Directory Structure:** Segregate the project into exactly three top-level folders: `contracts/`, `frontend/`, and `backend/`. No config files (package.json, hardhat.config.ts, tsconfig.json) or test/script folders should exist at the root.

---

## Phase 0: Ideation & Design Challenge
**Goal:** Define the privacy bounds and validate the architectural feasibility.

1. **Ask all 6 Phase 0 questions:** Name/Purpose, Actors, Confidential State, Public State, Reveal Conditions, Target Network.
2. **Invoke INTERROGATION-GATE.md:** Ask all 15 challenge questions.
3. **Review Answers:** Flag reorg risks (Two-Phase ACL), constructor bugs (Lazy Init), or gas issues.
4. **STOP:** Wait for developer approval of the design.

---

## Phase 1: Contract Development
**Goal:** Implement the business logic in the `contracts/` directory.

1. **Setup Scaffolding:** Create `contracts/` folder with `contracts/package.json`, `contracts/hardhat.config.ts`, and `contracts/tsconfig.json`.
2. **Generate Privacy Spec:** Await "Approved".
3. **Select Scaffold:** Choose from `templates/contracts/` and place in `contracts/contracts/`.
4. **Implementation:**
   - Use `ZamaEthereumConfig`.
   - Implement "allowThis on every write".
   - Use `FHE.select` for oblivious branches.
   - **Lazy Init:** No `asEuintXX` in constructor.
5. **12-Invariant Check:** Answer all 12 questions. Fix all "No" answers.
6. **Deliver:** Share the contract code.
7. **STOP:** Ask "Ready for tests?"

---

## Phase 2: Testing
**Goal:** Verify logic correctness in `contracts/test/`.

1. **Generate Test:** Fill `templates/typescript/fhevm-test-scaffold.ts` and place in `contracts/test/`.
2. **Verify ACL:** Add tests for authorized vs unauthorized decryption.
3. **STOP:** Wait for developer to run `pnpm test` (inside `contracts/`) and confirm "All Passing".

---

## Phase 3: Deployment
**Goal:** Deploy to Sepolia using `contracts/scripts/`.

1. **Ask:** Deployer address, Private key ready?, Constructor args.
2. **Generate Script:** Fill `templates/typescript/deploy-scaffold.ts` with explicit `gasLimit` and place in `contracts/scripts/`.
3. **Deliver:** Share script + run instructions (e.g., `pnpm deploy` from `contracts/`).
4. **Record:** Save the deployed contract address.
5. **STOP:** Ask about Backend and Frontend needs.

---

## Phase 4: Backend (Optional)
**Goal:** Implement keeper in `backend/`.

1. **Setup Scaffolding:** Create `backend/` folder from `templates/app/backend/`.
2. **Implementation:** Use `@zama-fhe/relayer-sdk/node` and 8-arg `userDecrypt`.
3. **STOP:** Advance to Phase 5 if requested.

---

## Phase 5: Frontend (Optional)
**Goal:** Implement frontend in `frontend/`.

1. **Setup Scaffolding:** Create `frontend/` folder from `templates/app/frontend/`.
2. **Setup SDK:** `initSDK` + `createInstance` with `SepoliaConfig`.
3. **Encrypt:** Batch inputs to save gas.
4. **Decrypt:** Implement 8-arg `userDecrypt` with EIP-712 signing.
5. **Done ✅**
