export default function LottoBalls({ winningNumber }) {
  const colours = [
    "#093ca6,#001b54",
    "#009c21,#004d10",
    "#0a6669,#042a2b",
    "#fac402,#774400",
    "#b3140f,#4f0200",
    "#6f309e,#2d004f",
    "#4361ee,#16204f",
    "#ffacc5,#ff5d8f",
    "#d1495b,#732832",
    "#9c89b8,#4d04ba",
  ];
  return (
    <div className="flex flex-col w-full gap-3 smallLotteryCard">
      <div className="w-full grid grid-cols-5 ">
        {Array.from(winningNumber).map((v, i) => {
          return (
            <div
              className="border-r-2 border-dashed last:border-r-0 p-2 xl:p-1 text-center "
              key={i}
            >
              <div
                style={{
                  background: `radial-gradient(${colours[v]})`,
                }}
                className={`flex flex-col justify-center items-center mx-auto rounded-[50%] w-[40px] h-[40px] md:w-[48px] md:h-[48px]`}
                key={i}
              >
                {v}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
