# FHEVM Agent Orchestration
<!-- 5-Phase Sequential Flow — DO NOT SKIP OR COMBINE PHASES -->

## Core Mandates
1. **SDK:** Always use `@zama-fhe/relayer-sdk`. NEVER use `fhevmjs` directly.
2. **Init:** Always follow the two-step `initSDK()` + `createInstance()` pattern for web.
3. **Decryption:** Always use the 8-argument `userDecrypt` for private data.
4. **Gas:** Always provide explicit `gasLimit` on Sepolia (500k/1.5M).
5. **Phase Gate:** Always pass the **Interrogation Gate** before writing any contract code.
6. **Validation:** Always pass all 12 invariants in `INVARIANTS.md` before delivery.

---

## Phase 0: Ideation & Design Challenge
**Goal:** Define the privacy bounds and validate the architectural feasibility.

1. **Ask all 6 Phase 0 questions:** Name/Purpose, Actors, Confidential State, Public State, Reveal Conditions, Target Network.
2. **Invoke INTERROGATION-GATE.md:** Ask all 15 challenge questions.
3. **Review Answers:** Flag reorg risks (Two-Phase ACL), constructor bugs (Lazy Init), or gas issues.
4. **STOP:** Wait for developer approval of the design.

---

## Phase 1: Contract Development
**Goal:** Implement the business logic with privacy-first patterns.

1. **Generate Privacy Spec:** Await "Approved".
2. **Select Scaffold:** Choose from `templates/contracts/`.
3. **Implementation:**
   - Use `ZamaEthereumConfig`.
   - Implement "allowThis on every write".
   - Use `FHE.select` for oblivious branches.
   - **Lazy Init:** No `asEuintXX` in constructor.
4. **12-Invariant Check:** Answer all 12 questions. Fix all "No" answers.
5. **Deliver:** Share the contract code.
6. **STOP:** Ask "Ready for tests?"

---

## Phase 2: Testing
**Goal:** Verify logic correctness in mock mode.

1. **Generate Test:** Fill `templates/typescript/fhevm-test-scaffold.ts`.
2. **Verify ACL:** Add tests for authorized vs unauthorized decryption.
3. **STOP:** Wait for developer to run `npx hardhat test` and confirm "All Passing".

---

## Phase 3: Deployment
**Goal:** Deploy to Sepolia and record addresses.

1. **Ask:** Deployer address, Private key ready?, Constructor args.
2. **Generate Script:** Fill `templates/typescript/deploy-scaffold.ts` with explicit `gasLimit`.
3. **Deliver:** Share script + run instructions.
4. **Record:** Save the deployed contract address.
5. **STOP:** Ask about Backend and Frontend needs.

---

## Phase 4: Backend (Optional)
**Goal:** Automated reveal and ACL management.

1. **Setup Dual Transport:** WS for events, HTTP for writes/decrypt.
2. **Implementation:** Use `@zama-fhe/relayer-sdk/node` and 8-arg `userDecrypt`.
3. **STOP:** Advance to Phase 5 if requested.

---

## Phase 5: Frontend (Optional)
**Goal:** Secure user interaction.

1. **Setup SDK:** `initSDK` + `createInstance` with `SepoliaConfig`.
2. **Encrypt:** Batch inputs to save gas.
3. **Decrypt:** Implement 8-arg `userDecrypt` with EIP-712 signing.
4. **Done ✅**
