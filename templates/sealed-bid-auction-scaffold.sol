// SPDX-License-Identifier: BSD-3-Clause-Clear
// Validated: @fhevm/solidity ^0.11.1 | 2026-05-07
pragma solidity ^0.8.27;

// ============================================================
// SEALED-BID AUCTION SCAFFOLD — Encrypted Bids
// ============================================================
// Pre-implemented: encrypted bid storage, comparison without
// revealing amounts, winner determination via public decryption.
// Fill TODO comments with: auction timing, settlement logic.
// ============================================================

import { FHE, euint64, eaddress, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract SealedBidAuctionScaffold is ZamaEthereumConfig, Ownable2Step {

    // --------------------------------------------------------
    // State Variables
    // --------------------------------------------------------
    // Encrypted highest bid and corresponding bidder address
    euint64  private _highestBid;
    eaddress private _highestBidder;

    // Per-bidder encrypted bid storage (for refund capability)
    mapping(address => euint64) private _bids;

    // Auction lifecycle
    bool private _biddingOpen;
    bool private _revealRequested;
    bool private _finalized;

    // Clear results (after finalization)
    address public winner;
    uint64  public winningBid; // publicly revealed after auction

    // TODO: Add auction timing parameters
    // uint256 public auctionStart;
    // uint256 public auctionEnd;

    // --------------------------------------------------------
    // Events
    // --------------------------------------------------------
    event BidSubmitted(address indexed bidder);
    event RevealRequested(euint64 encWinningBid, eaddress encWinner);
    event AuctionFinalized(address winner, uint64 winningBid);

    // --------------------------------------------------------
    // Constructor
    // --------------------------------------------------------
    constructor(address auctionOwner)
        Ownable(auctionOwner)
    {
        _biddingOpen = true;

        // Pre-implemented: initialize highest bid to 0 (will be replaced on first bid)
        _highestBid = FHE.asEuint64(0);
        FHE.allowThis(_highestBid); // REQUIRED after every encrypted storage write

        _highestBidder = FHE.asEaddress(address(0));
        FHE.allowThis(_highestBidder); // REQUIRED

        // TODO: Set auction timing parameters
    }

    // --------------------------------------------------------
    // Submit Bid (encrypted amount)
    // --------------------------------------------------------
    // Pre-implemented: input proof validation, FHE comparison, conditional update
    function submitBid(
        externalEuint64 encryptedBid,
        bytes calldata inputProof
    ) external {
        require(_biddingOpen, "bidding closed");
        // TODO: Add timing check (require(block.timestamp < auctionEnd))
        // TODO: Add any bid eligibility requirements (deposit, whitelist, etc.)

        // Pre-implemented: validate proof before use
        euint64 bid = FHE.fromExternal(encryptedBid, inputProof);

        // Pre-implemented: store bidder's bid (encrypted)
        _bids[msg.sender] = bid;
        FHE.allowThis(_bids[msg.sender]); // REQUIRED
        FHE.allow(_bids[msg.sender], msg.sender); // allow bidder to view own bid

        // Pre-implemented: compare with current highest WITHOUT revealing either amount
        // FHE.gt returns ebool — NEVER branch on it with if/require
        euint64  newHighestBid    = FHE.select(FHE.gt(bid, _highestBid), bid, _highestBid);
        eaddress newHighestBidder = FHE.select(
            FHE.gt(bid, _highestBid),
            FHE.asEaddress(msg.sender),
            _highestBidder
        );

        // Pre-implemented: update state with allowThis on every write
        _highestBid = newHighestBid;
        FHE.allowThis(_highestBid); // REQUIRED

        _highestBidder = newHighestBidder;
        FHE.allowThis(_highestBidder); // REQUIRED

        emit BidSubmitted(msg.sender);
    }

    // --------------------------------------------------------
    // Close Bidding
    // --------------------------------------------------------
    function closeBidding() external onlyOwner {
        // TODO: Add timing check (require(block.timestamp >= auctionEnd))
        require(_biddingOpen, "already closed");
        _biddingOpen = false;
    }

    // --------------------------------------------------------
    // Request Winner Reveal (Step 1 of 3-step async decryption)
    // --------------------------------------------------------
    // Pre-implemented: marks winner data as publicly decryptable
    function requestReveal() external onlyOwner {
        require(!_biddingOpen, "bidding still open");
        require(!_revealRequested, "reveal already requested");

        _revealRequested = true;
        FHE.makePubliclyDecryptable(_highestBid);     // signal relayer
        FHE.makePubliclyDecryptable(_highestBidder);

        emit RevealRequested(_highestBid, _highestBidder);
        // Off-chain: listen for this event, call publicDecrypt([highestBidHandle, highestBidderHandle])
    }

    // --------------------------------------------------------
    // Finalize Auction (Step 3 of 3-step async decryption)
    // --------------------------------------------------------
    // Pre-implemented: KMS proof verification + replay protection
    function finalizeAuction(
        uint64  clearWinningBid,
        address clearWinner,
        bytes   memory decryptionProof
    ) external {
        require(!_finalized, "already finalized");
        require(_revealRequested, "reveal not requested");

        // Pre-implemented: verify KMS signatures — order MUST match requestReveal emit order
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(_highestBid);
        handles[1] = FHE.toBytes32(_highestBidder);

        // abi.encode order must match handles array order exactly
        bytes memory abiClear = abi.encode(clearWinningBid, clearWinner);
        FHE.checkSignatures(handles, abiClear, decryptionProof);

        _finalized = true;
        winner     = clearWinner;
        winningBid = clearWinningBid;

        // TODO: Execute settlement logic here
        // e.g., transfer auctioned asset to winner, handle refunds, emit events
        emit AuctionFinalized(clearWinner, clearWinningBid);
    }

    // --------------------------------------------------------
    // Read Own Bid (bidder can decrypt their own bid off-chain)
    // --------------------------------------------------------
    // ACL: _bids[msg.sender] has FHE.allow(_, msg.sender) from submitBid
    function getMyEncryptedBid() external view returns (euint64) {
        return _bids[msg.sender];
    }

    // --------------------------------------------------------
    // TODO: Add contract-specific logic below
    // --------------------------------------------------------
    // - Refund mechanism for losing bidders
    // - Deposit/collateral requirement
    // - Multi-round auction support
}
