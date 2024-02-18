const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const MANAGER =
  "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
const AAVE_FAUCET_ON_MUMBAI = "0x2c95d10bA4BBEc79e562e8B3f48687751808C925";
const USDT = "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2";
const USDT_AAVE_TOKEN_ON_MUMBAI = "0x5F3a71D07E95C1E54B9Cc055D418a219586A3473";
const AAVE_POOL_ON_MUMBAI = "0xcC6114B983E4Ed2737E9BD3961c9924e6216c704";
const LINK_WHALE_MUMBAI = "0x71C05a4eA5E9d5b1Ac87Bf962a043f5265d4Bdc8";
const LINK_ON_MUMBAI = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const REGISTRAR_ON_MUMBAI = "0xb58E509b59538256854b2a223289160F83B23F92";
const VRF_COORDINATOR_ON_MUMBAI = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
const VRF_HASH_ON_MUMBAI =
  "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f";
const VRF_GAS_LIMIT = 2500000;

async function main() {
  const LOTTERY_STARTING_BLOCK = (await ethers.provider.getBlockNumber()) + 30; // starting In 60s

  const [deployer] = await ethers.getSigners();

  // USDT
  const usdt = await ethers.getContractAt("IERC20", USDT);
  // AAVE_USDT_Token
  const aaveUSDT = await ethers.getContractAt(
    "IERC20",
    USDT_AAVE_TOKEN_ON_MUMBAI
  );
  // AAVE Faucet
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_MUMBAI
  );

  // Token
  const FUSDT = await ethers.getContractFactory("FUSDT");
  const fusdt = await FUSDT.deploy(USDT);

  // 5 Vaults
  const ClaimVault = await ethers.getContractFactory("ClaimVault");
  const claimVault = await ClaimVault.deploy(fusdt.target);
  const RewardVault = await ethers.getContractFactory("RewardVault");
  const rewardVault = await RewardVault.deploy(fusdt.target);
  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(fusdt.target, deployer.address);
  const RaffleVault = await ethers.getContractFactory("RaffleVault");
  const raffleVault = await RaffleVault.deploy(
    fusdt.target,
    teamVault.target,
    rewardVault.target
  );
  const FirstPlacePrizeVault = await ethers.getContractFactory(
    "FirstPlacePrizeVault"
  );
  const firstPlacePrizeVault = await FirstPlacePrizeVault.deploy(
    fusdt.target,
    claimVault.target
  );
  // Test Prize
  const Erc20Prize = await ethers.getContractFactory("Erc20Prize");
  const erc20Prize = await Erc20Prize.deploy(
    "myERC20",
    "myERC20",
    deployer.address
  );
  const Erc721Prize = await ethers.getContractFactory("Erc721Prize");
  const erc721Prize = await Erc721Prize.deploy(
    "Lil' Heroes",
    "Lil' Heroes",
    deployer.address
  );
  const Erc1155Prize = await ethers.getContractFactory("Erc1155Prize");
  const erc1155Prize = await Erc1155Prize.deploy(deployer.address);

  // Lottery
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    fusdt.target,
    claimVault.target,
    rewardVault.target,
    firstPlacePrizeVault.target,
    teamVault.target,
    LOTTERY_STARTING_BLOCK
  );

  // Raffle
  const Raffle = await ethers.getContractFactory("Raffle");
  const raffle = await Raffle.deploy(
    fusdt.target,
    raffleVault.target,
    lottery.target
  );

  // RaffleUpkeep
  const RaffleUpkeep = await ethers.getContractFactory("RaffleUpkeep");
  const raffleUpkeep = await RaffleUpkeep.deploy(
    raffle.target,
    VRF_COORDINATOR_ON_MUMBAI,
    VRF_HASH_ON_MUMBAI,
    VRF_GAS_LIMIT,
    deployer.address
  );

  // Staking
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    USDT,
    USDT_AAVE_TOKEN_ON_MUMBAI,
    AAVE_POOL_ON_MUMBAI,
    lottery.target,
    rewardVault.target,
    teamVault.target
  );

  // link the staking contract to the lottery contract
  await lottery.setStaking(staking.target);
  const ChainLinkRegister = await ethers.getContractFactory(
    "ChainLinkRegister"
  );
  const chainLinkRegister = await ChainLinkRegister.deploy(
    LINK_ON_MUMBAI,
    REGISTRAR_ON_MUMBAI,
    VRF_COORDINATOR_ON_MUMBAI
  );
  /// Give an access
  await raffleVault.grantRole(MANAGER, raffle.target);
  await raffle.grantRole(MANAGER, raffleUpkeep.target);
  await staking.grantRole(MANAGER, lottery.target);
  await claimVault.grantRole(MANAGER, lottery.target);
  await firstPlacePrizeVault.grantRole(MANAGER, lottery.target);
  await rewardVault.grantRole(MANAGER, staking.target);
  await fusdt.approve(lottery.target, ethers.MaxUint256);
  await gainFUSDT(fusdt, [deployer, deployer, deployer, deployer, deployer]);
  /// deployer send FUSDT to the firstPlacePrizeVault vault for the future first place winners
  await fusdt.transfer(firstPlacePrizeVault, ethers.parseUnits("20", 6));

  // Fusdt
  await writeDeployedContractInfo(fusdt, "FUSDT", "fusdt");

  // 5 Vaults
  await writeDeployedContractInfo(claimVault, "ClaimVault", "claimVault");
  await writeDeployedContractInfo(rewardVault, "RewardVault", "rewardVault");
  await writeDeployedContractInfo(teamVault, "TeamVault", "teamVault");
  await writeDeployedContractInfo(raffleVault, "RaffleVault", "raffleVault");
  await writeDeployedContractInfo(
    firstPlacePrizeVault,
    "FirstPlacePrizeVault",
    "firstPlacePrizeVault"
  );
  // Test Prize tokens
  await writeDeployedContractInfo(erc20Prize, "Erc20Prize", "erc20Prize");
  await writeDeployedContractInfo(erc721Prize, "Erc721Prize", "erc721Prize");
  await writeDeployedContractInfo(erc1155Prize, "Erc1155Prize", "erc1155Prize");

  // Lottery
  await writeDeployedContractInfo(lottery, "Lottery", "lottery");

  // Raffle
  await writeDeployedContractInfo(raffle, "Raffle", "raffle");

  // RaffleUpkeep
  await writeDeployedContractInfo(raffleUpkeep, "RaffleUpkeep", "raffleUpkeep");

  // Staking
  await writeDeployedContractInfo(staking, "Staking", "staking");

  // Staking
  await writeDeployedContractInfo(
    chainLinkRegister,
    "ChainLinkRegister",
    "chainLinkRegister"
  );
}

