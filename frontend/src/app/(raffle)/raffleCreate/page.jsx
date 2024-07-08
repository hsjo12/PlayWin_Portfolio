import CreateBox from "./createBox";

export default function Raffle() {
  return (
    <section className="flex flex-col w-full  gap-10">
      <div className="flex flex-col gap-3 box">
        <p className="smallTitle">INFO</p>
        <div className="w-full flex flex-col gap-5">
          <p>10 FUSDT is required as a deposit to create a raffle.</p>
          <p>
            Due to insufficient minimum entries, if the raffle fails, 5% of the
            deposit will be deducted for staking rewards and the platform.
          </p>
          <p>
            When the raffle is successful, 10% of the total sales will be
            allocated for staking rewards and the platform.
          </p>
        </div>
      </div>
      <CreateBox />
    </section>
  );
}
