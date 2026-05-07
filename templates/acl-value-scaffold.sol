// SPDX-License-Identifier: BSD-3-Clause-Clear
// Validated: @fhevm/solidity ^0.11.1 | 2026-05-07
pragma solidity ^0.8.27;

// ============================================================
// ACL VALUE SCAFFOLD — General Encrypted State Storage
// ============================================================
// Use this scaffold when you need to store and manage encrypted
// values with custom ACL rules. Covers: owner-controlled encrypted
// state, per-user encrypted mappings, cross-contract ACL passing.
// Fill TODO comments with your business logic.
// ============================================================

import { FHE, euint64, euint32, ebool, eaddress,
         externalEuint64, externalEuint32, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { Ownable2Step, Ownable } from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract AclValueScaffold is ZamaEthereumConfig, Ownable2Step {

    // --------------------------------------------------------
    // State Variables
    // --------------------------------------------------------
    // Example: per-user encrypted data (extend/replace as needed)
    mapping(address => euint64) private _encryptedValues;

    // Example: a single shared encrypted contract state
    euint32 private _encryptedState;

    // Example: encrypted flag per user
    mapping(address => ebool) private _encryptedFlags;

    // TODO: Replace/extend with your actual encrypted state variables

    // --------------------------------------------------------
    // Events
    // --------------------------------------------------------
    event ValueUpdated(address indexed user);
    event StateUpdated();

    // --------------------------------------------------------
    // Constructor
    // --------------------------------------------------------
    constructor(address admin) Ownable(admin) {
        // Pre-implemented: initialize shared state to encrypted 0
        _encryptedState = FHE.asEuint32(0);
        FHE.allowThis(_encryptedState); // REQUIRED after every storage write

        // TODO: Initialize any additional state variables
    }

    // --------------------------------------------------------
    // Write Encrypted User Value
    // --------------------------------------------------------
    // Pre-implemented: input validation, allowThis, user ACL grant
    function setMyValue(
        externalEuint64 encryptedValue,
        bytes calldata inputProof
    ) external {
        // Pre-implemented: validate proof before use
        euint64 value = FHE.fromExternal(encryptedValue, inputProof);

        // Pre-implemented: store with required ACL grants
        _encryptedValues[msg.sender] = value;
        FHE.allowThis(_encryptedValues[msg.sender]); // REQUIRED — allows future contract ops
        FHE.allow(_encryptedValues[msg.sender], msg.sender); // user can decrypt own value

        // TODO: Add any additional ACL grants (e.g., FHE.allow(value, adminAddr))
        // TODO: Add business logic validation using FHE.select (NOT if/require on encrypted values)

        emit ValueUpdated(msg.sender);
    }

    // --------------------------------------------------------
    // Write Encrypted Flag
    // --------------------------------------------------------
    function setMyFlag(
        externalEbool encryptedFlag,
        bytes calldata inputProof
    ) external {
        ebool flag = FHE.fromExternal(encryptedFlag, inputProof);
        _encryptedFlags[msg.sender] = flag;
        FHE.allowThis(_encryptedFlags[msg.sender]); // REQUIRED
        FHE.allow(_encryptedFlags[msg.sender], msg.sender);
    }

    // --------------------------------------------------------
    // Update Shared Encrypted State (Admin Only)
    // --------------------------------------------------------
    function updateSharedState(
        externalEuint32 encryptedNewState,
        bytes calldata inputProof
    ) external onlyOwner {
        euint32 newState = FHE.fromExternal(encryptedNewState, inputProof);
        _encryptedState = newState;
        FHE.allowThis(_encryptedState); // REQUIRED
        FHE.allow(_encryptedState, owner()); // admin can view state

        // TODO: Add ACL grants for other authorized viewers
        emit StateUpdated();
    }

    // --------------------------------------------------------
    // Compute Derived Value (Example Pattern)
    // --------------------------------------------------------
    // Pre-implemented: shows how to handle derived encrypted values
    function addToMyValue(
        externalEuint64 encryptedAddend,
        bytes calldata inputProof
    ) external {
        euint64 addend = FHE.fromExternal(encryptedAddend, inputProof);
        euint64 current = _encryptedValues[msg.sender];

        // Pre-implemented: derived value needs its own ACL grants
        euint64 sum = FHE.add(current, addend);
        FHE.allowThis(sum); // REQUIRED — new handle from FHE.add needs its own grants
        FHE.allow(sum, msg.sender);

        _encryptedValues[msg.sender] = sum;
        // Note: after reassigning, the new value is `sum` — allowThis above covers it

        emit ValueUpdated(msg.sender);
    }

    // --------------------------------------------------------
    // Cross-Contract Pass (Transient ACL Example)
    // --------------------------------------------------------
    // Pre-implemented: shows allowTransient for passing to external contract
    function passToExternalContract(address targetContract) external onlyOwner {
        euint64 value = _encryptedValues[msg.sender];
        // Pre-implemented: transient grant for cross-contract call in this tx
        FHE.allowTransient(value, targetContract);
        // TODO: Call targetContract with value handle
        // IMyContract(targetContract).receiveValue(value);
    }

    // --------------------------------------------------------
    // Read Functions (return handles — callers decrypt off-chain)
    // --------------------------------------------------------
    // Pre-implemented: view functions return handles, not decrypted values
    function getMyValue() external view returns (euint64) {
        // ACL: msg.sender must have FHE.allow(_encryptedValues[msg.sender], msg.sender)
        return _encryptedValues[msg.sender];
    }

    function getSharedState() external view returns (euint32) {
        return _encryptedState;
    }

    function getMyFlag() external view returns (ebool) {
        return _encryptedFlags[msg.sender];
    }

    // --------------------------------------------------------
    // TODO: Add contract-specific business logic below
    // --------------------------------------------------------
}
