# SKILL-ERC7984 — Confidential Token Standard
<!-- Validated against: @openzeppelin/confidential-contracts | @fhevm/solidity ^0.11.1 | Source: docs.zama.ai/protocol/examples/openzeppelin-confidential-contracts/erc7984 | 2026-05-07 -->

## Setup
```bash
npm i @openzeppelin/confidential-contracts
```

## ERC-7984 vs. ERC-20
| | ERC-20 | ERC-7984 |
|---|---|---|
| Balances | Public `uint256` | Encrypted `euint64` |
| Transfer amounts | Visible in calldata | Encrypted, never revealed |
| `Transfer` event | Emits `from, to, amount` | Emits handles only (no amounts) |
| Approval | `approve(spender, amount)` | Confidential allowance |
| Base contract | `ERC20` | `ERC7984` from OZ confidential-contracts |

## Correct Imports & Inheritance
```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import { FHE, externalEuint64, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract MyConfidentialToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(address owner, uint64 initialSupply, string memory name, string memory symbol, string memory uri)
        ERC7984(name, symbol, uri) Ownable(owner) {
        euint64 enc = FHE.asEuint64(initialSupply);
        _mint(owner, enc);  // _mint handles allowThis + allow(owner) internally
    }
}
```

## Mint Patterns
```solidity
// Visible mint (amount in calldata — not private)
function mint(address to, uint64 amount) external onlyOwner {
    _mint(to, FHE.asEuint64(amount));
}

// Confidential mint (amount stays encrypted)
function confidentialMint(
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external onlyOwner returns (euint64 transferred) {
    return _mint(to, FHE.fromExternal(encryptedAmount, inputProof));
}
```

## Burn Patterns
```solidity
function confidentialBurn(
    address from,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) external onlyOwner returns (euint64 transferred) {
    return _burn(from, FHE.fromExternal(encryptedAmount, inputProof));
}
```

## Transfer (called by token holder)
```solidity
// ERC7984 base exposes: confidentialTransfer(address to, externalEuint64 amount, bytes calldata proof)
// Sufficient balance checked via FHE.select (no amount revealed)
// _update hook handles ACL: allowThis + allow(from) + allow(to)
```

## Override _update for Custom ACL
```solidity
function _update(address from, address to, euint64 amount)
    internal virtual override returns (euint64 transferred)
{
    transferred = super._update(from, to, amount);
    // Grant owner visibility of total supply after each update
    FHE.allow(confidentialTotalSupply(), owner());
}
```

## confidentialBalanceOf
```solidity
// Returns euint64 handle — user decrypts off-chain using their own key
euint64 handle = token.confidentialBalanceOf(userAddress);
```

## ACL Requirements for Token Transfers
- `_update` (inside `ERC7984` base) automatically calls `FHE.allowThis`, `FHE.allow(from)`, `FHE.allow(to)` on the transferred amount
- If you extend `_update`, always call `super._update` first
- Total supply handle needs explicit `FHE.allow` if admin needs to read it

## Wrap (ERC-20 → ERC-7984) Pattern
Use `ERC20ConfidentialWrapper` from `@openzeppelin/confidential-contracts`:
```solidity
import { ERC20ConfidentialWrapper } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC20ConfidentialWrapper.sol";
// wrap(uint256 amount) — locks ERC-20, mints encrypted ERC-7984
// unwrap(externalEuint64 amount, bytes proof) — burns encrypted, returns ERC-20
```
