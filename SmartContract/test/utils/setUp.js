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
  const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
  const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
  const USDT_AAVE_TOKEN_ON_SEPOLIA =
    "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6";
  const AAVE_POOL_ON_SEPOLIA = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  const LINK_WHALE_SEPOLIA = "0x23b5613fc04949F4A53d1cc8d6BCCD21ffc38C11";
  const LINK_ON_SEPOLIA = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const REGISTRAR_ON_SEPOLIA = "0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976";
  const VRF_COORDINATOR_ON_SEPOLIA =
    "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const VRF_HASH_ON_SEPOLIA =
    "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
  const VRF_GAS_LIMIT = 2_500_000;
  const LOTTERY_STARTING_TIME = Math.floor(new Date() / 1000) + 60; // starting In 60s
  const [deployer, user1, user2, user3, user4, stakingUser1, stakingUser2] =
    await ethers.getSigners();

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

  // Vrf coordinator
  const vrfCoordinator = await ethers.getContractAt(
    [
      "function acceptSubscriptionOwnerTransfer(uint64 subId) external",
      "function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)",
    ],
    VRF_COORDINATOR_ON_SEPOLIA
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
  await lottery.setOnlyFirstPlacePrizeAmountFromTeam(ethers.parseUnits("1", 6));
  const ChainLinkRegister = await ethers.getContractFactory(
    "ChainLinkRegister"
  );

  const chainLinkRegister = await ChainLinkRegister.deploy(
    LINK_ON_SEPOLIA,
    REGISTRAR_ON_SEPOLIA,
    VRF_COORDINATOR_ON_SEPOLIA
  );

  // Sending Link
  const whale = await ethers.getImpersonatedSigner(LINK_WHALE_SEPOLIA);
  // LINK
  const link = await ethers.getContractAt("ILink", LINK_ON_SEPOLIA);
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
  await link.approve(VRF_COORDINATOR_ON_SEPOLIA, ethers.MaxUint256);
  coder = ethers.AbiCoder.defaultAbiCoder();
  await link.transferAndCall(
    VRF_COORDINATOR_ON_SEPOLIA,
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
  const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
  const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
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
  const AAVE_FAUCET_ON_SEPOLIA = "0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D";
  const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
  const aaveFaucet = await ethers.getContractAt(
    ["function mint(address token, address to, uint256 value) external"],
    AAVE_FAUCET_ON_SEPOLIA
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
