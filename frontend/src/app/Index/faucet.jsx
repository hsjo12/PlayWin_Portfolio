import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { useCallback, useContext, useEffect, useState } from "react";
import erc20Json from "../../abis/erc20Abi.json";
import fusdtJSon from "../../abis/fusdt.json";
import aaveUsdtFaucetJson from "../../abis/aaveUsdtFaucet.json";
import { formattedBalance } from "@/utils/utils";
import Link from "next/link";
import { toastMessage, txMessage } from "@/utils/toastMessage";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
require("dotenv").config();
export default function Faucet() {
  const { update, sectionRefs, animationOnBySection } = useContext(ContextAPI);
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [ethBalance, setEthBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [fusdtBalance, setFusdtBalance] = useState(0);
  const [inputValue, setInputValue] = useState("");
  useEffect(() => {
    if (!isConnected || !address) return;

    updateBalance();
  }, [address, isConnected, update]);

  const updateBalance = useCallback(async () => {
    const provider = new BrowserProvider(walletProvider);

    const usdtInstance = new Contract(
      String(process.env.NEXT_PUBLIC_USDT),
      erc20Json.abi,
      provider
    );
    const fusdtInstance = new Contract(
      fusdtJSon.address,
      fusdtJSon.abi,
      provider
    );
    const ethBalance = await provider.getBalance(address);
    const usdtBalance = await usdtInstance.balanceOf(address);
    const fusdtBalance = await fusdtInstance.balanceOf(address);
    setEthBalance(formattedBalance(ethBalance, 18));
    setUsdtBalance(formattedBalance(usdtBalance, 6));
    setFusdtBalance(formattedBalance(fusdtBalance, 6));
  }, [address, isConnected, update, walletProvider]);

  const faucet = useCallback(async () => {
    try {
      if (!isConnected || !address) {
        return toastMessage("Please Connect Wallet", "warn");
      }
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const aaveUsdtFaucet = new Contract(
        process.env.NEXT_PUBLIC_AAVE_USDT_FAUCET,
        aaveUsdtFaucetJson.abi,
        signer
      );
      const tx = await aaveUsdtFaucet.mint(
        process.env.NEXT_PUBLIC_USDT,
        address,
        ethers.parseUnits("10", 6)
      );
      await txMessage(tx);
      await updateBalance();
    } catch (error) {
      console.log(error);
      return toastMessage("Transaction failed", "error");
    }
  }, [address, isConnected, walletProvider]);

  const changeInputValue = useCallback((e) => {
    if (e.target.value.length > 9) {
      toastMessage(
        "Ensure your input falls within the range of 0.0001 to 100,000,000 USDT.",
        "warn"
      );
      return setInputValue("");
    }
    const value = e.target.value;

    if (parseFloat(value) >= 0.0001 && parseFloat(value) < 100000001) {
      setInputValue(value);
    } else if (value === "0") {
      setInputValue("0");
    } else if (
      value.startsWith("0.") ||
      value.startsWith("0.0") ||
      value.startsWith("0.00") ||
      value.startsWith("0.000")
    ) {
      if (value.startsWith("0.000")) {
        toastMessage("The range of 0.0001 to 100,000,000 USDT.", "warn");
        return setInputValue("");
      }
      setInputValue(value);
    } else if (value === "") {
      setInputValue("");
    } else {
      toastMessage("The range of 0.0001 to 100,000,000 USDT.", "warn");
      setInputValue("");
    }
  }, []);
  const wrap = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }
    if (String(inputValue) === "" || inputValue == null) {
      return toastMessage("Please Input numbers", "warn");
    }
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const fusdtInstance = new Contract(
        fusdtJSon.address,
        fusdtJSon.abi,
        signer
      );
      const usdtInstance = new Contract(
        process.env.NEXT_PUBLIC_USDT,
        erc20Json.abi,
        signer
      );
      const userAllowance = await usdtInstance.allowance(
        address,
        fusdtInstance.target
      );
      const wrappingAmount = ethers.parseUnits(String(inputValue), 6);

      if (userAllowance < wrappingAmount) {
        toastMessage("Please approve the wrapping amount of USDT", "warn");
        const tx = await usdtInstance.approve(
          fusdtInstance.target,
          wrappingAmount
        );
        await txMessage(tx);
      }

      const userBalance = await usdtInstance.balanceOf(address);
      if (userBalance < wrappingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await fusdtInstance.wrapUSDT(wrappingAmount);
      await txMessage(tx);

      await updateBalance();
      setInputValue("");
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [address, isConnected, inputValue, walletProvider]);

  const unWrap = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const fusdtInstance = new Contract(
        fusdtJSon.address,
        fusdtJSon.abi,
        signer
      );

      const unwrappingAmount = ethers.parseUnits(String(inputValue), 6);

      const userBalance = await fusdtInstance.balanceOf(address);
      if (userBalance < unwrappingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await fusdtInstance.unWrapUSDT(unwrappingAmount);
      await txMessage(tx);

      await updateBalance();
      setInputValue("");
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [address, isConnected, inputValue, walletProvider]);

  if (!animationOnBySection.faucet) {
    return (
      <section
        ref={(el) => (sectionRefs.current.faucet = el)}
        className={`w-full flex flex-col justify-center items-center gap-3 ${
          animationOnBySection.faucet ? "" : "invisible"
        }`}
      >
        <p className="title">Faucet</p>

        <div className="box flex flex-col justify-center items-start gap-3">
          <p className="smallTitle">INFO</p>
          <p>• FUSDT is the currency for lottery and raffle.</p>
          <p>• To acquire fUSDT, wrapping USDT is a prerequisite.</p>
          <p>• FUSDT can be unwrapped into USDT at any time.</p>
          <p>• FUSDT is pegged at a 1:1 ratio to USDT.</p>
          <p>• To claim USDT for free, use the USDT faucet offered by AAVE.</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-3">
          <div className="box flex flex-col justify-center items-start gap-3">
            <p className="smallTitle">USER INFO</p>
            {isConnected && (
              <p>User : {`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
            )}
            <p>{`User ETH balance : ${isConnected ? ethBalance : "0"} ETH`}</p>
            <p>{`User USDT balance : ${
              isConnected ? usdtBalance : "0"
            } USDT`}</p>
            <p>{`User FUSDT balance : ${
              isConnected ? fusdtBalance : "0"
            } FUSDT`}</p>
            <div className="w-full flex flex-col md:flex-row justify-around items-center gap-3">
              <button className="btn w-full md:w-[40%]">
                <Link
                  href="https://www.alchemy.com/faucets/ethereum-sepolia"
                  target="blank"
                >
                  Get ETH
                </Link>
              </button>

              <button onClick={faucet} className="btn w-full md:w-[40%]">
                Get USDT
              </button>
            </div>
          </div>
          <div className="box flex flex-col justify-between items-start gap-3 h-full">
            <p className="smallTitle">WRAP / UNWRAP</p>

            <div className="flex flex-col gap-3 w-full">
              <label htmlFor="stakingInput">Amount</label>
              <input
                id="stakingInput"
                className="removeIncDecArrow inputStyle"
                type="number"
                step="0.0001"
                min="0.0001"
                onChange={changeInputValue}
                value={inputValue}
                placeholder="USDT/fUSDT"
              />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={wrap} className="btn">
                Wrap
              </button>
              <button onClick={unWrap} className="btn">
                UnWrap
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  } else {
    // ANIMATION
    return (
      <section
        ref={(el) => (sectionRefs.current.faucet = el)}
        className={`w-full flex flex-col justify-center items-center gap-3 ${
          animationOnBySection.faucet ? "" : "invisible"
        }`}
      >
        <p className="title">Faucet</p>

        <div className="box flex flex-col justify-center items-start gap-3 toBottom">
          <p className="smallTitle">INFO</p>
          <p>• FUSDT is the currency for lottery and raffle.</p>
          <p>• To acquire fUSDT, wrapping USDT is a prerequisite.</p>
          <p>• FUSDT can be unwrapped into USDT at any time.</p>
          <p>• FUSDT is pegged at a 1:1 ratio to USDT.</p>
          <p>• To claim USDT for free, use the USDT faucet offered by AAVE.</p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-3">
          <div className="box flex flex-col justify-center items-start gap-3 toLeft">
            <p className="smallTitle">USER INFO</p>
            {isConnected && (
              <p>User : {`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
            )}
            <p>{`User ETH balance : ${isConnected ? ethBalance : "0"} ETH`}</p>
            <p>{`User USDT balance : ${
              isConnected ? usdtBalance : "0"
            } USDT`}</p>
            <p>{`User FUSDT balance : ${
              isConnected ? fusdtBalance : "0"
            } FUSDT`}</p>
            <div className="w-full flex flex-col md:flex-row justify-around items-center gap-3">
              <button className="btn w-full md:w-[40%]">
                <Link
                  href="https://www.alchemy.com/faucets/ethereum-sepolia"
                  target="blank"
                >
                  Get ETH
                </Link>
              </button>

              <button onClick={faucet} className="btn w-full md:w-[40%]">
                Get USDT
              </button>
            </div>
          </div>
          <div className="box flex flex-col justify-between items-start gap-3 h-full toRight">
            <p className="smallTitle">WRAP / UNWRAP</p>

            <div className="flex flex-col gap-3 w-full">
              <label htmlFor="stakingInput">Amount</label>
              <input
                id="stakingInput"
                className="removeIncDecArrow inputStyle"
                type="number"
                step="0.0001"
                min="0.0001"
                onChange={changeInputValue}
                value={inputValue}
                placeholder="USDT/fUSDT"
              />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={wrap} className="btn">
                Wrap
              </button>
              <button onClick={unWrap} className="btn">
                UnWrap
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
