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

**playwin** : [https://playwin-on-blockchain.netlify.app/]

--
**TEST**

I have made total 170 test case.

Go to Smart Contract

npm i

npx hardhat test

---

**CONTRACT**

**FUSDT** : 0x5EF12967a7dA58a30dAc806b20CD88D74ECa4702
[https://mumbai.polygonscan.com/address/0x5EF12967a7dA58a30dAc806b20CD88D74ECa4702#code]

**ClaimVault** : 0xfe6364306822AB31e568aFe64CAb4023D0f072A6
[https://mumbai.polygonscan.com/address/0xfe6364306822AB31e568aFe64CAb4023D0f072A6#code]

**RewardVault** : 0x23f01521F9e47CC6C3B5819373483f24260914AA
[https://mumbai.polygonscan.com/address/0x23f01521F9e47CC6C3B5819373483f24260914AA#code]

**TeamVault** : 0xcB506b57450fc5F309EbF33f345Be0bAAa828798
[https://mumbai.polygonscan.com/address/0xcB506b57450fc5F309EbF33f345Be0bAAa828798#code]

**RaffleVault** : 0xbEa8227466BC8ff7439AB260e0dB3c8D5a26C81B
[https://mumbai.polygonscan.com/address/0xbEa8227466BC8ff7439AB260e0dB3c8D5a26C81B#code]

**FirstPlacePrizeVault** : 0xc1B39AABB9C563786E06bb2729e08dDd94cE6bD0
[https://mumbai.polygonscan.com/address/0xc1B39AABB9C563786E06bb2729e08dDd94cE6bD0#code]

**ERC20Prize(TEST-PRIZE)** : 0x89693454A4D9A4A49af63a05090f85cF32774538
[https://mumbai.polygonscan.com/address/0x89693454A4D9A4A49af63a05090f85cF32774538#code]

**ERC721Prize(TEST-PRIZE)** : 0x327056d5433513EB99b275fd57d9Da6d1F876569
[https://mumbai.polygonscan.com/address/0x327056d5433513EB99b275fd57d9Da6d1F876569#code]

**ERC1155Prize(TEST-PRIZE)** : 0x1e5Aab1Bf2db3e1931FAE3A8B6023f8cCA748AF5
[https://mumbai.polygonscan.com/address/0x1e5Aab1Bf2db3e1931FAE3A8B6023f8cCA748AF5#code]

**Lottery** : 0xF8EB8d16BA7ba1618349935b2DDC929a0AD7ba9d
[https://mumbai.polygonscan.com/address/0xF8EB8d16BA7ba1618349935b2DDC929a0AD7ba9d#code]

**Raffle** : 0x80F9C901AB1d887b8d95b1cE0E697336CcDeD571
[https://mumbai.polygonscan.com/address/0x80F9C901AB1d887b8d95b1cE0E697336CcDeD571#code]

**RaffleUpKeep** : 0x7F746f1eB0fd3da2B5122708BFa369865E79A1c5
[https://mumbai.polygonscan.com/address/0x7F746f1eB0fd3da2B5122708BFa369865E79A1c5#code]

**Staking** : 0x75f466B3FE06aA6cA9Ef4ff11e5886Bcd8043Eca
[https://mumbai.polygonscan.com/address/0x75f466B3FE06aA6cA9Ef4ff11e5886Bcd8043Eca#code]

**ChainLinkRegister** : 0x41CCF581F2Ad4E4494A34fCCd600611983Dd76
[https://mumbai.polygonscan.com/address/0x41CCF581F2Ad4E4494A34fCCd600611983Dd76#code]

**VRF** : 0x8FA15CbFCf5017B8E829f3368793819c00dA456C
[https://mumbai.polygonscan.com/address/0x8FA15CbFCf5017B8E829f3368793819c00dA456C#code]
