import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { fetchTicketList } from "@/utils/fetch/fetchLottery";
import Loading from "@/utils/loading";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import Empty from "@/utils/empty";
import { toastMessage } from "@/utils/toastMessage";
export default function TicketList() {
  const { isConnected, address } = useWeb3ModalAccount();

  const { update } = useContext(ContextAPI);
  const [loading, setLoading] = useState(true);
  const [ticketList, setTicketList] = useState([]);

  useEffect(() => {
    if (!isConnected || !address) return;

    (async () => {
      setLoading(true);
      const newList = await fetchTicketList(address);

      setTicketList([...newList]);
      setLoading(false);
    })();
  }, [update, isConnected, address]);

  if (!isConnected || ticketList.length === 0) {
    return (
      <div className="w-full flex flex-col justify-start lotterySmallInformationCard">
        <div className="w-full lotterySmallInformationCardHead">
          Ticket List
        </div>
        <div className="w-full flex flex-col items-center justify-center h-full min-h-[211px]">
          <Empty />
        </div>
      </div>
    );
  } else if (loading && isConnected) {
    return (
      <div className="w-full flex flex-col justify-start lotterySmallInformationCard">
        <div className="w-full lotterySmallInformationCardHead">
          Ticket List
        </div>
        <div className="w-full flex flex-col items-center justify-center h-full min-h-[211px]">
          <Loading loaderType="smallLoader" />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col justify-start lotterySmallInformationCard">
      <div className="w-full lotterySmallInformationCardHead">Ticket List</div>
      <div className="w-full flex flex-col items-center justify-start h-full  overflow-y-scroll min-h-[212px] max-h-[212px] customizedLotteryScrollbar ">
        <div className="grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2  ">
          <p>Round</p>
          <p>Selected</p>
          <p>Total</p>
        </div>
        <div className="w-full ">
          {ticketList.map((v, i) => {
            return (
              <div
                key={i}
                className="grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2 last:border-none "
              >
                <p>{String(v.round)}</p>
                <p>{String(v.selectedNumber)}</p>
                <p>{String(v.total)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
