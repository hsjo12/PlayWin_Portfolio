import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { fetchTicketList } from "@/components/utils/fetchLottery";
import Loading from "@/components/utils/loading";
import { useContext, useEffect, useRef, useState } from "react";

export default function TicketList() {
  const { update, user } = useContext(ContextAPI);
  const [loading, setLoading] = useState(true);
  const [ticketList, setTicketList] = useState([]);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      const newList = await fetchTicketList(user);

      setTicketList([...newList]);
      setLoading(false);
    })();
  }, [update, user]);

  if (!user || ticketList.length === 0) {
    return (
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Ticket List</div>
        <div className="infoText flex flex-col items-center justify-center h-full min-h-[211px]">
          <p className="tracking-[.25em]">EMPTY</p>
        </div>
      </div>
    );
  } else if (loading && user) {
    return (
      <div className="flex flex-col justify-start lotterySmallInformationCard">
        <div className="lotterySmallInformationCardHead">Ticket List</div>
        <div className="flex flex-col items-center justify-center h-full min-h-[211px]">
          <Loading loaderType="smallLoader" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-start lotterySmallInformationCard">
      <div className="lotterySmallInformationCardHead">Ticket List</div>
      <div className="flex flex-col items-center justify-start h-full  overflow-y-scroll min-h-[212px] max-h-[212px] customizedLotteryScrollbar ">
        <div className="infoText grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2  ">
          <p>Round</p>
          <p>Selected</p>
          <p>Total</p>
        </div>
        <div className="w-full ">
          {ticketList.map((v, i) => {
            return (
              <div
                key={i}
                className="infoText grid grid-cols-3 w-full text-center border-b-2 border-[whitesmoke] border-dashed p-2 last:border-none "
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
