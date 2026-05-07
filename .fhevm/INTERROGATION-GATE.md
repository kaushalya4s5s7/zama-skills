---
name: fhevm-interrogation-gate
description: 5D pre-build challenge — run before writing any contract code
validated: 2026-05-08
---

**When to invoke:** After Phase 0 (Ideation) completes, before Phase 1 (Contract) begins.

**Rule:** Developer must answer all 15 questions. Review the answers and flag any "I don't know" or design gaps.

### D1 — Forward Effects (what this design creates)
1. Which state changes are irreversible once encrypted?
2. Who can decrypt what, and when — trace each encrypted field end-to-end.
3. What happens when the coprocessor is slow and the user retries?

### D2 — Backward Causes (what this design depends on)
1. What off-chain inputs must exist before any on-chain FHE op can succeed?
2. Which contracts must have called `allowThis` or `allowTransient` before your contract uses a handle?
3. What breaks if `FINALITY_BLOCKS` is read wrong or hardcoded?

### D3 — Hidden Dependencies (what isn't obvious)
1. Are there any functions that need `gasLimit` overrides? (List them.)
2. Does any function receive encrypted inputs from more than one source in one call?
3. Are there cross-contract FHE passes? Which require `allowTransient`?

### D4 — Failure Modes (how this design breaks)
1. What happens if the Keeper never fires Phase 2 ACL? Is the user permanently locked out?
2. What happens if `userDecrypt` returns empty? Is there a fallback?
3. What happens if two users call the same finalize function simultaneously?

### D5 — Reversals (what would invalidate this design)
1. If the encrypted result must be disclosed to a regulator, is there a path for that?
2. If a user's key is lost, can they still access their encrypted data?
3. If the contract must be migrated, which ACL grants survive and which don't?
