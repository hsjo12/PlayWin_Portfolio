import { useCallback, useContext } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";

export default function RemoveAllBtn() {
  const { setLotteryNumList } = useContext(ContextAPI);

  const removeAll = useCallback(() => {
    setLotteryNumList([]);
  }, []);
  return (
    <div className="w-full flex flex-col xl:p-0 p-2">
      <button onClick={removeAll} className="btn">
        removeAll
      </button>
    </div>
  );
}
