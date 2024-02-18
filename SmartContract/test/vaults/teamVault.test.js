const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { inUSDT, setUp, gainFUSDT } = require("../utils/setUp");
const { ethers } = require("hardhat");

describe("teamVault", () => {
  let deployer, user1;
  let fusdt;
  let teamVault;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      fusdt,
      teamVault,
    } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      expect(fusdt.target).to.eq(await teamVault.FUSDT());
      expect(await teamVault.owner()).to.eq(deployer.address);
    });
  });

  context("getCurrentFUSDTBalance & withdraw", () => {
    const SENT_AMOUNT_IN_FUSDT = inUSDT(5);
    let teamVaultFUSDTBalance;
    let user1FUSDTBalance;
    before("Send FUSDT to teamVault", async () => {
      teamVaultFUSDTBalance = await fusdt.balanceOf(teamVault.target);
      user1FUSDTBalance = await fusdt.balanceOf(user1.address);
      await gainFUSDT(fusdt, [deployer]);
      await fusdt.transfer(teamVault.target, SENT_AMOUNT_IN_FUSDT);
    });

    it("Check If getCurrentFUSDTBalance returns the correct amount of FUSDT", async () => {
      const expecetedteamVaultFUDSTBalance =
        teamVaultFUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedteamVaultFUDSTBalance).to.eq(
        await teamVault.getCurrentFUSDTBalance()
      );
    });

    it("Check If withdraw works to send FUSDT to USER1", async () => {
      // Send FUSDT to user1
      await teamVault.withdraw(user1.address);
      const expecetedUser1FUDSTBalance =
        user1FUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedUser1FUDSTBalance).to.eq(
        await fusdt.balanceOf(user1.address)
      );
    });
  });
});
