import { getContract } from "@/components/utils/utils";
import Link from "next/link";
import { useCallback, useContext } from "react";
import AaveUsdtFaucetJson from "../../abis/aaveUsdtFaucet.json";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import { connectMetamask } from "@/components/metamask/connector";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { ethers } from "ethers";
require("dotenv").config();
export default function ThreeButtons() {
  const { user, setUser, setUpdate } = useContext(ContextAPI);

  const faucet = useCallback(async () => {
    if (!user) {
      const user = await connectMetamask();
      setUser(user);
      return toastMessage("Please Connect Wallet", "warn");
    }

    const aaveUsdtFaucet = await getContract(
      process.env.NEXT_PUBLIC_AAVE_USDT_FAUCET,
      AaveUsdtFaucetJson.abi
    );
    const tx = await aaveUsdtFaucet.mint(
      process.env.NEXT_PUBLIC_USDT,
      user,
      ethers.parseUnits("10", 6)
    );

    await txMessage(tx);
    setUpdate(Date.now());
  }, [user]);

  const addUSDT = useCallback(async () => {
    if (!user) {
      const user = await connectMetamask();
      setUser(user);
      return toastMessage("Please Connect Wallet", "warn");
    }
    return await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: `${process.env.NEXT_PUBLIC_USDT}`,
          symbol: "USDT",
          decimals: 6,
          image: "https://etherscan.io/token/images/tethernew_32.png",
        },
      },
    });
  }, [user]);
  return (
    <>
      <div className="btnText flex flex-col md:grid md:grid-cols-3 w-full gap-5 p-2">
        <button className="btn p-1">
          <Link href="https://mumbaifaucet.com/">Get MATIC</Link>
        </button>
        <button onClick={faucet} className="btn p-1">
          Faucet USDT
        </button>
        <button onClick={addUSDT} className="btn p-1">
          Add USDT
        </button>
      </div>
    </>
  );
}
