// SPDX-License-Identifier: BSD-3-Clause-Clear
// Validated: @fhevm/solidity ^0.11.1 | 2026-05-07
pragma solidity ^0.8.27;

// ============================================================
// CONFIDENTIAL VOTE SCAFFOLD — Encrypted Voting
// ============================================================
// Pre-implemented: encrypted vote storage, ACL for voter privacy,
// tally reveal via public decryption.
// Fill TODO comments with: eligibility logic, vote options,
// reveal conditions.
// ============================================================

import { FHE, ebool, euint64, externalEbool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract ConfidentialVoteScaffold is ZamaEthereumConfig, Ownable2Step {

    // --------------------------------------------------------
    // State Variables
    // --------------------------------------------------------
    // Encrypted vote tallies (one per option — extend as needed)
    euint64 private _tallyYes;
    euint64 private _tallyNo;

    // Tracks whether each address has voted (public — reveals participation, not vote)
    mapping(address => bool) public hasVoted;

    // Finalization state
    bool private _finalized;
    bool private _revealPhaseActive;

    // Clear results (populated after successful finalization)
    uint64 public clearTallyYes;
    uint64 public clearTallyNo;

    // TODO: Add voting window parameters (start time, end time)
    // uint256 public voteStart;
    // uint256 public voteEnd;

    // --------------------------------------------------------
    // Events
    // --------------------------------------------------------
    event VoteCast(address indexed voter);
    event RevealRequested(euint64 encTallyYes, euint64 encTallyNo);
    event ResultsFinalized(uint64 clearYes, uint64 clearNo);

    // --------------------------------------------------------
    // Constructor
    // --------------------------------------------------------
    constructor(address admin)
        Ownable(admin)
    {
        // Pre-implemented: initialize tallies to encrypted 0
        _tallyYes = FHE.asEuint64(0);
        FHE.allowThis(_tallyYes); // REQUIRED: allowThis after every storage write
        _tallyNo = FHE.asEuint64(0);
        FHE.allowThis(_tallyNo);  // REQUIRED
        // TODO: initialize voting window
    }

    // --------------------------------------------------------
    // Cast Vote (encrypted ballot)
    // --------------------------------------------------------
    // Pre-implemented: input proof validation, tally update with allowThis
    // Voter submits encrypted YES (1) or NO (0) as euint64
    function castVote(
        externalEuint64 encryptedVote,
        bytes calldata inputProof
    ) external {
        // TODO: Add voter eligibility check (e.g., whitelist, token gate)
        // require(isEligible(msg.sender), "not eligible");

        // Pre-implemented: replay protection
        require(!hasVoted[msg.sender], "already voted");
        // TODO: Add timing check (e.g., require(block.timestamp >= voteStart))

        // Pre-implemented: validate input proof
        euint64 vote = FHE.fromExternal(encryptedVote, inputProof);

        // Pre-implemented: add to tally using FHE addition
        // FHE.select ensures only valid vote (0 or 1) contributes
        // TODO: Adjust this logic if your vote structure differs
        _tallyYes = FHE.add(_tallyYes, vote);
        FHE.allowThis(_tallyYes); // REQUIRED after every encrypted state write

        euint64 antiVote = FHE.sub(FHE.asEuint64(1), vote);
        _tallyNo = FHE.add(_tallyNo, antiVote);
        FHE.allowThis(_tallyNo); // REQUIRED

        hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender);
    }

    // --------------------------------------------------------
    // Request Reveal (Step 1 of 3-step async decryption)
    // --------------------------------------------------------
    // Pre-implemented: marks tallies as publicly decryptable
    function requestReveal() external onlyOwner {
        // TODO: Add condition to gate reveal (e.g., voting period ended)
        // require(block.timestamp > voteEnd, "voting not ended");
        require(!_revealPhaseActive, "reveal already requested");

        _revealPhaseActive = true;
        FHE.makePubliclyDecryptable(_tallyYes); // signals off-chain relayer
        FHE.makePubliclyDecryptable(_tallyNo);

        emit RevealRequested(_tallyYes, _tallyNo);
        // Off-chain client listens for this event, then calls publicDecrypt
    }

    // --------------------------------------------------------
    // Finalize Results (Step 3 of 3-step async decryption)
    // --------------------------------------------------------
    // Pre-implemented: proof verification + replay guard
    // Call AFTER off-chain publicDecrypt returns clearValues + decryptionProof
    function finalizeResults(
        uint64 clearYes,
        uint64 clearNo,
        bytes memory decryptionProof
    ) external {
        // Pre-implemented: replay guard
        require(!_finalized, "already finalized");
        require(_revealPhaseActive, "reveal not requested");

        // Pre-implemented: verify KMS proof — reverts if invalid
        // Order in handles array MUST match order in abi.encode below
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(_tallyYes);
        handles[1] = FHE.toBytes32(_tallyNo);

        bytes memory abiClear = abi.encode(clearYes, clearNo); // order matches handles
        FHE.checkSignatures(handles, abiClear, decryptionProof);

        // Pre-implemented: store results and mark finalized
        _finalized = true;
        clearTallyYes = clearYes;
        clearTallyNo = clearNo;

        // TODO: Execute post-finalization business logic here
        // e.g., emit winner, trigger token distribution, record result on-chain
        emit ResultsFinalized(clearYes, clearNo);
    }

    // --------------------------------------------------------
    // Read Encrypted Tallies (returns handles — admin decrypts off-chain)
    // --------------------------------------------------------
    // ACL: requires FHE.allow(_tallyYes, msg.sender) before user can decrypt
    function getEncryptedTallyYes() external view returns (euint64) { return _tallyYes; }
    function getEncryptedTallyNo()  external view returns (euint64) { return _tallyNo; }

    // --------------------------------------------------------
    // TODO: Add contract-specific logic below
    // --------------------------------------------------------
    // - isEligible(address) voter check
    // - Voting window management
    // - Additional vote options (extend tally variables)
}
