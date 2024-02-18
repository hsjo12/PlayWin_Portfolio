// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/ILottery.sol";
import "../interfaces/IRewardVault.sol";
import "../aave/interfaces/IPool.sol";
import "../structs/StakingStruct.sol";

/// @title Staking
/// @author Daehwan cho
/// @notice Staking involves users staking USDT to earn FUSDT basd on total sale of raffle and lottery tickets in each lottery round. 
/// USDT staked by users will be directly deposited into AAVE to earn rewards for the project.

contract Staking is AccessControl, StakingStruct {
    
    /// Constant
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 
    uint16 public constant BPS = 10_000;

    /// Immutable
    IERC20 public immutable USDT; 
    IERC20 public immutable AAVE_USDT;
    IPool public immutable AAVE_POOL;
    ILottery public immutable LOTTERY;
    IRewardVault public immutable REWARD_VAULT;
    address public immutable TEAM_VAULT;

    ///Error
    error TooLow(); 
    error ZeroBalance();
    error ZeroReward();
    error Frozen(); 

    ///Event
    event Stake(address indexed user, uint256 indexed stakingRound, uint256 amount);
    event Unstake(address indexed user, uint256 indexed unstakingRound, uint256 amount);
    event Claim(address indexed user, uint256 amount);

    /// Vairable
    uint256 public totalStake;
    uint256 public totalRewardsOverAllTheRounds;
    uint32 public lockupRound = 3; 
    mapping(address => StakingInfo) public userStakingInfo;

    /// @param _usdt address is deployed by AAVE
    /// @param _aaveUsdt indicates the address of token received after staking USDT to the aave pool.
    /// @param _aavePool is the address of pool where USDT is finally deposited.
    /// @param _lottery is the address of lottery.
    /// @param _rewardVault is the address of rewardVault.
    /// @param _teamVault is the address of teamVault.
    constructor(
        IERC20 _usdt,
        IERC20  _aaveUsdt,
        IPool _aavePool,
        ILottery _lottery,
        IRewardVault _rewardVault,
        address _teamVault
    ) {
        USDT = _usdt;
        AAVE_USDT = _aaveUsdt;
        AAVE_POOL = _aavePool;
        LOTTERY = _lottery;
        REWARD_VAULT = _rewardVault;
        TEAM_VAULT = _teamVault;
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice It will keep updating users' rewards when they stake and withdraw USDT, and claim rewards. 
    modifier UpdateStatus {
        StakingInfo storage _userStakingInfo = userStakingInfo[msg.sender];
        _userStakingInfo.reward = getCurrentRewards(msg.sender);
        _userStakingInfo.rewardStartingPoint = totalRewardsOverAllTheRounds;
        _;
    }

    /// @notice It will assign the reward rate based on the total sales of raffles and lotteries in each round.
    /// @dev It will be called through the announce function in lottery.sol.
    /// @param _currentRound is the latest round corresponding to the total sales rate stored.  
    function finailizeRewardRate(uint256 _currentRound) external onlyRole(MANAGER) {
        uint256 currentRewardRate = REWARD_VAULT.totalRewardByRound(_currentRound);
        totalRewardsOverAllTheRounds = updateTotalRewardsOverAllTheRounds(currentRewardRate);
    }

    /// @notice It will calculate the total staking rewards across all lottery rounds.
    /// @param _rewardRate indicates the total sales of lottery and raffle tickets in the latest round.
    /// @return totalRewardsOverAllTheRounds will be returned as the total amount of reward rate all over the rounds. 
    function updateTotalRewardsOverAllTheRounds(uint256 _rewardRate) private view returns(uint256) {
        if(totalStake == 0) return 0;
        /// It is suspposed to be "return totalRewardsOverAllTheRounds + (_rewardRate * (currentRound - lastUpdateRound) * 1e18 / totalStake);"
        /// (currentRound - lastUpdateRound) is alway 1 since this variable is update every single round.
        /// So (currentRound - lastUpdateRound) is omitted.
        return totalRewardsOverAllTheRounds + (_rewardRate * 1e18 / totalStake);
    }

    /// @notice It will returns the rewards of input address.
    /// @param _user indicates the address to view the rewards.
    /// @return rewards is the rewards of input address.
    function getCurrentRewards(address _user) public view returns(uint256) {
        StakingInfo storage _userStakingInfo = userStakingInfo[_user];
        return _userStakingInfo.reward + (_userStakingInfo.balance * (totalRewardsOverAllTheRounds - _userStakingInfo.rewardStartingPoint)) / 1e18;
    }

    /// @notice It allows users to stake USDT.
    /// @dev It will directly deposit USDT staked by user to AAVE USDT Pool. 
    /// @param _amount is the amount of USDT to be staked. 
    function stake(uint256 _amount) external UpdateStatus {
        if(_amount < 1) revert TooLow();
        StakingInfo storage _userStakingInfo = userStakingInfo[msg.sender];
        USDT.transferFrom(msg.sender, address(this), _amount);
        USDT.approve(address(AAVE_POOL), _amount);
        AAVE_POOL.supply(address(USDT), _amount, address(this), 0);
        totalStake += _amount;
        _userStakingInfo.balance += _amount;
        _userStakingInfo.lockUp = LOTTERY.round();
        emit Stake(msg.sender, LOTTERY.round(), _amount);
    }

    /// @notice It allows users to withdraw the staked amount of USDT.
    function unstake() external UpdateStatus {
        StakingInfo storage _userStakingInfo = userStakingInfo[msg.sender];
        uint256 userBalance = _userStakingInfo.balance;
        if(userBalance == 0) revert ZeroBalance();
        if(_userStakingInfo.lockUp + lockupRound > LOTTERY.round()) revert Frozen(); 
        totalStake -= userBalance;
        _userStakingInfo.balance = 0;
        AAVE_POOL.withdraw(address(USDT), userBalance, msg.sender);
        emit Unstake(msg.sender, LOTTERY.round(), userBalance);
    }

    /// @notice It allows users to claim rewards.
    function claim() external UpdateStatus {
        StakingInfo storage _userStakingInfo = userStakingInfo[msg.sender];
        uint256 userRewards = getCurrentRewards(msg.sender);
        if(userRewards == 0) revert ZeroReward();
        _userStakingInfo.reward = 0;
        REWARD_VAULT.transferFUSDT(msg.sender, userRewards);
        emit Claim(msg.sender, userRewards);    
    }
    
    /// @notice It allows admin to collect rewards from AAVE.
    function collectProfitsFromAAVE() external onlyRole(MANAGER) {
        uint256 profit = AAVE_USDT.balanceOf(address(this)) - totalStake;
        AAVE_POOL.withdraw(address(USDT), profit, TEAM_VAULT);
    }

    /// @notice It shows the amount of rewards from AAVE.
    /// @return _amount is the amount of rewards.  
    function getProfitsFromAAVE() external view returns(uint256) {
        return AAVE_USDT.balanceOf(address(this)) - totalStake;
    }

    /// @notice It displays the input address of the total staking shares.
    /// @param _user is the address to veiwe the total staking sahres.
    /// @return _amount is the total staking sahres.  
    function getUserStakingShares(address _user) external view returns(uint256) {
        StakingInfo storage _userStakingInfo = userStakingInfo[_user];
        return (_userStakingInfo.balance * BPS) / totalStake; 
    }

    /// @notice It allows the admin to set the staking lockup round.
    /// @param _lockupRound is the staking locup round.
    function setLockupRound(uint32 _lockupRound) external onlyRole(MANAGER) {
        lockupRound = _lockupRound;
    }

    /// @notice It displays the input address of the remaining staking rounds for withdrawing staked USDT.
    /// @param _user is address to look for the remaining staking rounds.
    /// @return remainingRound is the number of rounds remaining until staked USDT can be withdrawn.
    function getLeftOverLockUpRound(
        address _user
    ) 
        external 
        view 
        returns(uint256) 
    {
        StakingInfo storage _userStakingInfo = userStakingInfo[_user];
        if(_userStakingInfo.balance == 0) return 0;
        else if(_userStakingInfo.lockUp + lockupRound > LOTTERY.round()) {
            unchecked {
                return (_userStakingInfo.lockUp + lockupRound) - LOTTERY.round();
            }
        } else return 0;
      
    }
}