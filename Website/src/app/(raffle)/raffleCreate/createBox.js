"use client";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import {
  converter,
  getContract,
  getContractForReadOnly,
  getProvider,
} from "@/components/utils/utils";
import { ethers } from "ethers";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import raffleJson from "../../../abis/raffle.json";
import erc20Json from "../../../abis/erc20Abi.json";
import erc721Json from "../../../abis/erc721Abi.json";
import erc1155Json from "../../../abis/erc1155Abi.json";
import fusdtJson from "../../../abis/fusdt.json";
import DateSelector from "./dateSelector";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
export default function CreateBox() {
  const { user, setUpdate } = useContext(ContextAPI);
  const [inputValue, setInputValue] = useState({
    prizeType: null,
    prizeTypeText: "None",
  });
  const ref = useRef({ prizeType: null, prizeTypeText: "None" });

  const onChangePrizeAddress = useCallback(
    async (e) => {
      const name = e.target.name;
      const value = e.target.value;
      ref.address = e.target.value;

      if (ref.address.length === 42) {
        try {
          const raffle = await getContractForReadOnly(
            raffleJson.address,
            raffleJson.abi
          );

          const prizeType = Number(
            await raffle.findPrizeType(
              ethers.getAddress(value.trim().toLowerCase())
            )
          );

          ref.prizeType = prizeType;
          ref.prizeTypeText = getPrizeTypeText(prizeType);
        } catch (error) {
          ref.prizeType = null;
          ref.prizeTypeText = "None";
        }
      } else {
        ref.prizeType = null;
        ref.prizeTypeText = "None";
      }
      setInputValue({
        ...inputValue,
        [name]: value,
        prizeType: ref.prizeType,
        prizeTypeText: ref.prizeTypeText,
      });
    },
    [inputValue, ref]
  );

  const onChangePrizeId = useCallback(
    async (e) => {
      const value = e.target.value;

      if (Math.sign(Number(value)) === -1 || !Number.isInteger(Number(value))) {
        toastMessage("Prize Id must be a number", "warn");
        return setInputValue({
          ...inputValue,
          prizeId: "",
        });
      }
      /// if it is erc20
      if (inputValue.prizeType === 0) {
        return setInputValue({
          ...inputValue,
          prizeId: 0,
        });
      }
      setInputValue({
        ...inputValue,
        prizeId: Number(value),
      });
    },
    [inputValue]
  );
  const onChangePrizeAmount = useCallback(
    async (e) => {
      const value = parseFloat(e.target.value);
      const valueInText = e.target.value;
      if (!inputValue.prizeAddress) {
        toastMessage("Please input prize address first", "warn");
        return setInputValue({
          ...inputValue,
          prizeAmount: "",
        });
      }
      const { prizeType } = inputValue;

      if (prizeType === 0) {
        if (erc20prizeInputRestriction(value, valueInText)) {
          return setInputValue({
            ...inputValue,
            prizeAmount: value,
          });
        } else {
          return setInputValue({
            ...inputValue,
            prizeAmount: "",
          });
        }
      }
      //  It is only for erc1155, erc721 will automatically set up 1
      else {
        if (numberInputRestriction(value)) {
          return setInputValue({
            ...inputValue,
            prizeAmount: value,
          });
        } else {
          return setInputValue({
            ...inputValue,
            prizeAmount: "",
          });
        }
      }
    },
    [inputValue]
  );
  const onChangeEntryPrice = useCallback(
    async (e) => {
      const value = parseFloat(e.target.value);
      const valueInText = e.target.value;
      if (erc20prizeInputRestriction(value, valueInText)) {
        setInputValue({
          ...inputValue,
          entryPrice: value,
        });
      } else {
        setInputValue({
          ...inputValue,
          entryPrice: "",
        });
      }
    },
    [inputValue]
  );

  const onChangeEntries = useCallback(
    (e) => {
      const name = e.target.name;
      const value = parseFloat(e.target.value);

      if (numberInputRestriction(value)) {
        return setInputValue({
          ...inputValue,
          [name]: value,
        });
      } else {
        return setInputValue({
          ...inputValue,
          [name]: "",
        });
      }
    },
    [inputValue]
  );

  const create = useCallback(
    async (e) => {
      if (!user) {
        const userAddress = await connectMetamask();
        setUser(userAddress);
        return toastMessage("Please Connect Wallet", "warn");
      }
      e.preventDefault();

      let {
        prizeType,
        prizeAddress,
        prizeAmount,
        prizeId,
        deadline,
        entryPrice,
        raffleMinEntries,
        raffleMaxEntries,
        maxUserEntries,
        minUserEntries,
      } = inputValue;

      const raffle = await getContract(raffleJson.address, raffleJson.abi);
      const fusdtInstance = await getContract(fusdtJson.address, fusdtJson.abi);
      const depositAmountOfFusdt = await raffle.depositAmount();
      const fusdtBalance = await fusdtInstance.balanceOf(user);
      if (depositAmountOfFusdt > fusdtBalance)
        return toastMessage(
          `Insufficient deposit amount ${converter(
            depositAmountOfFusdt,
            6
          )} FUSDT`,
          "warn"
        );
      const allowance = await fusdtInstance.allowance(user, raffleJson.address);

      if (allowance < depositAmountOfFusdt) {
        toastMessage("Please approve the prize amount first", "warn");

        const tx = await fusdtInstance.approve(
          raffleJson.address,
          depositAmountOfFusdt
        );
        await txMessage(tx);
      }

      if (!ethers.isAddress(prizeAddress)) {
        setInputValue({ ...inputValue, prizeAddress: "" });
        return toastMessage("Please input correct formatted address.", "warn");
      }
      if (prizeType === 4) {
        setInputValue({ ...inputValue, prizeAddress: "" });
        return toastMessage(
          "The prize is only available on ERC20, ERC721 and ERC1155.",
          "warn"
        );
      }

      if (
        parseFloat(inputValue.raffleMaxEntries) <
        parseFloat(inputValue.raffleMinEntries)
      ) {
        toastMessage(
          "The minimum raffle entries must be smaller than the maximum entries",
          "warn"
        );
        return setInputValue({
          ...inputValue,
          raffleMaxEntries: "",
          raffleMinEntries: "",
        });
      }

      if (
        parseFloat(inputValue.maxUserEntries) <
        parseFloat(inputValue.minUserEntries)
      ) {
        toastMessage(
          "The minimum raffle entries must be smaller than the maximum entries",
          "warn"
        );
        return setInputValue({
          ...inputValue,
          maxUserEntries: "",
          minUserEntries: "",
        });
      }

      const onlyFormattedERC20PrizeAmount = await prizeOwnerValidation(
        user,
        prizeType,
        prizeId,
        prizeAmount,
        prizeAddress
      );

      if (onlyFormattedERC20PrizeAmount !== null && prizeType === 0) {
        prizeAmount = onlyFormattedERC20PrizeAmount;
        prizeId = 0; /// since erc20 does not have token id
      }

      entryPrice = ethers.parseUnits(String(entryPrice), 6);
      const status_pending = 0;
      const winner = ethers.ZeroAddress;
      const winningEntryNumber = 0;
      const totalEntries = 0;

      prizeAmount = !prizeAmount ? 1 : prizeAmount;
      const raffleInfoParams = [
        prizeType,
        status_pending,
        prizeAddress,
        prizeAmount,
        prizeId,
        deadline,
        entryPrice,
        raffleMinEntries,
        raffleMaxEntries,
        minUserEntries,
        maxUserEntries,
        user,
        winner,
        winningEntryNumber,
        totalEntries,
      ];

      const tx = await raffle.create(raffleInfoParams);

      await txMessage(tx);
      setUpdate(Date.now());
    },
    [inputValue, user]
  );
  return (
    <form
      onSubmit={create}
      className="infoText grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 card gap-5 xl:gap-10"
    >
      <div className="flex flex-col gap-2">
        <label id="address">Current Prize Type</label>
        <div className="border-[3px] text-center text-[whiteSmoke] bg-[#011a42]">
          {inputValue.prizeTypeText}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label id="prizeAddress">Prize address</label>
        <input
          required
          className="inputStyle"
          value={inputValue.prizeAddress || ""}
          onChange={onChangePrizeAddress}
          name="prizeAddress"
          type="text"
          htmlFor="prizeAddress"
          placeholder="Input prize address"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label id="prizeAmount">Prize amount</label>
        <input
          required
          className="inputStyle"
          value={Number(ref.prizeType) === 1 ? "1" : inputValue.prizeAmount}
          onChange={onChangePrizeAmount}
          name="prizeAmount"
          type="number"
          htmlFor="prizeAmount"
          placeholder="Input prize amount"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label id="prizeId">
          Prize Id
          <span title="The prize, specified as ERC20, does not require an ID.">
            ℹ️
          </span>
        </label>
        <input
          required
          className="inputStyle"
          value={ref.prizeType === 0 ? 0 : inputValue.prizeId}
          onChange={onChangePrizeId}
          name="prizeId"
          type="number"
          htmlFor="prizeId"
          placeholder="Input prize Id"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label id="entryPrice">Entry price</label>
        <input
          required
          className="inputStyle"
          value={inputValue.entryPrice}
          onChange={onChangeEntryPrice}
          name="entryPrice"
          type="number"
          htmlFor="entryPrice"
          placeholder="Input raffle entry price in FUSDT"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label id="raffleMinEntries">
          Minimum Raffle Entries
          <span title="The minimum raffle entries specify the required number to proceed with the raffle; if this threshold is not met, the raffle will be canceled.">
            ℹ️
          </span>
        </label>
        <input
          required
          className="inputStyle"
          value={inputValue.raffleMinEntries || ""}
          onChange={onChangeEntries}
          name="raffleMinEntries"
          type="number"
          htmlFor="raffleMinEntries"
          placeholder="Input minimum raffle entries"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label id="raffleMaxEntries">
          Maximum Raffle Entries
          <span title="The maximum raffle entries is the total limit; once reached, users cannot join.">
            ℹ️
          </span>
        </label>
        <input
          required
          className="inputStyle"
          value={inputValue.raffleMaxEntries || ""}
          onChange={onChangeEntries}
          name="raffleMaxEntries"
          type="number"
          htmlFor="raffleMaxEntries"
          placeholder="Input maximum raffle entries"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label id="minUserEntries">
          Minimum user entries
          <span title="The minimum user raffle entries is the required threshold for participation.">
            ℹ️
          </span>
        </label>
        <input
          required
          className="inputStyle"
          value={inputValue.minUserEntries || ""}
          onChange={onChangeEntries}
          name="minUserEntries"
          type="number"
          htmlFor="minUserEntries"
          placeholder="Input minimum user entries "
        />
      </div>
      <div className="flex flex-col gap-2 ">
        <label id="maxUserEntries">
          Maximum User entries
          <span title="The maximum user entries is user's participation limit">
            ℹ️
          </span>
        </label>
        <input
          required
          className="inputStyle"
          value={inputValue.maxUserEntries || ""}
          onChange={onChangeEntries}
          name="maxUserEntries"
          type="number"
          htmlFor="maxUserEntries"
          placeholder="Input maximum user entries"
        />
      </div>

      <div className="flex flex-col gap-2 ">
        <label>DATE</label>
        <DateSelector inputValue={inputValue} setInputValue={setInputValue} />
      </div>

      <div className="flex flex-col  gap-2  ">
        <label>CREATOR</label>
        <div className="border-[3px] text-center text-[whiteSmoke] bg-[#011a42]">
          {user ? `${user.slice(0, 10)}...${user.slice(-10)}` : "NONE"}
        </div>
      </div>

      <div className="flex flex-col gap-2 h-full justify-end ">
        <div></div>

        <button className="btn bg-main-color">CREATE</button>
      </div>
    </form>
  );
}

