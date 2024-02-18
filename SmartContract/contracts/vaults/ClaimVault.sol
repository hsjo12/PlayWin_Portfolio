// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
/// @title ClaimVault
/// @author Daehwan Cho
/// @notice The ClaimVault keeps the prize from lottery.
contract ClaimVault is AccessControl {
    
    /// Constant
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 

    /// Immutable
    IERC20 public immutable FUSDT;

    /// @param _fusdt The address of FUSDT
    constructor(IERC20 _fusdt){
        FUSDT = _fusdt;
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Transfer the amount of prize to winner
    /// @dev This function will be executed by the claim function in Lottery.sol 
    /// @param _winner The address of a winner.
    /// @param _amount The amount of FUSDT.
    function transferFUSDT(
        address _winner,
        uint256 _amount
    )
        external 
        onlyRole(MANAGER)
    {
        FUSDT.transfer(_winner, _amount);  
    }

    /// @notice Return the balance of FUSDT 
    /// @return balance the balance of FUSDT
    function getCurrentFUSDTBalance() external view returns(uint256) {
        return FUSDT.balanceOf(address(this));
    }

}
