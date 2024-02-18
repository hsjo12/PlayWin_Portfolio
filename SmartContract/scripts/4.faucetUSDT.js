const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const AAVE_FAUCET_ON_MUMBAI = "0x2c95d10bA4BBEc79e562e8B3f48687751808C925";
const USDT = "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2";

async function main() {
  const [deployer] = await ethers.getSigners();

  // USDT
  const usdt = await ethers.getContractAt("IERC20", USDT);

  // AAVE Faucet
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_MUMBAI
  );

  Array(1000)
    .fill(0)
    .reduce(async (acc, cv) => {
      await acc;
      ///Mint USDT
      let tx = await aaveFaucet.mint(
        USDT,
        deployer.address,
        ethers.parseUnits("10", 6)
      );
      await tx.wait();
      console.log("USDT Mint...");
    }, Promise.resolve());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
