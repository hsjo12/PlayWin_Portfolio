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

**FUSDT** : 0x9Af768622d6e320109A4bba9caFC65E19719A77C
[https://mumbai.polygonscan.com/address/0x9Af768622d6e320109A4bba9caFC65E19719A77C#code]

**ClaimVault** : 0x2CBC7b6400dc3AdC60df97D4239f37D67dFC7c7F
[https://mumbai.polygonscan.com/address/0x2CBC7b6400dc3AdC60df97D4239f37D67dFC7c7F#code]

**RewardVault** : 0xBFE762Cb6F97FB3b8F274b3ed70ec1D0839cA553
[https://mumbai.polygonscan.com/address/0xBFE762Cb6F97FB3b8F274b3ed70ec1D0839cA553#code]

**TeamVault** : 0x41b0cCB8dD9a50531a3B90FbeA41185288877e64
[https://mumbai.polygonscan.com/address/0x41b0cCB8dD9a50531a3B90FbeA41185288877e64#code]

**RaffleVault** : 0x4754439Dec895Ca595717C0c12a603aAb097F829
[https://mumbai.polygonscan.com/address/0x4754439Dec895Ca595717C0c12a603aAb097F829#code]

**FirstPlacePrizeVault** : 0xfbF17A73FcD2250a8bE871A33911f10a81A14231
[https://mumbai.polygonscan.com/address/0xfbF17A73FcD2250a8bE871A33911f10a81A14231#code]

**ERC20Prize(TEST-PRIZE)** : 0xf1882631ad63fB2d9911114512e5CCb9ba20B3F5
[https://mumbai.polygonscan.com/address/0xf1882631ad63fB2d9911114512e5CCb9ba20B3F5#code]

**ERC721Prize(TEST-PRIZE)** : 0x893Eb3209B58b23668Af610e9930cd6CBA6cd1a7
[https://mumbai.polygonscan.com/address/0x893Eb3209B58b23668Af610e9930cd6CBA6cd1a7#code]

**ERC1155Prize(TEST-PRIZE)** : 0x92982482320C965d237ca997351cb16F77e9A401
[https://mumbai.polygonscan.com/address/0x92982482320C965d237ca997351cb16F77e9A401#code]

**Lottery** : 0xc4B788f7790ed904fF3e47e1743cdf9eFDa32E99
[https://mumbai.polygonscan.com/address/0xc4B788f7790ed904fF3e47e1743cdf9eFDa32E99#code]

**Raffle** : 0x4628cf0E6D3a6c6C7aEC4287079Db67010bC215A
[https://mumbai.polygonscan.com/address/0x4628cf0E6D3a6c6C7aEC4287079Db67010bC215A#code]

**RaffleUpKeep** : 0xb42284f57864a65b34A4023Fa44441eB14A9f152
[https://mumbai.polygonscan.com/address/0xb42284f57864a65b34A4023Fa44441eB14A9f152#code]

**Staking** : 0x59445DAbe9F0bb42Cf7DD9565A6D9811A29B0b00
[https://mumbai.polygonscan.com/address/0x59445DAbe9F0bb42Cf7DD9565A6D9811A29B0b00#code]

**ChainLinkRegister** : 0x8C96430d4895857fC72CAe3b34119ad07F7d6610
[https://mumbai.polygonscan.com/address/0x8C96430d4895857fC72CAe3b34119ad07F7d6610#code]

**VRF** : 0x8FA15CbFCf5017B8E829f3368793819c00dA456C
[https://mumbai.polygonscan.com/address/0x8FA15CbFCf5017B8E829f3368793819c00dA456C#code]
