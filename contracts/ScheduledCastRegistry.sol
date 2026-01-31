// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScheduledCastRegistry
 * @notice Smart contract for storing Farcaster scheduled cast data onchain on Base
 * @dev This contract allows users to store scheduled cast information on the blockchain
 *      providing transparency and immutability for scheduled posts
 */
contract ScheduledCastRegistry {
    // Struct to store scheduled cast data
    struct ScheduledCast {
        address author;           // Wallet address of the cast author
        bytes32 castId;          // Unique identifier for the cast (keccak256 hash)
        string text;             // Cast content text
        uint256 scheduledTime;   // Unix timestamp when cast should be posted
        string channelId;        // Farcaster channel ID
        uint256 timestamp;       // When it was stored onchain
        bool isPosted;           // Whether the cast has been posted
    }

    // Mapping from castId to ScheduledCast
    mapping(bytes32 => ScheduledCast) public scheduledCasts;
    
    // Mapping from author address to their cast IDs
    mapping(address => bytes32[]) public userCastIds;

    // Events
    event CastScheduled(
        bytes32 indexed castId,
        address indexed author,
        string text,
        uint256 scheduledTime,
        string channelId,
        uint256 timestamp
    );

    event CastPosted(
        bytes32 indexed castId,
        address indexed author,
        uint256 postedAt
    );

    /**
     * @notice Store a new scheduled cast onchain
     * @param _castId Unique identifier for the cast (generated client-side)
     * @param _text Content of the cast
     * @param _scheduledTime Unix timestamp when cast should be posted
     * @param _channelId Farcaster channel ID
     */
    function schedulecast(
        bytes32 _castId,
        string calldata _text,
        uint256 _scheduledTime,
        string calldata _channelId
    ) external {
        require(_castId != bytes32(0), "Invalid cast ID");
        require(bytes(_text).length > 0, "Cast text cannot be empty");
        require(bytes(_text).length <= 320, "Cast text too long");
        require(_scheduledTime > block.timestamp, "Scheduled time must be in the future");
        require(scheduledCasts[_castId].author == address(0), "Cast ID already exists");

        // Store the scheduled cast
        scheduledCasts[_castId] = ScheduledCast({
            author: msg.sender,
            castId: _castId,
            text: _text,
            scheduledTime: _scheduledTime,
            channelId: _channelId,
            timestamp: block.timestamp,
            isPosted: false
        });

        // Add to user's cast IDs
        userCastIds[msg.sender].push(_castId);

        // Emit event
        emit CastScheduled(
            _castId,
            msg.sender,
            _text,
            _scheduledTime,
            _channelId,
            block.timestamp
        );
    }

    /**
     * @notice Mark a scheduled cast as posted
     * @param _castId The cast ID to mark as posted
     */
    function markAsPosted(bytes32 _castId) external {
        ScheduledCast storage cast = scheduledCasts[_castId];
        require(cast.author != address(0), "Cast does not exist");
        require(cast.author == msg.sender, "Not the cast author");
        require(!cast.isPosted, "Cast already marked as posted");

        cast.isPosted = true;

        emit CastPosted(_castId, msg.sender, block.timestamp);
    }

    /**
     * @notice Get scheduled cast details
     * @param _castId The cast ID to query
     * @return ScheduledCast struct with all cast data
     */
    function getCast(bytes32 _castId) external view returns (ScheduledCast memory) {
        require(scheduledCasts[_castId].author != address(0), "Cast does not exist");
        return scheduledCasts[_castId];
    }

    /**
     * @notice Get all cast IDs for a user
     * @param _user The user address to query
     * @return Array of cast IDs
     */
    function getUserCasts(address _user) external view returns (bytes32[] memory) {
        return userCastIds[_user];
    }

    /**
     * @notice Verify if a cast exists and matches the provided data
     * @param _castId The cast ID to verify
     * @param _text Expected cast text
     * @param _scheduledTime Expected scheduled time
     * @return bool True if cast exists and data matches
     */
    function verifyCast(
        bytes32 _castId,
        string calldata _text,
        uint256 _scheduledTime
    ) external view returns (bool) {
        ScheduledCast memory cast = scheduledCasts[_castId];
        
        if (cast.author == address(0)) {
            return false;
        }

        return (
            keccak256(bytes(cast.text)) == keccak256(bytes(_text)) &&
            cast.scheduledTime == _scheduledTime
        );
    }

    /**
     * @notice Get total number of casts scheduled by a user
     * @param _user The user address to query
     * @return uint256 Total number of scheduled casts
     */
    function getUserCastCount(address _user) external view returns (uint256) {
        return userCastIds[_user].length;
    }
}
