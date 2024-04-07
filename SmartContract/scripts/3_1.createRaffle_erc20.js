const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;
const ERC20PrizeJson = require("../abis/Erc20Prize.json");

const RaffleJson = require("../abis/Raffle.json");
const FusdtJson = require("../abis/fusdt.json");
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

  // Token
  const fusdt = await ethers.getContractAt(FusdtJson.abi, FusdtJson.address);

  // Test Prize
  const erc20Prize = await ethers.getContractAt(
    ERC20PrizeJson.abi,
    ERC20PrizeJson.address
  );

  // Raffle
  const raffle = await ethers.getContractAt(RaffleJson.abi, RaffleJson.address);

  ///Mint USDT
  let tx = await aaveFaucet.mint(
    USDT,
    deployer.address,
    ethers.parseUnits("10", 6)
  );
  await tx.wait();
  console.log("USDT Mint...");

  // Approve
  tx = await usdt.approve(fusdt.target, ethers.MaxUint256);
  await tx.wait();

  /// Wrap USDT to FUSDT
  tx = await fusdt.wrapUSDT(ethers.parseUnits("10", 6));
  await tx.wait();
  console.log("USDT WRapping...");

  /// fusdt approval for the raffle deposit
  tx = await fusdt.approve(raffle.target, ethers.MaxUint256);
  await tx.wait();

  /// erc20Prize approval
  tx = await erc20Prize.approve(raffle.target, ethers.MaxUint256);
  await tx.wait();
  console.log("approval...");

  const erc20PrizeAmount = ethers.parseEther("10");
  tx = await erc20Prize.mint(deployer.address, erc20PrizeAmount);
  await tx.wait();
  console.log("ERC20 is minted...");

  const entryPrice = ethers.parseUnits("1", 6);

  const deadline =
    Math.floor(new Date().getTime() / 1000) +
    Math.floor(Math.random() * 10000) +
    100 * 86400;
  const erc20RaffleInfo = createErc20RaffleInfoParam(
    erc20Prize.target,
    erc20PrizeAmount,
    deployer.address,
    entryPrice,
    deadline
  );

  tx = await raffle.create(erc20RaffleInfo);
  await tx.wait();

  console.log("ERC20Raffle is created...");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const createErc20RaffleInfoParam = (
  erc20Target,
  prizeAmount,
  creator,
  entryPrice,
  deadline
) => {
  let PRIZE_TYPE = 0;
  const STATUS = 0; // pending
  let PRIZE = erc20Target;
  let PRIZE_AMOUNT = prizeAmount;
  let PRIZE_ID = 0;
  const DEADLINE = deadline;
  const ENTRY_PRICE = entryPrice; // FEE will be FUSDC
  const MIN_RAFFLE_ENTRIES = 2;
  const MAX_RAFFLE_ENTRIES = 5;
  const MIN_ENTRIES_PER_USER = 1;
  const MAX_ENTRIES_PER_USER = 3;
  let CREATOR = creator;
  const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
  const WINNING_NUMBER = 0; // Default Value
  const TOTAL_ENTRIES = 0; // Default Value

  return [
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
    CREATOR,
    WINNER,
    WINNING_NUMBER,
    TOTAL_ENTRIES,
  ];
};
