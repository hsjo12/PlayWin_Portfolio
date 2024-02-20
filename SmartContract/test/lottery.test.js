const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const {
  inUSDT,
  setUp,
  gainFUSDT,
  gainUSDT,
  multipleApprovals,
} = require("./utils/setUp");
const { getTheNumOfEachWinningPlaceWinners } = require("./utils/helper");
const { ethers } = require("hardhat");
describe("Lottery", () => {
  const WINNING_NUMBER = "12345";
  const SELECTED_NUMBERS_OF_USER1 = ["12345"];
  const SELECTED_NUMBERS_OF_USER2 = ["45825", "12340"];
  const SELECTED_NUMBERS_OF_USER3 = ["12345", "45825", "12300"];
  const FIRST_PLACE_WINNING_NUMBER = "12345";
  const SECOND_PLACE_WINNING_NUMBER = "02345";
  const THIRD_PLACE_WINNING_NUMBER = "00345";
  const NO_WINNING_NUMBER = "00045";
  let user1, user2, user3, user4, stakingUser1, stakingUser2;
  let usdt, fusdt;
  let lottery, staking;
  let claimVault, rewardVault, teamVault, firstPlacePrizeVault;
  let LOTTERY_STARTING_TIME;
  before(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      user4,
      stakingUser1,
      stakingUser2,
      usdt,
      fusdt,
      aaveFaucet,
      lottery,
      staking,
      LOTTERY_STARTING_TIME,
      claimVault,
      rewardVault,
      teamVault,
      firstPlacePrizeVault,
    } = await loadFixture(setUp));
  });

  context("Basic Check", async () => {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const MANAGER =
      "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
    it("Check if parameters are stored well through constructor", async () => {
      expect(await lottery.FUSDT()).to.eq(fusdt.target);
      expect(await lottery.CLAIM_VAULT()).to.eq(claimVault.target);
      expect(await lottery.REWARD_VAULT()).to.eq(rewardVault.target);
      expect(await lottery.TEAM_VAULT()).to.eq(teamVault.target);
      expect(await lottery.startingTime()).to.eq(LOTTERY_STARTING_TIME);
      expect(await lottery.hasRole(MANAGER, deployer.address)).to.true;
      expect(await lottery.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to
        .true;
    });
  });
  context("SetTaxes", async () => {
    it("Check if setTaxes function works well", async () => {
      const originalTaxForTeamVault = await lottery.taxForTeamVault();
      const originalTaxForRewardVault = await lottery.taxForRewardVault();
      const originalTaxForClaimVault = await lottery.taxForClaimVault();

      const newTaxForTeamVault = 1000; // 10%;
      const newTaxForRewardVault = 1000; // 10%;
      const newTaxForClaimVault = 8000; // 10%;
      await lottery.setTaxes(
        newTaxForTeamVault,
        newTaxForRewardVault,
        newTaxForClaimVault
      );
      expect(newTaxForTeamVault).to.eq(await lottery.taxForTeamVault());
      expect(newTaxForRewardVault).to.eq(await lottery.taxForRewardVault());
      expect(newTaxForClaimVault).to.eq(await lottery.taxForClaimVault());

      /// Save the original data
      await lottery.setTaxes(
        originalTaxForTeamVault,
        originalTaxForRewardVault,
        originalTaxForClaimVault
      );
    });
    it("Check if setTaxes function return revert when the sum of input taxes are not equal to 10,000", async () => {
      const newTaxForTeamVault = 500; // 5%;
      const newTaxForRewardVault = 500; // 5%;
      const newTaxForClaimVault = 500; // 5%;

      await expect(
        lottery.setTaxes(
          newTaxForTeamVault,
          newTaxForRewardVault,
          newTaxForClaimVault
        )
      ).to.revertedWithCustomError(lottery, "MustBeEqaulToBPS");
    });
  });
  context("setPrizeShares", async () => {
    it("Check if setPrizeShares function works well", async () => {
      const originalShareOfTheFirstPlacePrize =
        await lottery.shareOfTheFirstPlacePrize();
      const originalShareOfTheSecondPlacePrize =
        await lottery.shareOfTheSecondPlacePrize();
      const originalShareOfTheThirdPlacePrize =
        await lottery.shareOfTheThirdPlacePrize();

      const newShareOfTheFirstPlacePrize = 8000; // 80%;
      const newShareOfTheSecondPlacePrize = 1000; // 10%;
      const newShareOfTheThirdPlacePrize = 1000; // 10%;
      await lottery.setPrizeShares(
        newShareOfTheFirstPlacePrize,
        newShareOfTheSecondPlacePrize,
        newShareOfTheThirdPlacePrize
      );
      expect(newShareOfTheFirstPlacePrize).to.eq(
        await lottery.shareOfTheFirstPlacePrize()
      );
      expect(newShareOfTheSecondPlacePrize).to.eq(
        await lottery.shareOfTheSecondPlacePrize()
      );
      expect(newShareOfTheThirdPlacePrize).to.eq(
        await lottery.shareOfTheThirdPlacePrize()
      );

      /// Save the original data
      await lottery.setTaxes(
        originalShareOfTheFirstPlacePrize,
        originalShareOfTheSecondPlacePrize,
        originalShareOfTheThirdPlacePrize
      );
    });
    it("Check if setPrizeShares function return revert when the sum of input shares are not equal to 10,000", async () => {
      const newShareOfTheFirstPlacePrize = 500; // 5%;
      const newShareOfTheSecondPlacePrize = 500; // 5%;
      const newShareOfTheThirdPlacePrize = 500; // 5%;

      await expect(
        lottery.setPrizeShares(
          newShareOfTheFirstPlacePrize,
          newShareOfTheSecondPlacePrize,
          newShareOfTheThirdPlacePrize
        )
      ).to.revertedWithCustomError(lottery, "MustBeEqaulToBPS");
    });
  });
  context("buyTickets", async () => {
    before(async () => {
      let userList = [user1, user2, user3];
      await gainFUSDT(fusdt, userList);
      await multipleApprovals(fusdt, lottery.target, userList);
    });

    it("Check if user1, user2, and user3 can purchase lottery tickets", async () => {
      const currentRound = await lottery.round();
      await expect(lottery.connect(user1).buyTickets(SELECTED_NUMBERS_OF_USER1))
        .to.emit(lottery, "Buy")
        .withArgs(
          currentRound,
          user1.address,
          SELECTED_NUMBERS_OF_USER1[0],
          SELECTED_NUMBERS_OF_USER1[0]
        );
      await expect(lottery.connect(user2).buyTickets(SELECTED_NUMBERS_OF_USER2))
        .to.emit(lottery, "Buy")
        .withArgs(
          currentRound,
          user2.address,
          SELECTED_NUMBERS_OF_USER2[0],
          SELECTED_NUMBERS_OF_USER2[0]
        );
      await expect(lottery.connect(user3).buyTickets(SELECTED_NUMBERS_OF_USER3))
        .to.emit(lottery, "Buy")
        .withArgs(
          currentRound,
          user3.address,
          SELECTED_NUMBERS_OF_USER3[0],
          SELECTED_NUMBERS_OF_USER3[0]
        );
    });

    it("Check if the round info is updated after 3 users bought the tickets", async () => {
      const expectedTotalSoldTickets =
        SELECTED_NUMBERS_OF_USER1.length +
        SELECTED_NUMBERS_OF_USER2.length +
        SELECTED_NUMBERS_OF_USER3.length;
      const expectedTotalSale =
        BigInt(expectedTotalSoldTickets) * (await lottery.price());
      const currentRound = await lottery.round();
      const roundInfo = await lottery.roundInfo(currentRound);
      expect(roundInfo.totalSoldTickets).to.eq(expectedTotalSoldTickets);
      expect(roundInfo.totalSales).to.eq(expectedTotalSale);
    });

    it("Check if each winning place of prize amount is fetched", async () => {
      const BPS = 10_000n;
      const currentPrice = await lottery.price();
      const user1Spent =
        BigInt(SELECTED_NUMBERS_OF_USER1.length) * currentPrice;
      const user2Spent =
        BigInt(SELECTED_NUMBERS_OF_USER2.length) * currentPrice;
      const user3Spent =
        BigInt(SELECTED_NUMBERS_OF_USER3.length) * currentPrice;
      const distributedPercentage = await lottery.taxForClaimVault();
      const expectedTotalFee =
        ((user1Spent + user2Spent + user3Spent) * distributedPercentage) / BPS;

      const firstPlaceShares = await lottery.shareOfTheFirstPlacePrize();
      const secondPlaceShares = await lottery.shareOfTheSecondPlacePrize();
      const thirdtPlaceShares = await lottery.shareOfTheThirdPlacePrize();

      const divisionToFirstPlace = (expectedTotalFee * firstPlaceShares) / BPS;
      const divisionToSecondPlace =
        (expectedTotalFee * secondPlaceShares) / BPS;
      const divisionToThirdPlace = (expectedTotalFee * thirdtPlaceShares) / BPS;

      const firstPlacePrize =
        (await lottery.onlyFirstPlacePrizeAmountFromTeam()) +
        divisionToFirstPlace;
      const totlaPrize =
        firstPlacePrize + divisionToSecondPlace + divisionToThirdPlace;
      const currentRoundPrize = await lottery.getCurrentRoundTotalPrize();

      expect(currentRoundPrize).to.deep.eq([
        totlaPrize,
        firstPlacePrize,
        divisionToSecondPlace,
        divisionToThirdPlace,
      ]);
      expect(currentRoundPrize.totalPrize).to.eq(totlaPrize);
      expect(currentRoundPrize.firstPlacePrize).to.eq(firstPlacePrize);
      expect(currentRoundPrize.secondPlacePrize).to.eq(divisionToSecondPlace);
      expect(currentRoundPrize.thirdPlacePrize).to.eq(divisionToThirdPlace);
    });

    it("Check if the round info was updated after 3 users bought the tickets", async () => {
      const expectedTotalSoldTickets =
        SELECTED_NUMBERS_OF_USER1.length +
        SELECTED_NUMBERS_OF_USER2.length +
        SELECTED_NUMBERS_OF_USER3.length;
      const expectedTotalSale =
        BigInt(expectedTotalSoldTickets) * (await lottery.price());
      const currentRound = await lottery.round();
      const roundInfo = await lottery.roundInfo(currentRound);
      expect(roundInfo.totalSoldTickets).to.eq(expectedTotalSoldTickets);
      expect(roundInfo.totalSales).to.eq(expectedTotalSale);
    });

    it("Check if the total number of selected number for a round was counted when 3 users bought the tickets", async () => {
      const selectedNumberList = SELECTED_NUMBERS_OF_USER1.concat(
        SELECTED_NUMBERS_OF_USER2
      ).concat(SELECTED_NUMBERS_OF_USER3);

      const eachNumberCounter = counterEachValueInList(selectedNumberList);
      const selectedNumberWithNoDuplication = Array.from(
        new Set(selectedNumberList)
      );
      const currentRound = await lottery.round();
      selectedNumberWithNoDuplication.reduce(async (acc, selectedNumber) => {
        await acc;
        expect(eachNumberCounter[selectedNumber]).to.eq(
          await lottery.totalSelectedNumberByRound(currentRound, selectedNumber)
        );
      }, Promise.resolve());
    });

    it("Check if the total number of selected number for each user was counted when 3 users bought the tickets", async () => {
      const currentRound = await lottery.round();
      const eachNumberCounterForUser1 = counterEachValueInList(
        SELECTED_NUMBERS_OF_USER1
      );
      const eachNumberCounterForUser2 = counterEachValueInList(
        SELECTED_NUMBERS_OF_USER2
      );
      const eachNumberCounterForUser3 = counterEachValueInList(
        SELECTED_NUMBERS_OF_USER3
      );

      const selectedNumberWithNoDuplicationForUser1 = Array.from(
        new Set(SELECTED_NUMBERS_OF_USER1)
      );
      const selectedNumberWithNoDuplicationForUser2 = Array.from(
        new Set(SELECTED_NUMBERS_OF_USER2)
      );
      const selectedNumberWithNoDuplicationForUser3 = Array.from(
        new Set(SELECTED_NUMBERS_OF_USER3)
      );
      /// User1
      selectedNumberWithNoDuplicationForUser1.reduce(
        async (acc, selectedNumber) => {
          await acc;

          expect(eachNumberCounterForUser1[selectedNumber]).to.eq(
            await lottery.totalSelectedNumberByRound(
              user1.address,
              currentRound,
              selectedNumber
            )
          );
        },
        Promise.resolve()
      );
      /// User2
      selectedNumberWithNoDuplicationForUser2.reduce(
        async (acc, selectedNumber) => {
          await acc;

          expect(eachNumberCounterForUser2[selectedNumber]).to.eq(
            await lottery.totalSelectedNumberByRound(
              user2.address,
              currentRound,
              selectedNumber
            )
          );
        },
        Promise.resolve()
      );

      /// User3
      selectedNumberWithNoDuplicationForUser3.reduce(
        async (acc, selectedNumber) => {
          await acc;

          expect(eachNumberCounterForUser3[selectedNumber]).to.eq(
            await lottery.totalSelectedNumberByRound(
              user3.address,
              currentRound,
              selectedNumber
            )
          );
        },
        Promise.resolve()
      );
    });

    it("Check if lottery contract receives as much amount of FUSDT as 3 users paid for the tickets", async () => {
      const totalSoldTickets =
        SELECTED_NUMBERS_OF_USER1.length +
        SELECTED_NUMBERS_OF_USER2.length +
        SELECTED_NUMBERS_OF_USER3.length;
      const expectedFUSDT = BigInt(totalSoldTickets) * (await lottery.price());
      expect(expectedFUSDT).to.eq(await fusdt.balanceOf(lottery.target));
    });

    it("Check if InEqualTo5Numbers is reverted, when the user is attempting to buy tickets with numbers that are not exactly 5 characters in length", async () => {
      await expect(
        lottery.connect(user1).buyTickets(["1234"])
      ).to.revertedWithCustomError(lottery, "InEqualTo5Numbers");
      await expect(
        lottery.connect(user1).buyTickets(["123456"])
      ).to.revertedWithCustomError(lottery, "InEqualTo5Numbers");
    });
  });

  context("announce", async () => {
    let currentRound;
    let totalCollectedTicketFees;
    let totalFirstPlaceWinners, totalSecondPlaceWinners, totalThirdPlaceWinners;
    let stakingUser1Reward, stakingUser2Reward;
    let firstPlacePrizeBalance1;
    before(
      "User buy tickets, and arrange data for the announcement function",
      async () => {
        let userList = [user1, user2, user3];
        await gainFUSDT(fusdt, userList);
        await multipleApprovals(fusdt, lottery.target, userList);
        await lottery
          .connect(user1)
          .buyTickets([FIRST_PLACE_WINNING_NUMBER, NO_WINNING_NUMBER]);
        await lottery.connect(user2).buyTickets([SECOND_PLACE_WINNING_NUMBER]);
        await lottery
          .connect(user3)
          .buyTickets([THIRD_PLACE_WINNING_NUMBER, NO_WINNING_NUMBER]);
        currentRound = await lottery.round();
        totalCollectedTicketFees = (await lottery.roundInfo(currentRound))
          .totalSales;
      }
    );
    before("Staking Users stake USDT", async () => {
      let stakingUserList = [stakingUser1, stakingUser2];
      await gainUSDT(stakingUserList);
      await multipleApprovals(usdt, staking.target, stakingUserList);
      await staking.connect(stakingUser1).stake(inUSDT(9));
      await staking.connect(stakingUser2).stake(inUSDT(1));
      stakingUser1Reward = await staking.getCurrentRewards(
        stakingUser1.address
      );
      stakingUser2Reward = await staking.getCurrentRewards(
        stakingUser2.address
      );
      firstPlacePrizeBalance1 =
        await firstPlacePrizeVault.getCurrentFUSDTBalance();
    });
    before("Time passes for announcement", async () => {
      const closingRound = await lottery.intervalTime();
      lotteryRoundChangingTime = (await lottery.startingTime()) + closingRound;
      await time.increaseTo(lotteryRoundChangingTime);
    });
    it("Announce", async () => {
      /// WINNING_NUMBER will be generated by VRF on backend but it is simply tested with no VRF

      await ({
        totalFirstPlaceWinners,
        totalSecondPlaceWinners,
        totalThirdPlaceWinners,
      } = await getTheNumOfEachWinningPlaceWinners(
        lottery,
        currentRound,
        WINNING_NUMBER
      ));

      /// This function will be executed in backend
      await expect(
        lottery.announce(
          WINNING_NUMBER,
          totalFirstPlaceWinners,
          totalSecondPlaceWinners,
          totalThirdPlaceWinners
        )
      )
        .to.emit(lottery, "Announce")
        .withArgs(currentRound, WINNING_NUMBER);
    });

    it("Check if round is increased After announce", async () => {
      const expectedRound = currentRound + 1n;
      expect(expectedRound).to.eq(await lottery.round());
    });

    it("Check if the fusdt(prize) balance of FirstPlacePrizeVault is reduced as much as the first winning place prize", async () => {
      const firstPlacePrizeBalance2 =
        await firstPlacePrizeVault.getCurrentFUSDTBalance();
      const expectedFirstPlacePrizeBalance =
        firstPlacePrizeBalance1 -
        (await lottery.onlyFirstPlacePrizeAmountFromTeam());
      expect(expectedFirstPlacePrizeBalance).to.eq(firstPlacePrizeBalance2);
    });

    it("Check if the information of the round is correctly updated", async () => {
      const BPS = 10000n;
      const taxForClaimVault = await lottery.taxForClaimVault();
      const totalAmountForEachPlacePrize =
        (totalCollectedTicketFees * taxForClaimVault) / BPS;
      const shareOfTheFirstPlacePrize =
        await lottery.shareOfTheFirstPlacePrize();
      const shareOfTheSecondPlacePrize =
        await lottery.shareOfTheSecondPlacePrize();
      const shareOfTheThirdPlacePrize =
        await lottery.shareOfTheThirdPlacePrize();

      const firstPlacePrizeAmountFromFees =
        (totalAmountForEachPlacePrize * shareOfTheFirstPlacePrize) / BPS;
      const secondPlacePrizeAmountFromFees =
        (totalAmountForEachPlacePrize * shareOfTheSecondPlacePrize) / BPS;
      const thirdPlacePrizeAmountFromFees =
        (totalAmountForEachPlacePrize * shareOfTheThirdPlacePrize) / BPS;

      const onlyFirstPlacePrizeAmountFromTeam =
        await lottery.onlyFirstPlacePrizeAmountFromTeam();

      const totalFirstPlacePrizeAmount =
        onlyFirstPlacePrizeAmountFromTeam + firstPlacePrizeAmountFromFees;

      const previousRound = (await lottery.round()) - 1n;

      const roundInfo = await lottery.roundInfo(previousRound);

      expect(WINNING_NUMBER).to.eq(roundInfo.winningNumber);

      expect(firstPlacePrizeAmountFromFees).to.eq(
        roundInfo.firstPlacePrizeAmountFromFees
      );
      expect(totalFirstPlacePrizeAmount).to.eq(
        roundInfo.totalFirstPlacePrizeAmount
      );
      expect(secondPlacePrizeAmountFromFees).to.eq(
        roundInfo.secondPlacePrizeAmountFromFees
      );
      expect(thirdPlacePrizeAmountFromFees).to.eq(
        roundInfo.thirdPlacePrizeAmountFromFees
      );

      expect(totalFirstPlaceWinners).to.eq(roundInfo.totalFirstPlaceWinners);
      expect(totalSecondPlaceWinners).to.eq(roundInfo.totalSecondPlaceWinners);
      expect(totalThirdPlaceWinners).to.eq(roundInfo.totalThirdPlaceWinners);
    });

    it("Check if The claim, reward, and team vault is given the correct amount of collected ticket fees of this round", async () => {
      const BPS = 10000n;
      const taxForClaimVault = await lottery.taxForClaimVault();
      const taxForRewardVault = await lottery.taxForRewardVault();
      const taxForTeamVault = await lottery.taxForTeamVault();

      const expectedBalanceOfClaimVault =
        (totalCollectedTicketFees * taxForClaimVault) / BPS +
        (await lottery.onlyFirstPlacePrizeAmountFromTeam());
      const expectedBalanceOfRewardVault =
        (totalCollectedTicketFees * taxForRewardVault) / BPS;
      const expectedBalanceOfTeamVault =
        (totalCollectedTicketFees * taxForTeamVault) / BPS;

      expect(expectedBalanceOfClaimVault).to.eq(
        await fusdt.balanceOf(claimVault.target)
      );
      expect(expectedBalanceOfRewardVault).to.eq(
        await fusdt.balanceOf(rewardVault.target)
      );
      expect(expectedBalanceOfTeamVault).to.eq(
        await fusdt.balanceOf(teamVault.target)
      );
    });

    it("Check if staking users can see the rewards after one round passed", async () => {
      const BPS = 10000n;
      const taxForRewardVault = await lottery.taxForRewardVault();
      const expectedBalanceOfRewardVault =
        (totalCollectedTicketFees * taxForRewardVault) / BPS;

      const stakingUser1StakingShare = await staking.getUserStakingShares(
        stakingUser1.address
      );
      const stakingUser2StakingShare = await staking.getUserStakingShares(
        stakingUser2.address
      );

      const stakingUser1Rewards =
        (expectedBalanceOfRewardVault * stakingUser1StakingShare) / BPS;
      const stakingUser2Rewards =
        (expectedBalanceOfRewardVault * stakingUser2StakingShare) / BPS;

      expect(stakingUser1Rewards).to.eq(
        await staking.getCurrentRewards(stakingUser1.address)
      );
      expect(stakingUser2Rewards).to.eq(
        await staking.getCurrentRewards(stakingUser2.address)
      );
    });
  });

  context("claim", async () => {
    let fusdtBalanceOfUser1, fusdtBalanceOfUser2, fusdtBalanceOfUser3;

    before(async () => {
      fusdtBalanceOfUser1 = await fusdt.balanceOf(user1.address);
      fusdtBalanceOfUser2 = await fusdt.balanceOf(user2.address);
      fusdtBalanceOfUser3 = await fusdt.balanceOf(user3.address);
    });
    it("User1 won the first-place prize and can claim it", async () => {
      const previousRound = (await lottery.round()) - 1n;

      const expectedRewardToUser1 = await lottery.getRewards(
        previousRound,
        FIRST_PLACE_WINNING_NUMBER,
        user1.address
      );

      await expect(
        lottery.connect(user1).claim(previousRound, FIRST_PLACE_WINNING_NUMBER)
      )
        .to.emit(lottery, "Claim")
        .withArgs(
          previousRound,
          user1.address,
          1,
          expectedRewardToUser1,
          FIRST_PLACE_WINNING_NUMBER
        );
      const expectedFusdtBalanceOfUser1 =
        expectedRewardToUser1 + fusdtBalanceOfUser1;
      expect(expectedFusdtBalanceOfUser1).to.eq(
        await fusdt.balanceOf(user1.address)
      );
    });
    it("User2 won the second-place prize and can claim it", async () => {
      const previousRound = (await lottery.round()) - 1n;

      const expectedRewardToUser2 = await lottery.getRewards(
        previousRound,
        SECOND_PLACE_WINNING_NUMBER,
        user2.address
      );

      await expect(
        lottery.connect(user2).claim(previousRound, SECOND_PLACE_WINNING_NUMBER)
      )
        .to.emit(lottery, "Claim")
        .withArgs(
          previousRound,
          user2.address,
          2,
          expectedRewardToUser2,
          SECOND_PLACE_WINNING_NUMBER
        );
      const expectedFusdtBalanceOfUser2 =
        expectedRewardToUser2 + fusdtBalanceOfUser2;
      expect(expectedFusdtBalanceOfUser2).to.eq(
        await fusdt.balanceOf(user2.address)
      );
    });
    it("User3 won the third-place prize and can claim it", async () => {
      const previousRound = (await lottery.round()) - 1n;

      const expectedRewardToUser3 = await lottery.getRewards(
        previousRound,
        THIRD_PLACE_WINNING_NUMBER,
        user3.address
      );

      await expect(lottery.connect(user3).claim(1, THIRD_PLACE_WINNING_NUMBER))
        .to.emit(lottery, "Claim")
        .withArgs(
          previousRound,
          user3.address,
          3,
          expectedRewardToUser3,
          THIRD_PLACE_WINNING_NUMBER
        );
      const expectedFusdtBalanceOfUser3 =
        expectedRewardToUser3 + fusdtBalanceOfUser3;
      expect(expectedFusdtBalanceOfUser3).to.eq(
        await fusdt.balanceOf(user3.address)
      );
    });
    it("If user3 puts the wrong number, it will return an error", async () => {
      const previousRound = (await lottery.round()) - 1n;
      const randomNumber = "11559";
      await expect(
        lottery.connect(user3).claim(previousRound, randomNumber)
      ).revertedWithCustomError(lottery, "NotFound");
    });
    it("If user3 tries to claim the prize that was already claimed, it will return an error", async () => {
      const previousRound = (await lottery.round()) - 1n;
      await expect(
        lottery.connect(user3).claim(previousRound, THIRD_PLACE_WINNING_NUMBER)
      ).revertedWithCustomError(lottery, "AlreadyClaimed");
    });
    it("If user4 tried to claimed after the claimable round, it will return an error", async () => {
      let userList = [user4];
      const closingRound = await lottery.intervalTime();
      await gainFUSDT(fusdt, userList);
      await multipleApprovals(fusdt, lottery.target, userList);

      const newClaimableRound = 2n;
      await lottery.setClaimableRound(newClaimableRound);
      const claimableRound = await lottery.claimableRound();
      const userJoinedRound = await lottery.round();

      /// User4 bought tickets
      await lottery
        .connect(user4)
        .buyTickets([THIRD_PLACE_WINNING_NUMBER, NO_WINNING_NUMBER]);

      /// Passed 3 rounds
      await Array(Number(newClaimableRound + 1n))
        .fill(0)
        .map((v, i) => i + 1)
        .reduce(async (acc, cv) => {
          await acc;

          lotteryRoundChangingTime =
            (await lottery.startingTime()) + closingRound;
          await time.increaseTo(lotteryRoundChangingTime);
          await ({
            totalFirstPlaceWinners,
            totalSecondPlaceWinners,
            totalThirdPlaceWinners,
          } = await getTheNumOfEachWinningPlaceWinners(
            lottery,
            userJoinedRound + BigInt(cv),
            WINNING_NUMBER
          ));
          await lottery.announce(
            WINNING_NUMBER,
            totalFirstPlaceWinners,
            totalSecondPlaceWinners,
            totalThirdPlaceWinners
          );
        }, Promise.resolve());
      const currentRound = await lottery.round();
      expect(newClaimableRound).to.eq(claimableRound);
      expect(userJoinedRound + 1n + newClaimableRound).to.eq(currentRound);

      /// user4 cannot claimed prize since the time passed
      await expect(
        lottery.connect(user4).claim(userJoinedRound, WINNING_NUMBER)
      ).to.revertedWithCustomError(lottery, "Expired");
    });
  });
});

const counterEachValueInList = (selectedNumberList) => {
  const eachNumberCounter = {};
  for (selectedNumber of selectedNumberList) {
    if (!eachNumberCounter[selectedNumber]) {
      eachNumberCounter[selectedNumber] = 1;
    } else {
      ++eachNumberCounter[selectedNumber];
    }
  }
  return eachNumberCounter;
};
