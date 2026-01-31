// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DailyRewardClaim
 * @notice Distributes flat daily USDC rewards (NO STREAK BONUS)
 * @dev Start small: 0.001 USDC per claim, max $100 in contract
 */
contract DailyRewardClaim is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable usdcToken;
    
    // Flat reward - no bonuses
    uint256 public constant REWARD_AMOUNT = 1000; // 0.001 USDC (USDC has 6 decimals)
    uint256 public constant COOLDOWN = 24 hours;
    
    struct UserData {
        uint256 lastClaimTime;
        uint256 totalClaimed;
    }
    
    mapping(address => UserData) public users;
    
    // Statistics
    uint256 public totalDistributed;
    uint256 public totalUsers;
    
    event RewardClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event ContractFunded(address indexed funder, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    
    constructor(address _usdcToken) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @notice Claim daily flat reward (0.001 USDC)
     * @dev Users can claim once every 24 hours
     */
    function claimDailyReward() external nonReentrant whenNotPaused {
        UserData storage user = users[msg.sender];
        
        // Check cooldown
        require(
            block.timestamp >= user.lastClaimTime + COOLDOWN,
            "Cooldown not finished. Come back tomorrow!"
        );
        
        // Flat reward - no streak calculation
        uint256 reward = REWARD_AMOUNT;
        
        // Check contract balance
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        require(contractBalance >= reward, "Insufficient contract balance");
        
        // Update user state
        if (user.lastClaimTime == 0) {
            totalUsers++; // First claim for this user
        }
        user.lastClaimTime = block.timestamp;
        user.totalClaimed += reward;
        
        // Update global stats
        totalDistributed += reward;
        
        // Transfer USDC
        require(
            usdcToken.transfer(msg.sender, reward),
            "USDC transfer failed"
        );
        
        emit RewardClaimed(msg.sender, reward, block.timestamp);
    }
    
    /**
     * @notice Get user reward data
     * @param _user Address to query
     * @return lastClaim Last claim timestamp
     * @return totalClaimed Total USDC claimed
     * @return nextClaimTime When user can claim next
     * @return canClaimNow Whether user can claim right now
     */
    function getUserData(address _user) external view returns (
        uint256 lastClaim,
        uint256 totalClaimed,
        uint256 nextClaimTime,
        bool canClaimNow
    ) {
        UserData memory user = users[_user];
        lastClaim = user.lastClaimTime;
        totalClaimed = user.totalClaimed;
        nextClaimTime = user.lastClaimTime + COOLDOWN;
        canClaimNow = block.timestamp >= nextClaimTime;
    }
    
    /**
     * @notice Fund contract with USDC (Owner or anyone)
     * @param amount Amount of USDC to deposit (in USDC units - 6 decimals)
     */
    function fundContract(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        emit ContractFunded(msg.sender, amount);
    }
    
    /**
     * @notice Get contract balance
     * @return Balance in USDC units (6 decimals)
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /**
     * @notice Get contract statistics
     * @return distributed Total USDC distributed
     * @return usersCount Total unique users
     * @return balance Current contract balance
     */
    function getStats() external view returns (
        uint256 distributed,
        uint256 usersCount,
        uint256 balance
    ) {
        return (
            totalDistributed,
            totalUsers,
            usdcToken.balanceOf(address(this))
        );
    }
    
    /**
     * @notice Pause contract (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw all USDC (Owner only)
     * @dev Only use in case of critical bug or migration
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        
        require(
            usdcToken.transfer(owner(), balance),
            "USDC transfer failed"
        );
        
        emit EmergencyWithdraw(owner(), balance);
    }
}
