const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  inETH,
  inUSDT,
  setUp,
  gainFUSDT,
  multipleApprovals,
  multipleBalances,
} = require("./utils/setUp");

describe("Raffle", () => {
  let deployer, user1, user2, user3;
  let usdt, fusdt;
  let aaveFaucet;
  let rewardVault, teamVault, raffleVault;
  let raffle;
  let erc20Prize, erc721Prize, erc1155Prize;
  let erc20RaffleId, erc721RaffleId, erc1155RaffleId;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      aaveFaucet,
      usdt,
      fusdt,
      raffle,
      raffleVault,
      teamVault,
      rewardVault,
      erc20Prize,
      erc721Prize,
      erc1155Prize,
      raffleUpkeep,
    } = await loadFixture(setUp));
  });

  context("Basic check", async () => {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const MANAGER =
      "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
    it("Check if parameters are stored well through constructor", async () => {
      expect(await raffle.FUSDT()).to.eq(fusdt.target);
      expect(await raffle.raffleVault()).to.eq(raffleVault.target);
      expect(await raffle.hasRole(MANAGER, deployer.address)).to.true;
      expect(await raffle.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;
    });

    it("Check if findPrizeType can return correct a prize type", async () => {
      const ERC20 = 0n;
      const ERC721 = 1n;
      const ERC1155 = 2n;
      const NONE = 3n;
      expect(await raffle.findPrizeType(erc20Prize.target)).to.eq(ERC20);
      expect(await raffle.findPrizeType(erc721Prize.target)).to.eq(ERC721);
      expect(await raffle.findPrizeType(erc1155Prize.target)).to.eq(ERC1155);
      expect(await raffle.findPrizeType(deployer.address)).to.eq(NONE);
    });
  });

  context("A Create function", async () => {
    let PRIZE_TYPE;
    const STATUS = 0; // pending
    let PRIZE;
    let PRIZE_AMOUNT;
    let PRIZE_ID;
    const DEADLINE = Math.floor(new Date().getTime() / 1000) + 3600; // After 1 hr
    const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
    const MIN_RAFFLE_ENTRIES = 2;
    const MAX_RAFFLE_ENTRIES = 20;
    const MIN_ENTRIES_PER_USER = 2;
    const MAX_ENTRIES_PER_USER = 10;
    let CREATOR;
    const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
    const WINNING_NUMBER = 0; // Default Value
    const TOTAL_ENTRIES = 0; // Default Value

    context("Create a raffle with an erc20 prize", () => {
      let fUSDTBalanceOfDeployer, fUSDTBalanceOfRaffleVault;
      let erc20PrizeBalanceOFDeployer, erc20PrizeBalanceOFRaffleVault;
      before("Before a raffle is created", async () => {
        PRIZE_TYPE = 0; // erc20 prize
        PRIZE = erc20Prize.target;
        PRIZE_AMOUNT = inETH(1);
        PRIZE_ID = 0; // Id is always zero if it is erc20
        CREATOR = deployer.address;
        // Get USDT and swap it for FSUDT
        await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
        await usdt.approve(fusdt.target, inUSDT(10));
        await fusdt.wrapUSDT(inUSDT(10));

        // Get balance
        fUSDTBalanceOfDeployer = await fusdt.balanceOf(deployer.address);
        fUSDTBalanceOfRaffleVault = await fusdt.balanceOf(raffleVault.target);
        erc20PrizeBalanceOFDeployer = await erc20Prize.balanceOf(
          deployer.address
        );
        erc20PrizeBalanceOFRaffleVault = await erc20Prize.balanceOf(
          raffleVault.target
        );
        // Approve
        await fusdt.approve(raffle.target, ethers.MaxUint256);
        await erc20Prize.approve(raffle.target, ethers.MaxUint256);
      });

      it(`Create erc20 Raffle and check event "Create" `, async () => {
        erc20RaffleId = 1n;
        const blockNumber = (await ethers.provider.getBlockNumber()) + 1;
        /// Create an erc20 raffle
        await expect(
          raffle.create([
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
          ])
        )
          .to.emit(raffle, "Create")
          .withArgs(
            erc20RaffleId,
            deployer.address,
            PRIZE_TYPE,
            DEADLINE,
            PRIZE,
            PRIZE_ID,
            PRIZE_AMOUNT,
            blockNumber
          );
      });

      it("Check if the raffle id is added into the createdRaffleList in the userInfo of the raffle creator", async () => {
        expect(
          await raffle.getUserCreatedRaffleListLength(deployer.address)
        ).to.eq(1);
        expect(
          await raffle.getUserCreatedRaffleList(deployer.address, 0, 1)
        ).to.deep.eq([1n]);
      });

      it("Check if deployer sends deposit in FUSDT", async () => {
        const fUSDTBalanceOfDeployer2 = await fusdt.balanceOf(deployer.address);
        const expectedBalance =
          fUSDTBalanceOfDeployer - (await raffle.depositAmount());
        expect(fUSDTBalanceOfDeployer2).to.eq(expectedBalance);
      });

      it("Check if Raffle vault gains deposit in FUSDT", async () => {
        const fUSDTBalanceOfRaffleVault2 = await fusdt.balanceOf(
          raffleVault.target
        );
        const expectedBalance =
          fUSDTBalanceOfRaffleVault + (await raffle.depositAmount());
        expect(fUSDTBalanceOfRaffleVault2).to.eq(expectedBalance);
      });

      it("Check if the prize is taken away from the deployer", async () => {
        const erc20PrizeBalanceOFDeployer2 = await erc20Prize.balanceOf(
          deployer.address
        );
        const expectedBalance = erc20PrizeBalanceOFDeployer - PRIZE_AMOUNT;
        expect(erc20PrizeBalanceOFDeployer2).to.eq(expectedBalance);
      });

      it("Check if the prize is transferred to the raffle vault", async () => {
        const erc20PrizeBalanceOFRaffleVault2 = await erc20Prize.balanceOf(
          raffleVault.target
        );
        const expectedBalance = erc20PrizeBalanceOFRaffleVault + PRIZE_AMOUNT;
        expect(erc20PrizeBalanceOFRaffleVault2).to.eq(expectedBalance);
      });

      it("Check if raffle info is correctly stored", async () => {
        const currentRaffleId = await raffle.currentId();
        const raffleInfo = await raffle.raffleInfo(currentRaffleId);
        const expectedInfo = [
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
        expect(Array.from(raffleInfo)).to.deep.eq(expectedInfo);
      });
    });

    context("Create a raffle with an erc721 prize", () => {
      let fUSDTBalanceOfDeployer, fUSDTBalanceOfRaffleVault;
      let erc721PrizeBalanceOFDeployer, erc721PrizeBalanceOFRaffleVault;
      before("Before a raffle is created", async () => {
        PRIZE_TYPE = 1; // erc721 prize
        PRIZE = erc721Prize.target;
        PRIZE_AMOUNT = 1n;
        PRIZE_ID = 1;
        CREATOR = deployer.address;
        // Get USDT and swap it for FSUDT
        await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
        await usdt.approve(fusdt.target, inUSDT(10));
        await fusdt.wrapUSDT(inUSDT(10));

        // Get balance
        fUSDTBalanceOfDeployer = await fusdt.balanceOf(deployer.address);
        fUSDTBalanceOfRaffleVault = await fusdt.balanceOf(raffleVault.target);
        erc721PrizeBalanceOFDeployer = await erc721Prize.balanceOf(
          deployer.address
        );
        erc721PrizeBalanceOFRaffleVault = await erc721Prize.balanceOf(
          raffleVault.target
        );
        // Approve
        await fusdt.approve(raffle.target, ethers.MaxUint256);
        await erc721Prize.setApprovalForAll(raffle.target, true);
      });

      it(`Create erc721 Raffle and check event "Create" `, async () => {
        const blockNumber = (await ethers.provider.getBlockNumber()) + 1;
        erc721RaffleId = (await raffle.currentId()) + 1n;

        /// Create an erc721 raffle
        await expect(
          raffle.create([
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
          ])
        )
          .to.emit(raffle, "Create")
          .withArgs(
            erc721RaffleId,
            deployer.address,
            PRIZE_TYPE,
            DEADLINE,
            PRIZE,
            PRIZE_ID,
            PRIZE_AMOUNT,
            blockNumber
          );
      });

      it("Check if the raffle id is added into the createdRaffleList in the userInfo of the raffle creator", async () => {
        expect(
          await raffle.getUserCreatedRaffleListLength(deployer.address)
        ).to.eq(2);
        expect(
          await raffle.getUserCreatedRaffleList(deployer.address, 0, 2)
        ).to.deep.eq([1n, 2n]);
      });

      it("Check if deployer sends deposit in FUSDT", async () => {
        const fUSDTBalanceOfDeployer2 = await fusdt.balanceOf(deployer.address);
        const expectedBalance =
          fUSDTBalanceOfDeployer - (await raffle.depositAmount());
        expect(fUSDTBalanceOfDeployer2).to.eq(expectedBalance);
      });

      it("Check if Raffle vault gains deposit in FUSDT", async () => {
        const fUSDTBalanceOfRaffleVault2 = await fusdt.balanceOf(
          raffleVault.target
        );
        const expectedBalance =
          fUSDTBalanceOfRaffleVault + (await raffle.depositAmount());
        expect(fUSDTBalanceOfRaffleVault2).to.eq(expectedBalance);
      });

      it("Check if the prize is taken away from the deployer", async () => {
        const erc721PrizeBalanceOFDeployer2 = await erc721Prize.balanceOf(
          deployer.address
        );
        const expectedBalance = erc721PrizeBalanceOFDeployer - PRIZE_AMOUNT;
        expect(erc721PrizeBalanceOFDeployer2).to.eq(expectedBalance);
        expect(await erc721Prize.ownerOf(PRIZE_ID)).to.not.eq(deployer.address);
      });

      it("Check if the prize is transferred to the raffle vault", async () => {
        const erc721PrizeBalanceOFRaffleVault2 = await erc721Prize.balanceOf(
          raffleVault.target
        );
        const expectedBalance = erc721PrizeBalanceOFRaffleVault + PRIZE_AMOUNT;
        expect(erc721PrizeBalanceOFRaffleVault2).to.eq(expectedBalance);
        expect(await erc721Prize.ownerOf(PRIZE_ID)).to.eq(raffleVault.target);
      });

      it("Check if raffle info is correctly stored", async () => {
        const currentRaffleId = await raffle.currentId();
        const raffleInfo = await raffle.raffleInfo(currentRaffleId);
        const expectedInfo = [
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
        expect(Array.from(raffleInfo)).to.deep.eq(expectedInfo);
      });
    });

    context("Create a raffle with an erc1155 prize", () => {
      let fUSDTBalanceOfDeployer, fUSDTBalanceOfRaffleVault;
      let erc1155PrizeBalanceOFDeployer, erc1155PrizeBalanceOFRaffleVault;
      before("Before a raffle is created", async () => {
        PRIZE_TYPE = 2; // erc1155 prize
        PRIZE = erc1155Prize.target;
        PRIZE_AMOUNT = 1n;
        PRIZE_ID = 1;
        CREATOR = deployer.address;
        // Get USDT and swap it for FSUDT
        await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
        await usdt.approve(fusdt.target, inUSDT(10));
        await fusdt.wrapUSDT(inUSDT(10));

        // Get balance
        fUSDTBalanceOfDeployer = await fusdt.balanceOf(deployer.address);
        fUSDTBalanceOfRaffleVault = await fusdt.balanceOf(raffleVault.target);
        erc1155PrizeBalanceOFDeployer = await erc1155Prize.balanceOf(
          deployer.address,
          PRIZE_ID
        );
        erc1155PrizeBalanceOFRaffleVault = await erc1155Prize.balanceOf(
          raffleVault.target,
          PRIZE_ID
        );
        // Approve
        await fusdt.approve(raffle.target, ethers.MaxUint256);
        await erc1155Prize.setApprovalForAll(raffle.target, true);
      });

      it(`Create erc1155 Raffle and check event "Create" `, async () => {
        const blockNumber = (await ethers.provider.getBlockNumber()) + 1;
        erc1155RaffleId = (await raffle.currentId()) + 1n;

        /// Create an erc1155 raffle
        await expect(
          raffle.create([
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
          ])
        )
          .to.emit(raffle, "Create")
          .withArgs(
            erc1155RaffleId,
            deployer.address,
            PRIZE_TYPE,
            DEADLINE,
            PRIZE,
            PRIZE_ID,
            PRIZE_AMOUNT,
            blockNumber
          );
      });
      it("Check if the raffle id is added into the createdRaffleList in the userInfo of the raffle creator", async () => {
        expect(
          await raffle.getUserCreatedRaffleListLength(deployer.address)
        ).to.eq(3);
        expect(
          await raffle.getUserCreatedRaffleList(deployer.address, 0, 3)
        ).to.deep.eq([1n, 2n, 3n]);
      });

      it("Check if deployer sends deposit in FUSDT", async () => {
        const fUSDTBalanceOfDeployer2 = await fusdt.balanceOf(deployer.address);
        const expectedBalance =
          fUSDTBalanceOfDeployer - (await raffle.depositAmount());
        expect(fUSDTBalanceOfDeployer2).to.eq(expectedBalance);
      });

      it("Check if Raffle vault gains deposit in FUSDT", async () => {
        const fUSDTBalanceOfRaffleVault2 = await fusdt.balanceOf(
          raffleVault.target
        );
        const expectedBalance =
          fUSDTBalanceOfRaffleVault + (await raffle.depositAmount());
        expect(fUSDTBalanceOfRaffleVault2).to.eq(expectedBalance);
      });

      it("Check if the prize is taken away from the deployer", async () => {
        const erc1155PrizeBalanceOFDeployer2 = await erc1155Prize.balanceOf(
          deployer.address,
          PRIZE_ID
        );
        const expectedBalance = erc1155PrizeBalanceOFDeployer - PRIZE_AMOUNT;
        expect(erc1155PrizeBalanceOFDeployer2).to.eq(expectedBalance);
      });

      it("Check if the prize is transferred to the raffle vault", async () => {
        const erc1155PrizeBalanceOFRaffleVault2 = await erc1155Prize.balanceOf(
          raffleVault.target,
          PRIZE_ID
        );
        const expectedBalance = erc1155PrizeBalanceOFRaffleVault + PRIZE_AMOUNT;
        expect(erc1155PrizeBalanceOFRaffleVault2).to.eq(expectedBalance);
      });

      it("Check if raffle info is correctly stored", async () => {
        const currentRaffleId = await raffle.currentId();
        const raffleInfo = await raffle.raffleInfo(currentRaffleId);
        const expectedInfo = [
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
        expect(Array.from(raffleInfo)).to.deep.eq(expectedInfo);
      });
    });

    context("Failure Check", () => {
      before(() => {
        PRIZE_TYPE = 0; // erc20 prize
        PRIZE = erc20Prize.target;
        PRIZE_AMOUNT = inETH(1);
        PRIZE_ID = 0; // Id is always zero if it is erc20
        CREATOR = deployer.address;
      });

      it("If prize amount is zero", async () => {
        const prizeAmount = 0;
        await expect(
          raffle.create([
            PRIZE_TYPE,
            STATUS,
            PRIZE,
            prizeAmount,
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
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If deadline is less than the current time", async () => {
        let deadline = 0;
        await expect(
          raffle.create([
            PRIZE_TYPE,
            STATUS,
            PRIZE,
            PRIZE_AMOUNT,
            PRIZE_ID,
            deadline,
            ENTRY_PRICE,
            MIN_RAFFLE_ENTRIES,
            MAX_RAFFLE_ENTRIES,
            MIN_ENTRIES_PER_USER,
            MAX_ENTRIES_PER_USER,
            CREATOR,
            WINNER,
            WINNING_NUMBER,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If minRaffleEntries is greater than maxRaffleEntries", async () => {
        let minEntriesPerUser = 10;
        let maxRaffleEntries = 0;
        await expect(
          raffle.create([
            PRIZE_TYPE,
            STATUS,
            PRIZE,
            PRIZE_AMOUNT,
            PRIZE_ID,
            DEADLINE,
            ENTRY_PRICE,
            minEntriesPerUser,
            maxRaffleEntries,
            MIN_ENTRIES_PER_USER,
            MAX_ENTRIES_PER_USER,
            CREATOR,
            WINNER,
            WINNING_NUMBER,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If minEntriesPerUser is greater than maxEntriesPerUser", async () => {
        let minEntriesPerUser = 10;
        let maxEntriesPerUser = 0;
        await expect(
          raffle.create([
            PRIZE_TYPE,
            STATUS,
            PRIZE,
            PRIZE_AMOUNT,
            PRIZE_ID,
            DEADLINE,
            ENTRY_PRICE,
            MIN_RAFFLE_ENTRIES,
            MAX_RAFFLE_ENTRIES,
            minEntriesPerUser,
            maxEntriesPerUser,
            CREATOR,
            WINNER,
            WINNING_NUMBER,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If creator is equal to a zero address", async () => {
        let creator = ethers.ZeroAddress;
        await expect(
          raffle.create([
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
            creator,
            WINNER,
            WINNING_NUMBER,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If winner is not equal to a zero address (a Winner must not be set up)", async () => {
        let winner = deployer.address;
        await expect(
          raffle.create([
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
            winner,
            WINNING_NUMBER,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If winningEntryNumber is not equal to zero", async () => {
        let winningEntryNumber = 10;
        await expect(
          raffle.create([
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
            winningEntryNumber,
            TOTAL_ENTRIES,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If totalEntries is not equal to zero", async () => {
        let totalEntries = 10;
        await expect(
          raffle.create([
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
            totalEntries,
          ])
        ).to.revertedWithCustomError(raffle, "MalformedParams");
      });
      it("If prize is not token", async () => {
        let prize = deployer.address;
        await expect(
          raffle.create([
            PRIZE_TYPE,
            STATUS,
            prize,
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
          ])
        ).to.revertedWithCustomError(raffle, "InCorrectToken");
      });
    });
  });

  context("A Join function", async () => {
    before(async () => {
      let userList = [user1, user2, user3];
      await gainFUSDT(fusdt, userList);
      await multipleApprovals(fusdt, raffle.target, userList);
    });

    context("Join ERC20 raffle", async () => {
      let user1Balance, user2Balance, raffleVaultBalance;
      let user1EntryTimes, user2EntryTimes;
      let user1TotalEntryFee, user2TotalEntryFee;
      let user1TotalRaffleGames, user2TotalRaffleGames;
      before(async () => {
        user1EntryTimes = 2n;
        user2EntryTimes = 3n;
        const raffleInfo = await raffle.raffleInfo(erc20RaffleId);
        user1TotalEntryFee = user1EntryTimes * raffleInfo.entryPrice;
        user2TotalEntryFee = user2EntryTimes * raffleInfo.entryPrice;
        let addressList = [user1, user2, raffleVault];
        [user1Balance, user2Balance, raffleVaultBalance] =
          await multipleBalances(fusdt, addressList);
        user1TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user1.address
        );
        user2TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user2.address
        );
      });

      it("User1 and user2 join the erc20 raffle", async () => {
        await raffle.connect(user1).join(erc20RaffleId, user1EntryTimes);
        await expect(raffle.connect(user2).join(erc20RaffleId, user2EntryTimes))
          .to.emit(raffle, "Join")
          .withArgs(erc20RaffleId, user2.address, user2EntryTimes);
      });

      it("Check if the total number of raffle user1 and user2 joined has increased by 1", async () => {
        const expectedUser1TotalRaffleGames = user1TotalRaffleGames + 1n;
        const expectedUser2TotalRaffleGames = user2TotalRaffleGames + 1n;

        expect(await raffle.getUserJoinedRaffleListLength(user1.address)).to.eq(
          expectedUser1TotalRaffleGames
        );
        expect(await raffle.getUserJoinedRaffleListLength(user2.address)).to.eq(
          expectedUser2TotalRaffleGames
        );
      });

      it("Check if user raffle list keeps tracks of what raffle user1 and user2 joined", async () => {
        const totalJoinedRaffleOfUser1 =
          await raffle.getUserJoinedRaffleListLength(user1.address);
        const totalJoinedRaffleOfUser2 =
          await raffle.getUserJoinedRaffleListLength(user2.address);

        expect(
          await raffle.getUserJoinedRaffleList(
            user1,
            0,
            totalJoinedRaffleOfUser1
          )
        ).to.include(erc20RaffleId);
        expect(
          await raffle.getUserJoinedRaffleList(
            user2,
            0,
            totalJoinedRaffleOfUser2
          )
        ).to.include(erc20RaffleId);
      });
      it("Check if the balance of user1 and user2 decreased", async () => {
        const expectedBalanceOfUser1 = user1Balance - user1TotalEntryFee;
        const expectedBalanceOfUser2 = user1Balance - user2TotalEntryFee;
        expect(await fusdt.balanceOf(user1.address)).to.eq(
          expectedBalanceOfUser1
        );
        expect(await fusdt.balanceOf(user2.address)).to.eq(
          expectedBalanceOfUser2
        );
      });

      it("Check if the balance of rafflevault decreased", async () => {
        const expectedBalanceOfRaffleVaultBalance =
          raffleVaultBalance + user1TotalEntryFee + user2TotalEntryFee;
        expect(await fusdt.balanceOf(raffleVault.target)).to.eq(
          expectedBalanceOfRaffleVaultBalance
        );
      });

      it("Check if the raffleVault saves the data of how much entry fee is collected", async () => {
        const savedUser1TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc20RaffleId,
            user1.address
          );
        const savedUser2TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc20RaffleId,
            user2.address
          );
        const savedTotalEntryFeeOfERC20Raffle =
          await raffleVault.getTotalEntryFeeByRaffleId(erc20RaffleId);

        expect(savedUser1TotalEntryFee).to.eq(user1TotalEntryFee);
        expect(savedUser2TotalEntryFee).to.eq(user2TotalEntryFee);
        expect(savedTotalEntryFeeOfERC20Raffle).to.eq(
          user1TotalEntryFee + user2TotalEntryFee
        );
      });

      it("Check if the total entry of user1 and user2 is updated respectively", async () => {
        expect(
          await raffle.getUserEntryCounterByRaffle(user1.address, erc20RaffleId)
        ).to.eq(user1EntryTimes);
        expect(
          await raffle.getUserEntryCounterByRaffle(user2.address, erc20RaffleId)
        ).to.eq(user2EntryTimes);
      });

      it("Check if the total entry of raffle is updated", async () => {
        const totalEntries = (await raffle.raffleInfo(erc20RaffleId))
          .totalEntries;

        expect(totalEntries).to.eq(user1EntryTimes + user2EntryTimes);
      });

      it("Check if user1 and user2 are put into the raffle entry lists", async () => {
        const totalEntries = (await raffle.raffleInfo(erc20RaffleId))
          .totalEntries;
        const userEntryList = [];
        let index = 0;

        await Array(Number(totalEntries))
          .fill(0)
          .reduce(async (acc, cv) => {
            await acc;
            const userAddress = await raffle.userEntryListByRaffle(
              erc20RaffleId,
              index++
            );
            userEntryList.push(userAddress);
          }, Promise.resolve());

        const expectedUserEntryList = [];
        Array(Number(user1EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user1.address);
          });
        Array(Number(user2EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user2.address);
          });

        expect(userEntryList).to.deep.eq(expectedUserEntryList);
      });
    });
    context("Join ERC721 raffle", async () => {
      let user1Balance, user2Balance, raffleVaultBalance;
      let user1EntryTimes, user2EntryTimes;
      let user1TotalEntryFee, user2TotalEntryFee;
      let user1TotalRaffleGames, user2TotalRaffleGames;
      before(async () => {
        user1EntryTimes = 2n;
        user2EntryTimes = 3n;
        const raffleInfo = await raffle.raffleInfo(erc721RaffleId);
        user1TotalEntryFee = user1EntryTimes * raffleInfo.entryPrice;
        user2TotalEntryFee = user2EntryTimes * raffleInfo.entryPrice;
        let addressList = [user1, user2, raffleVault];
        [user1Balance, user2Balance, raffleVaultBalance] =
          await multipleBalances(fusdt, addressList);
        user1TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user1.address
        );
        user2TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user2.address
        );
      });

      it("User1 and user2 join the erc721 raffle", async () => {
        await raffle.connect(user1).join(erc721RaffleId, user1EntryTimes);
        await expect(
          raffle.connect(user2).join(erc721RaffleId, user2EntryTimes)
        )
          .to.emit(raffle, "Join")
          .withArgs(erc721RaffleId, user2.address, user2EntryTimes);
      });

      it("Check if the total number of raffle user1 and user2 joined has increased by 1", async () => {
        const expectedUser1TotalRaffleGames = user1TotalRaffleGames + 1n;
        const expectedUser2TotalRaffleGames = user2TotalRaffleGames + 1n;

        expect(await raffle.getUserJoinedRaffleListLength(user1.address)).to.eq(
          expectedUser1TotalRaffleGames
        );
        expect(await raffle.getUserJoinedRaffleListLength(user2.address)).to.eq(
          expectedUser2TotalRaffleGames
        );
      });

      it("Check if user raffle list keeps tracks of what raffle user1 and user2 joined", async () => {
        const totalJoinedRaffleOfUser1 =
          await raffle.getUserJoinedRaffleListLength(user1.address);
        const totalJoinedRaffleOfUser2 =
          await raffle.getUserJoinedRaffleListLength(user2.address);

        expect(
          await raffle.getUserJoinedRaffleList(
            user1,
            0,
            totalJoinedRaffleOfUser1
          )
        ).to.include(erc721RaffleId);
        expect(
          await raffle.getUserJoinedRaffleList(
            user2,
            0,
            totalJoinedRaffleOfUser2
          )
        ).to.include(erc721RaffleId);
      });

      it("Check if the balance of user1 and user2 decreased", async () => {
        const expectedBalanceOfUser1 = user1Balance - user1TotalEntryFee;
        const expectedBalanceOfUser2 = user2Balance - user2TotalEntryFee;
        expect(await fusdt.balanceOf(user1.address)).to.eq(
          expectedBalanceOfUser1
        );
        expect(await fusdt.balanceOf(user2.address)).to.eq(
          expectedBalanceOfUser2
        );
      });

      it("Check if the balance of rafflevault decreased", async () => {
        const expectedBalanceOfRaffleVaultBalance =
          raffleVaultBalance + user1TotalEntryFee + user2TotalEntryFee;
        expect(await fusdt.balanceOf(raffleVault.target)).to.eq(
          expectedBalanceOfRaffleVaultBalance
        );
      });

      it("Check if the raffleVault saves the data of how much entry fee is collected", async () => {
        const savedUser1TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc721RaffleId,
            user1.address
          );
        const savedUser2TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc721RaffleId,
            user2.address
          );
        const savedTotalEntryFeeOfERC20Raffle =
          await raffleVault.getTotalEntryFeeByRaffleId(erc721RaffleId);

        expect(savedUser1TotalEntryFee).to.eq(user1TotalEntryFee);
        expect(savedUser2TotalEntryFee).to.eq(user2TotalEntryFee);
        expect(savedTotalEntryFeeOfERC20Raffle).to.eq(
          user1TotalEntryFee + user2TotalEntryFee
        );
      });

      it("Check if the total entry of user1 and user2 is updated respectively", async () => {
        expect(
          await raffle.getUserEntryCounterByRaffle(
            user1.address,
            erc721RaffleId
          )
        ).to.eq(user1EntryTimes);
        expect(
          await raffle.getUserEntryCounterByRaffle(
            user2.address,
            erc721RaffleId
          )
        ).to.eq(user2EntryTimes);
      });

      it("Check if the total entry of raffle is updated", async () => {
        const totalEntries = (await raffle.raffleInfo(erc721RaffleId))
          .totalEntries;

        expect(totalEntries).to.eq(user1EntryTimes + user2EntryTimes);
      });

      it("Check if user1 and user2 are put into the raffle entry lists", async () => {
        const totalEntries = (await raffle.raffleInfo(erc721RaffleId))
          .totalEntries;
        const userEntryList = [];
        let index = 0;

        await Array(Number(totalEntries))
          .fill(0)
          .reduce(async (acc, cv) => {
            await acc;
            const userAddress = await raffle.userEntryListByRaffle(
              erc721RaffleId,
              index++
            );
            userEntryList.push(userAddress);
          }, Promise.resolve());

        const expectedUserEntryList = [];
        Array(Number(user1EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user1.address);
          });
        Array(Number(user2EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user2.address);
          });

        expect(userEntryList).to.deep.eq(expectedUserEntryList);
      });
    });
    context("Join ERC1155 raffle", async () => {
      let user1Balance, user2Balance, raffleVaultBalance;
      let user1EntryTimes, user2EntryTimes;
      let user1TotalEntryFee, user2TotalEntryFee;
      let user1TotalRaffleGames, user2TotalRaffleGames;
      before(async () => {
        user1EntryTimes = 2n;
        user2EntryTimes = 3n;
        const raffleInfo = await raffle.raffleInfo(erc1155RaffleId);
        user1TotalEntryFee = user1EntryTimes * raffleInfo.entryPrice;
        user2TotalEntryFee = user2EntryTimes * raffleInfo.entryPrice;
        let addressList = [user1, user2, raffleVault];
        [user1Balance, user2Balance, raffleVaultBalance] =
          await multipleBalances(fusdt, addressList);
        user1TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user1.address
        );
        user2TotalRaffleGames = await raffle.getUserJoinedRaffleListLength(
          user2.address
        );
      });

      it("User1 and user2 join the erc721 raffle", async () => {
        await raffle.connect(user1).join(erc1155RaffleId, user1EntryTimes);
        await expect(
          raffle.connect(user2).join(erc1155RaffleId, user2EntryTimes)
        )
          .to.emit(raffle, "Join")
          .withArgs(erc1155RaffleId, user2.address, user2EntryTimes);
      });
      it("Check if the total number of raffle user1 and user2 joined has increased by 1", async () => {
        const expectedUser1TotalRaffleGames = user1TotalRaffleGames + 1n;
        const expectedUser2TotalRaffleGames = user2TotalRaffleGames + 1n;

        expect(await raffle.getUserJoinedRaffleListLength(user1.address)).to.eq(
          expectedUser1TotalRaffleGames
        );
        expect(await raffle.getUserJoinedRaffleListLength(user2.address)).to.eq(
          expectedUser2TotalRaffleGames
        );
      });

      it("Check if user raffle list keeps tracks of what raffle user1 and user2 joined", async () => {
        const totalJoinedRaffleOfUser1 =
          await raffle.getUserJoinedRaffleListLength(user1.address);
        const totalJoinedRaffleOfUser2 =
          await raffle.getUserJoinedRaffleListLength(user2.address);

        expect(
          await raffle.getUserJoinedRaffleList(
            user1,
            0,
            totalJoinedRaffleOfUser1
          )
        ).to.include(erc1155RaffleId);
        expect(
          await raffle.getUserJoinedRaffleList(
            user2,
            0,
            totalJoinedRaffleOfUser2
          )
        ).to.include(erc1155RaffleId);
      });
      it("Check if the balance of user1 and user2 decreased", async () => {
        const expectedBalanceOfUser1 = user1Balance - user1TotalEntryFee;
        const expectedBalanceOfUser2 = user2Balance - user2TotalEntryFee;
        expect(await fusdt.balanceOf(user1.address)).to.eq(
          expectedBalanceOfUser1
        );
        expect(await fusdt.balanceOf(user2.address)).to.eq(
          expectedBalanceOfUser2
        );
      });

      it("Check if the balance of rafflevault decreased", async () => {
        const expectedBalanceOfRaffleVaultBalance =
          raffleVaultBalance + user1TotalEntryFee + user2TotalEntryFee;
        expect(await fusdt.balanceOf(raffleVault.target)).to.eq(
          expectedBalanceOfRaffleVaultBalance
        );
      });

      it("Check if the raffleVault saves the data of how much entry fee is collected", async () => {
        const savedUser1TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc1155RaffleId,
            user1.address
          );
        const savedUser2TotalEntryFee =
          await raffleVault.getUserEntryFeeByRaffleId(
            erc1155RaffleId,
            user2.address
          );
        const savedTotalEntryFeeOfERC20Raffle =
          await raffleVault.getTotalEntryFeeByRaffleId(erc1155RaffleId);

        expect(savedUser1TotalEntryFee).to.eq(user1TotalEntryFee);
        expect(savedUser2TotalEntryFee).to.eq(user2TotalEntryFee);
        expect(savedTotalEntryFeeOfERC20Raffle).to.eq(
          user1TotalEntryFee + user2TotalEntryFee
        );
      });

      it("Check if the total entry of user1 and user2 is updated respectively", async () => {
        expect(
          await raffle.getUserEntryCounterByRaffle(
            user1.address,
            erc1155RaffleId
          )
        ).to.eq(user1EntryTimes);
        expect(
          await raffle.getUserEntryCounterByRaffle(
            user2.address,
            erc1155RaffleId
          )
        ).to.eq(user2EntryTimes);
      });

      it("Check if the total entry of raffle is updated", async () => {
        const totalEntries = (await raffle.raffleInfo(erc1155RaffleId))
          .totalEntries;

        expect(totalEntries).to.eq(user1EntryTimes + user2EntryTimes);
      });

      it("Check if user1 and user2 are put into the raffle entry lists", async () => {
        const totalEntries = (await raffle.raffleInfo(erc1155RaffleId))
          .totalEntries;
        const userEntryList = [];
        let index = 0;

        await Array(Number(totalEntries))
          .fill(0)
          .reduce(async (acc, cv) => {
            await acc;
            const userAddress = await raffle.userEntryListByRaffle(
              erc1155RaffleId,
              index++
            );
            userEntryList.push(userAddress);
          }, Promise.resolve());

        const expectedUserEntryList = [];
        Array(Number(user1EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user1.address);
          });
        Array(Number(user2EntryTimes))
          .fill(0)
          .map(() => {
            expectedUserEntryList.push(user2.address);
          });

        expect(userEntryList).to.deep.eq(expectedUserEntryList);
      });
    });
    context("Failure Checks", async () => {
      it("If a user tries to enter more raffle entries than the maximum allowed at one time, it will be reverted", async () => {
        const maxEntries = await raffle.MAX_OF_ENTRIES();
        await expect(
          raffle.connect(user3).join(erc20RaffleId, maxEntries + 1n)
        ).to.revertedWithCustomError(raffle, "OverMaxEntries");
      });

      it("If a user tries to enter more raffle entries than the maximum limit set by a creator", async () => {
        const maxRaffleEntries = (await raffle.raffleInfo(erc20RaffleId))
          .maxRaffleEntries;
        await expect(
          raffle.connect(user3).join(erc20RaffleId, maxRaffleEntries + 1n)
        ).to.revertedWithCustomError(raffle, "OutOfRaffleEntries");
      });

      it("If a user tries to enter more or less raffle entries than the personal entry limit set by a creator", async () => {
        const minPersonalRaffleEntries = (
          await raffle.raffleInfo(erc20RaffleId)
        ).minEntriesPerUser;
        const maxPersonalRaffleEntries = (
          await raffle.raffleInfo(erc20RaffleId)
        ).maxEntriesPerUser;

        await expect(
          raffle
            .connect(user3)
            .join(erc20RaffleId, minPersonalRaffleEntries - 1n)
        ).to.revertedWithCustomError(raffle, "OutOfPersonalEntries");

        await expect(
          raffle
            .connect(user3)
            .join(erc20RaffleId, maxPersonalRaffleEntries + 1n)
        ).to.revertedWithCustomError(raffle, "OutOfPersonalEntries");
      });
    });
  });

  /// Simply test the announce function without any chainlink mock test.
  context("An Announce function", async () => {
    let winningRaffleIndex = 1;
    const SUCCESS_STATUS = 1;
    context("Announce the ERC20 Prize raffle", async () => {
      let earliestRaffleId, expectedWinner;
      let raffleListLength1;
      let erc20PrizeBalanceOfWinner1, creator;
      let fusdtBalanceOfCreator1,
        fusdtBalanceOfTeamVault1,
        fusdtBalanceOfRewardVault1;
      let inActiveListLength;
      before(async () => {
        /// Change time after deadline
        time.increase(4000);
        earliestRaffleId = await raffle.getHeadId();
        expectedWinner = await raffle.userEntryListByRaffle(
          earliestRaffleId,
          winningRaffleIndex
        );
        ({ creator } = await raffle.raffleInfo(earliestRaffleId));
        raffleListLength1 = await raffle.listLength();
        erc20PrizeBalanceOfWinner1 = await erc20Prize.balanceOf(expectedWinner);
        fusdtBalanceOfCreator1 = await fusdt.balanceOf(creator);
        fusdtBalanceOfTeamVault1 = await fusdt.balanceOf(teamVault.target);
        fusdtBalanceOfRewardVault1 = await fusdt.balanceOf(rewardVault.target);
        inActiveListLength = await raffle.getInactiveRaffleListLength();
      });

      it("Announce a raffle", async () => {
        /// Chainlink UpKeep will fetch and remove the earliest deadline of a raffle in the list, and then announce it.
        /// However, here I do it manually.
        await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
          .to.emit(raffle, "Announce")
          .withArgs(earliestRaffleId, expectedWinner, SUCCESS_STATUS);
      });

      it("Check if the earliest raffle is removed in the list after the announce", async () => {
        const raffleListLength2 = await raffle.listLength();
        expect(raffleListLength1 - 1n).to.eq(raffleListLength2);
      });

      it("Check if the winner info is filled in the raffle info after the announce", async () => {
        const { status, winner, winningEntryNumber, prizeAmount } =
          await raffle.raffleInfo(earliestRaffleId);

        expect([status, winner, winningEntryNumber]).to.deep.eq([
          SUCCESS_STATUS,
          expectedWinner,
          winningRaffleIndex,
        ]);
      });

      it("Check if the winner receives the prize after the announce", async () => {
        const { prizeAmount } = await raffle.raffleInfo(earliestRaffleId);
        const erc20PrizeBalanceOfWinner2 = await erc20Prize.balanceOf(
          expectedWinner
        );
        expect(erc20PrizeBalanceOfWinner1 + prizeAmount).to.eq(
          erc20PrizeBalanceOfWinner2
        );
      });

      it("Check if the 90%, 5%, and 5% amount of total entry fee are sent to the creator, the teamVault and the rewardVault respectively after the announce", async () => {
        const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
          earliestRaffleId
        );
        const depositFee = await raffleVault.getFUSDTDepositByRaffleId(
          earliestRaffleId
        );
        const toCreator = (totalEntryFee * 9000n) / 10000n + depositFee;
        const toTeamVault = (totalEntryFee * 500n) / 10000n;
        const toRewardVault = (totalEntryFee * 500n) / 10000n;
        const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
        const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
          teamVault.target
        );
        const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
          rewardVault.target
        );
        expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
          fusdtBalanceOfCreator2
        );
        expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
          fusdtBalanceOfTeamVault2
        );
        expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
          fusdtBalanceOfRewardVault2
        );
      });

      it(`Check if the raffle is in inActiveList`, async () => {
        const currentInActiveListLength =
          await raffle.getInactiveRaffleListLength();
        const expectedInactiveListLength = inActiveListLength + 1n;
        expect(expectedInactiveListLength).to.eq(currentInActiveListLength);
        expect(
          await raffle.getInactiveList(0, expectedInactiveListLength)
        ).to.deep.eq([earliestRaffleId]);
      });
    });
    context("Announce the ERC721 Prize raffle", async () => {
      let earliestRaffleId, expectedWinner;
      let raffleListLength1;
      let erc721PrizeBalanceOfWinner1, creator;
      let fusdtBalanceOfCreator1,
        fusdtBalanceOfTeamVault1,
        fusdtBalanceOfRewardVault1;
      let inActiveListLength;
      before(async () => {
        /// Change time after deadline
        time.increase(4000);
        earliestRaffleId = await raffle.getHeadId();
        expectedWinner = await raffle.userEntryListByRaffle(
          earliestRaffleId,
          winningRaffleIndex
        );
        ({ creator } = await raffle.raffleInfo(earliestRaffleId));
        raffleListLength1 = await raffle.listLength();
        erc721PrizeBalanceOfWinner1 = await erc721Prize.balanceOf(
          expectedWinner
        );
        fusdtBalanceOfCreator1 = await fusdt.balanceOf(creator);
        fusdtBalanceOfTeamVault1 = await fusdt.balanceOf(teamVault.target);
        fusdtBalanceOfRewardVault1 = await fusdt.balanceOf(rewardVault.target);
        inActiveListLength = await raffle.getInactiveRaffleListLength();
      });

      it("Announce a raffle", async () => {
        /// Chainlink UpKeep will fetch and remove the earliest deadline of a raffle in the list, and then announce it.
        /// However, here I do it manually.
        await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
          .to.emit(raffle, "Announce")
          .withArgs(earliestRaffleId, expectedWinner, SUCCESS_STATUS);
      });

      it("Check if the earliest raffle is removed in the list after the announce", async () => {
        const raffleListLength2 = await raffle.listLength();
        expect(raffleListLength1 - 1n).to.eq(raffleListLength2);
      });

      it("Check if the winner info is filled in the raffle info after the announce", async () => {
        const { status, winner, winningEntryNumber, prizeAmount } =
          await raffle.raffleInfo(earliestRaffleId);

        expect([status, winner, winningEntryNumber]).to.deep.eq([
          SUCCESS_STATUS,
          expectedWinner,
          winningRaffleIndex,
        ]);
      });

      it("Check if the winner receives the prize after the announce", async () => {
        const { prizeAmount } = await raffle.raffleInfo(earliestRaffleId);
        const erc721PrizeBalanceOfWinner2 = await erc721Prize.balanceOf(
          expectedWinner
        );
        expect(erc721PrizeBalanceOfWinner1 + prizeAmount).to.eq(
          erc721PrizeBalanceOfWinner2
        );
      });

      it("Check if the 90%, 5%, and 5% amount of  total entry fee are sent to the creator, the teamVault and the rewardVault respectively after the announce", async () => {
        const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
          earliestRaffleId
        );
        const depositFee = await raffleVault.getFUSDTDepositByRaffleId(
          earliestRaffleId
        );
        const toCreator = (totalEntryFee * 9000n) / 10000n + depositFee;
        const toTeamVault = (totalEntryFee * 500n) / 10000n;
        const toRewardVault = (totalEntryFee * 500n) / 10000n;
        const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
        const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
          teamVault.target
        );
        const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
          rewardVault.target
        );
        expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
          fusdtBalanceOfCreator2
        );
        expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
          fusdtBalanceOfTeamVault2
        );
        expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
          fusdtBalanceOfRewardVault2
        );
      });

      it(`Check if the raffle is in inActiveList`, async () => {
        const currentInActiveListLength =
          await raffle.getInactiveRaffleListLength();
        const expectedInactiveListLength = inActiveListLength + 1n;
        expect(expectedInactiveListLength).to.eq(currentInActiveListLength);
        expect(
          await raffle.getInactiveList(0, expectedInactiveListLength)
        ).to.deep.eq([1n, 2n]);
      });
    });
    context("Announce the ERC1155 Prize raffle", async () => {
      const PRIZE_ID = 1;
      let earliestRaffleId, expectedWinner;
      let raffleListLength1;
      let erc1155PrizeBalanceOfWinner1, creator;
      let fusdtBalanceOfCreator1,
        fusdtBalanceOfTeamVault1,
        fusdtBalanceOfRewardVault1;
      let inActiveListLength;
      before(async () => {
        /// Change time after deadline
        time.increase(4000);
        earliestRaffleId = await raffle.getHeadId();
        expectedWinner = await raffle.userEntryListByRaffle(
          earliestRaffleId,
          winningRaffleIndex
        );
        ({ creator } = await raffle.raffleInfo(earliestRaffleId));
        raffleListLength1 = await raffle.listLength();
        erc1155PrizeBalanceOfWinner1 = await erc1155Prize.balanceOf(
          expectedWinner,
          PRIZE_ID
        );
        fusdtBalanceOfCreator1 = await fusdt.balanceOf(creator);
        fusdtBalanceOfTeamVault1 = await fusdt.balanceOf(teamVault.target);
        fusdtBalanceOfRewardVault1 = await fusdt.balanceOf(rewardVault.target);
        inActiveListLength = await raffle.getInactiveRaffleListLength();
      });

      it("Announce a raffle", async () => {
        /// Chainlink UpKeep will fetch and remove the earliest deadline of a raffle in the list, and then announce it.
        /// However, here I do it manually.
        await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
          .to.emit(raffle, "Announce")
          .withArgs(earliestRaffleId, expectedWinner, SUCCESS_STATUS);
      });

      it("Check if the earliest raffle is removed in the list after the announce", async () => {
        const raffleListLength2 = await raffle.listLength();
        expect(raffleListLength1 - 1n).to.eq(raffleListLength2);
      });

      it("Check if the winner info is filled in the raffle info after the announce", async () => {
        const { status, winner, winningEntryNumber, prizeAmount } =
          await raffle.raffleInfo(earliestRaffleId);

        expect([status, winner, winningEntryNumber]).to.deep.eq([
          SUCCESS_STATUS,
          expectedWinner,
          winningRaffleIndex,
        ]);
      });

      it("Check if the winner receives the prize after the announce", async () => {
        const { prizeAmount } = await raffle.raffleInfo(earliestRaffleId);
        const erc1155PrizeBalanceOfWinner2 = await erc1155Prize.balanceOf(
          expectedWinner,
          PRIZE_ID
        );
        expect(erc1155PrizeBalanceOfWinner1 + prizeAmount).to.eq(
          erc1155PrizeBalanceOfWinner2
        );
      });

      it("Check if the 90%, 5%, and 5% amount of total entry fee are sent to the creator, the teamVault and the rewardVault respectively after the announce", async () => {
        const totalEntryFee = await raffleVault.getTotalEntryFeeByRaffleId(
          earliestRaffleId
        );
        const depositFee = await raffleVault.getFUSDTDepositByRaffleId(
          earliestRaffleId
        );
        const toCreator = (totalEntryFee * 9000n) / 10000n + depositFee;
        const toTeamVault = (totalEntryFee * 500n) / 10000n;
        const toRewardVault = (totalEntryFee * 500n) / 10000n;
        const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
        const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
          teamVault.target
        );
        const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
          rewardVault.target
        );
        expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
          fusdtBalanceOfCreator2
        );
        expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
          fusdtBalanceOfTeamVault2
        );
        expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
          fusdtBalanceOfRewardVault2
        );
      });
      it(`Check if the raffle is in inActiveList`, async () => {
        const currentInActiveListLength =
          await raffle.getInactiveRaffleListLength();
        const expectedInactiveListLength = inActiveListLength + 1n;
        expect(expectedInactiveListLength).to.eq(currentInActiveListLength);
        expect(
          await raffle.getInactiveList(0, expectedInactiveListLength)
        ).to.deep.eq([1n, 2n, 3n]);
      });
    });
    context(
      "Announce the ERC20 Prize raffle but the raffle did not meet the minimum entries",
      async () => {
        const USER1_ENTRIES = 1n;
        let earliestRaffleId, expectedWinner;
        let prizeAmount;
        let erc20PrizeBalanceOfCreator1, creator;
        let fusdtBalanceOfCreator1,
          fusdtBalanceOfTeamVault1,
          fusdtBalanceOfRewardVault1,
          fusdtBalanceOfRewardUser1;
        before("Create a raffle for failure checks", async () => {
          const PRIZE_TYPE = 0; // erc20 prize
          const STATUS = 0; // pending
          const PRIZE = erc20Prize.target;
          const PRIZE_AMOUNT = inETH(1);
          const PRIZE_ID = 0; // Id is always zero if it is erc20
          const DEADLINE = (await ethers.provider.getBlock()).timestamp + 3600; // After 1 hr
          const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
          const MIN_RAFFLE_ENTRIES = 2;
          const MAX_RAFFLE_ENTRIES = 20;
          const MIN_ENTRIES_PER_USER = 1;
          const MAX_ENTRIES_PER_USER = 10;
          const CREATOR = deployer.address;
          const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
          const WINNING_NUMBER = 0; // Default Value
          const TOTAL_ENTRIES = 0; // Default Value
          // Get USDT and swap it for FSUDT
          await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
          await usdt.approve(fusdt.target, inUSDT(10));
          await fusdt.wrapUSDT(inUSDT(10));

          // Approve
          await fusdt.approve(raffle.target, ethers.MaxUint256);
          await erc20Prize.approve(raffle.target, ethers.MaxUint256);

          /// Create an erc20 raffle
          await raffle.create([
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
          ]);

          earliestRaffleId = await raffle.getHeadId();
          /// User1 joined it only one time which does not meet the minimum entries
          await raffle.connect(user1).join(earliestRaffleId, USER1_ENTRIES);
        });

        before("Check balance", async () => {
          /// Change time after deadline
          time.increase(4000);
          earliestRaffleId = await raffle.getHeadId();

          ({ creator, prizeAmount } = await raffle.raffleInfo(
            earliestRaffleId
          ));
          raffleListLength1 = await raffle.listLength();
          erc20PrizeBalanceOfCreator1 = await erc20Prize.balanceOf(creator);
          [
            fusdtBalanceOfCreator1,
            fusdtBalanceOfTeamVault1,
            fusdtBalanceOfRewardVault1,
            fusdtBalanceOfRewardUser1,
          ] = await multipleBalances(fusdt, [
            creator,
            teamVault,
            rewardVault,
            user1,
          ]);
        });

        it(`Announce the raffle`, async () => {
          const noWinner = ethers.ZeroAddress;
          const cancelStatus = 2;
          await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
            .to.emit(raffle, "Announce")
            .withArgs(earliestRaffleId, noWinner, cancelStatus);
        });
        it(`The prize is sent back to the creator after the raffle is canceled`, async () => {
          const erc20PrizeBalanceOfCreator2 = await erc20Prize.balanceOf(
            creator
          );
          expect(erc20PrizeBalanceOfCreator1 + prizeAmount).to.eq(
            erc20PrizeBalanceOfCreator2
          );
        });

        it(`The 95%, 2.5%, and 2.5% amount of deposit is sent back to the creator, the teamVault, and the rewardVault after the raffle is canceled`, async () => {
          const depositAmount = await raffle.depositAmount();
          const toCreator = (depositAmount * 9500n) / 10000n;
          const toTeamVault = (depositAmount * 250n) / 10000n;
          const toRewardVault = (depositAmount * 250n) / 10000n;
          const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
          const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
            teamVault.target
          );
          const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
            rewardVault.target
          );
          expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
            fusdtBalanceOfCreator2
          );
          expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
            fusdtBalanceOfTeamVault2
          );
          expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
            fusdtBalanceOfRewardVault2
          );
        });

        it("User1 can get a refund of the entry fee", async () => {
          await raffle.connect(user1).refundEntryFee(earliestRaffleId);
          const expectedFUSDTBalanceOfUser1 =
            fusdtBalanceOfRewardUser1 +
            (await raffle.raffleInfo(earliestRaffleId)).entryPrice *
              USER1_ENTRIES;
          expect(expectedFUSDTBalanceOfUser1).to.eq(
            await fusdt.balanceOf(user1.address)
          );
        });
      }
    );
    context(
      "Announce the ERC721 Prize raffle but the raffle did not meet the minimum entries",
      async () => {
        const USER1_ENTRIES = 1n;
        let earliestRaffleId;
        let prizeAmount;
        let erc721PrizeBalanceOfCreator1, creator;
        let fusdtBalanceOfCreator1,
          fusdtBalanceOfTeamVault1,
          fusdtBalanceOfRewardVault1,
          fusdtBalanceOfRewardUser1;

        before("Create a raffle for failure checks", async () => {
          const PRIZE_TYPE = 1; // erc721 prize
          const STATUS = 0; // pending
          const PRIZE = erc721Prize.target;
          const PRIZE_AMOUNT = 1n;
          const PRIZE_ID = (await erc721Prize.id()) + 1n; // Id is always zero if it is erc20
          const DEADLINE = Math.floor(new Date().getTime() / 1000) + 100000; // After 1 hr
          const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
          const MIN_RAFFLE_ENTRIES = 2;
          const MAX_RAFFLE_ENTRIES = 20;
          const MIN_ENTRIES_PER_USER = 1;
          const MAX_ENTRIES_PER_USER = 10;
          const CREATOR = deployer.address;
          const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
          const WINNING_NUMBER = 0; // Default Value
          const TOTAL_ENTRIES = 0; // Default Value

          /// mint a NFT corresponding to id2
          await erc721Prize.mint(deployer.address);

          // Get USDT and swap it for FSUDT
          await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
          await usdt.approve(fusdt.target, inUSDT(10));
          await fusdt.wrapUSDT(inUSDT(10));

          // Approve
          await fusdt.approve(raffle.target, ethers.MaxUint256);
          await erc721Prize.setApprovalForAll(raffle.target, true);

          /// Create an erc20 raffle
          await raffle.create([
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
          ]);

          /// No one joins this raffle
          earliestRaffleId = await raffle.getHeadId();
          /// User1 joined it only one time which does not meet the minimum entries
          await raffle.connect(user1).join(earliestRaffleId, USER1_ENTRIES);
        });
        before("Check balance", async () => {
          /// Change time after deadline
          time.increase(101000);
          earliestRaffleId = await raffle.getHeadId();

          ({ creator, prizeAmount } = await raffle.raffleInfo(
            earliestRaffleId
          ));
          raffleListLength1 = await raffle.listLength();
          erc721PrizeBalanceOfCreator1 = await erc721Prize.balanceOf(creator);
          [
            fusdtBalanceOfCreator1,
            fusdtBalanceOfTeamVault1,
            fusdtBalanceOfRewardVault1,
            fusdtBalanceOfRewardUser1,
          ] = await multipleBalances(fusdt, [
            creator,
            teamVault,
            rewardVault,
            user1,
          ]);
        });

        it(`Announce the raffle`, async () => {
          const noWinner = ethers.ZeroAddress;
          const cancelStatus = 2;

          await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
            .to.emit(raffle, "Announce")
            .withArgs(earliestRaffleId, noWinner, cancelStatus);
        });
        it(`The prize is sent back to the creator after the raffle is canceled`, async () => {
          const erc20PrizeBalanceOfCreator2 = await erc721Prize.balanceOf(
            creator
          );
          expect(erc721PrizeBalanceOfCreator1 + prizeAmount).to.eq(
            erc20PrizeBalanceOfCreator2
          );
        });

        it(`The 95%, 2.5%, and 2.5% amount of deposit is sent back to the creator, the teamVault, and the rewardVault after the raffle is canceled`, async () => {
          const depositAmount = await raffle.depositAmount();
          const toCreator = (depositAmount * 9500n) / 10000n;
          const toTeamVault = (depositAmount * 250n) / 10000n;
          const toRewardVault = (depositAmount * 250n) / 10000n;
          const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
          const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
            teamVault.target
          );
          const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
            rewardVault.target
          );
          expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
            fusdtBalanceOfCreator2
          );
          expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
            fusdtBalanceOfTeamVault2
          );
          expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
            fusdtBalanceOfRewardVault2
          );
        });
        it("User1 can get a refund of the entry fee", async () => {
          await raffle.connect(user1).refundEntryFee(earliestRaffleId);
          const expectedFUSDTBalanceOfUser1 =
            fusdtBalanceOfRewardUser1 +
            (await raffle.raffleInfo(earliestRaffleId)).entryPrice *
              USER1_ENTRIES;
          expect(expectedFUSDTBalanceOfUser1).to.eq(
            await fusdt.balanceOf(user1.address)
          );
        });
      }
    );
    context(
      "Announce the ERC1155 Prize raffle but the raffle did not meet the minimum entries",
      async () => {
        const USER1_ENTRIES = 1n;
        let PRIZE_ID;
        let earliestRaffleId, expectedWinner;
        let prizeAmount;
        let erc1155PrizeBalanceOfCreator1, creator;
        let fusdtBalanceOfCreator1,
          fusdtBalanceOfTeamVault1,
          fusdtBalanceOfRewardVault1,
          fusdtBalanceOfRewardUser1;

        before("Create a raffle for failure checks", async () => {
          const PRIZE_TYPE = 2; // erc1155 prize
          const STATUS = 0; // pending
          const PRIZE = erc1155Prize.target;
          const PRIZE_AMOUNT = 1n;
          PRIZE_ID = 1; // Id is always zero if it is erc20
          const DEADLINE = Math.floor(new Date().getTime() / 1000) + 200000; // After 1 hr
          const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
          const MIN_RAFFLE_ENTRIES = 2;
          const MAX_RAFFLE_ENTRIES = 20;
          const MIN_ENTRIES_PER_USER = 1;
          const MAX_ENTRIES_PER_USER = 10;
          const CREATOR = deployer.address;
          const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
          const WINNING_NUMBER = 0; // Default Value
          const TOTAL_ENTRIES = 0; // Default Value

          /// mint a NFT corresponding to id1
          await erc1155Prize.mint(deployer.address, 1, 1);

          // Get USDT and swap it for FSUDT
          await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
          await usdt.approve(fusdt.target, inUSDT(10));
          await fusdt.wrapUSDT(inUSDT(10));

          // Approve
          await fusdt.approve(raffle.target, ethers.MaxUint256);
          await erc1155Prize.setApprovalForAll(raffle.target, true);

          /// Create an erc20 raffle
          await raffle.create([
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
          ]);

          earliestRaffleId = await raffle.getHeadId();
          /// User1 joined it only one time which does not meet the minimum entries
          await raffle.connect(user1).join(earliestRaffleId, USER1_ENTRIES);
        });
        before("Check balance", async () => {
          /// Change time after deadline
          time.increase(201000);
          earliestRaffleId = await raffle.getHeadId();

          ({ creator, prizeAmount } = await raffle.raffleInfo(
            earliestRaffleId
          ));
          raffleListLength1 = await raffle.listLength();
          erc1155PrizeBalanceOfCreator1 = await erc1155Prize.balanceOf(
            creator,
            PRIZE_ID
          );

          [
            fusdtBalanceOfCreator1,
            fusdtBalanceOfTeamVault1,
            fusdtBalanceOfRewardVault1,
            fusdtBalanceOfRewardUser1,
          ] = await multipleBalances(fusdt, [
            creator,
            teamVault,
            rewardVault,
            user1,
          ]);
        });

        it(`Announce the raffle`, async () => {
          const noWinner = ethers.ZeroAddress;
          const cancelStatus = 2;
          await expect(raffle.announce(earliestRaffleId, winningRaffleIndex))
            .to.emit(raffle, "Announce")
            .withArgs(earliestRaffleId, noWinner, cancelStatus);
        });
        it(`The prize is sent back to the creator after the raffle is canceled`, async () => {
          const erc20PrizeBalanceOfCreator2 = await erc1155Prize.balanceOf(
            creator,
            PRIZE_ID
          );
          expect(erc1155PrizeBalanceOfCreator1 + prizeAmount).to.eq(
            erc20PrizeBalanceOfCreator2
          );
        });

        it(`The 95%, 2.5%, and 2.5% amount of deposit is sent back to the creator, the teamVault, and the rewardVault after the raffle is canceled`, async () => {
          const depositAmount = await raffle.depositAmount();
          const toCreator = (depositAmount * 9500n) / 10000n;
          const toTeamVault = (depositAmount * 250n) / 10000n;
          const toRewardVault = (depositAmount * 250n) / 10000n;
          const fusdtBalanceOfCreator2 = await fusdt.balanceOf(creator);
          const fusdtBalanceOfTeamVault2 = await fusdt.balanceOf(
            teamVault.target
          );
          const fusdtBalanceOfRewardVault2 = await fusdt.balanceOf(
            rewardVault.target
          );
          expect(fusdtBalanceOfCreator1 + toCreator).to.eq(
            fusdtBalanceOfCreator2
          );
          expect(fusdtBalanceOfTeamVault1 + toTeamVault).to.eq(
            fusdtBalanceOfTeamVault2
          );
          expect(fusdtBalanceOfRewardVault1 + toRewardVault).to.eq(
            fusdtBalanceOfRewardVault2
          );
        });
        it("User1 can get a refund of the entry fee", async () => {
          await raffle.connect(user1).refundEntryFee(earliestRaffleId);
          const expectedFUSDTBalanceOfUser1 =
            fusdtBalanceOfRewardUser1 +
            (await raffle.raffleInfo(earliestRaffleId)).entryPrice *
              USER1_ENTRIES;
          expect(expectedFUSDTBalanceOfUser1).to.eq(
            await fusdt.balanceOf(user1.address)
          );
        });
      }
    );
    context("Failure Checks", async () => {
      let earliestRaffleId;
      before("Create a raffle for failure checks", async () => {
        const PRIZE_TYPE = 0; // erc20 prize
        const STATUS = 0; // pending
        const PRIZE = erc20Prize.target;
        const PRIZE_AMOUNT = inETH(1);
        const PRIZE_ID = 0; // Id is always zero if it is erc20
        const DEADLINE = Math.floor(new Date().getTime() / 1000) + 3000000; // After 1 hr
        const ENTRY_PRICE = inUSDT(1); // FEE will be FUSDC
        const MIN_RAFFLE_ENTRIES = 2;
        const MAX_RAFFLE_ENTRIES = 20;
        const MIN_ENTRIES_PER_USER = 2;
        const MAX_ENTRIES_PER_USER = 10;
        const CREATOR = deployer.address;
        const WINNER = ethers.ZeroAddress; // Default value since a winner is not picked up yet.
        const WINNING_NUMBER = 0; // Default Value
        const TOTAL_ENTRIES = 0; // Default Value
        // Get USDT and swap it for FSUDT
        await aaveFaucet.mint(usdt.target, deployer.address, inUSDT(10));
        await usdt.approve(fusdt.target, inUSDT(10));
        await fusdt.wrapUSDT(inUSDT(10));

        // Approve
        await fusdt.approve(raffle.target, ethers.MaxUint256);
        await erc20Prize.approve(raffle.target, ethers.MaxUint256);

        /// Create an erc20 raffle
        await raffle.create([
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
        ]);

        // User1 gets USDT and swaps it for FSUDT
        await aaveFaucet.mint(usdt.target, user1.address, inUSDT(10));
        await usdt.connect(user1).approve(fusdt.target, inUSDT(10));
        await fusdt.connect(user1).wrapUSDT(inUSDT(10));

        // User1 joins a raffle
        const user1EntryTimes = 2n;
        const erc20RaffleId = await raffle.currentId();
        await raffle.connect(user1).join(erc20RaffleId, user1EntryTimes);

        earliestRaffleId = await raffle.getHeadId();
      });

      it(`Announce function must not be executed before the deadline of a raffle`, async () => {
        await expect(
          raffle.announce(earliestRaffleId, winningRaffleIndex)
        ).to.revertedWithCustomError(raffle, "RaffleStillOn");
      });

      it(`Announce  function must not be executed for the same raffle more than one time`, async () => {
        time.increase(3010000);
        await raffle.announce(earliestRaffleId, winningRaffleIndex);
        await expect(
          raffle.announce(earliestRaffleId, winningRaffleIndex)
        ).to.revertedWithCustomError(raffle, "AlreadyAnnounced");
      });
    });
  });
});
