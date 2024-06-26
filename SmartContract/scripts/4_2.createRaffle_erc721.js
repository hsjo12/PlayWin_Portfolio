const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const ERC721PrizeJson = require("../abis/Erc721Prize.json");

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

  // Test Prize

  const erc721Prize = await ethers.getContractAt(
    ERC721PrizeJson.abi,
    ERC721PrizeJson.address
  );

  // Raffle
  const raffle = await ethers.getContractAt(RaffleJson.abi, RaffleJson.address);

  const len = 10;

  ///Mint USDT
  await Array(len)
    .fill(0)
    .reduce(async (acc, cv) => {
      await acc;
      let tx = await aaveFaucet.mint(
        USDT,
        deployer.address,
        ethers.parseUnits("10", 6)
      );
      await tx.wait();
      console.log("USDT Mint...");
    }, Promise.resolve());

  // /// Approve
  tx = await usdt.approve(fusdt.target, ethers.MaxUint256);
  await tx.wait();

  /// Wrap USDT to FUSDT
  tx = await fusdt.wrapUSDT(ethers.parseUnits(String(30 * len), 6));
  await tx.wait();
  console.log("USDT WRapping...");

  /// fusdt approval for the raffle deposit
  tx = await fusdt.approve(raffle.target, ethers.MaxUint256);
  await tx.wait();

  /// erc721Prize approval
  tx = await erc721Prize.setApprovalForAll(raffle.target, true);
  await tx.wait();

  const currentId = Number(await erc721Prize.id());
  /// mint NFT
  await Array(len)
    .fill(0)
    .reduce(async (acc, cv) => {
      await acc;
      tx = await erc721Prize.mint(deployer.address);
      await tx.wait();
      console.log("erc721Prize Mint...");
    }, Promise.resolve());

  const entryPrice = ethers.parseUnits("1", 6);

  await Array(len)
    .fill(0)
    .map((v, i) => i + currentId)
    .reduce(async (acc, nft_id) => {
      await acc;
      const deadline =
        Math.floor(new Date().getTime() / 1000) +
        Math.floor(Math.random() * 10000) +
        95 * 86400;
      const erc721RaffleInfo = createErc721RaffleInfoParam(
        erc721Prize.target,
        deployer.address,
        nft_id,
        entryPrice,
        deadline
      );

      tx = await raffle.create(erc721RaffleInfo);
      await tx.wait().then(async (receipt) => {
        if (receipt && receipt.status == 1) {
          console.log("Tx is confirmed");
        } else {
          console.log("Tx is failed");
        }
      });
      await holdOn(3000);
    }, Promise.resolve());

  console.log("ERC721Raffle is created...");
}

const holdOn = (time) => new Promise((resolve) => setTimeout(resolve, time));

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const createErc721RaffleInfoParam = (
  erc721Target,
  creator,
  prizeId,
  entryPrice,
  deadline
) => {
  let PRIZE_TYPE = 1;
  const STATUS = 0; // pending
  let PRIZE = erc721Target;
  let PRIZE_AMOUNT = 1;
  let PRIZE_ID = prizeId;
  const DEADLINE = deadline;
  const ENTRY_PRICE = entryPrice; // FEE will be FUSDC
  const MIN_RAFFLE_ENTRIES = 10;
  const MAX_RAFFLE_ENTRIES = 20;
  const MIN_ENTRIES_PER_USER = 2;
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
