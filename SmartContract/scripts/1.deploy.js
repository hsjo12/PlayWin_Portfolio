const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const MANAGER =
  "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
const USDT_AAVE_TOKEN_ON_SEPOLIA = "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6";
const AAVE_POOL_ON_SEPOLIA = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
const LINK_ON_SEPOLIA = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
const REGISTRAR_ON_SEPOLIA = "0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976";
const VRF_COORDINATOR_ON_SEPOLIA = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
const VRF_HASH_ON_SEPOLIA =
  "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
const VRF_GAS_LIMIT = 2_500_000;

async function main() {
  const LOTTERY_STARTING_TIME = Math.floor(new Date() / 1000) + 600; // starting In 600s

  const [deployer] = await ethers.getSigners();

  // USDT
  const usdt = await ethers.getContractAt("IERC20", USDT);
  // AAVE_USDT_Token
  const aaveUSDT = await ethers.getContractAt(
    "IERC20",
    USDT_AAVE_TOKEN_ON_SEPOLIA
  );
  // AAVE Faucet
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
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
    LOTTERY_STARTING_TIME
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
    VRF_COORDINATOR_ON_SEPOLIA,
    VRF_HASH_ON_SEPOLIA,
    VRF_GAS_LIMIT,
    deployer.address
  );

  // Staking
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    USDT,
    USDT_AAVE_TOKEN_ON_SEPOLIA,
    AAVE_POOL_ON_SEPOLIA,
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
    LINK_ON_SEPOLIA,
    REGISTRAR_ON_SEPOLIA,
    VRF_COORDINATOR_ON_SEPOLIA
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

  ////// Write contracts abis
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

  ////// Verify Contracts
  // Token
  await verify(fusdt.target, [USDT]);

  // 5 Vaults
  await verify(claimVault.target, [fusdt.target]);
  await verify(rewardVault.target, [fusdt.target]);
  await verify(teamVault.target, [fusdt.target, deployer.address]);
  await verify(raffleVault.target, [
    fusdt.target,
    teamVault.target,
    rewardVault.target,
  ]);
  await verify(firstPlacePrizeVault.target, [fusdt.target, claimVault.target]);

  // Test Prize
  await verify(erc20Prize.target, ["myERC20", "myERC20", deployer.address]);
  await verify(erc721Prize.target, [
    "Lil' Heroes",
    "Lil' Heroes",
    deployer.address,
  ]);
  await verify(erc1155Prize.target, [deployer.address]);
  // Lottery
  await verify(lottery.target, [
    fusdt.target,
    claimVault.target,
    rewardVault.target,
    firstPlacePrizeVault.target,
    teamVault.target,
    LOTTERY_STARTING_TIME,
  ]);

  // Raffle
  await verify(raffle.target, [
    fusdt.target,
    raffleVault.target,
    lottery.target,
  ]);

  // RaffleUpkeep
  await verify(raffle.target, [
    raffle.target,
    VRF_COORDINATOR_ON_SEPOLIA,
    VRF_HASH_ON_SEPOLIA,
    VRF_GAS_LIMIT,
    deployer.address,
  ]);

  // Staking
  await verify(staking.target, [
    USDT,
    USDT_AAVE_TOKEN_ON_SEPOLIA,
    AAVE_POOL_ON_SEPOLIA,
    lottery.target,
    rewardVault.target,
    teamVault.target,
  ]);
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
  const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
  const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
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

const verify = async (contractAddress, args) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
