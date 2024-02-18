//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../structs/LotteryStruct.sol";
import "../interfaces/IClaimVault.sol";
import "../interfaces/IRewardVault.sol";
import "../interfaces/IFirstPlacePrizeVault.sol";
import "../interfaces/IStaking.sol";

/// @title Lottery
/// @author Daehwan Cho
/// @notice The Raffle contract provides a platform where users can join raffles.
/// @dev Chainlink's VRF randomly generates the winning number.
///      Afterward, the numbers of the first, second, and third place winners are computed and sent as transactions to this smart contract, which is executed by an oracle host.
contract Lottery is LotteryStruct, AccessControl{

    ///Constants
    bytes32 public constant MANAGER = 0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c; 
    uint256 public constant BPS = 10_000;

    /// Immutables
    IERC20 public immutable FUSDT;
    IClaimVault public immutable CLAIM_VAULT;
    IRewardVault public immutable REWARD_VAULT; 
    IFirstPlacePrizeVault public immutable FIRST_PLACE_PRIZE_VAULT;
    address public immutable TEAM_VAULT;

    /// Events
    event Buy(uint256 indexed round, address indexed user, string indexed selectedNumberTopic, string selectedNumber);
    event Announce(uint256 indexed round, string winningNumber);
    event Claim(uint256 indexed round, address indexed user, uint8 prizeType, uint256 prizeAmount, string winningNumber);
    
    /// Errors
    error MustBeLaterThanNow();
    error GameOver();
    error Active();
    error InEqualTo5Numbers();
    error NotFound();
    error NotWinningNumber();
    error MustBeEqaulToBPS();
    error AlreadyClaimed();
    error Expired();
    error Valid();

    /// variable s
    IStaking public staking;
    uint256 public round;
    uint256 public price;
    uint256 public startingBlock;
    uint256 public intervalBlock;
    uint8 public claimableRound;
    uint16 public taxForTeamVault; 
    uint16 public taxForClaimVault; 
    uint16 public taxForRewardVault; 
    uint16 public shareOfTheFirstPlacePrize; /// The share of total sold fee. 
    uint16 public shareOfTheSecondPlacePrize; /// The share of total sold fee. 
    uint16 public shareOfTheThirdPlacePrize; /// The share of total sold fee. 
    uint256 public onlyFirstPlacePrizeAmountFromTeam; /// This prize is sourced from team. 

    // round => seleceted number
    mapping(uint256 => mapping(string => uint256)) public totalSelectedNumberByRound;
    // user => round => selected Number  
    mapping(address => mapping(uint256 => mapping(string => bool))) public isClaimed;
    // user => round => selected Number  
    mapping(address => mapping(uint256 => mapping(string => uint256))) public totalSelectedNumberByUser;
    /// round => roundInfo
    mapping(uint256 => RoundInfo) public roundInfo;
    /// round => claimedPrizeAmount
    mapping(uint256 => uint256) public claimedPrizeAmount; 
    
    ///@param _fusdt The address of fusdt
    ///@param _claimVault The address of claimvault
    ///@param _claimVault The address of rewardVault
    ///@param _claimVault The address of firstPlacePrizeVault
    constructor(
        IERC20 _fusdt,  
        IClaimVault _claimVault, 
        IRewardVault _rewardVault, 
        IFirstPlacePrizeVault _firstPlacePrizeVault,
        address _taemVault,
        uint256 _startingBlock
    ) 
    {    
        if(_startingBlock < block.number) revert MustBeLaterThanNow();
        FUSDT = _fusdt;
        TEAM_VAULT = _taemVault;
        REWARD_VAULT = _rewardVault;
        CLAIM_VAULT = _claimVault;
        FIRST_PLACE_PRIZE_VAULT = _firstPlacePrizeVault;
        round = 1;
        claimableRound = 7; /// users can calim their prizes for 7 rounds 
        intervalBlock = 42600; /// Around 23 hrs and 50 mins
        price = 1 * 10 ** 6; /// 1 FUSDT 
        taxForTeamVault = 1000; // 10%
        taxForRewardVault = 2000; // 20%
        taxForClaimVault = 7000; // 70%
        onlyFirstPlacePrizeAmountFromTeam = 1 * 10 ** 6; /// The prize will be as small amount as 1 FUSDC for test purpose.
        shareOfTheFirstPlacePrize = 1000; // 10%
        shareOfTheSecondPlacePrize = 6000; // 60%
        shareOfTheThirdPlacePrize = 3000; // 20%
        startingBlock = _startingBlock;
    
        _grantRole(MANAGER, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Returns the latest ID of created raffles.
    /// @param selectedNumbers The list of 5 long numbers that users input for the lottery.
    function buyTickets(
        string[] calldata selectedNumbers
    )
        external
    {
        if(isRoundOver()) revert GameOver();
        RoundInfo storage _roundInfo = roundInfo[round];

        uint256 size = selectedNumbers.length;
        string memory selectedNumber;
        uint256 _round = round;
        uint256 totalPrice = price * size;

        _roundInfo.totalSoldTickets += size;
        _roundInfo.totalSales += totalPrice;
        
        /// Send total ticket fee to here
        FUSDT.transferFrom(msg.sender, address(this), totalPrice);
        
        for(uint256 i; i < size; i++) {
            selectedNumber = selectedNumbers[i];
            if(bytes(selectedNumber).length != 5) revert InEqualTo5Numbers();
            ++totalSelectedNumberByRound[_round][selectedNumber];
            ++totalSelectedNumberByUser[msg.sender][_round][selectedNumber];
            emit Buy(_round, msg.sender, selectedNumber, selectedNumber);
          
        }
    
    }

    /// @notice Stores the winners of this round along with their winning numbers, and then starts the next round.
    /// @param _winningNumber The winning number randomly generated by Chainlink's VRF.
    /// @param _totalFirstPlaceWinners The number of first-place winners.
    /// @param _totalSecondPlaceWinners The number of second-place winners.
    /// @param _totalThirdPlaceWinners The number of third-place winners.
    function announce(
        string calldata _winningNumber,
        uint256 _totalFirstPlaceWinners,
        uint256 _totalSecondPlaceWinners,
        uint256 _totalThirdPlaceWinners
    ) 
        external 
        onlyRole(MANAGER)
    {
        if(!isRoundOver()) revert Active();
        /// Increase round
        uint256 currentRound = round++;
        /// Update StartingBlock 
        startingBlock = block.number;
        RoundInfo storage _roundInfo = roundInfo[currentRound];
        RoundInfo storage _nextRoundInfo = roundInfo[round];
        uint256 totalSales = _roundInfo.totalSales;

        /// The total sale amount will be split into three amounts.
        (
        uint256 toClaimVault, 
        uint256 toRewardVault, 
        uint256 toTeamVault
        ) = breakIntoThree(
        totalSales, 
        taxForClaimVault, 
        taxForRewardVault, 
        taxForTeamVault
        );

        /// The amount for prizes will be split into three prizes.
        (
        uint256 firstPlacePrizeAmount, 
        uint256 secondPlacePrizeAmount, 
        uint256 thirdPlacePrizeAmount
        ) = breakIntoThree(
        toClaimVault, 
        shareOfTheFirstPlacePrize, 
        shareOfTheSecondPlacePrize, 
        shareOfTheThirdPlacePrize
        );

        if(_totalFirstPlaceWinners == 0) {
            _roundInfo.onlyFirstPlacePrizeAmountFromTeam = 0; 
            _roundInfo.firstPlacePrizeAmountFromFees = 0; 
            _roundInfo.totalFirstPlacePrizeAmount = 0;
        }else {
            _roundInfo.onlyFirstPlacePrizeAmountFromTeam = onlyFirstPlacePrizeAmountFromTeam; 
            _roundInfo.firstPlacePrizeAmountFromFees = firstPlacePrizeAmount; 
            _roundInfo.totalFirstPlacePrizeAmount = onlyFirstPlacePrizeAmountFromTeam + firstPlacePrizeAmount;
            /// Send FUSDT to claim vault
            FIRST_PLACE_PRIZE_VAULT.sendFirstPlacePrizeSourcedFromTeam(onlyFirstPlacePrizeAmountFromTeam);
        }

        if(_totalSecondPlaceWinners == 0) secondPlacePrizeAmount = 0;
        if(_totalThirdPlaceWinners == 0) thirdPlacePrizeAmount = 0;


        _roundInfo.winningNumber = _winningNumber; 
        _roundInfo.totalPrizeAmount = _roundInfo.totalFirstPlacePrizeAmount + secondPlacePrizeAmount + thirdPlacePrizeAmount;
        _roundInfo.secondPlacePrizeAmountFromFees = secondPlacePrizeAmount; 
        _roundInfo.thirdPlacePrizeAmountFromFees = thirdPlacePrizeAmount; 
        _roundInfo.totalFirstPlaceWinners = _totalFirstPlaceWinners; 
        _roundInfo.totalSecondPlaceWinners = _totalSecondPlaceWinners; 
        _roundInfo.totalThirdPlaceWinners = _totalThirdPlaceWinners; 
        _roundInfo.announcedBlock = block.number;

        
        uint256 totalPrizeAmountFromOnlySale = firstPlacePrizeAmount + secondPlacePrizeAmount + thirdPlacePrizeAmount;
        uint256 remainingPrizeCarriedOver = toClaimVault - totalPrizeAmountFromOnlySale;
        
        ///f there are no winners in any of the positions, the prize will be carried over to the next round.
        _nextRoundInfo.totalSales = remainingPrizeCarriedOver; 


        /// a part of ticket fee is kept and then will move into the REWARD_VAULT after the announce function.
        FUSDT.transfer(address(CLAIM_VAULT), totalPrizeAmountFromOnlySale);



        ///  a part of ticket fee goes to the reaward vault so that staking user can get rwards.
        FUSDT.transfer(address(REWARD_VAULT), toRewardVault);
        REWARD_VAULT.saveReward(currentRound, toRewardVault);
        ///  a part of ticket fee will be carried onto the team vault
        FUSDT.transfer(TEAM_VAULT, toTeamVault);
        staking.finailizeRewardRate(currentRound);
     
        emit Announce(currentRound, _winningNumber);
    }

    /// @notice Allows winners to claim their prize.
    /// @param _round The winning round.
    /// @param _wonNumber The number the user won.
    function claim(
        uint256 _round,
        string calldata _wonNumber
    ) 
        external
    {   
        if(_isClaimableRoundPassed(_round)) revert Expired();
        uint256 _totalSelectedNumberByUser = totalSelectedNumberByUser[msg.sender][_round][_wonNumber];
        if(_totalSelectedNumberByUser == 0) revert NotFound();
        if(isClaimed[msg.sender][_round][_wonNumber]) revert AlreadyClaimed();
        RoundInfo storage _roundInfo = roundInfo[_round];   
        uint256 similarities = checkSimilarity(_roundInfo.winningNumber, _wonNumber);
        uint256 toWinner;
        isClaimed[msg.sender][_round][_wonNumber] = true;
        uint8 prizeType;
        ///The first-place prize
        if(similarities == 5) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser,
                _roundInfo.totalFirstPlaceWinners,
                _roundInfo.totalFirstPlacePrizeAmount
            );
            prizeType = 1;
            CLAIM_VAULT.transferFUSDT(msg.sender, toWinner);
        }
        ///The second-place prize
        else if(similarities == 4) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser,
                _roundInfo.totalSecondPlaceWinners,
                _roundInfo.secondPlacePrizeAmountFromFees
            );
            prizeType = 2;
            CLAIM_VAULT.transferFUSDT(msg.sender, toWinner);
        }
        ///The thrid-place prize        
        else if(similarities == 3) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser, 
                _roundInfo.totalThirdPlaceWinners, 
                _roundInfo.thirdPlacePrizeAmountFromFees
            );
            prizeType = 3;
            CLAIM_VAULT.transferFUSDT(msg.sender, toWinner);
        }
        else {
            revert NotWinningNumber();
        }
        claimedPrizeAmount[_round] += toWinner;
        emit Claim(_round, msg.sender, prizeType, toWinner, _wonNumber);
    }

    /// @notice Displays the amount of prize rewards.
    /// @param _round The winning round.
    /// @param _wonNumber The number the user won.
    /// @param _user The address of the winner.
    function getRewards(
        uint256 _round,
        string calldata _wonNumber,
        address _user
    ) 
        external
        view
        returns(uint256)
    {
        uint256 _totalSelectedNumberByUser = totalSelectedNumberByUser[_user][_round][_wonNumber];
        if(_totalSelectedNumberByUser == 0 || isClaimed[_user][_round][_wonNumber]) return 0;

        RoundInfo storage _roundInfo = roundInfo[_round];   
        uint256 similarities = checkSimilarity(_roundInfo.winningNumber, _wonNumber);
        uint256 toWinner;

        ///The first-place prize
        if(similarities == 5) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser,
                _roundInfo.totalFirstPlaceWinners,
                _roundInfo.totalFirstPlacePrizeAmount
            );
        }
        ///The second-place prize
        else if(similarities == 4) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser,
                _roundInfo.totalSecondPlaceWinners,
                _roundInfo.secondPlacePrizeAmountFromFees
            );
        }
        ///The thrid-place prize        
        else if(similarities == 3) {
            toWinner = prizeCalculator(
                _totalSelectedNumberByUser, 
                _roundInfo.totalThirdPlaceWinners, 
                _roundInfo.thirdPlacePrizeAmountFromFees
            );
        }
        else {
            return 0;
        }
        return toWinner;
    }

    /// @notice Returns the status of a round.
    /// @return roundStatus Returns true if the round is open, false otherwise.
    function isRoundOver() public view returns(bool) {
        return startingBlock + intervalBlock < block.number;
    }

    /// @notice Returns the total, first-place, second-place, third-place prize amount.
    /// @return totalPrize The sum of first, second and third place prize amount.
    /// @return firstPlacePrize The sum of first-place prize.
    /// @return secondPlacePrize The sum of second-place prize.
    /// @return thirdPlacePrize The sum of third-place prize.
    function getCurrentRoundTotalPrize()
        external 
        view
        returns(
            uint256 totalPrize,
            uint256 firstPlacePrize,
            uint256 secondPlacePrize,
            uint256 thirdPlacePrize
        ) 
    {
        uint256 totalPrizeFromFee = (FUSDT.balanceOf(address(this)) * taxForClaimVault) / BPS;
        (
            firstPlacePrize, 
            secondPlacePrize, 
            thirdPlacePrize
        ) = breakIntoThree ( 
            totalPrizeFromFee,
            shareOfTheFirstPlacePrize, 
            shareOfTheSecondPlacePrize, 
            shareOfTheThirdPlacePrize
        );
        firstPlacePrize += onlyFirstPlacePrizeAmountFromTeam;
        totalPrize = firstPlacePrize + secondPlacePrize + thirdPlacePrize;
    }

    /// @notice Returns the deadline block number for a round.
    function getDeadlineBlock() external view returns(uint256) {
        return startingBlock + intervalBlock;
    }

    /// @notice Breaks down the total sale into three parts for distributing prizes.
    /// @dev This function splits the total sale into the first, second, and third place prizes.
    /// @param _total The total sale amount.
    /// @param _shareA The percentage of the first prize (in basis points), where 100 BPS equals 1%.
    /// @param _shareB The percentage of the second prize (in basis points), where 100 BPS equals 1%.
    /// @param _shareC The percentage of the third prize (in basis points), where 100 BPS equals 1%.
    /// @param totalA The calculated amount for the first prize.
    /// @param totalB The calculated amount for the second prize.
    /// @param totalC The calculated amount for the third prize.
    function breakIntoThree(
        uint256 _total, 
        uint256 _shareA,
        uint256 _shareB,
        uint256 _shareC 
    )   
        private
        pure
        returns (
            uint256 totalA,
            uint256 totalB,
            uint256 totalC
        )    
    {
        if(_shareA + _shareB + _shareC != BPS) revert MustBeEqaulToBPS();
        totalA = (_total * _shareA) / BPS;
        totalB = (_total * _shareB) / BPS;
        totalC = _total - totalA - totalB;
    }

    /// @notice Calculates and returns the personal prize amount.
    /// @dev Each winning place prize is required to be divided by the number of winners in that place.
    /// @param _totalSelectedNumberByUser The number of the same winning ticket purchased by the user.
    /// @param _totalWinners The total number of winners in the same winning place.
    /// @param _totalPrizeAmount The total prize amount in the winning place.
    function prizeCalculator(
        uint256 _totalSelectedNumberByUser,
        uint256 _totalWinners, 
        uint256 _totalPrizeAmount
    )
        private
        pure
        returns (uint256 toWinner)
    {
        /// The rounding error will be deviated from 1e18 
        uint256 userShare = (_totalSelectedNumberByUser * 1e18) / _totalWinners;
        toWinner = userShare *  _totalPrizeAmount / 1e18;
    } 

    /// @notice Finds the number of matched numbers between winning numbers and user-selected numbers.
    /// @dev This function is used in a claim function to determine the winning place.
    /// @param _winningNumber The winning number generated by Chainlink's VRF.
    /// @param _inputNumber The lottery number purchased by the user.
    function checkSimilarity(
        string memory _winningNumber, 
        string calldata _inputNumber
    ) 
        private 
        pure 
        returns(uint256) 
    {
        if(keccak256(abi.encode(_winningNumber)) == keccak256(abi.encode(_inputNumber))) return 5;

        bytes memory _winningNumberInBytes = bytes(_winningNumber);
        bytes memory _inputNumberInBytes = bytes(_inputNumber);

        uint256 len = bytes(_winningNumber).length;
        uint256 counter; 

        for(uint i; i < len; i++) {
            if(_winningNumberInBytes[i] == _inputNumberInBytes[i]) counter++;
        }

        return counter;
    }

    /// @notice Collects prizes unclaimed by users.
    /// @dev Users have 7 rounds to claim their prize; otherwise, the prize will be lost.
    /// @param _rounds The number of rounds to claim prizes unclaimed by users.
    function collectExpiredPrize(
        uint256[] calldata _rounds
    ) 
        external 
        onlyRole(MANAGER) 
    {
        uint256 size = _rounds.length;
        uint256 currentRound;
        uint256 leftover;

        
        for(uint256 i; i < size; i++) {
            currentRound = _rounds[i];
            if(!_isClaimableRoundPassed(currentRound)) revert Valid();
            leftover =  roundInfo[currentRound].totalPrizeAmount - claimedPrizeAmount[currentRound];
            CLAIM_VAULT.transferFUSDT(msg.sender, leftover);
            claimedPrizeAmount[currentRound] = roundInfo[currentRound].totalPrizeAmount;
        }

    }

    /// @notice Checks if the period for claiming a prize has expired.
    /// @param _winningRound The round in which the user won the prize.
    function _isClaimableRoundPassed(
        uint256 _winningRound
    ) 
        internal 
        view 
        returns (bool) 
    {
        /// If it is true, the claim deadline round is passed, meaning that a user cannot claim rewards. 
        return round > _winningRound + claimableRound;
    }

    /// @notice Returns the remaining rounds to claim a prize.
    /// @param _winningRound The round in which the user won the prize.
    function getLeftoverClaimableRound(
        uint256 _winningRound
    ) 
        external 
        view 
        returns(uint256) 
    {   
        uint256 lastClaimableRound = _winningRound + claimableRound;
        if(lastClaimableRound <= round) return 0;
        unchecked {
            return lastClaimableRound - round;
        }
      
    } 

    /// @notice Allows the admin to set split shares for TeamVault, RewardVault, and ClaimVault.
    /// @param _taxForTeamVault The share of TeamVault, in basis points (BPS), where 100 BPS equals 1%.
    /// @param _taxForRewardVault The share of RewardVault, in basis points (BPS), where 100 BPS equals 1%.
    /// @param _taxForClaimVault The share of ClaimVault, in basis points (BPS), where 100 BPS equals 1%.
    function setTaxes(
        uint16 _taxForTeamVault,
        uint16 _taxForRewardVault, 
        uint16 _taxForClaimVault

    ) 
        external
        onlyRole(MANAGER)
    {
        if(_taxForTeamVault + _taxForRewardVault + _taxForClaimVault != BPS) revert MustBeEqaulToBPS();
        taxForTeamVault = _taxForTeamVault;
        taxForRewardVault = _taxForRewardVault;
        taxForClaimVault = _taxForClaimVault;
    }

    /// @notice Allows the admin to set split shares for first-place prize, second-place prize, and third-place prize.
    /// @param _shareOfTheFirstPlacePrize The share of first-place prize, in basis points (BPS), where 100 BPS equals 1%.
    /// @param _shareOfTheSecondPlacePrize The share of second-place prize, in basis points (BPS), where 100 BPS equals 1%.
    /// @param _shareOfTheThirdPlacePrize The share of third-place prize, in basis points (BPS), where 100 BPS equals 1%.
    function setPrizeShares(
        uint16 _shareOfTheFirstPlacePrize,
        uint16 _shareOfTheSecondPlacePrize, 
        uint16 _shareOfTheThirdPlacePrize

    ) 
        external
        onlyRole(MANAGER)
    {
        if(_shareOfTheFirstPlacePrize + _shareOfTheSecondPlacePrize + _shareOfTheThirdPlacePrize != BPS) revert MustBeEqaulToBPS();
        shareOfTheFirstPlacePrize = _shareOfTheFirstPlacePrize;
        shareOfTheSecondPlacePrize = _shareOfTheSecondPlacePrize;
        shareOfTheThirdPlacePrize = _shareOfTheThirdPlacePrize;
    }

    /// @notice Allows the admin to set the address of the staking contract.
    /// @dev The staking contract is required for setting up the reward rate of the round in the announce function when the round is over.
    /// @param _staking The address of the staking contract.
    function setStaking(IStaking _staking) external onlyRole(MANAGER) {
        staking = _staking;
    }

    /// @notice Allows the admin to set the amount of the first place prize sourced from the team fund.
    /// @param _onlyFirstPlacePrizeAmountFromTeam The amount of the first place prize sourced from the team fund.
    function setOnlyFirstPlacePrizeAmountFromTeam(
        uint256 _onlyFirstPlacePrizeAmountFromTeam
    ) 
        external 
        onlyRole(MANAGER)
    {
        onlyFirstPlacePrizeAmountFromTeam = _onlyFirstPlacePrizeAmountFromTeam;
    }

    /// @notice Allows the admin to set the starting block number for the lottery.
    /// @param _startingBlock The starting block number.
    function setStartingBlock(uint256 _startingBlock) external onlyRole(MANAGER) {
        startingBlock = _startingBlock;
    }

    /// @notice Allows the admin to set the interval block number for the lottery.
    /// @param _intervalBlock The interval block number.
    function setIntervalBlock(uint256 _intervalBlock) external onlyRole(MANAGER) {
        intervalBlock = _intervalBlock;
    }

    /// @notice Allows the admin to set the number of rounds users have to claim their prize.
    /// @param _claimableRound The number of rounds to claim a prize.
    function setClaimableRound(
        uint8 _claimableRound
    ) 
        external 
        onlyRole(MANAGER) 
    {
        claimableRound = _claimableRound;
    }
   
    /// @notice Allows the admin to set the price of a lottery ticket.
    /// @param _price The price of a lottery ticket.
    function setPrice(uint256 _price) external onlyRole(MANAGER) {
        price = _price;
    }


}