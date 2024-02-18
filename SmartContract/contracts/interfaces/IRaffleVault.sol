//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "../structs/RaffleStructs.sol";
interface IRaffleVault is RaffleStructs {
    
    function sendPrizeToWinner(
        PrizeType _prizeType,
        uint256 _raffleId,
        address _creator,
        address _prize, 
        address _to,
        uint256 _prizeId,
        uint256 _prizeAmount,
        uint256 _lotteryRound
    ) 
        external;
    
    function saveDepositAndPrize(
        uint256 _raffleId,
        address _creator,
        PrizeType _prizeType,
        address _prize,
        uint256 _amount,
        uint256 _prizeId,
        uint256 _depositAmount
    ) 
        external;
    
    function refundDepositAndPrize(
        PrizeType _prizeType,
        uint256 _raffleId,
        address _creator,
        address _prize, 
        uint256 _prizeId,
        uint256 _prizeAmount,
        uint256 _lotteryRound
    )
        external;
    
    function saveEntryFee(
        uint256 _raffleId,
        address _user,
        uint256 _amount
    )
        external; 

    function refundEntryFee(
        uint256 _raffleId,
        address _user
    )
        external; 

}
