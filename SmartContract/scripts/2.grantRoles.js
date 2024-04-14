const raffleVaultJson = require("../abis/RaffleVault.json");
const raffleJson = require("../abis/Raffle.json");
const stakingJson = require("../abis/Staking.json");
const claimVaultJson = require("../abis/ClaimVault.json");
const firstPlacePrizeVaultJson = require("../abis/firstPlacePrizeVault.json");
const rewardVaultJson = require("../abis/RewardVault.json");

const raffleUpkeepJson = require("../abis/RaffleUpkeep.json");
const lotteryJson = require("../abis/lottery.json");

const hre = require("hardhat");
const { ethers } = hre;

const MANAGER =
  "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";

async function main() {
  const raffleVault = await ethers.getContractAt(
    raffleVaultJson.abi,
    raffleVaultJson.address
  );
  const raffle = await ethers.getContractAt(raffleJson.abi, raffleJson.address);
  const staking = await ethers.getContractAt(
    stakingJson.abi,
    stakingJson.address
  );
  const claimVault = await ethers.getContractAt(
    claimVaultJson.abi,
    claimVaultJson.address
  );
  const firstPlacePrizeVault = await ethers.getContractAt(
    firstPlacePrizeVaultJson.abi,
    firstPlacePrizeVaultJson.address
  );
  const rewardVault = await ethers.getContractAt(
    rewardVaultJson.abi,
    rewardVaultJson.address
  );

  /// Give an access
  await raffleVault.grantRole(MANAGER, raffle.target);
  await raffle.grantRole(MANAGER, raffleUpkeepJson.address);
  await staking.grantRole(MANAGER, lotteryJson.address);
  await claimVault.grantRole(MANAGER, lotteryJson.address);
  await firstPlacePrizeVault.grantRole(MANAGER, lotteryJson.address);
  await rewardVault.grantRole(MANAGER, staking.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
