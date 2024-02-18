// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// @title FirstPlacePrizeVault
/// @author Daehwan Cho
/// @notice The FirstPlacePrizeVault holds the first-place prize in FUSDT sourced from a team fund.
contract FirstPlacePrizeVault is AccessControl {
     
    /// Constant
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 

    /// Immutable
    IERC20 public immutable FUSDT;
    address public claimVault;
    /// Events
    event Withdraw(address indexed receiver, uint256 amount);
    
    /// @param _fusdt The address of FUSDT
    /// @param _claimVault The address of ClaimVault
    constructor(IERC20 _fusdt, address _claimVault){
        FUSDT = _fusdt;
        claimVault = _claimVault;
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Allows the admin to Withdraw FUSDT 
    /// @param _receiver the address of a receiver 
    function withdraw(
        address _receiver
    ) 
        external 
        onlyRole(MANAGER)
    {
        uint256 balance = FUSDT.balanceOf(address(this));
        FUSDT.transfer(_receiver, balance);    
        emit Withdraw(_receiver, balance);   
    }

    /// @notice Return the balance of FUSDT 
    /// @return balance the balance of FUSDT
    function getCurrentFUSDTBalance() external view returns(uint256) {
        return FUSDT.balanceOf(address(this));
    }

    /// @notice Transfer the amount of prize to winner
    /// @dev This function will be executed by the claim function in Lottery.sol 
    function sendFirstPlacePrizeSourcedFromTeam(
        uint256 _amount
    ) 
        external 
        onlyRole(MANAGER) 
    {
        FUSDT.transfer(claimVault, _amount);
    }

    /// @notice Allows the admin set the address of claimVault
    /// @param _claimVault thea address of claimVault.
    function setClaimVault(address _claimVault) external onlyRole(MANAGER) {
        claimVault = _claimVault;
    }

}
