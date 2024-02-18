import Image from "next/image";
import { useCallback, useContext } from "react";
import lotteryJson from "../../../abis/lottery.json";
import { getContract } from "@/components/utils/utils.js";
import { connectMetamask } from "@/components/metamask/connector";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { txMessage } from "@/components/utils/toastMessage";
export default function PrizeInfo({ setOpen, openedPrizeInfo }) {
  const { user, setUser, setUpdate } = useContext(ContextAPI);
  const {
    winner,
    round,
    winningPlace,
    winningNumber,
    prizeAmount,
    deadlineRound,
    claimPeriod,
  } = openedPrizeInfo;

  const claim = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }
    try {
      const lotteryInstance = await getContract(
        lotteryJson.address,
        lotteryJson.abi
      );

      const tx = await lotteryInstance.claim(round, winningNumber);
      await txMessage(tx);
      await setOpen(false);
      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [openedPrizeInfo]);

  return (
    <div className="top-0 left-0 z-[999] fixed w-screen h-screen bg-[#111111da] flex flex-col justify-center items-center  ">
      <div className="w-[90%] sm:w-[80%] md:w-[70%] xl:w-[60%]  flex flex-col justify-start cardBox gap-5 bg-[#41414191]">
        <div className="lotterySmallInformationCardHead ">Prize Info</div>
        <div className=" w-full flex flex-col justify-center items-center p-2">
          <Image
            src={`/prizes/${winningPlace}.jpg`}
            width={0}
            height={0}
            sizes="100%"
            alt="Prize picture"
            className="prizeImageSize border-[2px] border-dashed border-[whitesmoke] "
          />
        </div>
        <div className="prizeInfoText w-full flex flex-col justify-center items-center">
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              Winner
            </p>
            <p className="w-full text-left pl-2">
              {`${winner.slice(0, 6)}...${winner.slice(-6)}`}
            </p>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              Number
            </p>
            <p className="w-full text-left pl-2">{winningNumber}</p>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              Winning Place
            </p>
            <p className="w-full text-left pl-2">{winningPlace}</p>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              Prize
            </p>
            <p className="w-full text-left pl-2">{`${prizeAmount} FUSDC`}</p>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              round
            </p>
            <p className="w-full text-left pl-2">{round}</p>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px]  border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px] border-dashed border-[whitesmoke]">
              D-Claimable rounds
            </p>
            <p className="w-full text-left pl-2">{deadlineRound}</p>
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 w-full border-t-[2px] border-b-[2px] border-dashed border-[whitesmoke] pl-4">
            <p className="w-full text-left border-r-[2px]  border-dashed border-[whitesmoke]">
              Claimable period
            </p>
            <p className="w-full text-left pl-2">{claimPeriod}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 mx-auto gap-5 pl-5 pr-5 pb-5 w-full">
          <button
            onClick={() => setOpen(false)}
            className="lottoBtn p-2 prizeInfoText "
          >
            Confirm
          </button>
          <button onClick={claim} className="lottoBtn p-2 prizeInfoText">
            Claim
          </button>
        </div>
      </div>
    </div>
  );
}
