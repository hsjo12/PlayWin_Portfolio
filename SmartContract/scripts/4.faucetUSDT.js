const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";

async function main() {
  const [deployer] = await ethers.getSigners();

  // USDT
  const usdt = await ethers.getContractAt("IERC20", USDT);

  // AAVE Faucet
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
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
