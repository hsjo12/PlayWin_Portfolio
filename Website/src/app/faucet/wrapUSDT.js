import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { connectMetamask } from "@/components/metamask/connector";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import { getContract } from "@/components/utils/utils";
import { useCallback, useContext, useState } from "react";
import erc20Json from "../../abis/erc20Abi.json";
import fusdtJSon from "../../abis/fusdt.json";
import { ethers } from "ethers";

export default function WrapUSDT() {
  const { setUpdate, user, setUser } = useContext(ContextAPI);
  const [inputValue, setInputValue] = useState("");
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
        const a = toastMessage(
          "Ensure your input falls within the range of 0.0001 to 100,000,000 USDT.",
          "warn"
        );
        return setInputValue("");
      }
      setInputValue(value);
    } else if (value === "") {
      setInputValue("");
    } else {
      toastMessage(
        "Ensure your input falls within the range of 0.0001 to 100,000,000 USDT.",
        "warn"
      );
      setInputValue("");
    }
  }, []);

  const wrap = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }
    if (String(inputValue) === "" || inputValue == null) {
      return toastMessage("Please Input numbers");
    }
    try {
      const fusdtInstance = await getContract(fusdtJSon.address, fusdtJSon.abi);
      const usdtInstance = await getContract(
        process.env.NEXT_PUBLIC_USDT,
        erc20Json.abi
      );
      const userAllowance = await usdtInstance.allowance(
        user,
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

      const userBalance = await usdtInstance.balanceOf(user);
      if (userBalance < wrappingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await fusdtInstance.wrapUSDT(wrappingAmount);
      await txMessage(tx);

      setUpdate(Date.now());
      setInputValue("");
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [user, inputValue]);

  const unWrap = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }
    try {
      const fusdtInstance = await getContract(fusdtJSon.address, fusdtJSon.abi);
      const unwrappingAmount = ethers.parseUnits(String(inputValue), 6);

      const userBalance = await fusdtInstance.balanceOf(user);
      if (userBalance < unwrappingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await fusdtInstance.unWrapUSDT(unwrappingAmount);
      await txMessage(tx);

      setUpdate(Date.now());
      setInputValue("");
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [user, inputValue]);

  return (
    <div className="flex flex-col w-full p-2 gap-7 infoText ">
      <p className="subTitle">WRAP/UNWRAP</p>
      <div className="card text-left mx-auto flex flex-col gap-7 !pb-12 ">
        <label htmlFor="stakingInput" className="infoText2">
          Amount
        </label>

        <input
          id="stakingInput"
          className="removeIncDecArrow inputStyle infoText2"
          type="number"
          step="0.0001"
          min="0.0001"
          onChange={changeInputValue}
          value={inputValue}
          placeholder="The amount for USDT/fUSDT."
        />
      </div>
      <div className="btnText flex flex-col md:grid md:grid-cols-2 w-full gap-5 p-2">
        <button onClick={wrap} className="btn p-1">
          Wrap
        </button>
        <button onClick={unWrap} className="btn p-1">
          UnWrap
        </button>
      </div>
    </div>
  );
}
