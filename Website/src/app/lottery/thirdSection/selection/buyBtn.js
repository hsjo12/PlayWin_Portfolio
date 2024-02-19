import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useCallback, useContext } from "react";
import lotteryJson from "../../../../abis/lottery.json";
import fusdtJson from "../../../../abis/fusdt.json";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import { getContract } from "@/components/utils/utils";
export default function BuyBtn() {
  const { lotteryNumList, setLotteryNumList, setUpdate, user } =
    useContext(ContextAPI);

  const purchase = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }

    if (lotteryNumList == null || lotteryNumList.length == 0) {
      return toastMessage("Please add selected numbers", "warn");
    }

    try {
      const lotteryInstance = await getContract(
        lotteryJson.address,
        lotteryJson.abi
      );
      const fusdtInstance = await getContract(fusdtJson.address, fusdtJson.abi);

      const userAllowance = await fusdtInstance.allowance(
        user,
        lotteryInstance.target
      );

      const pricePerTicket = await lotteryInstance.price();
      const totalPrice = BigInt(lotteryNumList.length) * pricePerTicket;

      if (userAllowance < totalPrice) {
        toastMessage("Please approve the staking amount of FUSDT", "warn");
        const tx = await fusdtInstance.approve(
          lotteryInstance.target,
          totalPrice
        );
        await txMessage(tx);
      }

      const userBalance = await fusdtInstance.balanceOf(user);
      if (userBalance < totalPrice) {
        return toastMessage("Insufficient FUSDT balance", "warn");
      }

      const tx = await lotteryInstance.buyTickets(lotteryNumList);
      await txMessage(tx);
      setLotteryNumList([]);
      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [lotteryNumList, user]);

  return (
    <div className="w-full flex flex-col xl:p-0 p-2">
      <button onClick={purchase} className="btnText lottoBtn p-2">
        Purchase
      </button>
    </div>
  );
}
