import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { useCallback, useContext, useEffect, useState } from "react";
import erc20Json from "../../abis/erc20Abi.json";
import stakingJson from "../../abis/staking.json";
import { formattedBalance } from "@/utils/utils";

import { toastMessage, txMessage } from "@/utils/toastMessage";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
require("dotenv").config();
export default function Stake() {
  const { update, setUpdate, sectionRefs, animationOnBySection } =
    useContext(ContextAPI);
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [stakingBalance, setStakingBalance] = useState(0);
  const [leftoverLockUpRounds, setLeftoverLockUpRounds] = useState(0);
  const [userReward, setUserReward] = useState(0);
  const [inputValue, setInputValue] = useState("");
  useEffect(() => {
    if (!isConnected || !address) return;
    updateStakingInfo();
  }, [address, isConnected, update]);

  const updateStakingInfo = useCallback(async () => {
    try {
      const provider = new BrowserProvider(walletProvider);

      const stakingInstance = new Contract(
        stakingJson.address,
        stakingJson.abi,
        provider
      );

      const stakingInfo = await stakingInstance.userStakingInfo(address);
      const leftoverRound = await stakingInstance.getLeftOverLockUpRound(
        address
      );
      const userReward = await stakingInstance.getCurrentRewards(address);

      setStakingBalance(formattedBalance(stakingInfo[0], 6));
      setUserReward(formattedBalance(userReward, 6));
      setLeftoverLockUpRounds(leftoverRound);
    } catch (error) {
      console.log(error);
    }
  }, [address, isConnected, update, walletProvider]);

  const stake = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }
    if (String(inputValue) === "" || inputValue == null) {
      return toastMessage("Please Input numbers", "warn");
    }
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const stakingInstance = new Contract(
        stakingJson.address,
        stakingJson.abi,
        signer
      );
      const usdtInstance = new Contract(
        process.env.NEXT_PUBLIC_USDT,
        erc20Json.abi,
        signer
      );

      const stakingAmount = ethers.parseUnits(String(inputValue), 6);
      const userAllowance = await usdtInstance.allowance(
        address,
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

      const userBalance = await usdtInstance.balanceOf(address);
      if (userBalance < stakingAmount) {
        return toastMessage("Insufficient USDT balance", "warn");
      }

      const tx = await stakingInstance.stake(stakingAmount);
      await txMessage(tx);
      setInputValue("");
      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [address, isConnected, inputValue, walletProvider]);

  const withdraw = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const stakingInstance = new Contract(
        stakingJson.address,
        stakingJson.abi,
        signer
      );

      const leftoverRound = await stakingInstance.getLeftOverLockUpRound(
        address
      );
      if (leftoverRound !== 0n) {
        return toastMessage(`Please wait more ${leftoverRound} rounds`, "warn");
      }

      const tx = await stakingInstance.unstake();
      await txMessage(tx);
      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [address, isConnected, inputValue]);

  const claim = useCallback(async () => {
    if (!isConnected || !address) {
      return toastMessage("Please Connect Wallet", "warn");
    }

    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const stakingInstance = new Contract(
        stakingJson.address,
        stakingJson.abi,
        signer
      );
      const userReward = await stakingInstance.getCurrentRewards(address);

      if (userReward === 0n) {
        return toastMessage(`Sorry, There is nothing you can claim`, "warn");
      }

      const tx = await stakingInstance.claim();
      await txMessage(tx);

      setUpdate(Date.now());
    } catch (error) {
      console.error(`error : ${error}`);
    }
  }, [address, isConnected, inputValue, walletProvider]);
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

  if (!animationOnBySection.stake) {
    return (
      <section
        ref={(el) => (sectionRefs.current.stake = el)}
        className={`w-full flex flex-col justify-center items-center gap-3 ${
          animationOnBySection.stake ? "" : "invisible"
        }`}
      >
        <p className="title">Stake</p>

        <div className="box flex flex-col justify-center items-start gap-3">
          <p className="smallTitle">INFO</p>
          <p>• Only USDT is acceptable to be staked.</p>
          <p>• FUSDT, in the same amount as the staked USDT, will be minted.</p>
          <p>• The minimum lock period is 3 days.</p>
          <p>• The rewards will be in FUSDT.</p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-3">
          <div className="box flex flex-col justify-center items-start gap-3">
            <p className="smallTitle">STAKING INFO</p>
            {isConnected && (
              <p>User : {`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
            )}
            <p>{`Staking balance: ${
              isConnected ? stakingBalance : "0"
            } USDT`}</p>
            <p>{`Current Reward: ${isConnected ? userReward : "0"} FUSDT`}</p>
            <p>{`Lockup rounds: ${
              isConnected ? leftoverLockUpRounds : "0"
            } Round`}</p>
          </div>
          <div className="box flex flex-col justify-between items-start gap-3 h-full">
            <p className="smallTitle">STAKING</p>

            <div className="flex flex-col gap-3 w-full">
              <label htmlFor="stakingInput" className="infoText">
                Staking Amount
              </label>

              <input
                id="stakingInput"
                className="removeIncDecArrow inputStyle infoText"
                type="number"
                step="0.0001"
                min="0.0001"
                onChange={changeInputValue}
                value={inputValue}
                placeholder="The staking amount in FUSDT"
              />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={stake} className="btn">
                Stake
              </button>
              <button onClick={withdraw} className="btn">
                Withdraw all
              </button>
              <button onClick={claim} className="btn">
                Claim
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
        ref={(el) => (sectionRefs.current.stake = el)}
        className={`w-full flex flex-col justify-center items-center gap-3 ${
          animationOnBySection.stake ? "" : "invisible"
        }`}
      >
        <p className="title">Stake</p>

        <div className="box flex flex-col justify-center items-start gap-3 toBottom">
          <p className="smallTitle">INFO</p>
          <p>• Only USDT is acceptable to be staked.</p>
          <p>• FUSDT, in the same amount as the staked USDT, will be minted.</p>
          <p>• The minimum lock period is 3 days.</p>
          <p>• The rewards will be in FUSDT.</p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-3">
          <div className="box flex flex-col justify-center items-start gap-3 toLeft">
            <p className="smallTitle">STAKING INFO</p>
            {isConnected && (
              <p>User : {`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
            )}
            <p>{`Staking balance: ${
              isConnected ? stakingBalance : "0"
            } USDT`}</p>
            <p>{`Current Reward: ${isConnected ? userReward : "0"} FUSDT`}</p>
            <p>{`Lockup rounds: ${
              isConnected ? leftoverLockUpRounds : "0"
            } Round`}</p>
          </div>
          <div className="box flex flex-col justify-between items-start gap-3 h-full toRight">
            <p className="smallTitle">STAKING</p>

            <div className="flex flex-col gap-3 w-full">
              <label htmlFor="stakingInput" className="infoText">
                Staking Amount
              </label>

              <input
                id="stakingInput"
                className="removeIncDecArrow inputStyle infoText"
                type="number"
                step="0.0001"
                min="0.0001"
                onChange={changeInputValue}
                value={inputValue}
                placeholder="The staking amount in FUSDT"
              />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={stake} className="btn">
                Stake
              </button>
              <button onClick={withdraw} className="btn">
                Withdraw all
              </button>
              <button onClick={claim} className="btn">
                Claim
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
