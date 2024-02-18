const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { inUSDT, setUp, gainFUSDT } = require("../utils/setUp");
const { ethers } = require("hardhat");

describe("FirstPlacePrizeVault.test", () => {
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MANAGER =
    "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  let deployer, user1;
  let fusdt;
  let firstPlacePrizeVault, claimVault;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      fusdt,
      firstPlacePrizeVault,
      claimVault,
    } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      await firstPlacePrizeVault.setClaimVault(user1.address);
      expect(await firstPlacePrizeVault.claimVault()).to.eq(user1.address);
      await firstPlacePrizeVault.setClaimVault(claimVault.target);
      expect(fusdt.target).to.eq(await firstPlacePrizeVault.FUSDT());
      expect(await firstPlacePrizeVault.hasRole(MANAGER, deployer.address)).to
        .true;
      expect(
        await firstPlacePrizeVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)
      ).to.true;
    });
  });

  context("getCurrentFUSDTBalance & sendFirstPlacePrizeSourcedFromTeam", () => {
    const SENT_AMOUNT_IN_FUSDT = inUSDT(5);
    let firstPlacePrizeVaultFUSDTBalance;
    let claimVaultFUSDTBalance;
    before("Send FUSDT to firstPlacePrizeVault", async () => {
      firstPlacePrizeVaultFUSDTBalance = await fusdt.balanceOf(
        firstPlacePrizeVault.target
      );
      claimVaultFUSDTBalance = await fusdt.balanceOf(claimVault.target);
      await gainFUSDT(fusdt, [deployer]);
      await fusdt.transfer(firstPlacePrizeVault.target, SENT_AMOUNT_IN_FUSDT);
    });

    it("Check If getCurrentFUSDTBalance returns the correct amount of FUSDT", async () => {
      const expecetedFirstPlacePrizeVaultFUDSTBalance =
        firstPlacePrizeVaultFUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedFirstPlacePrizeVaultFUDSTBalance).to.eq(
        await firstPlacePrizeVault.getCurrentFUSDTBalance()
      );
    });

    it("Check If sendFirstPlacePrizeSourcedFromTeam works to send FUSDT to claimVault", async () => {
      // Send FUSDT to user1
      await firstPlacePrizeVault.sendFirstPlacePrizeSourcedFromTeam(
        SENT_AMOUNT_IN_FUSDT
      );
      const expecetedUser1FUDSTBalance =
        claimVaultFUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedUser1FUDSTBalance).to.eq(
        await fusdt.balanceOf(claimVault.target)
      );
    });
  });
});
