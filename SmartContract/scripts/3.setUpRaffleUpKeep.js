const hre = require("hardhat");
const { ethers } = hre;

const ChainLinkRegisterJson = require("../abis/ChainLinkRegister.json");
const RaffleUpkeepJson = require("../abis/RaffleUpkeep.json");
const LINK_ON_SEPOLIA = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
const VRF_COORDINATOR_ON_SEPOLIA = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
async function main() {
  const vrfCoordinator = await ethers.getContractAt(
    [
      "function acceptSubscriptionOwnerTransfer(uint64 subId) external",
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
    ],
    VRF_COORDINATOR_ON_SEPOLIA
  );

  const raffleUpkeep = await ethers.getContractAt(
    RaffleUpkeepJson.abi,
    RaffleUpkeepJson.address
  );
  const chainLinkRegister = await ethers.getContractAt(
    ChainLinkRegisterJson.abi,
    ChainLinkRegisterJson.address
  );
  const link = await ethers.getContractAt("ILink", LINK_ON_SEPOLIA);
  const [deployer] = await ethers.getSigners();
  const listBalance = await link.balanceOf(deployer.address);
  console.log(`Your $Link balance : ${listBalance}`);
  if (listBalance < ethers.parseEther("20")) {
    return console.log("Insufficient $Link balance");
  }

  /////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////

  const upkeepName = "raffleUpkeep";
  const encryptedEmail = "0x"; /// empty
  const upkeepContract = raffleUpkeep.target;
  const gasLimit = 5000000;
  const adminAddress = deployer.address; // the ownership of the id to be created
  const triggerType = 0;
  const checkData = "0x";
  const triggerConfig = "0x";
  const offchainConfig = "0x";
  const amount = ethers.parseEther("10"); /// deposit Link

  const params = [
    upkeepName,
    encryptedEmail,
    upkeepContract,
    gasLimit,
    adminAddress,
    triggerType,
    checkData,
    triggerConfig,
    offchainConfig,
    amount,
  ];

  /// Create upkeep Id, deposit links, and add raffleUpkeep to the Upkeep list
  await link.approve(chainLinkRegister.target, ethers.MaxUint256);
  let tx = await chainLinkRegister.registerUpKeep(params);

  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      const upkeepId = await chainLinkRegister.upkeepRegisterId();
      console.log(`Raffle upkeep is created, upkeep id is ${upkeepId}`);
    } else {
      return console.log("Transaction failed");
    }
  });
  let vrfId;
  /// Create the vrf subscription id and add raffleUpkeep to a consumer list.
  tx = await chainLinkRegister.registerVRF(raffleUpkeep.target);
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      vrfId = await chainLinkRegister.vrfSubscriptionId();
      console.log(`Vrf is created, vrf id is ${vrfId}`);
    } else {
      return console.log("Transaction failed");
    }
  });

  /// Store the created vrf subscription id into the raffleUpkeep contract
  tx = await raffleUpkeep.setSubscriptionId(vrfId);
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      console.log(`Vrf is set up in the raffleUpkeep contract`);
    } else {
      return console.log("Transaction failed");
    }
  });

  /// Move the ownership of the id from the raffleUpkeep to the deployer
  tx = await vrfCoordinator.acceptSubscriptionOwnerTransfer(vrfId);
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      console.log(`Vrf ownership is moved to the deployer`);
    } else {
      return console.log("Transaction failed");
    }
  });

  /// Deposit Links under the id
  tx = await link.approve(VRF_COORDINATOR_ON_SEPOLIA, ethers.MaxUint256);
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      console.log(`Link is approved for deposit of the VRF subscription`);
    } else {
      return console.log("Transaction failed");
    }
  });

  coder = ethers.AbiCoder.defaultAbiCoder();
  await link.transferAndCall(
    VRF_COORDINATOR_ON_SEPOLIA,
    ethers.parseEther("10"),
    coder.encode(["uint256"], [vrfId])
  );

  console.log("Check your upkeep here : https://automation.chain.link/mumbai");
  console.log("Check your VRF here : https://vrf.chain.link/mumbai");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
