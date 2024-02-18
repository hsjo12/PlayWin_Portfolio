const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { inUSDT, setUp, gainFUSDT } = require("../utils/setUp");
const { ethers } = require("hardhat");

describe("rewardVault", () => {
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MANAGER =
    "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  let deployer, user1;
  let fusdt;
  let rewardVault;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      fusdt,
      rewardVault,
    } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      expect(fusdt.target).to.eq(await rewardVault.FUSDT());
      expect(await rewardVault.hasRole(MANAGER, deployer.address)).to.true;
      expect(await rewardVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;
    });
  });

  context("getCurrentFUSDTBalance & transferFUSDT", () => {
    const SENT_AMOUNT_IN_FUSDT = inUSDT(5);
    let rewardVaultFUSDTBalance;
    let user1FUSDTBalance;
    before("Send FUSDT to rewardVault", async () => {
      rewardVaultFUSDTBalance = await fusdt.balanceOf(rewardVault.target);
      user1FUSDTBalance = await fusdt.balanceOf(user1.address);
      await gainFUSDT(fusdt, [deployer]);
      await fusdt.transfer(rewardVault.target, SENT_AMOUNT_IN_FUSDT);
    });

    it("Check If getCurrentFUSDTBalance returns the correct amount of FUSDT", async () => {
      const expecetedrewardVaultFUDSTBalance =
        rewardVaultFUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedrewardVaultFUDSTBalance).to.eq(
        await rewardVault.getCurrentFUSDTBalance()
      );
    });

    it("Check If transferFUSDT works to send FUSDT to USER1", async () => {
      // Send FUSDT to user1
      await rewardVault.transferFUSDT(user1.address, SENT_AMOUNT_IN_FUSDT);
      const expecetedUser1FUDSTBalance =
        user1FUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedUser1FUDSTBalance).to.eq(
        await fusdt.balanceOf(user1.address)
      );
    });
  });

  context("SaveReward", async () => {
    it("Check if saveReward works well", async () => {
      const round = 1;
      const amount = 10;
      await rewardVault.saveReward(round, amount);
      expect(await rewardVault.totalRewardByRound(round)).to.eq(amount);
    });
  });
});
