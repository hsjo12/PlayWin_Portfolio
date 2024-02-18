//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface StakingStruct {
    /// @dev RoundInfo is used in a mapping in Staking.sol.
    /// - balance: The staking balance of the user.
    /// - reward: The reward of the user.
    /// - rewardStartingPoint: The starting round of the user to stake USDT.
    /// - lockUp: The lock-up round to withdraw USDT.
    struct StakingInfo {
        uint256 balance;
        uint256 reward;
        uint256 rewardStartingPoint;
        uint256 lockUp;
    }
}