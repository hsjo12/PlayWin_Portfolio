export default function Info() {
  return (
    <div className="flex flex-col w-full p-2 gap-5 ">
      <p className="subTitle">INFO</p>
      <div className="infoText card text-left mx-auto flex flex-col gap-7 ">
        <p>Staking asset: USDT</p>
        <p>Reward: FUSDT</p>
        <p>Lock-up Period: 3days</p>
      </div>
    </div>
  );
}
