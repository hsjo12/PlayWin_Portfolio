const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

const inETH = (value) => ethers.parseEther(value.toString());
const inUSDT = (value) => ethers.parseUnits(value.toString(), 6);

const setUp = async () => {
  const MANAGER =
    "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
  const AAVE_FAUCET_ON_MUMBAI = "0x2c95d10bA4BBEc79e562e8B3f48687751808C925";
  const USDT = "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2";
  const USDT_AAVE_TOKEN_ON_MUMBAI =
    "0x5F3a71D07E95C1E54B9Cc055D418a219586A3473";
  const AAVE_POOL_ON_MUMBAI = "0xcC6114B983E4Ed2737E9BD3961c9924e6216c704";
  const LINK_WHALE_MUMBAI = "0x71C05a4eA5E9d5b1Ac87Bf962a043f5265d4Bdc8";
  const LINK_ON_MUMBAI = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const REGISTRAR_ON_MUMBAI = "0xb58E509b59538256854b2a223289160F83B23F92";
  const VRF_COORDINATOR_ON_MUMBAI =
    "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
  const VRF_HASH_ON_MUMBAI =
    "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f";
  const VRF_GAS_LIMIT = 2500000;
  const LOTTERY_STARTING_TIME = Math.floor(new Date() / 1000) + 60; // starting In 60s
  const [deployer, user1, user2, user3, user4, stakingUser1, stakingUser2] =
    await ethers.getSigners();

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

  // Vrf coordinator
  const vrfCoordinator = await ethers.getContractAt(
    [
      "function acceptSubscriptionOwnerTransfer(uint64 subId) external",
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
    ],
    VRF_COORDINATOR_ON_MUMBAI
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
    "erc20Prize",
    "erc20Prize",
    deployer.address
  );
  const Erc721Prize = await ethers.getContractFactory("Erc721Prize");
  const erc721Prize = await Erc721Prize.deploy(
    "erc721Prize",
    "erc721Prize",
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

  // Sending Link
  const whale = await ethers.getImpersonatedSigner(LINK_WHALE_MUMBAI);
  // LINK
  const link = await ethers.getContractAt("ILink", LINK_ON_MUMBAI);
  // Send Link to the deployer
  await link.connect(whale).transfer(deployer.address, inETH(100));
  /*
  /// Set up Upkeep
  const upkeepName = "raffleUpkeep";
  const encryptedEmail = "0x"; /// empty
  const upkeepContract = raffleUpkeep.target;
  const gasLimit = 5000000;
  const adminAddress = deployer.address; // the ownership of the id to be created
  const triggerType = 0;
  const checkData = "0x";
  const triggerConfig = "0x";
  const offchainConfig = "0x";
  const amount = inETH(10); /// deposit Link

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
  await chainLinkRegister.registerUpKeep(params);
  const upkeepId = await chainLinkRegister.upkeepRegisterId();

  /// Set up VRF
  /// Create the vrf subscription id and add raffleUpkeep to a consumer list.
  await chainLinkRegister.registerVRF(raffleUpkeep.target);
  const vrfId = await chainLinkRegister.vrfSubscriptionId();
  /// Store the created vrf subscription id into the raffleUpkeep contract
  await raffleUpkeep.setSubscriptionId(vrfId);
  /// Move the ownership of the id from the raffleUpkeep to the deployer
  await vrfCoordinator.acceptSubscriptionOwnerTransfer(vrfId);

  /// Deposit Links under the id
  await link.approve(VRF_COORDINATOR_ON_MUMBAI, ethers.MaxUint256);
  coder = ethers.AbiCoder.defaultAbiCoder();
  await link.transferAndCall(
    VRF_COORDINATOR_ON_MUMBAI,
    inETH(10),
    coder.encode(["uint256"], [vrfId])
  );

  console.log(
    "The current Balance of VRF : ",
    (await vrfCoordinator.getSubscription(vrfId)).balance
  );
  */
  /// Give an access
  await raffleVault.grantRole(MANAGER, raffle.target);
  await raffle.grantRole(MANAGER, raffleUpkeep.target);
  await staking.grantRole(MANAGER, lottery.target);
  await claimVault.grantRole(MANAGER, lottery.target);
  await firstPlacePrizeVault.grantRole(MANAGER, lottery.target);
  await rewardVault.grantRole(MANAGER, staking.target);
  await gainFUSDT(fusdt, [deployer, deployer, deployer, deployer, deployer]);
  await fusdt.approve(lottery.target, ethers.MaxUint256);

  /// deployer send FUSDT to the firstPlacePrizeVault vault for the future first place winners
  await fusdt.transfer(firstPlacePrizeVault, inUSDT(20));

  return {
    deployer,
    user1,
    user2,
    user3,
    user4,
    stakingUser1,
    stakingUser2,
    usdt,
    aaveUSDT,
    aaveFaucet,
    vrfCoordinator,
    link,
    fusdt,
    claimVault,
    rewardVault,
    teamVault,
    raffleVault,
    firstPlacePrizeVault,
    raffle,
    lottery,
    staking,
    LOTTERY_STARTING_TIME,
    raffleUpkeep,
    chainLinkRegister,
    erc20Prize,
    erc721Prize,
    erc1155Prize,
  };
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
    await aaveFaucet.mint(USDT, currentUser.address, inUSDT(10));
    await usdt.connect(currentUser).approve(fusdt.target, inUSDT(10));
    await fusdt.connect(currentUser).wrapUSDT(inUSDT(10));
  }, Promise.resolve());
};
const gainUSDT = async (userList) => {
  const USDT = "0x1fdE0eCc619726f4cD597887C9F3b4c8740e19e2";
  const AAVE_FAUCET_ON_MUMBAI = "0x2c95d10bA4BBEc79e562e8B3f48687751808C925";
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_MUMBAI
  );

  await userList.reduce(async (acc, currentUser) => {
    await acc;
    await aaveFaucet.mint(USDT, currentUser.address, inUSDT(10));
  }, Promise.resolve());
};

const multipleApprovals = async (contract, targetAddress, userList) => {
  await userList.reduce(async (acc, currentUser) => {
    await acc;
    await contract
      .connect(currentUser)
      .approve(targetAddress, ethers.MaxUint256);
  }, Promise.resolve());
};

const multipleBalances = async (contract, userList) => {
  const balanceList = [];
  await userList.reduce(async (acc, currentUser) => {
    await acc;

    if (ethers.isAddress(currentUser)) {
      const balance = await contract.balanceOf(currentUser);
      balanceList.push(balance);
    } else {
      balance = await contract.balanceOf(
        currentUser.address ? currentUser.address : currentUser.target
      );
      balanceList.push(balance);
    }
  }, Promise.resolve());

  return balanceList;
};

module.exports = {
  inETH,
  inUSDT,
  setUp,
  gainFUSDT,
  gainUSDT,
  multipleApprovals,
  multipleBalances,
};