const getPrizeTypeText = (prizeType) => {
  if (prizeType === 0) return "ERC20";
  else if (prizeType === 1) return "ERC721";
  else if (prizeType === 2) return "ERC1155";
  else return "None";
};

const prizeOwnerValidation = async (
  user,
  prizeType,
  prizeId,
  prizeAmount,
  prizeAddress
) => {
  /// erc20
  if (prizeType === 0) {
    const erc20Instance = await getContract(prizeAddress, erc20Json.abi);

    // Check1: Balance check
    const decimals = await erc20Instance.decimals();
    prizeAmount = ethers.parseUnits(String(prizeAmount), decimals);
    const userBalance = await erc20Instance.balanceOf(user);

    if (userBalance < prizeAmount)
      return toastMessage("The prize amount exceeds your balance.", "warn");

    // Check2: Allowance check
    const allowance = await erc20Instance.allowance(user, raffleJson.address);
    if (allowance < prizeAmount) {
      toastMessage("Please approve the prize amount first", "warn");

      const tx = await erc20Instance.approve(raffleJson.address, prizeAmount);
      await txMessage(tx);
    }
    return prizeAmount;
  }
  /// ERC721
  else if (prizeType === 1) {
    const erc721Instance = await getContract(prizeAddress, erc721Json.abi);

    // Check1: Owner check
    const ownerOfPrizeId = ethers.getAddress(
      await erc721Instance.ownerOf(prizeId)
    );
    user = ethers.getAddress(user);
    if (user !== ownerOfPrizeId)
      return toastMessage("You are not the owner of this prize", "warn");

    // Check2: Allowance check
    const expectedSpender = ethers.getAddress(
      await erc721Instance.getApproved(prizeId)
    );
    const raffleAddress = ethers.getAddress(raffleJson.address);
    if (raffleAddress !== expectedSpender) {
      toastMessage("Please approve the prize first", "warn");
      const tx = await erc721Instance.approve(raffleAddress, prizeId);
      await txMessage(tx);
    }
    return null;
  } else if (prizeType === 2) {
    const erc1155Instance = await getContract(prizeAddress, erc1155Json.abi);

    // check 1 : Balance check
    const userBalance = await erc1155Instance.balanceOf(user, prizeId);
    if (userBalance < prizeAmount)
      return toastMessage("The prize amount exceeds your balance.", "warn");

    // Check2: Allowance check
    const expectedOperator = ethers.getAddress(
      await erc1155Instance.isApprovedForAll(user, raffleJson.address)
    );
    const raffleAddress = ethers.getAddress(raffleJson.address);
    if (raffleAddress !== expectedOperator) {
      toastMessage("Please approve the prize amount first", "warn");

      const tx = await erc1155Instance.setApprovalForAll(raffleAddress, true);
      await txMessage(tx);
    }
    return null;
  }
};
const erc20prizeInputRestriction = (value, valueInText) => {
  if (valueInText.includes("0.0") && valueInText.length > 8) {
    toastMessage("Too many decimal pointer numbers", "warn");
    return false;
  }

  if (!Number.isInteger(value) && !isNaN(value)) {
    const [number, decimals] = valueInText.split(".");
    if (decimals.length > 5) {
      toastMessage("Too many decimal pointer numbers", "warn");
      return false;
    }
  }

  if (value !== 0 && value < 0.0001) {
    toastMessage("Too low amount", "warn");
    return false;
  }
  if (value > 9999) {
    toastMessage("Too high amount", "warn");
    return false;
  }

  return true;
};

const numberInputRestriction = (value) => {
  if (!Number.isInteger(value)) {
    toastMessage("Must be a Number", "warn");
    return false;
  }
  if (Math.sign(value) !== 1 || value === 0 || isNaN(value)) {
    toastMessage("Must be more than 0", "warn");
    return false;
  }
  return true;
};
/*
        PrizeType prizeType;
        Status status;
        address prize;
        uint256 prizeAmount;
        uint256 prizeId;
        uint256 deadline;
        uint256 entryPrice;
        uint256 minRaffleEntries; 
        uint256 maxRaffleEntries;
        uint256 minEntriesPerUser;
        uint256 maxEntriesPerUser;
        address creator;
        address winner;
        uint256 winningEntryNumber;
        uint256 totalEntries;

*/
