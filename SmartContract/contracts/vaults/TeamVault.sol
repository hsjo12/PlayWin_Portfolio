// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// @title TeamVault
/// @author Daehwan Cho
/// @notice The TeamVault keeps some amount of FUSDT from raffle, lottery, and AAVE staking rewards.
contract TeamVault is Ownable {
     
    /// Immutables
    IERC20 public immutable FUSDT;

    /// Eventss
    event Withdraw(address indexed receiver, uint256 amount);

    /// @param _fusdt The address of FUSDT
    constructor(IERC20 _fusdt, address _owner) Ownable(_owner) {
        FUSDT = _fusdt;
    }

    /// @notice Allows the admin to withdraw FUSDT or any tokens.
    /// @param _receiver The address of the receiver.
    function withdraw(
        address _receiver
    ) 
        external 
        onlyOwner
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

}
