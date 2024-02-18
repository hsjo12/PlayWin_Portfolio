// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "../structs/RaffleStructs.sol";
import "../interfaces/IRewardVault.sol";
/// @title RaffleVault
/// @author Daehwan Cho
/// @notice The RaffleVault holds the raffle prize, deposits, and entry fees from participants.
///         When the raffle is finished, these assets will be transferred out.
contract RaffleVault is AccessControl, RaffleStructs, IERC721Receiver, ERC1155Holder {
    
    /// Constants
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 
    uint256 public constant BPS = 10_000; 
    
    /// Immutables
    IERC20 public immutable FUSDT;
    address public teamVault;
    address public rewardVault;

    /// Errors
    error InsufficientBalance();
    error OnlyOnce();
    
    /// Events
    event DepositPrize(address indexed creator, PrizeType indexed prizeType, uint256 id, address prize, uint256 prizeAmount, uint256 _prizeId);
    event DepositEntryFee(address indexed user, uint256 indexed raffleId, uint256 amount);
    event RefundEntryFee(address indexed user, uint256 indexed raffleId, uint256 amount);
    event Claim(address indexed winner, PrizeType indexed prizeType, address prize, uint256 prizeId, uint256 prizeAmount);
    event CollectFee(address indexed creator, uint256 indexed raffleId, uint256 amount);
    event RefundPrize(address indexed creator, PrizeType indexed prizeType, address prize, uint256 prizeId, uint256 prizeAmount, uint256 deposit);

    /// Variables
    /// raffle ID => prizeInfo
    mapping(uint256 => prizeInfo) public prizeInfoByRaffleId;
    /// raffle ID => RaffleFundInfo
    mapping(uint256 => RaffleFundInfo) private raffleFundInfo;
    TaxInfo public taxInfo;

    /// @param _fusdt The address of FUSDT
    /// @param _teamVault The address of teamVault
    /// @param _rewardVault The addres pf rewardVault;
    constructor(
        IERC20 _fusdt,
        address _teamVault,
        address _rewardVault
    ) 
    {
        FUSDT = _fusdt;
        teamVault = _teamVault;
        rewardVault = _rewardVault;
        /// 500 == 5%, 250 == 2.5% 
        taxInfo = TaxInfo(500, 500, 250, 250); 
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Transfers the prize to a winner.
    /// @dev This function is executed within the claim function in Raffle.sol.
    ///      5% of total sales will be allocated to the claim vault, which will then increase the reward rate corresponding to the lottery rate.
    ///      Another 5% of total sales will go to the team vault.
    /// @param _prizeType The type of prize.
    /// @param _raffleId The ID of the raffle.
    /// @param _creator The address of the raffle creator, who will receive 90% of total sales.
    /// @param _prize The address of the raffle prize to be sent to the winner.
    /// @param _to The address of the raffle winner.
    /// @param _prizeId The ID of the prize (if it is ERC721 or ERC1155).
    /// @param _prizeAmount The amount of the prize.
    /// @param _lotteryRound The current lottery round.
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
        external 
        onlyRole(MANAGER)
    {
        RaffleFundInfo storage _raffleFundInfo = raffleFundInfo[_raffleId];
        if(_raffleFundInfo.isPrizeMoved) revert OnlyOnce();
        _raffleFundInfo.isPrizeMoved = true;
        uint256 totalEntryFee = _raffleFundInfo.totalEntryFee;
        (uint256 _toTeamVault, uint256 _toRewardVault, uint256 _toCreator) = calculator(totalEntryFee, taxInfo.teamTaxForSuccess, taxInfo.rewardTaxForSuccess);
        /// Add deposit fee
        _toCreator +=  _raffleFundInfo.FUSDTDeposit;
        
        /// Currently 5% of total sales goes to the team vaut
        FUSDT.transfer(teamVault, _toTeamVault);  
    
        /// Currently 5% of total sales goes to the reward vaut
        FUSDT.transfer(rewardVault, _toRewardVault);  
        IRewardVault(rewardVault).saveReward(_lotteryRound, _toRewardVault);
        /// 90% of total profit + deposit goes to the raffle creator
        FUSDT.transfer(_creator, _toCreator);  

        /// Send the prize to the winner 
        prizeTransfer(uint8(_prizeType), _prize,  _to, _prizeId, _prizeAmount);
        emit Claim(_to, _prizeType, _prize, _prizeId, _prizeAmount);
        emit CollectFee(_creator, _raffleId, _toCreator);
    }

    /// @notice Saves the amount of deposit and prize when a raffle is created.
    /// @dev It will be executed in the create function in Raffle.sol
    /// @param _raffleId The ID of the raffle.
    /// @param _creator The address of the raffle creator.
    /// @param _prizeType The type of prize.
    /// @param _prize The address of the raffle prize.
    /// @param _prizeAmount The amount of the prize.
    /// @param _prizeId The ID of the prize (if it is ERC721 or ERC1155).
    /// @param _depositAmount The amount of deposit to create a raffle.
    function saveDepositAndPrize(
        uint256 _raffleId,
        address _creator,
        PrizeType _prizeType,
        address _prize,
        uint256 _prizeAmount,
        uint256 _prizeId,
        uint256 _depositAmount
    ) 
        external 
        onlyRole(MANAGER)
    {   
        RaffleFundInfo storage _raffleFundInfo = raffleFundInfo[_raffleId];
        /// Save deposit 10 FUSDT as a raffle deposit 
        _raffleFundInfo.FUSDTDeposit +=  _depositAmount;
        /// Save the prize
        prizeInfoByRaffleId[_raffleId] = prizeInfo(_creator, _prizeType, _prize, _prizeAmount, _prizeId);
        emit DepositPrize( _creator, _prizeType, _raffleId, _prize, _prizeAmount, _prizeId);
    }

    /// @notice Sends back the prize and 95% of the deposit to a raffle creator when a raffle is created.
    /// @dev This function is executed via the Chainlink Upkeep when the raffle time is completed.
    /// 5% of the deposit will be equally distributed between the reward and team vaults, with each receiving 2.5%.
    /// @param _prizeType The type of prize.
    /// @param _raffleId The ID of the raffle.
    /// @param _creator The address of the raffle creator.
    /// @param _prize The address of the raffle prize.
    /// @param _prizeId The ID of the prize (if it is ERC721 or ERC1155).
    /// @param _prizeAmount The amount of the prize.
    /// @param _lotteryRound The current lottery round.
    function refundDepositAndPrize(
        PrizeType _prizeType,
        uint256 _raffleId,
        address _creator,
        address _prize, 
        uint256 _prizeId,
        uint256 _prizeAmount,
        uint256 _lotteryRound
    )
        external 
        onlyRole(MANAGER)
    {
        RaffleFundInfo storage _raffleFundInfo = raffleFundInfo[_raffleId];
        if(_raffleFundInfo.isPrizeMoved) revert OnlyOnce();
        _raffleFundInfo.isPrizeMoved = true;
        /// Send back the deposit and prize to a user 
        uint256 deposit = _raffleFundInfo.FUSDTDeposit;

        /// However, there is a penalty that deposit will be deducted by current tax of team and reward taxes (5%).
        (uint256 _toTeamVault, uint256 _toRewardVault, uint256 _toCreator) = calculator(deposit, taxInfo.teamTaxForCancel, taxInfo.rewardTaxForCancel);
        
        /// Currently 2.5% of total deposit goes to the team vaut
        FUSDT.transfer(teamVault, _toTeamVault); 

        /// Currently 2.5% of total deposit goes to the reward vaut
        FUSDT.transfer(rewardVault, _toRewardVault);  
        IRewardVault(rewardVault).saveReward(_lotteryRound, _toRewardVault);
        /// 95% of total deposit goes to the raffle creator
        FUSDT.transfer(_creator, _toCreator);  

        /// Send the prize to the _creator 
        prizeTransfer(uint8(_prizeType), _prize, _creator, _prizeId, _prizeAmount);
        emit RefundPrize(_creator, _prizeType, _prize, _prizeId, _prizeAmount, _toCreator);
    }


    /// @notice Transfers the entry fees purchased by users as a refund.
    /// @dev This function is executed in the refundEntryFee function in Raffle.sol.
    /// @param _raffleId The ID of the raffle to claim a refund.
    /// @param _user The address of the user requesting a refund.
    function refundEntryFee(
        uint256 _raffleId,
        address _user
    )
        external 
        onlyRole(MANAGER) 
    {
        RaffleFundInfo storage _raffleFundInfo = raffleFundInfo[_raffleId];
        if(_raffleFundInfo.refundTakenByUser[_user]) revert OnlyOnce();
        _raffleFundInfo.refundTakenByUser[_user] = true;
        uint256 balance = _raffleFundInfo.userEntryFee[_user];
        FUSDT.transfer(_user, balance);  
        emit RefundEntryFee(_user, _raffleId, balance);
    }

    /// @notice Saves the entry fees.
    /// @dev This function is executed in the join function in Raffle.sol.
    /// @param _raffleId The ID of the raffle for users to join.
    /// @param _user The address of the participant.
    /// @param _amount The amount of entry tickets.
    function saveEntryFee(
        uint256 _raffleId,
        address _user,
        uint256 _amount
    ) 
        external 
        onlyRole(MANAGER)
    {
        RaffleFundInfo storage _raffleFundInfo = raffleFundInfo[_raffleId];
        _raffleFundInfo.totalEntryFee += _amount;
        _raffleFundInfo.userEntryFee[_user]  += _amount;
        emit DepositEntryFee(_user, _raffleId, _amount);
    }

    /// @notice Allows the admin to set up taxinfo 
    /// @param _taxInfo The parameter explained in RaffleStruct.sol.
    function setTaxes(TaxInfo calldata _taxInfo) external onlyRole(MANAGER) {
        taxInfo = _taxInfo;
    }

    /// @notice Allows the admin to set up the team vault. 
    /// @param _teamVault The address of the team vault.
    function setTeamVault(address _teamVault) external onlyRole(MANAGER) {
        teamVault = _teamVault;
    }

    /// @notice Allows the admin to set up the reward vault. 
    /// @param _rewardVault The address of the reward vault.
    function setRewardVault(address _rewardVault) external onlyRole(MANAGER) {
        rewardVault = _rewardVault;
    }
    
    /// @notice Split total raffle sales or deposit between the creator, teamVault, and rewardVault.
    /// @param _amount Total raffle sales or deposit.
    /// @param _teamTax The share of the team vault based on BPS (1% == 100).
    /// @param _rewardTax The share of the reward vault based on BPS (1% == 100).
    /// @return _toTeamVault The share allocated to the team vault.
    /// @return _toRewardVault The share allocated to the reward vault.
    /// @return _toCreator The share allocated to the creator.
    function calculator(
        uint256 _amount,
        uint256 _teamTax,
        uint256 _rewardTax
    ) 
        private
        pure
        returns(
            uint256 _toTeamVault,
            uint256 _toRewardVault,
            uint256 _toCreator
        )
    {
        _toTeamVault = (_amount * _teamTax) / BPS;
        _toRewardVault = (_amount * _rewardTax) / BPS;
        _toCreator = _amount - _toTeamVault - _toRewardVault;
    } 

    /// @notice Transfers a prize based on the prize type.
    /// @param _prize The prize token address.
    /// @param _to The receiver.
    /// @param _prizeId The prize ID to be sent.
    /// @param _prizeAmount The amount of prize to be sent.
    function prizeTransfer(
        uint8 _prizeType,
        address _prize, 
        address _to, 
        uint256 _prizeId,
        uint256 _prizeAmount

    )   
        private
    {
        if(_prizeType == 0) {
            //slither-disable-next-line arbitrary-send per
            IERC20(_prize).transfer(_to, _prizeAmount);
        } else if(_prizeType == 1) {
            IERC721(_prize).safeTransferFrom(address(this), _to, _prizeId);
        } else{
            IERC1155(_prize).safeTransferFrom(address(this), _to, _prizeId, _prizeAmount,"");
        }
    }

    /// @notice Returns the total entry fee corresponding to a raffle ID.
    /// @param _raffleId The ID of the raffle to view the total entry fee.
    /// @return totalEntryFee The amount of entry fee.
    function getTotalEntryFeeByRaffleId(
        uint256 _raffleId
    ) 
        external 
        view 
        returns (uint256) 
    {
        return raffleFundInfo[_raffleId].totalEntryFee;
    }

    /// @notice Returns the amount of deposit corresponding to a raffle ID.
    /// @param _raffleId The ID of the raffle to view the amount of deposit.
    /// @return deposit The amount of deposit.
    function getFUSDTDepositByRaffleId(
        uint256 _raffleId
    ) 
        external 
        view 
        returns (uint256) 
    {
        return raffleFundInfo[_raffleId].FUSDTDeposit;
    }

    /// @notice Returns the total entry fee spent by a user on a specific raffle.
    /// @param _raffleId The ID of the raffle.
    /// @return usertotalEntryFee The amount of user entry fee.
    function getUserEntryFeeByRaffleId(
        uint256 _raffleId,
        address _user
    ) 
        external 
        view 
        returns (uint256) 
    {
        return raffleFundInfo[_raffleId].userEntryFee[_user];
    }

    /// @notice Returns the status of a user's refund claim.
    /// @param _raffleId The ID of the raffle.
    /// @param _user The address of the user claiming a refund.
    /// @return isClaimed The status of the user's refund claim.
    function getRefundTakenByUser(
        uint256 _raffleId,
        address _user
    ) 
        external 
        view 
        returns (bool) 
    {
        return raffleFundInfo[_raffleId].refundTakenByUser[_user];
    }

    /// @notice Returns the status of a prize being moved.
    /// @param _raffleId The ID of the raffle.
    /// @return isMoved The status indicating if the prize has been moved.
    function getIsPrizeMoved(
        uint256 _raffleId
    ) 
        external 
        view 
        returns (bool) 
    {
        return raffleFundInfo[_raffleId].isPrizeMoved;
    }

        /// @notice To receive ERC721, it is required.
        function onERC721Received(
            address,
            address,
            uint256,
            bytes calldata 
        ) external returns (bytes4) {
            return this.onERC721Received.selector;
        }
    
        function supportsInterface(bytes4 interfaceId) 
            public 
            view 
            virtual 
            override(
                AccessControl,
                ERC1155Holder
            ) 
            returns (bool) 
        {
            return super.supportsInterface(interfaceId);
        }
    
}

