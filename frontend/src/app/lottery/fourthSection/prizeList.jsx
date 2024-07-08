import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { fetchPrizeList } from "@/utils/fetch/fetchLottery";
import { formattedBalance } from "@/utils/utils.js";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import Loading from "@/utils/loading";
import PrizeInfo from "./prizeInfo";
import lotteryJson from "../../../abis/lottery.json";
import { BrowserProvider, Contract } from "ethers";
import Empty from "@/utils/empty";
import { toastMessage } from "@/utils/toastMessage";

export default function PrizeList() {
  const { isConnected, address } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { update } = useContext(ContextAPI);
  const [loading, setLoading] = useState(true);
  const [prizeList, setPrizeList] = useState(true);
  const [open, setOpen] = useState(false);
  const [openedPrizeInfo, setOpenPrizeInfo] = useState(null);

  useEffect(() => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }
    (async () => {
      setLoading(true);
      setPrizeList(await fetchPrizeList(address));
      setLoading(false);
    })();
  }, [update, isConnected, address]);

  const viewPrize = useCallback(
    async (info) => {
      try {
        if (!isConnected || !address) {
          return toastMessage("Please Connect Wallet", "warn");
        }
        const { round, winningNumber } = info;
        const provider = new BrowserProvider(walletProvider);
        const signer = await provider.getSigner();

        const lotteryInstance = new Contract(
          lotteryJson.address,
          lotteryJson.abi,
          signer
        );

        const prizeAmount = await lotteryInstance.getRewards(
          round,
          winningNumber,
          address
        );

        setOpenPrizeInfo({
          winner: address,
          prizeAmount: formattedBalance(prizeAmount, 6),
          ...info,
        });
        setOpen(true);
      } catch (error) {
        console.log(error);
      }
    },
    [isConnected, address]
  );
  if (!isConnected || prizeList.length === 0) {
    return (
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Prize List</div>
        <div className="w-full flex flex-col items-center justify-center h-full min-h-[211px]">
          <Empty />
        </div>
      </div>
    );
  } else if (loading && isConnected) {
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
        <div className="infoText flex flex-col items-center justify-start h-full overflow-y-scroll min-h-[212px] max-h-[212px] customizedLotteryScrollbar">
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
