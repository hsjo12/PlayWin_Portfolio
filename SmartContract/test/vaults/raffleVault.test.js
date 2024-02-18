const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const {
  inUSDT,
  setUp,
  gainFUSDT,
  multipleApprovals,
  multipleBalances,
  inETH,
} = require("../utils/setUp");
const { ethers } = require("hardhat");

describe("RaffleVault", () => {
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MANAGER =
    "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  let deployer, user1;
  let fusdt;
  let raffle, erc20Prize, raffleVault, rewardVault, teamVault;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      fusdt,
      raffle,
      raffleVault,
      claimVault,
      teamVault,
      rewardVault,
      erc20Prize,
    } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      expect(await raffleVault.FUSDT()).to.eq(fusdt.target);
      expect(await raffleVault.teamVault()).to.eq(teamVault.target);
      expect(await raffleVault.rewardVault()).to.eq(rewardVault.target);
      expect(await raffleVault.taxInfo()).to.deep.eq([500, 500, 250, 250]);
      expect(await raffleVault.hasRole(MANAGER, deployer.address)).to.true;
      expect(await raffleVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;

      await raffleVault.setTeamVault(user1.address);
      await raffleVault.setRewardVault(user1.address);

      expect(await raffleVault.teamVault()).to.eq(user1.address);
      expect(await raffleVault.rewardVault()).to.eq(user1.address);

      await raffleVault.setTeamVault(teamVault.target);
      await raffleVault.setRewardVault(rewardVault.target);
    });
  });

  context("sendPrizeToWinner", () => {
    let teamVaultFUSDTBalance, rewardVaultFUSDTBalance, creatorFUSDTBalance;
    let creatorERC20PrizeBalance;
    let PRIZE_TYPE = 0; // erc20 prize
    const STATUS = 0; // pending
    let PRIZE;
    let PRIZE_AMOUNT = inETH(1);
    let PRIZE_ID = 0;
    const DEADLINE = Math.floor(new Date().getTime() / 1000) + 3600; // After 1 hr
    const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
    const MIN_RAFFLE_ENTRIES = 2;
    const MAX_RAFFLE_ENTRIES = 20;
    const MIN_ENTRIES_PER_USER = 2;
    const MAX_ENTRIES_PER_USER = 10;
    let creator, winner;
    const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
    const WINNING_NUMBER = 0; // Default Value
    const TOTAL_ENTRIES = 0; // Default Value
    before("Create raffle", async () => {
      creator = deployer;
      winner = user1;
      PRIZE = erc20Prize.target;
      await gainFUSDT(fusdt, [creator]);

      await erc20Prize.mint(creator, inETH(1));
      await multipleApprovals(fusdt, raffle.target, [creator]);
      await multipleApprovals(erc20Prize, raffle.target, [creator]);
      await raffle.create([
        PRIZE_TYPE,
        STATUS,
        PRIZE,
        PRIZE_AMOUNT,
        PRIZE_ID,
        DEADLINE,
        ENTRY_PRICE,
        MIN_RAFFLE_ENTRIES,
        MAX_RAFFLE_ENTRIES,
        MIN_ENTRIES_PER_USER,
        MAX_ENTRIES_PER_USER,
        creator,
        WINNER,
        WINNING_NUMBER,
        TOTAL_ENTRIES,
      ]);
    });
    before("Get FUSDT Balances", async () => {
      creatorERC20PrizeBalance = await erc20Prize.balanceOf(winner.address);
      [teamVaultFUSDTBalance, rewardVaultFUSDTBalance, creatorFUSDTBalance] =
        await multipleBalances(fusdt, [teamVault, rewardVault, creator]);
    });

    it("Check if the sendPrizeToWinner function works well", async () => {
      const raffleId = await raffle.currentId();
      const lotteryRound = 1;
      const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
        raffleId
      );
      const depositFee = await raffleVault.getFUSDTDepositByRaffleId(raffleId);
      const toCreator = (totalEntryFee * 9000n) / 10000n + depositFee;
      expect(
        await raffleVault.sendPrizeToWinner(
          PRIZE_TYPE,
          raffleId,
          creator.address,
          PRIZE,
          winner.address,
          PRIZE_ID,
          PRIZE_AMOUNT,
          lotteryRound
        )
      )
        .to.emit(raffleVault, "Claim")
        .withArgs(winner.address, PRIZE_TYPE, PRIZE, PRIZE_ID, PRIZE_AMOUNT)
        .to.emit(raffleVault, "CollectFee")
        .withArgs(creator, raffleId, toCreator);
    });

    it("Check if the 90%, 2.5%, and 5% amount of total entry fee are sent to the creator, the teamVault and the rewardVault respectively after the announce", async () => {
      const raffleId = await raffle.currentId();
      const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
        raffleId
      );
      const depositFee = await raffleVault.getFUSDTDepositByRaffleId(raffleId);
      const toCreator = (totalEntryFee * 9000n) / 10000n;
      const toTeamVault = (totalEntryFee * 500n) / 10000n;
      const toRewardVault = (totalEntryFee * 500n) / 10000n;
      const expectedFUSDTBalanceOfTeamVault =
        teamVaultFUSDTBalance + toTeamVault;
      const expectedFUSDTBalanceOfRewardVault =
        rewardVaultFUSDTBalance + toRewardVault;
      const expectedFUSDTBalanceOfCreator =
        creatorFUSDTBalance + toCreator + depositFee;

      expect(expectedFUSDTBalanceOfTeamVault).to.eq(
        await fusdt.balanceOf(teamVault.target)
      );
      expect(expectedFUSDTBalanceOfRewardVault).to.eq(
        await fusdt.balanceOf(rewardVault.target)
      );

      expect(expectedFUSDTBalanceOfCreator).to.eq(
        await fusdt.balanceOf(creator.address)
      );
    });

    it("Check if rewardVault saves the received amount from the raffleVault", async () => {
      const raffleId = await raffle.currentId();
      const lotteryRound = 1;
      const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
        raffleId
      );

      const toRewardVault = (totalEntryFee * 500n) / 10000n;
      expect(toRewardVault).to.eq(
        await rewardVault.totalRewardByRound(lotteryRound)
      );
    });
    it("Check if the winner(user1) receives erc20 prize", async () => {
      const expectedERC20PRizeBalanceOfWinner =
        creatorERC20PrizeBalance + PRIZE_AMOUNT;
      expect(expectedERC20PRizeBalanceOfWinner).to.eq(
        await erc20Prize.balanceOf(winner.address)
      );
    });
    it("Check if sendPrizeToWinner function returns the error OnlyOnce When it is executed again", async () => {
      const raffleId = await raffle.currentId();
      const lotteryRound = 1;
      await expect(
        raffleVault.sendPrizeToWinner(
          PRIZE_TYPE,
          raffleId,
          creator.address,
          PRIZE,
          winner.address,
          PRIZE_ID,
          PRIZE_AMOUNT,
          lotteryRound
        )
      ).to.revertedWithCustomError(raffleVault, "OnlyOnce");
    });
  });

  context("refundDepositAndPrize", () => {
    let teamVaultFUSDTBalance, rewardVaultFUSDTBalance, creatorFUSDTBalance;
    let creatorERC20PrizeBalance;
    let PRIZE_TYPE = 0; // erc20 prize
    const STATUS = 0; // pending
    let PRIZE;
    let PRIZE_AMOUNT = inETH(1);
    let PRIZE_ID = 0;
    const DEADLINE = Math.floor(new Date().getTime() / 1000) + 3600; // After 1 hr
    const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
    const MIN_RAFFLE_ENTRIES = 2;
    const MAX_RAFFLE_ENTRIES = 20;
    const MIN_ENTRIES_PER_USER = 2;
    const MAX_ENTRIES_PER_USER = 10;
    let creator, winner;
    const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
    const WINNING_NUMBER = 0; // Default Value
    const TOTAL_ENTRIES = 0; // Default Value
    before("Create raffle", async () => {
      creator = deployer;
      PRIZE = erc20Prize.target;
      await gainFUSDT(fusdt, [creator]);

      await erc20Prize.mint(creator, inETH(1));
      await multipleApprovals(fusdt, raffle.target, [creator]);
      await multipleApprovals(erc20Prize, raffle.target, [creator]);
      await raffle.create([
        PRIZE_TYPE,
        STATUS,
        PRIZE,
        PRIZE_AMOUNT,
        PRIZE_ID,
        DEADLINE,
        ENTRY_PRICE,
        MIN_RAFFLE_ENTRIES,
        MAX_RAFFLE_ENTRIES,
        MIN_ENTRIES_PER_USER,
        MAX_ENTRIES_PER_USER,
        creator,
        WINNER,
        WINNING_NUMBER,
        TOTAL_ENTRIES,
      ]);
    });
    before("Get FUSDT Balances", async () => {
      creatorERC20PrizeBalance = await erc20Prize.balanceOf(creator.address);
      [teamVaultFUSDTBalance, rewardVaultFUSDTBalance, creatorFUSDTBalance] =
        await multipleBalances(fusdt, [teamVault, rewardVault, creator]);
    });

    it("Check if the refundDepositAndPrize function works well", async () => {
      const raffleId = await raffle.currentId();
      const lotteryRound = 1;
      const depositFee = await raffleVault.getFUSDTDepositByRaffleId(raffleId);
      const toCreator = (depositFee * 9500n) / 10000n;

      expect(
        await raffleVault.refundDepositAndPrize(
          PRIZE_TYPE,
          raffleId,
          creator.address,
          PRIZE,
          PRIZE_ID,
          PRIZE_AMOUNT,
          lotteryRound
        )
      )
        .to.emit(raffleVault, "RefundPrize")
        .withArgs(
          creator,
          PRIZE_TYPE,
          PRIZE,
          PRIZE_ID,
          PRIZE_AMOUNT,
          toCreator
        );
    });

    it("Check if the 95%, 2.5%, and 2.5% amount of total entry fee are sent to the creator, the teamVault and the rewardVault respectively after the announce", async () => {
      const raffleId = await raffle.currentId();

      const depositFee = await raffleVault.getFUSDTDepositByRaffleId(raffleId);
      const toCreator = (depositFee * 9500n) / 10000n;
      const toTeamVault = (depositFee * 250n) / 10000n;
      const toRewardVault = (depositFee * 250n) / 10000n;
      const expectedFUSDTBalanceOfTeamVault =
        teamVaultFUSDTBalance + toTeamVault;
      const expectedFUSDTBalanceOfRewardVault =
        rewardVaultFUSDTBalance + toRewardVault;
      const expectedFUSDTBalanceOfCreator = creatorFUSDTBalance + toCreator;

      expect(expectedFUSDTBalanceOfTeamVault).to.eq(
        await fusdt.balanceOf(teamVault.target)
      );
      expect(expectedFUSDTBalanceOfRewardVault).to.eq(
        await fusdt.balanceOf(rewardVault.target)
      );

      expect(expectedFUSDTBalanceOfCreator).to.eq(
        await fusdt.balanceOf(creator.address)
      );
    });

    it("Check if rewardVault saves the received amount from the raffleVault", async () => {
      const lotteryRound = 1;
      const raffleId = await raffle.currentId();

      const depositFee = await raffleVault.getFUSDTDepositByRaffleId(raffleId);
      const toRewardVault = (depositFee * 250n) / 10000n;
      expect(toRewardVault).to.eq(
        await rewardVault.totalRewardByRound(lotteryRound)
      );
    });
    it("Check if the winner(user1) receives erc20 prize", async () => {
      const expectedERC20PRizeBalanceOfWinner =
        creatorERC20PrizeBalance + PRIZE_AMOUNT;
      expect(expectedERC20PRizeBalanceOfWinner).to.eq(
        await erc20Prize.balanceOf(creator.address)
      );
    });
    it("Check if refundDepositAndPrize function returns the error OnlyOnce When it is executed again", async () => {
      const raffleId = await raffle.currentId();
      const lotteryRound = 1;
      await expect(
        raffleVault.refundDepositAndPrize(
          PRIZE_TYPE,
          raffleId,
          creator.address,
          PRIZE,
          PRIZE_ID,
          PRIZE_AMOUNT,
          lotteryRound
        )
      ).to.revertedWithCustomError(raffleVault, "OnlyOnce");
    });
  });

  context("SaveEntryFee & setTaxes", () => {
    it("Check if saveEntryFee works well", async () => {
      const raffleId = 1;
      const user = deployer.address;
      const amount = 10;
      await expect(raffleVault.saveEntryFee(raffleId, user, amount))
        .to.emit(raffleVault, "DepositEntryFee")
        .withArgs(user, raffleId, amount);

      expect(await raffleVault.getTotalEntryFeeByRaffleId(raffleId)).to.eq(
        amount
      );
      expect(await raffleVault.getUserEntryFeeByRaffleId(raffleId, user)).to.eq(
        amount
      );
    });
    it("Check if setTaxes works well", async () => {
      const newTaxes = [1000, 1000, 1000, 1000];
      await raffleVault.setTaxes(newTaxes);
      expect(newTaxes).to.deep.eq(await raffleVault.taxInfo());
    });
  });
});
