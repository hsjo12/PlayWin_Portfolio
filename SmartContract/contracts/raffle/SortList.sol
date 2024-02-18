// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title SortList
/// @author Daehwan Cho
/// @notice SortList helps to order raffles by their deadlines.
/// @dev SortList is a linked list, and the GUARD_ID(0) has the first index node.
contract SortList is AccessControl{
    
    /// Constants
    uint256 public constant GUARD_ID = 0;
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 
    
    /// Errors
    error EmptyInTheList();
    error ToMustBeGreaterThanFrom();
    error NonExisistence();

    /// Events
    event Add(uint256 indexed raffleId, uint256 deadline, uint256 listLength);
    event Remove(uint256 indexed raffleId, uint256 deadline, uint256 listLength);

    /// Structs
    struct Node{
        uint256 deadline;
        uint256 raffleId;
        uint256 nextRaffleId;
    }

    /// Variables
    mapping(uint256 => Node) public raffleList;
    uint256 public listLength;

    constructor() {
        raffleList[GUARD_ID] = Node(0, 0, GUARD_ID);
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Adds a raffle in its earliest deadline order.
    /// @param _raffleId The ID of the raffle to be added to the list.
    /// @param _deadline The deadline of the raffle ID.
    function addList(
        uint256 _raffleId,  
        uint256 _deadline
    ) 
        external 
        onlyRole(MANAGER)
    {
        _addList(_raffleId, _deadline);
    }

    /// @notice Adds a raffle in its earliest deadline order.
    /// @dev The _findRightBeforeRaffleId function finds the correct index by comparing the deadlines of other raffles.
    /// @param _raffleId The ID of the raffle to be added to the list.
    /// @param _deadline The deadline of the raffle ID.
    function _addList(uint256 _raffleId,  uint256 _deadline) internal {
        uint256 rightBeforeRaffleId = _findRightBeforeRaffleId(_deadline);
        raffleList[_raffleId] = Node(_deadline, _raffleId, raffleList[rightBeforeRaffleId].nextRaffleId);
        raffleList[rightBeforeRaffleId].nextRaffleId = _raffleId;
        listLength++;
        emit Add(_raffleId, _deadline, listLength);
    }

    /// @notice Removes a raffle with the earliest deadline.
    function removeHead() public onlyRole(MANAGER) {
        if(listLength == 0) revert EmptyInTheList();
        uint256 raffleHeadId = raffleList[GUARD_ID].nextRaffleId;
        uint256 deadline = raffleList[raffleHeadId].deadline;
        uint256 prevIndex = GUARD_ID; /// Always 0 which is GUARD_ID
        raffleList[prevIndex].nextRaffleId = raffleList[raffleHeadId].nextRaffleId;
        delete raffleList[raffleHeadId];
        listLength--;
        emit Remove(raffleHeadId, deadline, listLength);
    }

    /// @notice Iterates the list to compare the existing raffles' deadlines with the new raffle's deadline to find the correct index.
    /// @param _newAddedDeadline The new raffle's deadline.
    /// @return index An index of the sorted raffle list.
    function _findRightBeforeRaffleId(uint256 _newAddedDeadline) private view returns(uint256) {
        uint256 currentId = GUARD_ID;
        while(true) {
            if(
                (GUARD_ID == currentId || _newAddedDeadline >= raffleList[currentId].deadline) &&
                (GUARD_ID == raffleList[currentId].nextRaffleId || _newAddedDeadline < raffleList[raffleList[currentId].nextRaffleId].deadline) 
            ){
                return currentId;
            }
            currentId =  raffleList[currentId].nextRaffleId;
        }
        return GUARD_ID;
    }

    /// @notice Returns the index of the raffle ID in the sorted raffle list.
    /// @param _raffleId The ID of the raffle to search for.
    /// @return index The index of the raffle ID in the sorted raffle list.
    function findIndex(uint256 _raffleId) external view returns(uint256) {
        /// raffle id cannot be existed 
        if(raffleList[_raffleId].raffleId == 0) revert NonExisistence();
        uint256 currentId = GUARD_ID;
        uint256 index;
            while(true) {
            // raffleList[GUARD_ID] is not supposed to be counted.
            if(raffleList[currentId].nextRaffleId == _raffleId){
                break;
            }
            currentId =  raffleList[currentId].nextRaffleId;
            index++;
        }
        return index;
    }

    /// @notice Returns All the raffle ids in the list.
    /// @dev The sorted list is linked list, and the GUARD_ID has the first index.
    ///      So the GUARD_ID node's next raffle id is the first index.  
    /// @return _nodeList The sorted raffle list.
    function getListAll() external view returns (Node[] memory _nodeList) {
         _nodeList = new Node[](listLength);
        uint256 currentId = raffleList[GUARD_ID].nextRaffleId;
        for(uint256 i; i < listLength; i++) {
            _nodeList[i] = raffleList[currentId];
            currentId = raffleList[currentId].nextRaffleId;
        }
    }

    /// @notice Returns the raffle IDs in the list.
    /// @param _prevStartingRaffleId The starting raffle ID linked from the previous raffle ID.
    /// @param _size The offset indicating the number of raffle IDs to fetch.
    /// @return _nodeList A list of raffle IDs.
    function getList(
        uint256 _prevStartingRaffleId, // starting raffle id
        uint256 _size
    ) 
        external 
        view 
        returns (Node[] memory _nodeList) 
    {
        /// If _prevStartingRaffleId does not exist, an error will occur. This error will be caught, and an empty array [] will be returned.
        try this.findIndex(raffleList[_prevStartingRaffleId].nextRaffleId) returns (uint256 _fromIndex) {
            _size = listLength > _size + _fromIndex ? _size : listLength - _fromIndex;
            _nodeList = new Node[](_size);

            uint256 currentId = raffleList[_prevStartingRaffleId].nextRaffleId;
            for(uint256 i; i < _size; i++) {
                _nodeList[i] = raffleList[currentId];
                currentId = raffleList[currentId].nextRaffleId;
            }
        } catch {
            return _nodeList;
        }

   }

    /// @notice Returns the earliest deadline.
    /// @return earliestRaffleDeadline The deadline of the first index in the list.
    function getHeadDeadline() external view returns (uint256) {
        uint256 headId = raffleList[GUARD_ID].nextRaffleId;
        return raffleList[headId].deadline;
    }

    /// @notice Returns the raffle ID of the first index in the list.
    /// @return earliestRaffleDeadline The raffle ID of the first index in the list.
    function getHeadId() external view returns (uint256) {
        return raffleList[GUARD_ID].nextRaffleId;
    }

}

