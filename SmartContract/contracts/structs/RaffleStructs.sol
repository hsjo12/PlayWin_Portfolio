//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface RaffleStructs {

    /// @dev Status indicates the status of the raffle:
    /// - Pending: Raffle is open.
    /// - Success: Raffle successfully ended.
    /// - Canceled: Raffle did not meet its minimum entries, so the prize and entry fee are returned to the creator and users.
    enum Status {
        Pending, 
        Success,
        Canceled
    }

    /// @dev PrizeType indicates the type of prize:
    /// - ERC20: ERC20 token.
    /// - ERC721: ERC721 token.
    /// - ERC1155: ERC1155 token.
    /// - None: Not supported type.
    enum PrizeType {
        Erc20,
        Erc721,
        Erc1155,
        None
    }
    
    /// @dev RoundInfo is used as a parameter in Raffle.sol.
    /// @param prizeType The type of prize: ERC20, ERC721, ERC1155, or None.
    /// @param status The status of a raffle: Pending, Success, or Canceled.
    /// @param prizeAmount The amount of the prize.
    /// @param deadline The deadline of the raffle. When passed, a winner is drawn.
    /// @param entryPrice The entry price of the raffle.
    /// @param minRaffleEntries The minimum number of entries required for the raffle to proceed.
    /// @param maxRaffleEntries The maximum number of entries allowed for the raffle.
    /// @param minEntriesPerUser The minimum number of entries per user for the raffle.
    /// @param maxEntriesPerUser The maximum number of entries per user for the raffle.
    /// @param creator The address of the raffle creator.
    /// @param winner The address of the winner, initially set to zero.
    /// @param winningEntryNumber The winning entry number, initially set to zero.
    /// @param totalEntries The total number of entries users have joined.

    struct RaffleInfo {
        PrizeType prizeType;
        Status status;
        address prize;
        uint256 prizeAmount;
        uint256 prizeId;
        uint256 deadline;
        uint256 entryPrice;
        uint256 minRaffleEntries; 
        uint256 maxRaffleEntries;
        uint256 minEntriesPerUser;
        uint256 maxEntriesPerUser;
        address creator;
        address winner;
        uint256 winningEntryNumber;
        uint256 totalEntries;
    }

    /// @dev RoundInfo is used in RaffleVault.sol.
    /// - creator: The address of the raffle creator.
    /// - prize: The address of the prize.
    /// - prizeAmount: The amount of the prize.
    /// - prizeTokenId: The prize token ID.
    struct prizeInfo {
        address creator;
        PrizeType prizeType;
        address prize;
        uint256 prizeAmount;
        uint256 prizeTokenId;
    }

    /// @dev RoundInfo is used as a parameter in RaffleVault.sol.
    /// @param teamTaxForSuccess The percentage of total sale sent to the teamVault when the raffle is successful.
    /// @param rewardTaxForSuccess The percentage of total sale sent to the rewardVault for staking rewards when the raffle is successful.
    /// @param teamTaxForCancel The percentage of a raffle deposit sent to the teamVault when the raffle is failed.
    /// @param rewardTaxForCancel The percentage of a raffle deposit sent to the rewardVault when the raffle is failed.
    struct TaxInfo {
        uint16 teamTaxForSuccess;
        uint16 rewardTaxForSuccess;
        uint16 teamTaxForCancel;
        uint16 rewardTaxForCancel;
    }

    /// @dev RoundInfo is used in RaffleVault.sol.
    /// - totalEntryFee: The total entry fee.
    /// - FUSDTDeposit: The deposit in FUSDT to create a raffle.
    /// - userEntryFee: The amount of the user's entry fee.
    /// - refundTakenByUser: The status of the user's refund.
    /// - isPrizeMoved: The status of the prize being moved from the raffleVault.
    struct RaffleFundInfo {
        uint256 totalEntryFee;
        uint256 FUSDTDeposit;
        mapping(address=>uint256) userEntryFee;
        mapping(address=>bool) refundTakenByUser;
        bool isPrizeMoved;
    }

    /// @dev RoundInfo is used in Raffle.sol.
    /// - entryCounterByRaffle: The total number of entries users joined corresponding to a raffle ID.
    /// - joinedRaffleList: The list of raffles users joined.
    /// - createdRaffleList: The list of raffles users created.
    struct UserInfo {
        /// raffle id => userEntryCounterByRaffle
        mapping(uint256=>uint256) entryCounterByRaffle; 
        uint256[] joinedRaffleList;
        uint256[] createdRaffleList;
    }

}