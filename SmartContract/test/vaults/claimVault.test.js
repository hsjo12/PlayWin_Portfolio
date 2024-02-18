const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { inUSDT, setUp, gainFUSDT } = require("../utils/setUp");
const { ethers } = require("hardhat");

describe("ClaimVault", () => {
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const MANAGER =
    "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  let deployer, user1;
  let fusdt;
  let claimVault;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      stakingUser1,
      stakingUser2,
      fusdt,
      claimVault,
    } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      expect(fusdt.target).to.eq(await claimVault.FUSDT());
      expect(await claimVault.hasRole(MANAGER, deployer.address)).to.true;
      expect(await claimVault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;
    });
  });

  context("getCurrentFUSDTBalance & transferFUSDT", () => {
    const SENT_AMOUNT_IN_FUSDT = inUSDT(5);
    let claimVaultFUSDTBalance;
    let user1FUSDTBalance;
    before("Send FUSDT to claimVault", async () => {
      claimVaultFUSDTBalance = await fusdt.balanceOf(claimVault.target);
      user1FUSDTBalance = await fusdt.balanceOf(user1.address);
      await gainFUSDT(fusdt, [deployer]);
      await fusdt.transfer(claimVault.target, SENT_AMOUNT_IN_FUSDT);
    });

    it("Check If getCurrentFUSDTBalance returns the correct amount of FUSDT", async () => {
      const expecetedClaimVaultFUDSTBalance =
        claimVaultFUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedClaimVaultFUDSTBalance).to.eq(
        await claimVault.getCurrentFUSDTBalance()
      );
    });

    it("Check If transferFUSDT works to send FUSDT to USER1", async () => {
      // Send FUSDT to user1
      await claimVault.transferFUSDT(user1.address, SENT_AMOUNT_IN_FUSDT);
      const expecetedUser1FUDSTBalance =
        user1FUSDTBalance + SENT_AMOUNT_IN_FUSDT;
      expect(expecetedUser1FUDSTBalance).to.eq(
        await fusdt.balanceOf(user1.address)
      );
    });
  });
});
