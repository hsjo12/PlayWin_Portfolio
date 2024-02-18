// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title RewardVault
/// @author Daehwan Cho
/// @notice The RewardVault receives a portion of FUSDT from each round of raffles and lotteries, holding the rewards for staking.
contract RewardVault is AccessControl {
    /// Constants
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 

    /// Immutables
    IERC20 public immutable FUSDT; /// Rewards collected from tickets and compensated for staking users

    /// Vairables
    /// round => reward 
    mapping(uint256 => uint256) public totalRewardByRound;

    /// @param _fusdt The address of FUSDT
    constructor(
        IERC20 _fusdt
    ) {
        FUSDT = _fusdt;
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }


    /// @notice Saves the amount of rewards sourced from raffles and lotteries in each round.
    /// @dev Executed when raffle and lottery contracts send FUSDT.
    /// @param _lotteryRound The round of the lottery.
    /// @param _amount The amount of FUSDT.
    function saveReward(
        uint256 _lotteryRound, 
        uint256 _amount
    ) 
        external 
    {
        totalRewardByRound[_lotteryRound] += _amount;
    }

    /// @notice Transfers the amount of prize to staking users when they claim rewards.
    /// @dev This function is executed by the claim function in Staking.sol.
    /// @param _receiver The address of the user claiming rewards from staking.
    /// @param _amount The amount of FUSDT.
    function transferFUSDT(
        address _receiver,
        uint256 _amount
    )
        external 
        onlyRole(MANAGER)
    {
        FUSDT.transfer(_receiver, _amount);  
    }

    /// @notice Return the balance of FUSDT 
    /// @return balance the balance of FUSDT   
    function getCurrentFUSDTBalance() external view returns(uint256) {
        return FUSDT.balanceOf(address(this));
    }
}
