# FHEVM Orchestration — Full 5-Phase Gate Logic
<!-- Read this when CLAUDE.md/GEMINI.md compressed orchestration is insufficient -->
<!-- RULE: Phases execute sequentially. Never skip. Never combine phases. -->
<!-- RULE: Always ask before advancing to the next phase. -->

═══════════════════════════════════════════════════════════════════
## PHASE 0 — IDEATION  (Entry Point for Every New Project)
═══════════════════════════════════════════════════════════════════

When a developer makes any FHEVM request, ALWAYS start here.

### Questions to Ask (all required, in this order)

**Q1**: "What is the name and purpose of this confidential contract?"

**Q2**: "Which actors interact with it? (e.g., users, admin, public, specific roles)"

**Q3**: "What data must stay confidential? (e.g., bid amounts, vote choices, balances, addresses)"

**Q4**: "What data can be publicly visible? (e.g., timestamps, results after reveal, participant list)"

**Q5**: "When and how should encrypted results be revealed? (e.g., never / only to owner / publicly after deadline)"

**Q6 (required)**: "Which network do you want to deploy to?
  - (1) Local Hardhat (mock — for testing only)
  - (2) Ethereum Sepolia (testnet)
  - (3) Ethereum Mainnet"

Do NOT proceed to Phase 1 until ALL 6 questions are answered.

---

═══════════════════════════════════════════════════════════════════
## PHASE 1 — CONTRACT (Privacy Spec → Scaffold → Write → Validate)
═══════════════════════════════════════════════════════════════════

### Gate 1-A: Generate Privacy Specification
- Use `.fhevm/PRIVACY-SPEC-TEMPLATE.md` as the template
- Fill: Actors, Visibility Matrix, Decryption Events, ACL Propagation Notes
- Present the completed spec to the developer
- **STOP** — await explicit developer approval ("approved", "looks good", "proceed")

### Gate 1-B: Select Scaffold
| Spec Characteristic | Scaffold |
|---|---|
| Token balances, confidential transfers | `confidential-token-scaffold.sol` |
| Encrypted voting, tally reveal | `confidential-vote-scaffold.sol` |
| Sealed bids, winner determination | `sealed-bid-auction-scaffold.sol` |
| General encrypted state | `acl-value-scaffold.sol` |
| Result reveal to public | `public-decrypt-scaffold.sol` |

### Gate 1-C: Fill Scaffold Business Logic
- Replace `// TODO` comments with business logic ONLY
- Do NOT modify pre-implemented FHE patterns (allowThis, fromExternal, etc.)
- Every new encrypted state variable gets `FHE.allowThis` immediately

### Gate 1-D: Run 10-Invariant Checklist
Answer all 10 questions from `INVARIANTS.md`. Fix all "No" answers. Re-check until all pass.

### Gate 1-E: Deliver Contract
Present the filled contract. Briefly explain: which scaffold used, key ACL decisions.

**STOP — Do not advance. Ask developer: "Shall I generate the Hardhat tests for this contract?"**

---

═══════════════════════════════════════════════════════════════════
## PHASE 2 — TESTING
═══════════════════════════════════════════════════════════════════

Only start Phase 2 after developer confirms contract is ready for testing.

### Gate 2-A: Load SKILL-TESTING.md
### Gate 2-B: Generate test file from `fhevm-test-scaffold.ts`
  Fill encryption helpers, decryption helpers, ACL enforcement tests, FHE operation tests.

### Gate 2-C: Deliver test file with run instructions
```bash
npx hardhat test          # mock mode
```

### Gate 2-D: Confirm tests pass
Ask developer: "Please run `npx hardhat test` and share the result."
If tests fail: debug using the Debug Orchestration section below.

**STOP — Do not advance. Ask developer: "Tests passing? Ready to deploy?"**

---

═══════════════════════════════════════════════════════════════════
## PHASE 3 — DEPLOYMENT
═══════════════════════════════════════════════════════════════════

Only start Phase 3 after developer confirms tests pass.

### Gate 3-A: Ask for deployment details
```
"Before I generate the deploy script, I need:
  1. Which network? (local / sepolia / mainnet) — already answered in Phase 0
  2. What is your deployer wallet address?
  3. Do you have your PRIVATE_KEY and RPC API key (Infura/Alchemy) ready?
  4. Any constructor arguments beyond what's in the contract?"
```

### Gate 3-B: Generate deploy script from `deploy-scaffold.ts`
Fill: CONTRACT_NAME, getConstructorArgs() with actual args from Phase 0 answers.

### Gate 3-C: Generate hardhat.config.ts network section
Use the target network from Phase 0 Q6. See `SKILL-DEPLOY.md` for full config.

### Gate 3-D: Deliver deploy instructions
```bash
# 1. Set environment variables
echo "PRIVATE_KEY=0x..." >> .env
echo "INFURA_API_KEY=..." >> .env

# 2. Deploy
npx hardhat run scripts/deploy.ts --network <network>

# 3. Note the contract address output — needed for next phases
```

### Gate 3-E: Record deployed address
After developer runs deploy, ask: "What is the deployed contract address?"
Store this as `CONTRACT_ADDRESS` — it is needed for backend and frontend phases.

**STOP — Contract is fully complete (written, tested, deployed).**

═══════════════════════════════════════════════════════════════════
### *** DECISION GATE: Ask BOTH questions after deploy ***
═══════════════════════════════════════════════════════════════════

After developer confirms deployment, ask these two questions explicitly:

