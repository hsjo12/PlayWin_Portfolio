# PlayWin

Playwin is a transparent blockchain-based gaming platform where users can play raffles and lotteries. Furthermore, users can earn FUSDT tokens pegged to USDT by staking USDT.

<img src="./readMeImage/diargram.png">

**There are 4 main smart contracts as follows;**

**1. FUSDT.sol (ERC20)**

FUSDT is an ERC20-based token designed for playing raffle and lottery games on the platform. Essentially, FUSDT serves as the primary currency within this ecosystem. Moreover, FUSDT maintains a fixed value tied to USDT by being backed by USDT. This means that 1 FUSDT is always equal in value to 1 USDT.

**2. Staking.sol**

The staking smart contract allows users to deposit USDT and, in return, earn FUSDT as rewards. These rewards are generated from the total sales of raffle and lottery tickets, distributed at the conclusion of each lottery round. Furthermore, the USDT staked by users is reinvested into the AAVE V3 POOL to accrue additional rewards for the platform.

**3. Raffle.sol**

A raffle allows users to either create their own or join existing ones. The creator earns FUSDT from total sales, while the winner, selected from the participants, receives a prize.

To initiate a raffle, a deposit of 10 FUSDT is required.

During a successful raffle, 90% of the total sales proceeds are distributed among the raffle creator, a reward vault, and the platform's team vault. The remaining 10% constitutes the prize awarded to the winner. Conversely, if a raffle fails, typically due to the creator setting a high minimum entry requirement, 95% of the deposit is returned to the creator, with 2.5% each allocated to the reward vault and team vault. In this scenario, the prize is returned to the creator.

Raffles are executed at the specified end time set by the creator using Upkeep and VRF, supported by Chainlink.

**4. Lottery.sol**

The lottery feature allows users to purchase tickets by selecting five numbers.

Each round of the lottery lasts for 42,600 blocks, approximately equivalent to 23 hours and 50 minutes. Following this period, the winning numbers are revealed, and the first, second, and third-place winners are determined within a 10-minute window.

Once a round concludes, 70% of the total sales proceeds are allocated to a claimVault for the lottery, 20% to a rewardVault for staking, and 10% to the teamVault for the platform's operations.

The first-place prize is supported by a predetermined amount of FUSDT contributed by the team, along with 10% of the total sales distributed to the claimVault. The second and third-place prizes are 60% and 30% of the total sales distributed to the claimVault, respectively. In the event that there are no winners in any category, the prize amount carries over to the next round.

The winning numbers are generated using Chainlink's VRF, and the results, including the number of winners, are transferred to the lottery.sol contract via the backend hosted on the Oracle Cloud.

**Raffle**

**1. Create a raffle**

<img src="./readMeImage/raffle/1.create.png">

As shown in the image above, users can create raffles with a 10 FUSDT deposit fee and send a prize. The prize and deposit fee will be stored in the raffle vault. Only ERC20, ERC721 and ERC1155 are available as prizes. Furthermore, users can set up more detail feature of their raffles as follows

- The minimum number of entries: the minimum number of entries required for
  a raffle to proceed. If the minimum number is not met, the prize and deposit will be returned to the creator.
- The maximum number of entries: the maximum number of entries that users can join in the raffle.
- The minimum number of entries per user: the minimum number of entries that each user can purchase in the raffle.
- The maximum number of entries per user: the maximum number of entries that each user can purchase in the raffle.
- Price: the price of each raffle entry.
- Date: the deadline for the raffle to end.

**2. Join a raffle**

<img src="./readMeImage/raffle/2.join.png">

User can buy raffle tickets as many as the maximum number of entries per user, by paying FUSDT.

**3. Draw a raffle winner**

<img src="./readMeImage/raffle/3.announcement.png">

After the raffle deadline passes, UpKeep, supported by Chainlink, will request VRF to generate a random number. This random number will be used to determine the winner. Once the winner is selected, the prize will be sent to the winner.

90% of the total sales and the initial deposit made by users to create the raffle will be transferred to the raffle creator. The remaining 5% each of the total sales will be allocated to the reward vault for rewarding staking users and the team vault for platform operations.

**4. Cancel a raffle**

<img src="./readMeImage/raffle/4.cancel.png">

If the total number of entries for a raffle does not meet the minimum set by the creator, the raffle can be canceled. In such cases, UpKeep will assist in returning the prize and 95% of the deposit to the participants who entered the raffle. The remaining 2.5% each of the total sales will be allocated to the reward vault for rewarding staking users and the team vault for platform operations

**Lottery**

**1. Buy lottery tickets**

<img src="./readMeImage/lottery/1.buy.png">

Users can buy lottery tickets, input any 5 numbers by paying FUSDT.

