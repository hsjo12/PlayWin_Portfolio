const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { inUSDT, setUp, gainUSDT } = require("./utils/setUp");
const { ethers } = require("hardhat");

describe("FUSDT", () => {
  let user1;
  let fusdt, usdt;

  before(async () => {
    ({ user1, usdt, fusdt } = await loadFixture(setUp));
  });

  context("Basic check", () => {
    it("Check if parameters are stored well through constructor", async () => {
      expect(await fusdt.USDT()).to.eq(usdt.target);
    });
  });

  context("wrapUSDT", () => {
    const WRAP_UNWRAP_AMOUNT = inUSDT(1);

    before("Faucet USDT", async () => {
      await gainUSDT([user1]);
      await fusdt.connect(user1).approve(fusdt.target, ethers.MaxUint256);
      await usdt.connect(user1).approve(fusdt.target, ethers.MaxUint256);
      uSDTBalanceOfUser1 = await usdt.balanceOf(user1.address);
      fUSDTBalanceOfUser1 = await fusdt.balanceOf(user1.address);

      uSDTBalanceOfFUSDT = await usdt.balanceOf(fusdt.target);
      totalSupplyOfFUSDT = await fusdt.totalSupply();
    });

    it("User1 wrap USDT", async () => {
      await expect(fusdt.connect(user1).wrapUSDT(WRAP_UNWRAP_AMOUNT))
        .to.emit(fusdt, "WrapUSDT")
        .withArgs(user1.address, WRAP_UNWRAP_AMOUNT);
    });

    it("Check User1's balance of usdt and fusdt", async () => {
      const expectedUSDTBalanceOfUser1 =
        uSDTBalanceOfUser1 - WRAP_UNWRAP_AMOUNT;
      const expectedFUSDTBalanceOfUser1 =
        fUSDTBalanceOfUser1 + WRAP_UNWRAP_AMOUNT;
      expect(await usdt.balanceOf(user1.address)).to.eq(
        expectedUSDTBalanceOfUser1
      );
      expect(await fusdt.balanceOf(user1.address)).to.eq(
        expectedFUSDTBalanceOfUser1
      );
    });

    it("Check FUSD contract's balance of usdt and, the total supply of FUSDT ", async () => {
      const expectedUSDTBalanceOfFUSDT =
        uSDTBalanceOfFUSDT + WRAP_UNWRAP_AMOUNT;
      const expectedTotalSupplyOfFUSDT =
        totalSupplyOfFUSDT + WRAP_UNWRAP_AMOUNT;
      expect(await usdt.balanceOf(fusdt.target)).to.eq(
        expectedUSDTBalanceOfFUSDT
      );
      expect(await fusdt.totalSupply()).to.eq(expectedTotalSupplyOfFUSDT);
    });
  });

  context("unWrapUSDT", () => {
    const WRAP_UNWRAP_AMOUNT = inUSDT(1);

    before("wrap USDT", async () => {
      await gainUSDT([user1]);
      await fusdt.connect(user1).approve(fusdt.target, ethers.MaxUint256);
      await usdt.connect(user1).approve(fusdt.target, ethers.MaxUint256);
      await fusdt.connect(user1).wrapUSDT(WRAP_UNWRAP_AMOUNT);

      uSDTBalanceOfUser1 = await usdt.balanceOf(user1.address);
      fUSDTBalanceOfUser1 = await fusdt.balanceOf(user1.address);

      uSDTBalanceOfFUSDT = await usdt.balanceOf(fusdt.target);
      totalSupplyOfFUSDT = await fusdt.totalSupply();
    });

    it("User1 uwraps USDT", async () => {
      await expect(fusdt.connect(user1).unWrapUSDT(WRAP_UNWRAP_AMOUNT))
        .to.emit(fusdt, "UnWrapUSDT")
        .withArgs(user1.address, WRAP_UNWRAP_AMOUNT);
    });

    it("Check User1's balance of usdt and fusdt", async () => {
      const expectedUSDTBalanceOfUser1 =
        uSDTBalanceOfUser1 + WRAP_UNWRAP_AMOUNT;
      const expectedFUSDTBalanceOfUser1 =
        fUSDTBalanceOfUser1 - WRAP_UNWRAP_AMOUNT;
      expect(await usdt.balanceOf(user1.address)).to.eq(
        expectedUSDTBalanceOfUser1
      );
      expect(await fusdt.balanceOf(user1.address)).to.eq(
        expectedFUSDTBalanceOfUser1
      );
    });

    it("Check FUSD contract's balance of usdt and, the total supply of FUSDT ", async () => {
      const expectedUSDTBalanceOfFUSDT =
        uSDTBalanceOfFUSDT - WRAP_UNWRAP_AMOUNT;
      const expectedTotalSupplyOfFUSDT =
        totalSupplyOfFUSDT - WRAP_UNWRAP_AMOUNT;

      expect(await usdt.balanceOf(fusdt.target)).to.eq(
        expectedUSDTBalanceOfFUSDT
      );
      expect(await fusdt.totalSupply()).to.eq(expectedTotalSupplyOfFUSDT);
    });
  });
});