```
"Your contract is deployed at: [CONTRACT_ADDRESS]

Now I can help you with the next steps. Please answer both:

1. Do you need a backend service?
   (A keeper/bot that automatically calls publicDecrypt and submits
   the proof on-chain when your contract signals a reveal event)
   → Answer YES if your contract has makePubliclyDecryptable + checkSignatures

2. Do you need a frontend?
   (React hooks for encrypting user inputs, reading encrypted balances,
   and displaying revealed results)
   → Answer YES if end-users will interact with this contract via a web UI

Reply with: 'yes/no' for backend, 'yes/no' for frontend"
```

Route based on answers:
- backend = YES → execute **Phase 4**
- frontend = YES → execute **Phase 5**
- both = YES → execute **Phase 4 first**, then **Phase 5**
- both = NO → done ✅

---

═══════════════════════════════════════════════════════════════════
## PHASE 4 — BACKEND SERVICE (only if developer answered YES)
═══════════════════════════════════════════════════════════════════

### Gate 4-A: Ask backend configuration questions
```
"For the keeper service I need:
  1. What event does the contract emit when a reveal is needed?
     (from your contract's RevealRequested / similar event)
  2. What is your finalize function signature?
     (e.g., finalizeResult(uint64 clearA, uint64 clearB, bytes proof))
  3. How many handles are being decrypted in one reveal call?
  4. What is the ORDER of handles? (critical — must match abi.encode order)
  5. Keeper mode preference: event-driven (recommended) or polling?
  6. CONTRACT_ADDRESS: [use address from Phase 3-E]"
```

### Gate 4-B: Load SKILL-BACKEND.md
### Gate 4-C: Fill `keeper-service-scaffold.ts`
  Fill: CONTRACT_ABI, CONTRACT_ADDRESS env var, event name, handle extraction,
  executeReveal clear value extraction, finalize function call.

### Gate 4-D: Deliver keeper with setup instructions
```bash
npm install @zama-fhe/relayer-sdk ethers dotenv

echo "RPC_URL=..." >> .env
echo "KEEPER_PRIVATE_KEY=0x..." >> .env
echo "CONTRACT_ADDRESS=<from Phase 3>" >> .env

ts-node services/keeper.ts
```

**STOP — Keeper complete. Advance to Phase 5 if frontend was requested.**

---

═══════════════════════════════════════════════════════════════════
## PHASE 5 — FRONTEND (only if developer answered YES)
═══════════════════════════════════════════════════════════════════

### Gate 5-A: Ask frontend configuration questions
```
"For the frontend hooks I need:
  1. What framework? (React / Next.js / Vite)
  2. CONTRACT_ADDRESS: [use address from Phase 3-E]
  3. What encrypted inputs does the user submit?
     (e.g., bid amount, vote choice, token transfer amount)
  4. What does the user need to READ back?
     (a) Their own encrypted data (user decrypt — balance, their bid)
     (b) Publicly revealed results (public decrypt — winner, tally)
     (c) Both
  5. Does the frontend need to trigger the reveal? Or is that handled by the keeper?"
```

### Gate 5-B: Load SKILL-FRONTEND.md
### Gate 5-C: Fill `fhevm-frontend-hooks-scaffold.ts`
  Fill: contractAddress constant, useEncryptedInput for each user action,
  usePublicDecrypt for reading revealed results,
  contract-specific hooks (useBidSubmission, useVoteCasting, etc.).

### Gate 5-D: Deliver hooks with usage example
Show a minimal React component demonstrating how to use the generated hooks.

**STOP — All phases complete. ✅**

---

═══════════════════════════════════════════════════════════════════
## DEBUG ORCHESTRATION
═══════════════════════════════════════════════════════════════════

### Step 1: ACL Check (most common cause)
- Every encrypted state write has `FHE.allowThis`?
- Cross-contract passes use `FHE.allowTransient`?
- User decryption targets have `FHE.allow(val, userAddr)`?

### Step 2: Decryption Flow Check
- No synchronous decrypt in production code?
- `FHE.checkSignatures` handles in same order as `abi.encode`?
- Replay guard present (`require(!_finalized)`)?

### Step 3: Input Proof Check
- `FHE.fromExternal` called before every external input use?
- Correct `inputProof` passed (not confused with `decryptionProof`)?

### Step 4: Keeper/Backend Check
- `CONTRACT_ADDRESS` in keeper `.env` matches deployed address from Phase 3?
- Keeper wallet has ETH balance for finalize tx gas?
- Event name in keeper matches contract exactly?
- Handle order in `executeReveal` matches on-chain `abi.encode` order?

---

═══════════════════════════════════════════════════════════════════
## MIGRATION ORCHESTRATION (existing public contract → confidential)
═══════════════════════════════════════════════════════════════════

1. List all state variables → identify which ones need encryption
2. Run Phase 0 ideation questions for the existing contract
3. Generate Privacy Spec (Gate 1-A applies)
4. For each variable being encrypted:
   - `uint64` → `euint64` + add `FHE.allowThis` after every write
   - Remove all `if/require` on encrypted comparisons → use `FHE.select`
   - Replace any public getters with handles (no on-chain decrypt)
5. Select nearest scaffold as reference
6. Run full invariant checklist (Gate 1-D)
7. Proceed to Phase 2 → 3 → decision gate → 4/5 as normal

---

═══════════════════════════════════════════════════════════════════
## GRADUATED OUTPUT RULES
═══════════════════════════════════════════════════════════════════
- **"Write me a confidential voting contract"** → novice → explain each gate, full Privacy Spec walkthrough
- **"Add a keeper to my existing auction"** → intermediate → skip Phase 0–3, jump to Phase 4
- **"Missing allowTransient on cross-contract pass"** → expert → terse code fix only
