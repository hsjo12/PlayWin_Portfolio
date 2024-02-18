//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "./IAutomationStruct.sol";
interface IAutomationRegistrar2_1 is IAutomationStruct {
    
    function registerUpkeep(
        RegistrationParams calldata requestParams
    ) external returns (uint256);

}