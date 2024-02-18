const {
  time,
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { expect } = require("chai");
const { inUSDT, setUp, gainUSDT, multipleApprovals } = require("./utils/setUp");
const { ethers } = require("hardhat");

describe("Staking", () => {
  const user1StakingAmt = inUSDT(6);
  const user2StakingAmt = inUSDT(2);
  const user3StakingAmt = inUSDT(2);
  let deployer, user1, user2, user3;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      usdt,
      fusdt,
      aaveUSDT,
      aaveFaucet,
      lottery,
      staking,
      claimVault,
      rewardVault,
      teamVault,
    } = await loadFixture(setUp));
  });
  context("Basic check", async () => {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const MANAGER =
      "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
    const AAVE_POOL_ON_MUMBAI = "0xcC6114B983E4Ed2737E9BD3961c9924e6216c704";
    it("Check if parameters are stored well through constructor", async () => {
      expect(await staking.USDT()).to.eq(usdt.target);
      expect(await staking.AAVE_USDT()).to.eq(aaveUSDT.target);
      expect(await staking.AAVE_POOL()).to.eq(AAVE_POOL_ON_MUMBAI);
      expect(await staking.LOTTERY()).to.eq(lottery.target);
      expect(await staking.REWARD_VAULT()).to.eq(rewardVault.target);
      expect(await staking.TEAM_VAULT()).to.eq(teamVault.target);
      expect(await claimVault.hasRole(MANAGER, deployer.address)).to.true;
      expect(await claimVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;
    });

    it("Check if setLockUpRound function works", async () => {
      const oneLotteryRound = 1;
      await staking.setLockupRound(oneLotteryRound);
      expect(oneLotteryRound).to.eq(await staking.lockupRound());
    });
  });
  context("Stake & getUserStakingShares", async () => {
    before(async () => {
      let userList = [user1, user2, user3];

      await gainUSDT(userList);
      await multipleApprovals(usdt, staking.target, userList);
    });

    it("User1, user2, and user3 stake 6, 2, 2 USDT", async () => {
      const currentRound = await lottery.round();
      /// User1 stakes 5 USDT
      await expect(staking.connect(user1).stake(user1StakingAmt))
        .to.emit(staking, "Stake")
        .withArgs(user1.address, currentRound, user1StakingAmt);
      /// User2 stakes 2 USDT
      await expect(staking.connect(user2).stake(user2StakingAmt))
        .to.emit(staking, "Stake")
        .withArgs(user2.address, currentRound, user2StakingAmt);
      /// User2 stakes 2 USDT
      await expect(staking.connect(user3).stake(user3StakingAmt))
        .to.emit(staking, "Stake")
        .withArgs(user3.address, currentRound, user3StakingAmt);
    });

    it("Check if the staking balance of user1, user2, and user3 are 5, 3, 2 USDT", async () => {
      const user1StakingInfo = await staking.userStakingInfo(user1.address);
      const user2StakingInfo = await staking.userStakingInfo(user2.address);
      const user3StakingInfo = await staking.userStakingInfo(user3.address);
      expect(user1StakingInfo.balance).to.eq(user1StakingAmt);
      expect(user2StakingInfo.balance).to.eq(user2StakingAmt);
      expect(user3StakingInfo.balance).to.eq(user3StakingAmt);
    });

    it("Check if the total staking amount is equal to the sum up of the balance of user1, user2, and user3", async () => {
      expect(await staking.totalStake()).to.eq(
        user1StakingAmt + user2StakingAmt + user3StakingAmt
      );
    });

    it("Check if USDT is deposited to AAVE and receives equal or bigger amount of aave token than the amount of deposited USDT ", async () => {
      expect(await aaveUSDT.balanceOf(staking.target)).to.gte(
        await staking.totalStake()
      );
    });

    it("Check if the usdt balance of staking must be zero since the usdt is deposited to aave", async () => {
      expect(await usdt.balanceOf(staking.target)).to.eq(0);
    });

    it("Check if getUserStakingShares works correctly", async () => {
      /// since the user1, user2, and user3 stake 6, 2, 2 USDT.
      /// User1 will take up 60% shares of the staking amount
      /// User2 will have 20% shares of the staking amount
      /// User3 will have 20% of it

      await expect(await staking.getUserStakingShares(user1)).to.eq(6000);
      await expect(await staking.getUserStakingShares(user2)).to.eq(2000);
      await expect(await staking.getUserStakingShares(user3)).to.eq(2000);
    });
  });
  context("Claim & getCurrentRewards ", async () => {
    let user1FusdtBalance, user2FusdtBalance, user3FusdtBalance;
    let expectedUser1Rewards, expectedUser2Rewards, expectedUser3Rewards;
    before("Round changed", async () => {
      const closingRound = await lottery.intervalBlock();
      roundChangingBlocks =
        BigInt(await ethers.provider.getBlockNumber()) + closingRound;
      await lottery.buyTickets(Array(10).fill("11112"));
      await mine(roundChangingBlocks);
      const winningNumber = "00700";
      const totalFirstPlaceWinners = 0;
      const totalSecondPlaceWinners = 0;
      const totalThirdPlaceWinners = 0;
      await lottery.announce(
        winningNumber,
        totalFirstPlaceWinners,
        totalSecondPlaceWinners,
        totalThirdPlaceWinners
      );
    });
    before(async () => {
      user1FusdtBalance = await fusdt.balanceOf(user1.address);
      user2FusdtBalance = await fusdt.balanceOf(user2.address);
      user3FusdtBalance = await fusdt.balanceOf(user3.address);
      expectedUser1Rewards = await staking.getCurrentRewards(user1.address);
      expectedUser2Rewards = await staking.getCurrentRewards(user2.address);
      expectedUser3Rewards = await staking.getCurrentRewards(user3.address);
    });
    it("Check if users can claim the correct amount of rewards", async () => {
      await expect(staking.connect(user1).claim())
        .to.emit(staking, "Claim")
        .withArgs(user1.address, expectedUser1Rewards);
      await expect(staking.connect(user2).claim())
        .to.emit(staking, "Claim")
        .withArgs(user2.address, expectedUser2Rewards);
      await expect(staking.connect(user3).claim())
        .to.emit(staking, "Claim")
        .withArgs(user3.address, expectedUser3Rewards);
    });
    it("Check if users receive the correct amount of rewards", async () => {
      const expectedFusdtBalaceOfUser1 =
        user1FusdtBalance + expectedUser1Rewards;
      const expectedFusdtBalaceOfUser2 =
        user2FusdtBalance + expectedUser2Rewards;
      const expectedFusdtBalaceOfUser3 =
        user3FusdtBalance + expectedUser3Rewards;

      expect(expectedFusdtBalaceOfUser1).to.eq(
        await fusdt.balanceOf(user1.address)
      );
      expect(expectedFusdtBalaceOfUser2).to.eq(
        await fusdt.balanceOf(user2.address)
      );
      expect(expectedFusdtBalaceOfUser3).to.eq(
        await fusdt.balanceOf(user3.address)
      );
    });
    it("Check if user1, user2, user3 has zero-rewards after claim", async () => {
      const rewardOfUser1 = await staking.getCurrentRewards(user1.address);
      const rewardOfUser2 = await staking.getCurrentRewards(user2.address);
      const rewardOfUser3 = await staking.getCurrentRewards(user3.address);
      expect(rewardOfUser1).to.eq(0);
      expect(rewardOfUser2).to.eq(0);
      expect(rewardOfUser3).to.eq(0);
    });
    it("Check if the error ZeroReward returns when users with no rewards try to claim", async () => {
      await expect(staking.claim()).to.revertedWithCustomError(
        staking,
        "ZeroReward"
      );
      await expect(staking.connect(user1).claim()).to.revertedWithCustomError(
        staking,
        "ZeroReward"
      );
      await expect(staking.connect(user2).claim()).to.revertedWithCustomError(
        staking,
        "ZeroReward"
      );
      await expect(staking.connect(user3).claim()).to.revertedWithCustomError(
        staking,
        "ZeroReward"
      );
    });
  });
  context("Unstake", async () => {
    let user1StakingBalance, user2StakingBalance, user3StakingBalance;
    let user1UsdtBalance, user2UsdtBalance, user3UsdtBalance;
    before(async () => {
      const user1StakingInfo = await staking.userStakingInfo(user1.address);
      const user2StakingInfo = await staking.userStakingInfo(user2.address);
      const user3StakingInfo = await staking.userStakingInfo(user3.address);

      user1StakingBalance = user1StakingInfo.balance;
      user2StakingBalance = user2StakingInfo.balance;
      user3StakingBalance = user3StakingInfo.balance;
      user1UsdtBalance = await usdt.balanceOf(user1.address);
      user2UsdtBalance = await usdt.balanceOf(user2.address);
      user3UsdtBalance = await usdt.balanceOf(user3.address);
    });
    before("lock-up round passed", async () => {
      const lockupRound = 1;
      await staking.setLockupRound(lockupRound);

      const closingRound = await lottery.intervalBlock();
      lotteryRoundChangingBlocks =
        BigInt(await ethers.provider.getBlockNumber()) + closingRound;
      await mine(lotteryRoundChangingBlocks);

      /// Increase lottery round
      const winningNumber = "12345";
      const totalFirstPlaceWinner = 0;
      const totalSecondPlaceWinner = 0;
      const totalThirdPlaceWinner = 0;
      await lottery.announce(
        winningNumber,
        totalFirstPlaceWinner,
        totalSecondPlaceWinner,
        totalThirdPlaceWinner
      );
    });
    it("User1, user2, and user3 unStake 5, 3, 2 USDT", async () => {
      const currentRound = await lottery.round();

      /// User1 stakes 5 USDT
      await expect(staking.connect(user1).unstake())
        .to.emit(staking, "Unstake")
        .withArgs(user1.address, currentRound, user1StakingBalance);
      /// User2 stakes 2 USDT
      await expect(staking.connect(user2).unstake())
        .to.emit(staking, "Unstake")
        /// User2 stakes 2 USDT
        .withArgs(user2.address, currentRound, user2StakingBalance);
      await expect(staking.connect(user3).unstake())
        .to.emit(staking, "Unstake")
        .withArgs(user3.address, currentRound, user3StakingBalance);
    });

    it("Check if user1, user2, and user3 receive correct amount of usdt after the unstaking token", async () => {
      const expectedUSDTbalanceOfUser1 = user1StakingBalance + user1UsdtBalance;
      const expectedUSDTbalanceOfUser2 = user2StakingBalance + user2UsdtBalance;
      const expectedUSDTbalanceOfUser3 = user3StakingBalance + user3UsdtBalance;
      expect(expectedUSDTbalanceOfUser1).to.eq(
        await usdt.balanceOf(user1.address)
      );
      expect(expectedUSDTbalanceOfUser2).to.eq(
        await usdt.balanceOf(user2.address)
      );
      expect(expectedUSDTbalanceOfUser3).to.eq(
        await usdt.balanceOf(user3.address)
      );
    });
    it("Check if the error ZeroBalance returns when a user with no rewards tries to claim", async () => {
      await expect(staking.unstake()).to.revertedWithCustomError(
        staking,
        "ZeroBalance"
      );
    });
    it("Check if the error Frozen returns when a user tries to unstak their token before the lockup time passes", async () => {
      await staking.connect(user1).stake(user1StakingAmt);
      await expect(staking.connect(user1).unstake()).to.revertedWithCustomError(
        staking,
        "Frozen"
      );
    });
  });
  context("collectProfitsFromAAVE & getProfitsFromAAVE", async () => {
    let usdtBalanceOfTeamVault;
    before("User Stakes and time passed", async () => {
      usdtBalanceOfTeamVault = await usdt.balanceOf(teamVault.target);
      await staking.connect(user2).stake(user2StakingAmt);
      const OneYear = 31536000n;
      const timePassed = BigInt(await time.latest()) + OneYear;
      await time.increaseTo(timePassed);
    });
    it("Check if getProfitsFromAAVE works well", async () => {
      const expectedProfit =
        (await aaveUSDT.balanceOf(staking.target)) -
        (await staking.totalStake());

      expect(expectedProfit).to.eq(await staking.getProfitsFromAAVE());
    });

    it("Check if teaVault can receive a profit via collectProfitsFromAAVE works well", async () => {
      const expectedUsdtBalanceOfStakingContract =
        (await staking.getProfitsFromAAVE()) + usdtBalanceOfTeamVault;
      await staking.collectProfitsFromAAVE();
      expect(expectedUsdtBalanceOfStakingContract).to.eq(
        await usdt.balanceOf(teamVault.target)
      );
    });
  });
});
