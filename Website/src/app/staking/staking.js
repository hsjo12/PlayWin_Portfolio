import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { connectMetamask } from "@/components/metamask/connector";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import { getContract } from "@/components/utils/utils";
import { useCallback, useContext, useState } from "react";
import StakingJson from "../../abis/staking.json";
import erc20Json from "../../abis/erc20Abi.json";
import { ethers } from "ethers";
export default function Staking() {
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
        toastMessage(
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

  const stake = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }
    if (String(inputValue) === "" || inputValue == null) {
      return toastMessage("Please Input numbers", "warn");
    }
    try {
      const stakingInstance = await getContract(
        StakingJson.address,
        StakingJson.abi
      );
      const usdtInstance = await getContract(
        process.env.NEXT_PUBLIC_USDT,
        erc20Json.abi
      );

      const stakingAmount = ethers.parseUnits(String(inputValue), 6);
      const userAllowance = await usdtInstance.allowance(
        user,
        stakingInstance.target
      );

      if (userAllowance < stakingAmount) {
        toastMessage("Please approve the staking amount of USDT", "warn");
        const tx = await usdtInstance.approve(
          stakingInstance.target,
          stakingAmount
        );
        await txMessage(tx);
      }

      const userBalance = await usdtInstance.balanceOf(user);
      if (userBalance < stakingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await stakingInstance.stake(stakingAmount);
      await txMessage(tx);

      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [user, inputValue]);

  const withdraw = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
    }

    try {
      const stakingInstance = await getContract(
        StakingJson.address,
        StakingJson.abi
      );

      const leftoverRound = await stakingInstance.getLeftOverLockUpRound(user);
      if (leftoverRound !== 0n) {
        return toastMessage(`Please wait more ${leftoverRound} rounds`, "warn");
      }

      const tx = await stakingInstance.unstake();
      await txMessage(tx);

      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [user, inputValue]);

  const claim = useCallback(async () => {
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
      return toastMessage("Please Connect Wallet", "warn");
    }

    try {
      const stakingInstance = await getContract(
        StakingJson.address,
        StakingJson.abi
      );

      const userReward = await stakingInstance.getCurrentRewards(user);

      if (userReward === 0n) {
        return toastMessage(`Sorry, There is nothing you can claim`, "warn");
      }

      const tx = await stakingInstance.claim();
      await txMessage(tx);

      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [user, inputValue]);
  return (
    <div className="flex flex-col w-full p-2 gap-5 infoText ">
      <p className="subTitle">STAKE</p>
      <div className=" card text-left mx-auto flex flex-col gap-7 !pb-12 ">
        <label htmlFor="stakingInput" className="infoText">
          STAKING Amount
        </label>

        <input
          id="stakingInput"
          className="removeIncDecArrow inputStyle infoText"
          type="number"
          step="0.0001"
          min="0.0001"
          onChange={changeInputValue}
          value={inputValue}
          placeholder="the amount of FUSDT"
        />
      </div>
      <div className="btnText flex flex-col md:grid md:grid-cols-3 w-full gap-5 ">
        <button onClick={stake} className="btn p-1">
          Stake
        </button>
        <button onClick={withdraw} className="btn p-1">
          Withdraw All
        </button>
        <button onClick={claim} className="btn p-1">
          Claim
        </button>
      </div>
    </div>
  );
}
