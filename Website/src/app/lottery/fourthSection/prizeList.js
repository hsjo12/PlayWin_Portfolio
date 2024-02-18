import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { fetchPrizeList } from "@/components/utils/fetchLottery";
import Loading from "@/components/utils/loading";
import PrizeInfo from "./prizeInfo.js";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  converter,
  getContract,
  getContractForReadOnly,
} from "@/components/utils/utils.js";
import lotteryJson from "../../../abis/lottery.json";
export default function PrizeList() {
  const { update, user } = useContext(ContextAPI);
  const [loading, setLoading] = useState(true);
  const [prizeList, setPrizeList] = useState(true);
  const [open, setOpen] = useState(false);
  const [openedPrizeInfo, setOpenPrizeInfo] = useState(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      setPrizeList(await fetchPrizeList(user));
      setLoading(false);
    })();
  }, [update, user]);

  const viewPrize = useCallback(
    async (info) => {
      if (!user) return;

      const { round, winningNumber } = info;
      const lotteryInstance = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );

      const prizeAmount = await lotteryInstance.getRewards(
        round,
        winningNumber,
        user
      );

      setOpenPrizeInfo({
        winner: user,
        prizeAmount: converter(prizeAmount, 6),
        ...info,
      });
      setOpen(true);
    },
    [user]
  );
  if (!user || prizeList.length === 0) {
    return (
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Prize List</div>
        <div className="infoText flex flex-col items-center justify-center h-full min-h-[211px]">
          <p className="tracking-[.25em]">EMPTY</p>
        </div>
      </div>
    );
  } else if (loading && user) {
    return (
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Prize List</div>
        <div className="flex flex-col items-center justify-center h-full min-h-[211px]">
          <Loading loaderType="smallLoader" />
        </div>
      </div>
    );
  }
  return (
    <>
      {open ? (
        <PrizeInfo setOpen={setOpen} openedPrizeInfo={openedPrizeInfo} />
      ) : null}
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Prize List</div>
        <div className="infoText flex flex-col items-center justify-start h-full overflow-y-scroll min-h-[212px] max-h-[212px] customizedLotteryScrollbar ">
          <div className="grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2  ">
            <p>Prize</p>
            <p>D-Round</p>
            <p>Claim</p>
          </div>
          <div className=" w-full ">
            {prizeList.map((v, i) => {
              return (
                <div
                  key={i}
                  className="grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2 last:border-none"
                >
                  <p>{Number(v.winningPlace)}</p>
                  <p>{Number(v.claimPeriod)}</p>
                  <button className="lottoBtn" onClick={() => viewPrize(v)}>
                    View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
