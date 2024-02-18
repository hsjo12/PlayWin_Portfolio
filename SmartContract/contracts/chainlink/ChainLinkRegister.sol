// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IAutomationStruct.sol";
import "./interfaces/IAutomationRegistrar2_1.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
/// @title RaffleUpkeep
/// @author Daehwan Cho
/// @notice RaffleUpkeep allows admins to register Chainlink's Upkeep for raffles.
contract ChainLinkRegister is IAutomationStruct, AccessControl {

    /// Constants
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 
    
    /// Immuatables 
    IERC20 public immutable LINK;
    IAutomationRegistrar2_1 public immutable REGISTRAR;
    VRFCoordinatorV2Interface public immutable VRF_COORDINATOR;

    /// Variables
    uint64 public vrfSubscriptionId;
    uint256 public upkeepRegisterId;

    /// Errors
    error registerFailure();

    /// @param _link The address of $link
    /// @param _registrar The address of the Chainlink automationRegistrar2.1
    /// @param _registrar The address of the Chainlink VRF coordinator.
    constructor(
        IERC20 _link, 
        IAutomationRegistrar2_1 _registrar,
        VRFCoordinatorV2Interface _vrfCoordinator
        
    ) {
        LINK = _link;
        REGISTRAR = _registrar;
        VRF_COORDINATOR = _vrfCoordinator;
    }

    /// @notice Register new UpKeep. 
    /// @param _params the parameter about UpKeep registration typed in RegistrationParams. 
    function registerUpKeep(
        RegistrationParams calldata _params
    ) 
        external
    {
        LINK.transferFrom(msg.sender, address(this), _params.amount);
        /// Approve is essential since REGISTRAR will take link away
        LINK.approve(address(REGISTRAR), _params.amount);
        /// Register upkeeps       
        upkeepRegisterId = REGISTRAR.registerUpkeep(_params);
        if (upkeepRegisterId == 0) revert registerFailure();
    }

    /// @notice Register a consumer contract under the VRF subscription ID.
    /// @param _consumer The address of a consumer contract.
    function registerVRF(address _consumer) external {
        /// Create a new vrf subscription Id 
        vrfSubscriptionId = VRF_COORDINATOR.createSubscription();
        /// Assign this contract as one of vrf consumbers under the above created subscription Id. 
        VRF_COORDINATOR.addConsumer(vrfSubscriptionId, _consumer);
        /// To gain the ownership of the subscription Id, the deployer becomes a reqest owner.  
        VRF_COORDINATOR.requestSubscriptionOwnerTransfer(vrfSubscriptionId, msg.sender);
    }
    

}