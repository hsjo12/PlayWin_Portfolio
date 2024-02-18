//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface IClaimVault {
    function transferFUSDT(address _receiver, uint256 _amount) external;
}