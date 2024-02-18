export default function UserInfo({
  user,
  usdtBalance,
  stakingBalance,
  leftoverLockUpRounds,
  userReward,
}) {
  return (
    <div className="flex flex-col w-full p-2 gap-5 ">
      <p className="subTitle">USER INFO</p>
      <div className="card text-left mx-auto flex flex-col gap-7 infoText">
        <p>User: {`${user.slice(0, 7)}...${user.slice(-4)}`}</p>

        <p>{`USDT balance: ${usdtBalance} USDT`}</p>
        <p>{`Staking balance: ${stakingBalance} USDT`}</p>
        <p>{`Reward: ${userReward} FUSDT `}</p>
        <p>{`Leftover lockup rounds: ${leftoverLockUpRounds} rounds`}</p>
      </div>
    </div>
  );
}
