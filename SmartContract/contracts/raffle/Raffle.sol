//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./SortList.sol";
import "../structs/RaffleStructs.sol";
import "../interfaces/IRaffleVault.sol";
import "../interfaces/ILottery.sol";

/// @title Raffle
/// @author Daehwan Cho
/// @notice The raffle provides a platform where users can create and participate in raffles. 
///         Prizes are available only in ERC20, ERC721, and ERC1155 formats.
/// @dev Raffle is inherited from SortList, which sorts the raffles by their deadlines.
///      Additionally, the winning number will be generated by Chainlink's VRF, and 
///      ChainLink's UpKeep will execute the announce function to store the winner when each raffle ends.
contract Raffle is RaffleStructs, SortList{

    /// Constant
    uint256 public constant MAX_OF_ENTRIES = 200;

    /// Immutable
    IERC20 public immutable FUSDT;
    IRaffleVault public immutable raffleVault;
    ILottery public immutable lottery;

    /// Errors
    error MalformedParams();
    error NonExistence();
    error InCorrectToken();
    error OverMaxEntries();
    error RaffleOver();
    error OutOfPersonalEntries();
    error OutOfRaffleEntries();
    error RaffleStillOn();
    error AlreadyAnnounced();

    /// Events
    event Create(
        uint256 indexed raffleId, 
        address indexed creator, 
        PrizeType indexed prizeType, 
        uint256 deadline, 
        address prize, 
        uint256 prizeId,
        uint256 prizeAmount,
        uint256 blockNumber
    );
    event Join(uint256 indexed raffleId, address indexed user, uint256 _entries);
    event Announce(uint256 indexed raffleId, address indexed winner, Status indexed status);
    
    /// Vatiables
    uint256 public depositAmount = 10 * 10 ** 6; // 10 FUSDT
    /// Id => RaffleInfo
    mapping(uint256 => RaffleInfo) public raffleInfo;
    /// user => userInfo
    mapping(address=> UserInfo) private userInfo;
    /// Id => Block number : stack too deep
    mapping(uint256 => uint256) public blockNumberByRaffleId;
    /// Raffle Id => User Address
    mapping(uint256 => address[]) public userEntryListByRaffle;
    /// The ids of cancled or finished raffles
    uint256[] public inActiveRaffleList; 
    uint256 private raffleId;
    

    /// @param _fusdt The address of fusdt
    /// @param _raffleVault The address of rafffle vault
    /// @param _lottery The address of lottery
    constructor(
        IERC20 _fusdt,
        IRaffleVault _raffleVault,
        ILottery _lottery
    ) {
        FUSDT = _fusdt;
        raffleVault = _raffleVault;
        lottery = _lottery;
        raffleId = 1;
    }

    /// @notice Returns the latest id of created raffles.
    /// @return latestRaffleId is the latest raffle id.
    function currentId() external view returns(uint256) {
        if(raffleId == 1) revert NonExistence();
        return raffleId - 1;
    }

    /// @notice Allows users to create a raffle.
    /// @dev Only ERC20, ERC721, and ERC1155 tokens are supported.
    ///      Parameters in the RaffleInfo struct (winner, winning number, and total entries) must be initially zero.
    ///      When the raffle prize is ERC20, the prize ID must be 0 since ERC20 tokens do not have token IDs.
    ///      At least 10 FUSDT tokens must be approved for the address of this contract.
    /// @param _param The RaffleInfo struct containing raffle details.
    function create(RaffleInfo memory _param) external {
        
        if(!validateTokens(_param.prizeType, _param.prize)) revert InCorrectToken();

        if(_param.prizeAmount < 1
           || _param.deadline < block.timestamp
           || _param.minRaffleEntries > _param.maxRaffleEntries
           || _param.minEntriesPerUser > _param.maxEntriesPerUser 
           || _param.creator == address(0)
           || _param.creator != msg.sender
           || _param.winner != address(0)
           || _param.winningEntryNumber != 0
           ||_param.totalEntries != 0
        ) 
        {
            revert MalformedParams();
        }
        
        /// The amount of an ERC721 prize must be 1.  
        if(_param.prizeType == PrizeType(1) && _param.prizeAmount != 1) {
            revert MalformedParams();
        }

        FUSDT.transferFrom(msg.sender, address(raffleVault), depositAmount);
        prizeTransfer(uint8(_param.prizeType), _param.prize, msg.sender, address(raffleVault), _param.prizeId, _param.prizeAmount);
        raffleInfo[raffleId] = _param;
        raffleInfo[raffleId].maxRaffleEntries > MAX_OF_ENTRIES ? MAX_OF_ENTRIES : raffleInfo[raffleId].maxRaffleEntries;
        blockNumberByRaffleId[raffleId] = block.number;
        raffleVault.saveDepositAndPrize(raffleId, _param.creator,  _param.prizeType, _param.prize, _param.prizeAmount, _param.prizeId, depositAmount);
     
        /// Put a raffle into the list sorted by its deadline 
        _addList(raffleId, _param.deadline);

        /// Store a raffle id into user info
        userInfo[msg.sender].createdRaffleList.push(raffleId);

        emit Create(raffleId++, msg.sender, _param.prizeType, _param.deadline, _param.prize, _param.prizeId, _param.prizeAmount, block.number);
    }

    /// @notice Allows users to join a raffle.
    /// @param _raffleId The ID of the raffle users are willing to join.
    /// @param _entries The number of entries users are willing to join.
    /// @dev FUSDT is approved for as much as the total entries price.
    function join(uint256 _raffleId, uint256 _entries) external {
        
        if(MAX_OF_ENTRIES < _entries) revert OverMaxEntries();
        UserInfo storage targetUserInfo = userInfo[msg.sender];
        RaffleInfo storage targetRaffleInfo = raffleInfo[_raffleId];
        address[] storage targetUserEntryList = userEntryListByRaffle[_raffleId];
        uint256 totalPrice = targetRaffleInfo.entryPrice * _entries;
        uint256 _targetUserEntryCounter = targetUserInfo.entryCounterByRaffle[_raffleId];
        
        /// Check if raffle is on
        if(targetRaffleInfo.deadline < block.timestamp || targetRaffleInfo.status != Status.Pending) revert RaffleOver();

        /// Check if it is out of raffle entries per game
        if(targetRaffleInfo.maxRaffleEntries < targetRaffleInfo.totalEntries + _entries) revert OutOfRaffleEntries();
        
        /// Check if it is out of raffle entries per user
        if(targetRaffleInfo.minEntriesPerUser > _targetUserEntryCounter + _entries 
            || targetRaffleInfo.maxEntriesPerUser < _targetUserEntryCounter + _entries) revert OutOfPersonalEntries();
        
        // Keep track of what raffle user joined
        if(_targetUserEntryCounter == 0) {
            targetUserInfo.joinedRaffleList.push(_raffleId);
        }

        /// Send to RaffleVault
        FUSDT.transferFrom(msg.sender, address(raffleVault), totalPrice);
        raffleVault.saveEntryFee(_raffleId, msg.sender, totalPrice);
        targetUserInfo.entryCounterByRaffle[_raffleId] += _entries;
        targetRaffleInfo.totalEntries += _entries;
        
 
        /// join raffle
        for(uint256 i; i < _entries; i++) {
            targetUserEntryList.push(msg.sender);
        }

        emit Join(_raffleId, msg.sender, _entries);
    }

    /// @notice Allows users to join a raffle.
    /// @param _raffleId The raffle ID with the winner announcement.
    /// @param _winningNumber The winning number indicates the entry number.
    /// @dev It will be executed by Chainlink's Upkeep, using a winning number randomly generated by Chainlink's VRF.
    function announce(
        uint256 _raffleId, 
        uint256 _winningNumber
    ) 
        external 
        onlyRole(MANAGER)
    {
        
        uint256 currentLotteryRound = lottery.round(); 
        RaffleInfo storage targetRaffleInfo = raffleInfo[_raffleId];

        if(targetRaffleInfo.deadline > block.timestamp) revert RaffleStillOn();
        if(targetRaffleInfo.status != Status.Pending) revert AlreadyAnnounced();
        
        address[] storage targetUserEntryList = userEntryListByRaffle[_raffleId];
        uint256 totalNumOfUsers = targetUserEntryList.length;
        address winner;
        /// The raffle will be carried on if the total number of participants is greater than or equal to the minimum number of raffle entreies.
        if(totalNumOfUsers >= targetRaffleInfo.minRaffleEntries) {
            targetRaffleInfo.status = Status.Success;
            winner = targetUserEntryList[_winningNumber];
            targetRaffleInfo.winner = winner;
            targetRaffleInfo.winningEntryNumber = _winningNumber;
            targetRaffleInfo.totalEntries = totalNumOfUsers;
            /// Send a prize to the winner and send Deposit back to and users' entry fee  
            raffleVault.sendPrizeToWinner(targetRaffleInfo.prizeType, _raffleId, targetRaffleInfo.creator, targetRaffleInfo.prize, winner, targetRaffleInfo.prizeId, targetRaffleInfo.prizeAmount, currentLotteryRound);
        }
        /// The raffle will be cancled on if the total number of participants is less than the minimum number of raffle entreies.
        else{
            targetRaffleInfo.status = Status.Canceled;
            /// Send a prize to the winner and send Deposit back to and users' entry fee  
            raffleVault.refundDepositAndPrize(targetRaffleInfo.prizeType, _raffleId, targetRaffleInfo.creator, targetRaffleInfo.prize, targetRaffleInfo.prizeId, targetRaffleInfo.prizeAmount, currentLotteryRound);
        }
        /// Remove the target raffle having the earliest deadline in the list
        removeHead();
        inActiveRaffleList.push(_raffleId);
        emit Announce(_raffleId, winner, targetRaffleInfo.status);
    }   
    
    /// @notice Allows users to claim a refund of the entry fee when the raffle is canceled.
    /// @param _raffleId The raffle ID to request a refund fee.
    /// @dev The raffle can be canceled due to insufficient entries as determined by the raffle creator.
    function refundEntryFee(
        uint256 _raffleId
    ) external {
        raffleVault.refundEntryFee(_raffleId, msg.sender);
    }

    /// @notice Allows the admin to set up the deposit amount required to create a raffle.
    /// @param _depositAmount The amount of deposit to be established.
    function setDeposit(uint256 _depositAmount) external onlyRole(MANAGER) {
        depositAmount = _depositAmount;
    }

    /// @notice Returns the total entries of a raffle with the input ID.
    /// @param _round The round to view the total entries.
    /// @return totalEntries The number of sold entry tickets.
    function totalEntriesByRound(uint256 _round) external view returns (uint256) {
       return userEntryListByRaffle[_round].length;
    }

    /// @notice Returns the total entries of a raffle with the input ID.
    /// @param _user The round to view the total entries.
    /// @return totalEntries The number of sold entry tickets.
    function getUserJoinedRaffleListLength(
        address _user
    ) 
        external 
        view 
        returns (uint256) 
    {
        return userInfo[_user].joinedRaffleList.length; 
    }

    /// @notice Returns the raffle IDs that a user has joined.
    /// @param _user The address to view the raffle IDs joined by an address.
    /// @param _from It indicates the starting index to fetch raffle IDs.
    /// @param _size It indicates the offset to fetch raffle IDs.
    /// @dev Purposely, it does not return all the raffle IDs since it could cause a gas limit exceeded error, typically around 3,000. 
    /// @return raffleIds A list of raffle IDs.
    function getUserJoinedRaffleList(
        address _user,
        uint256 _from, 
        uint256 _size
    ) 
        external 
        view
        returns(uint256[] memory raffleIds) 
    {
        uint256[] storage _userRaffleList = userInfo[_user].joinedRaffleList;
        uint256 _length = _userRaffleList.length;
        if(_from >= _length) return raffleIds;

        _size = _length > _size + _from ? _size : _length - _from;
        raffleIds = new uint256[](_size);
        for(uint256 i; i < _size; i++) {
            raffleIds[i] = _userRaffleList[_from];
            _from++;
        }
    }

    /// @notice Returns the total number of raffles created by an address.
    /// @param _user The address to return the total number of created raffles.
    /// @return totalCreatedRaffles The number of created raffles.
    function getUserCreatedRaffleListLength(
        address _user
    ) 
        external 
        view 
        returns (uint256) 
    {
        return userInfo[_user].createdRaffleList.length; 
    }

    /// @notice Returns the raffle IDs that a user has created.
    /// @param _user The address to view the raffle IDs created by an address.
    /// @param _from It indicates the starting index to fetch raffle IDs.
    /// @param _size It indicates the offset to fetch raffle IDs.
    /// @dev Purposely, it does not return all the raffle IDs since it could cause a gas limit exceeded error, typically around 3,000. 
    /// @return raffleIds A list of raffle IDs.
    function getUserCreatedRaffleList(
        address _user,
        uint256 _from, 
        uint256 _size
    ) 
        external 
        view
        returns(uint256[] memory raffleIds) 
    {
        uint256[] storage _userRaffleList = userInfo[_user].createdRaffleList;
        uint256 _length = _userRaffleList.length;
        if(_from >= _length) return raffleIds;

        _size = _length > _size + _from ? _size : _length - _from;
        raffleIds = new uint256[](_size);
        for(uint256 i; i < _size; i++) {
            raffleIds[i] = _userRaffleList[_from];
            _from++;
        }
    }

    /// @notice Returns the total number of canceled and ended raffles.
    /// @return totalInactiveRaffles The number of inactive raffles.
    function getInactiveRaffleListLength() external view returns (uint256) 
    {
        return inActiveRaffleList.length; 
    }

    /// @notice Returns the inactive raffle IDs that are ended and canceled.
    /// @param _from It indicates the starting index to fetch raffle IDs.
    /// @param _size It indicates the offset to fetch raffle IDs.
    /// @dev Purposely, it does not return all the raffle IDs since it could cause a gas limit exceeded error, typically around 3,000.
    /// @return raffleIds A list of raffle IDs.
    function getInactiveList(
        uint256 _from, 
        uint256 _size
    ) 
        external 
        view 
        returns(uint256[] memory raffleIds) 
    {
        uint256 _length = inActiveRaffleList.length;
        // if from(index) is larger than length, it will return []
        if(_from >= _length) return raffleIds;
        _size = _length > _size + _from ? _size : _length - _from;
        raffleIds = new uint256[](_size);
        for(uint256 i; i < _size; i++) {
            raffleIds[i] = inActiveRaffleList[_from];
            _from++;
        }
    }

    /// @notice Returns the total number of user entries for a specific raffle.
    /// @param _user The address to view the total number of user entries for a specific raffle.
    /// @param _raffleId The raffle ID to view the total number of user entries for a specific raffle.
    /// @return totalUserEntries The number of user entries for a specific raffle.
    function getUserEntryCounterByRaffle(
        address _user,
        uint256 _raffleId
    ) 
        external 
        view 
        returns (uint256) 
    {
        return userInfo[_user].entryCounterByRaffle[_raffleId];
    }

    /// @notice Validates if the prize token is a supported token such as ERC20, ERC721, or ERC1155.
    /// @dev findPrizeType will return prizeType.
    /// @param _prizeType The type of the prize token.
    /// @param _token The address of the prize token.
    /// @return isSupported Returns whether the token is supported as a boolean.
    function validateTokens(
        PrizeType _prizeType, 
        address _token
    ) 
        private 
        view 
        returns(bool) 
    {
        return _prizeType == findPrizeType(_token);
    }

    /// @notice Validates if the prize token is a supported token such as ERC20, ERC721, or ERC1155.
    /// @dev It will use a try-catch statement to check if the prize token implements the standard token interfaces.
    /// @param _token The address of the prize token.
    /// @return _prizeType Returns the prize token type.
    function findPrizeType(
        address _token
    ) 
        public 
        view 
        returns(PrizeType _prizeType) 
    {
        if(!isContract(_token)) return PrizeType.None; 
        if(_token == address(0)) return PrizeType.None;

        /// Check If a prize is ERC1155
        try IERC1155(_token).supportsInterface(0xd9b67a26) returns (bool result) {
            /// the result is true, it is ERC1155
            if(result) return PrizeType.Erc1155;
            /// If not ERC1155
            else{
                /// Check If a prize is ERC721 
                try IERC721(_token).supportsInterface(0x80ac58cd) returns (bool result) {
                    /// the result is true, it is ERC721
                    if(result) return PrizeType.Erc721;
                    /// If not ERC721
                    else{
                        /// Check If the token supportes ERC165  
                        try IERC165(_token).supportsInterface(0x36372b07) returns (bool result) {
                            /// Check If the token has totalSupply function
                            if(result){
                                try IERC20(_token).totalSupply() {
                                    return PrizeType.Erc20;
                                }catch {return PrizeType.None;}   
                            }
                        }catch {return PrizeType.None;}     
                    }
                
                /// When try-case of ERC721 caught an error, it will return none type 
                }catch {return PrizeType.None;}  
            }

           /// When try-case of ERC1155 caught an error, try to check if it is erc20
         } catch {
            /// Check If the token has totalSupply function
            try IERC20(_token).totalSupply() {
                return PrizeType.Erc20;
            }catch {return PrizeType.None;}     
        }     


    }

    /// @notice Validates if the prize token address is a contract address.
    /// @param _prize The prize token address.
    /// @return isContractAddress Returns whether the prize token is a contract address.
    function isContract(address _prize) private view returns (bool) {
        uint size;
        assembly { size := extcodesize(_prize) }
        return size > 0;
      }
    
    /// @notice Transfers a prize based on the prize type.
    /// @param _prize The prize token address.
    /// @param _from The sender.
    /// @param _to The receiver.
    /// @param _prizeId The prize ID to be sent.
    /// @param _prizeAmount The amount of prize to be sent.
    function prizeTransfer(
        uint8 _prizeType,
        address _prize, 
        address _from,
        address _to, 
        uint256 _prizeId,
        uint256 _prizeAmount

    )   
        private
    {
        if(_prizeType == 0) {
            //slither-disable-next-line arbitrary-send per
            IERC20(_prize).transferFrom(_from, _to, _prizeAmount);
        } else if(_prizeType == 1) {
            IERC721(_prize).safeTransferFrom(_from, _to, _prizeId);
        } else{
            IERC1155(_prize).safeTransferFrom(_from, _to, _prizeId, _prizeAmount,"");
        }
    }
}