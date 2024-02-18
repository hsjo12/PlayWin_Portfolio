//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface IRewardVault {
    function totalRewardByRound(uint256) external view returns(uint256);
    function transferFUSDT(address _receiver, uint256 _amount) external;
    function saveReward(
        uint256 _round, 
        uint256 _amount
    ) 
        external; 
}