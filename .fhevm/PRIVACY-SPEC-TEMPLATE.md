# Privacy Specification Template
<!-- Fill this template BEFORE writing any FHEVM contract code -->
<!-- Status: PENDING DEVELOPER CONFIRMATION -->

---

## System Name
<!-- e.g., "Confidential Sealed-Bid Auction" -->
[FILL: System name]

## Problem Statement
<!-- One paragraph: what does this contract do and why is confidentiality required? -->
[FILL: Brief description]

---

## Actors
<!-- List every role that interacts with the system -->
| Actor | Description |
|---|---|
| [e.g., Bidder] | [e.g., Submits encrypted bids] |
| [e.g., Owner/Admin] | [e.g., Deploys contract, triggers reveal] |
| [e.g., Public/Anyone] | [e.g., Can view final results after reveal] |

---

## Visibility Matrix
<!-- For each data field: which actor can see it, and when? -->
<!-- ✓ = can see | ✗ = cannot see | "After X" = visible only after condition X -->

| Data Field | Type (suggested) | Bidder | Owner | Public |
|---|---|---|---|---|
| [e.g., Bid amount] | `euint64` | Own only | After reveal | After reveal |
| [e.g., Winner address] | `eaddress` / `address` | After reveal | After reveal | After reveal |
| [FILL] | | | | |

---

## Decryption Events
<!-- List every permitted decryption: what triggers it, who authorizes it -->
| Event | Trigger Condition | Authorization Required | Decryption Method |
|---|---|---|---|
| [e.g., Reveal winner] | [e.g., Auction deadline passed] | [e.g., Anyone (public)] | `makePubliclyDecryptable` + `checkSignatures` |
| [e.g., User checks own bid] | [e.g., Any time] | [e.g., Bidder (self only)] | `FHE.allow(bid, bidder)` + off-chain userDecrypt |

---

## Encrypted Type Derivation
<!-- For each piece of data requiring encryption: minimum type needed -->
| Data | Min Type | Reasoning |
|---|---|---|
| [e.g., Bid amount in ETH wei] | `euint64` | Fits in uint64, matches ERC-7984 standard |
| [e.g., Encrypted participant address] | `eaddress` | Ethereum address = 160 bits |

---

## ACL Propagation Notes
<!-- Any complex cross-contract or derived value situations -->
- [e.g., "When comparing two bids to find winner, derived comparison result needs FHE.allowThis before storage"]
- [e.g., "Winning bid amount passed to settlement contract — needs FHE.allowTransient before cross-contract call"]

---

## Developer Confirmation
**Status**: ☐ PENDING

> The agent will not proceed to write any code until the developer explicitly confirms this specification.
> To confirm: reply with "approved", "proceed", or explicitly describe any changes needed.

**Confirmed by**: [FILL when confirmed]
**Date**: [FILL]
