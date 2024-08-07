import { useContext } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import Empty from "@/utils/empty";

export default function SelectedNumbersBox() {
  const { lotteryNumList, setLotteryNumList } = useContext(ContextAPI);
  const removeItem = (selectedIndex) => {
    setLotteryNumList([
      ...lotteryNumList.filter((v, index) => index !== selectedIndex),
    ]);
  };

  if (lotteryNumList == null || lotteryNumList.length === 0) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-full min-h-[200px]">
        <Empty />
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col  overflow-y-scroll min-h-[300px] max-h-[300px] md:min-h-[470px]  md:max-h-[470px] justify-between customizedLotteryScrollbar">
      <div className=" w-full grid grid-cols-2  mx-auto gap-6  p-2 ">
        {lotteryNumList.map((v, index) => {
          return (
            <div key={index} className="w-full grid grid-cols-11  ">
              <div className="w-full col-span-3 flex justify-end">
                {index + 1}.
              </div>
              <p className="w-full col-span-5 xs:tracking-[.10em] text-center border-b-[1px] border-dashed border-[whitesmoke]">
                {v}
              </p>
              <button
                onClick={() => removeItem(index)}
                className="btn col-span-3"
              >
                −
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
