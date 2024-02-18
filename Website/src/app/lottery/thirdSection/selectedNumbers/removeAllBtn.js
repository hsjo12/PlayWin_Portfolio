import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useCallback, useContext } from "react";

export default function RemoveAllBtn() {
  const { setLotteryNumList } = useContext(ContextAPI);

  const removeAll = useCallback(() => {
    setLotteryNumList([]);
  }, []);
  return (
    <div className="w-full flex flex-col xl:p-0 p-2">
      <button onClick={removeAll} className="btnText lottoBtn p-2">
        removeAll
      </button>
    </div>
  );
}