const writeDeployedContractInfo = async (contract, contractName, fileName) => {
  const artifacts = await hre.artifacts.readArtifact(contractName);
  artifacts.chainId = hre.network.config.chainId;
  artifacts.address = contract.target;

  const abiPath = path.join(__dirname, "../abis");

  if (!fs.existsSync(abiPath)) {
    fs.mkdirSync(abiPath, { recursive: true });
  }
  fs.writeFileSync(
    abiPath + `/${fileName}.json`,
    JSON.stringify(artifacts, null, 2)
  );

  console.log(`${fileName} is generated in ${abiPath}/${fileName}.json...`);
  console.log(`${fileName}'s target is ${contract.target}`);
  console.log("");
};

const gainFUSDT = async (fusdt, userList) => {
  const USDT = "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2";
  const AAVE_FAUCET_ON_MUMBAI = "0x2c95d10bA4BBEc79e562e8B3f48687751808C925";
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_MUMBAI
  );
  const usdt = await ethers.getContractAt("IERC20", USDT);

  await userList.reduce(async (acc, currentUser) => {
    await acc;
    let tx = await usdt
      .connect(currentUser)
      .approve(fusdt.target, ethers.MaxUint256);
    await tx.wait();
    tx = await aaveFaucet.mint(
      USDT,
      currentUser.address,
      ethers.parseUnits("10", 6)
    );
    await tx.wait();
    tx = await fusdt.connect(currentUser).wrapUSDT(ethers.parseUnits("10", 6));
    await tx.wait();
  }, Promise.resolve());
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
