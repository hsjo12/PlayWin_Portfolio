import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { converter, getContractForReadOnly } from "@/components/utils/utils";
import { useContext, useEffect, useState } from "react";
import lotteryJson from "../../../../abis/lottery.json";
import Loading from "@/components/utils/loading";
export default function PriceDisplay() {
  const { lotteryNumList, upload } = useContext(ContextAPI);
  const [loading, setLoading] = useState(true);
  const [ticketPrice, setTicketPrice] = useState(null);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const lottery = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );

      const ticketPrice = await lottery.price();
      setTicketPrice(converter(ticketPrice, 6));
      setLoading(false);
    })();
  }, [upload]);

  if (loading || ticketPrice == null) {
    return <Loading loaderType="smallLoader" />;
  } else if (lotteryNumList == null || lotteryNumList.length === 0) {
    return (
      <div className="infoText w-[90%] xl:w-full  flex flex-col items-center border-b-2 border-[whitesmoke] border-dashed p-2 xl:p-0">
        <p>{ticketPrice} FUSDT per ticket</p>
      </div>
    );
  } else {
    return (
      <div className="infoText w-[90%] xl:w-full flex flex-col items-center border-b-2 border-[whitesmoke] border-dashed p-2 xl:p-0">
        <p>
          {`${lotteryNumList.length} x ${ticketPrice} FUSDT = ${
            lotteryNumList.length * ticketPrice
          } FUSDT`}
        </p>
      </div>
    );
  }
}
