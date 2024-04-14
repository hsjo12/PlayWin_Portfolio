const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const ERC1155PrizeJson = require("../abis/Erc1155Prize.json");
const RaffleJson = require("../abis/Raffle.json");
const FusdtJson = require("../abis/fusdt.json");
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

  // Token
  const fusdt = await ethers.getContractAt(FusdtJson.abi, FusdtJson.address);

  const erc1155Prize = await ethers.getContractAt(
    ERC1155PrizeJson.abi,
    ERC1155PrizeJson.address
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

  // /// Approve
  tx = await usdt.approve(fusdt.target, ethers.MaxUint256);
  await tx.wait();

  /// Wrap USDT to FUSDT
  tx = await fusdt.wrapUSDT(ethers.parseUnits("10", 6));
  await tx.wait();
  console.log("USDT WRapping...");

  /// fusdt approval for the raffle deposit
  tx = await fusdt.approve(raffle.target, ethers.MaxUint256);
  await tx.wait();

  /// erc1155Prize approval
  tx = await erc1155Prize.setApprovalForAll(raffle.target, true);
  await tx.wait();
  console.log("approval...");

  const erc1155PrizeId = 1;
  const erc1155PrizeAmount = 1;
  tx = await erc1155Prize.mint(
    deployer.address,
    erc1155PrizeId,
    erc1155PrizeAmount
  );
  console.log("erc1155Prize Mint...");

  const entryPrice = ethers.parseUnits("1", 6);
  const deadline =
    Math.floor(new Date().getTime() / 1000) +
    Math.floor(Math.random() * 10000) +
    100 * 86400;
  const erc1155RaffleInfo = createErc1155RaffleInfoParam(
    erc1155Prize.target,
    erc1155PrizeAmount,
    erc1155PrizeId,
    deployer.address,
    entryPrice,
    deadline
  );

  tx = await raffle.create(erc1155RaffleInfo);
  await tx.wait();
  console.log("ERC1155Raffle is created...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const createErc1155RaffleInfoParam = (
  erc1155Target,
  prizeAmount,
  prizeId,
  creator,
  entryPrice,
  deadline
) => {
  let PRIZE_TYPE = 2;
  const STATUS = 0; // pending
  let PRIZE = erc1155Target;
  let PRIZE_AMOUNT = prizeAmount;
  let PRIZE_ID = prizeId;
  const DEADLINE = deadline;
  const ENTRY_PRICE = entryPrice; // FEE will be FUSDT
  const MIN_RAFFLE_ENTRIES = 10;
  const MAX_RAFFLE_ENTRIES = 20;
  const MIN_ENTRIES_PER_USER = 7;
  const MAX_ENTRIES_PER_USER = 10;
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
