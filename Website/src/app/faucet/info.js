export default function Info() {
  return (
    <div className="flex flex-col w-full p-2 gap-5 ">
      <p className="subTitle">INFO</p>
      <div className="card text-left mx-auto flex flex-col gap-7 infoText ">
        <p>• FUSDT is the currency for lottery and raffle.</p>
        <p>• To acquire fUSDT, wrapping USDT is a prerequisite.</p>
        <p>• FUSDT can be unwrapped into USDT at any time.</p>
        <p>• FUSDT is pegged at a 1:1 ratio to USDT.</p>
        <p>• To claim USDT for free, use the USDT faucet offered by AAVE.</p>
      </div>
    </div>
  );
}
