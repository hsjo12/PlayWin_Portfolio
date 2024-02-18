//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "./interfaces/IAutomationRegistrar2_1.sol";
import "../interfaces/IRaffle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RaffleUpkeep
/// @author Daehwan Cho
/// @notice RaffleUpkeep works to draw a winner for raffles using Chainlink's VRF.
contract RaffleUpkeep is  AutomationCompatible, VRFConsumerBaseV2, Ownable  {
    
    /// Constants
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    /// Immutables
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    IRaffle public immutable raffle;
    bytes32 private immutable gasLane;
    uint32 private immutable callbackGasLimit;
    uint64 public subscriptionId;
    bool public pending;

    /// @param _raffle The address of the raffle contract.
    /// @param _vrfCoordinator The address of the Chainlink VRF coordinator.
    /// @param _gasLane The Chainlink gas lane.
    /// @param _callbackGasLimit The gas limit that UpKeep can spend.
    /// @param _owner The address of an admin.
    constructor(
        IRaffle _raffle,
        address _vrfCoordinator,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        address _owner
    )   VRFConsumerBaseV2(_vrfCoordinator)
        Ownable(_owner) 
    {
        raffle = _raffle;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        gasLane = _gasLane;
        callbackGasLimit = _callbackGasLimit;
    }

    /// @notice Allows an admin to set the VRF subscription ID.
    /// @param _subscriptionId The VRF subscription ID.
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /// @notice It will check if the earliest deadline of a raffle has passed; if it has, it will execute performUpkeep.
    function checkUpkeep(
        bytes calldata /* checkData */ /// Not used
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        if(raffle.listLength() != 0 &&  !pending) {
            upkeepNeeded = raffle.getHeadDeadline() <= block.timestamp;
        }
       
    }

    /// @notice Once the raffle time has passed, it executes the VRF to generate a random number, selects a winner of the raffle based on the random number, and removes the raffle from the sorted raffle list.
    function performUpkeep(bytes calldata /* performData */) external override {
        
        /// Delete the eariest deadline of the raffle
        if( raffle.listLength() != 0 && raffle.getHeadDeadline() <= block.timestamp) {
          // To avoid to call performUpkeep again before random value is generated. 
          pending = true;  
          /// VRF
          vrfCoordinator.requestRandomWords(
                gasLane,
                subscriptionId,
                REQUEST_CONFIRMATIONS,
                callbackGasLimit,
                NUM_WORDS
            );
   
        }
    }
    
    /// @notice Once the VRF is requested to generate random numbers, this function will be executed to send the random number.
    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal override {
      
        /// Remove 
        uint256 earliestRaffleId = raffle.getHeadId();
        
       
        uint256 randomWinningNum;

        /// If nobody joinned a raffle, the winning number would be 0 to avoid the division error
        /// Otherwise,  random numbers from VRF % total entries by round
        if(raffle.totalEntriesByRound(earliestRaffleId) != 0) {
            randomWinningNum = randomWords[0] % raffle.totalEntriesByRound(earliestRaffleId);
        }

        /// Announce the winner of raffle
        raffle.announce(earliestRaffleId, randomWinningNum);
        
        /// performUpkeep can be called again
        pending = false;  
        
    }

}