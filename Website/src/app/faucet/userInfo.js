export default function UserInfo({
  user,
  maticBalance,
  usdtBalance,
  fusdtBalance,
}) {
  return (
    <div className="flex flex-col w-full p-2 gap-5 ">
      <p className="subTitle">USER INFO</p>
      <div className="card text-left mx-auto flex flex-col gap-7 ">
        <p className="infoText">
          User : {`${user.slice(0, 7)}...${user.slice(-4)}`}
        </p>
        <p className="infoText">{`User MATIC balance : ${maticBalance} MATIC`}</p>
        <p className="infoText">{`User USDT balance : ${usdtBalance} USDT`}</p>
        <p className="infoText">{`User FUSDT balance : ${fusdtBalance} FUSDT`}</p>
      </div>
    </div>
  );
}
