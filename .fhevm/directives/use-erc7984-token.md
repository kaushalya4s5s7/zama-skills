---
name: use-erc7984-token
description: ERC-7984 Confidential Token Standard — implementation and deployment
version: "@openzeppelin/confidential-contracts | @fhevm/solidity ^0.11.1"
validated: 2026-05-08
---

## What is ERC-7984?
ERC-7984 is the standard for confidential tokens on fhEVM. It uses `euint64` for balances, ensuring that token holdings and transfer amounts are hidden from the public.

## Implementation Pattern
Always extend `ERC7984` from the OpenZeppelin confidential contracts library.

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract MyToken is ZamaEthereumConfig, ERC7984 {
    constructor() ERC7984("MyToken", "MTK", "https://api.example.com") {}

    // ⚠️ DO NOT use _mint in constructor on Sepolia (A6)
    // Use an external initialization function instead.
    function initialize(uint64 initialSupply) public {
        _mint(msg.sender, FHE.asEuint64(initialSupply));
    }
}
```

## Key Features
- **Confidential Transfers:** Amounts are encrypted. The contract uses `FHE.select` internally to verify balances without revealing them.
- **Automatic ACL:** The standard base contract handles `FHE.allowThis`, `FHE.allow(from)`, and `FHE.allow(to)` automatically during transfers.
- **Off-Chain Balance Decryption:** Users call `confidentialBalanceOf(user)` to get a handle, then use the `relayer-sdk` to decrypt it privately.

## Confidential Minting
```solidity
function mint(
    address to, 
    externalEuint64 amount, 
    bytes calldata proof
) external onlyOwner {
    _mint(to, FHE.fromExternal(amount, proof));
}
```

## Fingerprint Reference
- `fingerprints/fhevm-solidity-api.md`
- `choose-encrypted-types.md`

## Common Pitfalls
- **A6:** Calling `_mint` with `FHE.asEuint64` in the constructor (reverts on Sepolia).
- **Invariant 10:** Forgetting to extend the official `ERC7984` base contract.
