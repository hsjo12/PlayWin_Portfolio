import { useCallback, useContext } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { toastMessage, txMessage } from "@/utils/toastMessage";
import lotteryJson from "../../../../abis/lottery.json";
import fusdtJson from "../../../../abis/fusdt.json";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { BrowserProvider, Contract } from "ethers";

export default function BuyBtn() {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { lotteryNumList, setLotteryNumList, setUpdate } =
    useContext(ContextAPI);

  const purchase = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }

    if (lotteryNumList == null || lotteryNumList.length == 0) {
      return toastMessage("Please add selected numbers", "warn");
    }

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const lotteryInstance = new Contract(
        lotteryJson.address,
        lotteryJson.abi,
        signer
      );
      const fusdtInstance = new Contract(
        fusdtJson.address,
        fusdtJson.abi,
        signer
      );

      const userAllowance = await fusdtInstance.allowance(
        address,
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

      const userBalance = await fusdtInstance.balanceOf(address);
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
  }, [lotteryNumList, address, isConnected, walletProvider]);

  return (
    <div className="w-full flex flex-col xl:p-0 p-2">
      <button onClick={purchase} className="btn">
        Purchase
      </button>
    </div>
  );
}
