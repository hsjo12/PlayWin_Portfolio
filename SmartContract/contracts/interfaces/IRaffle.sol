//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface IRaffle {
    function getHeadId() external returns (uint256);
    function getHeadDeadline() external view returns (uint256);
    function listLength() external view returns (uint256); 
    function announce(uint256 _raffleId, uint256 _winningNumber) external; 
    function totalEntriesByRound(uint256 _round) external view returns (uint256);
}