**2. Announce Winning numbers**

<img src="./readMeImage/lottery/2.announcement.png">

Every 42,600 blocks, each round of the lottery will end, and the winning number will
be generated by Chainlink's VRF. Once the random number is generated, the first,
second, and third-place winners will be computed on the server-side hosted on the
Oracle Cloud. Afterward, the computed data will be sent to Lottery.sol so that winners
can claim their prizes accurately.

As shown in the image above, 70%, 20%, and 10% of total sales will be split into the
claim vault for the lottery, the reward vault for staking users, and the team vault
for the platform.

The first-place prize is supported by a predetermined amount of FUSDT contributed by
the team, along with 10% of the total sales distributed to the claim vault. The second
and third-place prizes are 60% and 30% of the total sales distributed to the claim
vault, respectively. In the event that there are no winners in any category, the prize
amount carries over to the next round.

**3. Claim prizes**

<img src="./readMeImage/lottery/3.claim.png">

Winners can claim prizes within 7 rounds, otherwise the prize will be gone.
Once a winner executed claim function in Lottery.sol, the prizeVault.sol will send the prize in FUSDT to the winner.

**DEMO Link**

(playwin)[https://playwin-on-blockchain.netlify.app/]

--
**TEST**

I have made total 170 test case.

Go to Smart Contract

npm i

npx hardhat test

---

**CONTRACT**

(FUSDT)[https://mumbai.polygonscan.com/address/0x0224b585c08Fa29C88AB5c5D55e7C57549901D0D#code]: 0x0224b585c08Fa29C88AB5c5D55e7C57549901D0D

(ClaimVault)[https://mumbai.polygonscan.com/address/0x856646C716ce2b37a76C189D9F5105DD0F4E3803#code]: 0x856646C716ce2b37a76C189D9F5105DD0F4E3803

(RewardVault)[https://mumbai.polygonscan.com/address/0x0C803E9E4A3a5EAB209a7c9bF4F5a08825aC49da#code]: 0x0C803E9E4A3a5EAB209a7c9bF4F5a08825aC49da

(TeamVault)[https://mumbai.polygonscan.com/address/0x7DD0cF550dfaE5c777328c65Eafc941181F215d2#code]: 0x7DD0cF550dfaE5c777328c65Eafc941181F215d2

(RaffleVault)[https://mumbai.polygonscan.com/address/0xFfe7946c6a0892AD46f38578d6541dC8260D22c0#code]: 0xFfe7946c6a0892AD46f38578d6541dC8260D22c0

(FirstPlacePrizeVault)[https://mumbai.polygonscan.com/address/0x3C9795a68E37c139794103c1eD5f6c1b9A115931#code]: 0x3C9795a68E37c139794103c1eD5f6c1b9A115931

(ERC20Prize(TEST-PRIZE))[https://mumbai.polygonscan.com/address/0x3d4bBa13cf48C23d636d046E3cee21E70730a404#code]: 0x3d4bBa13cf48C23d636d046E3cee21E70730a404

(ERC721Prize(TEST-PRIZE))[https://mumbai.polygonscan.com/address/0x29dbfD2088B8C9A2D337ceFc938e52c031a23B74#code]: 0x29dbfD2088B8C9A2D337ceFc938e52c031a23B74

(ERC1155Prize(TEST-PRIZE))[https://mumbai.polygonscan.com/address/0xFa1AE7DB1eb63EB7c637f85b53046F8276234009#code]: 0xFa1AE7DB1eb63EB7c637f85b53046F8276234009

(Lottery)[https://mumbai.polygonscan.com/address/0xF10aEa0fD037A8dDD2cBAF9173BCd381dD398264#code]: 0xF10aEa0fD037A8dDD2cBAF9173BCd381dD398264

(Raffle)[https://mumbai.polygonscan.com/address/0x67F8edc89520CBDB77F0c13A10ceDb93f0dCFf25#code]: 0x67F8edc89520CBDB77F0c13A10ceDb93f0dCFf25

(RaffleUpKeep)[https://mumbai.polygonscan.com/address/0xc83BD9103F15cB94BFd3ce3ec9E5852d5dCC5537#code]: 0xc83BD9103F15cB94BFd3ce3ec9E5852d5dCC5537

(Staking)[https://mumbai.polygonscan.com/address/0x49aBB47A12EF0a60fA3faEA959Dd948dA6468E7f#code]: 0x49aBB47A12EF0a60fA3faEA959Dd948dA6468E7f

(ChainLinkRegister)[https://mumbai.polygonscan.com/address/0x7aE5b125b078DF75b8B8914E827c7Cf7B051C471#code]: 0x7aE5b125b078DF75b8B8914E827c7Cf7B051C471
