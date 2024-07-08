import LottoBtn from "./lottoBtn";

export default function LottoBtnBox() {
  return (
    <div className="w-full p-2 xl:p-0">
      {Array(5)
        .fill(0)
        .map((v, i) => {
          return (
            <div
              key={i}
              className=" grid grid-cols-12 w-full p-3 gap-2  border-[1px] border-dashed border-[whitesmoke]"
            >
              <div className="infoText col-span-2 text-center"> No.{i + 1}</div>
              <div className="w-full col-span-10 ">
                <LottoBtn index={i} />
              </div>
            </div>
          );
        })}
    </div>
  );
}
