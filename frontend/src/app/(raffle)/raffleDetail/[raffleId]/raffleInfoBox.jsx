"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import fusdtJSon from "../../../../abis/fusdt.json";
import raffleJson from "../../../../abis/raffle.json";
import erc20AbiJson from "../../../../abis/erc20Abi.json";
import erc721AbiJson from "../../../../abis/erc721Abi.json";
import erc1155AbiJson from "../../../../abis/erc1155Abi.json";
import Loading from "@/utils/loading";
import EthDater from "ethereum-block-by-date";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import {
  formattedBalance,
  getContract,
  getContractForReadOnly,
  getProvider,
} from "@/utils/utils";
import { ipfsToHttpConverter, fetchCreatorTx } from "@/utils/fetch/fetchUtils";
import { CiLink } from "react-icons/ci";
import FeatureBox from "./featureBox";
import { toastMessage, txMessage } from "@/utils/toastMessage";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { ethers, BrowserProvider, Contract } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import { useMediaQuery } from "react-responsive";
export default function RaffleInfoBox({ raffleId }) {
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [isLoading, setIsLoading] = useState(true);
  const [raffleInfo, setRaffleInfo] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const { update, setUpdate } = useContext(ContextAPI);

  useEffect(() => {
    if (raffleId == null) return setIsLoading(false);

    (async () => {
      const raffle = getContractForReadOnly(raffleJson.address, raffleJson.abi);

      let {
        status,
        prize,
        prizeAmount,
        prizeType,
        prizeId,
        entryPrice,
        deadline,
        minRaffleEntries,
        maxRaffleEntries,
        minEntriesPerUser,
        maxEntriesPerUser,
        creator,
        winner,
        winningEntryNumber,
        totalEntries,
      } = await raffle.raffleInfo(raffleId);

      const prizeInstance = await getContractForReadOnly(
        prize,
        getAIBByPrizeType(prizeType)
      );

      let name;
      let imageURI, description;
      if (prizeType === 0n) {
        name = await prizeInstance.name();
        imageURI = "/tokens/erc20Prize.jpg";
      } else if (prizeType === 1n) {
        name = await prizeInstance.name();
        const response = await axios.get(await prizeInstance.tokenURI(prizeId));
        imageURI = ipfsToHttpConverter(response.data.image);
        description = response.data.description;
        name = `${name} ${response.data.name}`;
      } else {
        const response = await axios.get(await prizeInstance.uri(prizeId));
        imageURI = ipfsToHttpConverter(response.data.image);
        description = response.data.description;
        name = `${response.data.name}`;
      }

      const txHash = await fetchCreatorTx(raffleId, creator, deadline);

      const totalUserEntries = !isConnected
        ? 0
        : await raffle.getUserEntryCounterByRaffle(address, raffleId);

      let announceTxHash = await announceEventHash(status, raffle, deadline);

      setRaffleInfo({
        status: getRaffleStatus(status, deadline),
        raffleId,
        prize, // prize address
        prizeAmount,
        prizeType,
        prizeId, // if it is a nft
        formattedEntryPrice: formattedBalance(entryPrice, 6),
        entryPrice: entryPrice,
        deadline,
        imageURI,
        description,
        creator,
        name,
        txHash,
        announceTxHash,
        winner,
        totalEntries: Number(totalEntries),
        minRaffleEntries: Number(minRaffleEntries),
        maxRaffleEntries: Number(maxRaffleEntries),
        minEntriesPerUser: Number(minEntriesPerUser),
        maxEntriesPerUser: Number(maxEntriesPerUser),
        totalUserEntries: Number(totalUserEntries),
      });

      setIsLoading(false);
    })();
  }, [raffleId, address, isConnected, update]);

  const announceEventHash = async (status, raffle, deadline) => {
    if (status !== 0n) {
      const announceFilter = await raffle.filters.Announce(
        raffleId,
        null,
        null
      );
      const dater = new EthDater(
        await getProvider() // Ethers provider, required.
      );

      let deadlineInMilliseconds = Number(deadline * 1000n);

      const { block } = await dater.getDate(
        new Date(deadlineInMilliseconds),
        false,
        false
      );

      const events = await raffle.queryFilter(
        announceFilter,
        block,
        block + 1000
      );
      return events[0].transactionHash;
    }
    return null;
  };

  const onChangeValue = useCallback((e) => {
    const value = Number(e.target.value);
    if (isNaN(value)) return toastMessage("Input only number", "warn");

    setInputValue(value);
  }, []);

  const enter = useCallback(async () => {
    try {
      if (!isConnected || !address) {
        return toastMessage("Please Connect Wallet", "warn");
      }

      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      const fusdtInstance = new Contract(
        fusdtJSon.address,
        fusdtJSon.abi,
        signer
      );
      const raffleInstance = new Contract(
        raffleJson.address,
        raffleJson.abi,
        signer
      );

      // 0. total entry check
      const totalUserEntry = Number(
        await raffleInstance.getUserEntryCounterByRaffle(
          address,
          raffleInfo.raffleId
        )
      );
      if (raffleInfo.maxEntriesPerUser < Number(inputValue) + totalUserEntry)
        return toastMessage(
          `You have hit the ${raffleInfo.maxEntriesPerUser}-entry limit.`,
          "warn"
        );

      // 2. min-entry check
      if (raffleInfo.minEntriesPerUser > Number(inputValue))
        return toastMessage(
          `The minimum entry is ${raffleInfo.minEntriesPerUser}`,
          "warn"
        );

      //3. remaining entry check
      if (raffleInfo.maxRaffleEntries - raffleInfo.totalEntries <= 0)
        return toastMessage(`Out of remaining tickets`, "warn");
      if (
        raffleInfo.maxRaffleEntries <
        raffleInfo.totalEntries + Number(inputValue)
      )
        return toastMessage(`Out of remaining tickets`, "warn");

      // 4.Balance check
      const userBalance = await fusdtInstance.balanceOf(address);
      const totalEntryPrice =
        Number(inputValue) * Number(raffleInfo.entryPrice);

      if (userBalance < totalEntryPrice)
        return toastMessage("Insufficient FUSDT", "warn");

      // 5.Approval Check
      const approvalAmount = await fusdtInstance.allowance(
        address,
        raffleJson.address
      );

      if (approvalAmount < totalEntryPrice) {
        toastMessage(
          "Please approve the same amount as the total entry price in FUSDT",
          "warn"
        );

        const tx = await fusdtInstance.approve(
          raffleJson.address,
          totalEntryPrice
        );
        await txMessage(tx);
      }

      const tx = await raffleInstance.join(
        raffleInfo.raffleId,
        Number(inputValue)
      );
      await txMessage(tx);
      setUpdate(Date().now);
      setInputValue("");
    } catch (error) {
      console.log(error);
    }
  }, [address, isConnected, walletProvider, raffleInfo, inputValue]);

  if (isLoading || raffleInfo == null)
    return (
      <div className="flex flex-col justify-center items-center w-full h-full min-h-[90vh] ">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  else {
    if (!isMobile) {
      return (
        <div className="largeText flex flex-col w-full justify-center items-center min-h-[80vh] font-bebas_neue">
          <div className="grid grid-cols-3 w-full justify-center items-center raffleCard">
            <div className="flex flex-col justify-evenly items-center gap-2 p-2 tracking-[0.1rem] w-full h-full">
              <div className="text-center w-full flex flex-col justify-center items-center relative bigImageContainer">
                <Image
                  src={raffleInfo.imageURI}
                  alt="Raffle Image"
                  sizes="(min-width:640px) 300px, (min-width:475px) 250px, 200px"
                  fill
                />
                <p>{`${raffleInfo.name}`}</p>
              </div>

              {raffleInfo.prizeType !== 0n ? (
                <div className="w-full flex flex-col justify-center items-center gap-3">
                  <p>DESCRIPTION</p>
                  <p className="font-roboto_slab pt-2 pb-2 border-t-2 border-b-2 w-full break-words text-center overflow-auto max-h-[200px] customizedScrollbar">
                    {raffleInfo.description}
                  </p>
                  <button className="w-full textBtn">
                    <Link
                      className="w-full flex justify-center"
                      href={`https://testnets.opensea.io/assets/sepolia/${raffleInfo.prize}`}
                      target="_blank"
                    >
                      GO TO OPENSEA <CiLink />
                    </Link>
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3 justify-center items-center">
                  <p>prize amount</p>
                  <p>{`${formattedBalance(raffleInfo.prizeAmount)} ${
                    raffleInfo.name
                  }`}</p>
                  <button className="w-full textBtn">
                    <Link
                      className="w-full flex justify-center"
                      href={`https://app.uniswap.org/swap?inputCurrency=${raffleInfo.prize}`}
                      target="_blank"
                    >
                      GO TO UNISWAP <CiLink />
                    </Link>
                  </button>
                </div>
              )}
            </div>

            <div className="col-span-2 border-l-[1px] h-full w-full p-2 flex flex-col gap-5">
              <p className="text-highlight-color">{raffleInfo.status}</p>
              <p>
                {`Raffle will be closed at `}
                <span className="text-highlight-color">
                  {`${timeConvert(raffleInfo.deadline).time} `}
                </span>
                in
                <span className="text-highlight-color">
                  {` ${timeConvert(raffleInfo.deadline).date}`}
                </span>
              </p>
              <div className="flex w-full gap-1">
                <p>{`Created by`}</p>
                <button>
                  <Link
                    className="w-full flex textBtn"
                    href={`https://sepolia.etherscan.io/tx/${raffleInfo.txHash}`}
                    target="_blank"
                  >
                    {`${raffleInfo.creator.slice(
                      0,
                      4
                    )}...${raffleInfo.creator.slice(-4)}`}
                    <CiLink />
                  </Link>
                </button>
              </div>
              <div className="grid grid-cols-3 w-full gap-5 p-2 ">
                <FeatureBox
                  title={"Total Sale"}
                  content={raffleInfo.totalEntries}
                />

                <FeatureBox
                  title={"Remaining"}
                  content={
                    raffleInfo.maxRaffleEntries - raffleInfo.totalEntries
                  }
                />
                <FeatureBox
                  title={"Min-Entries"}
                  content={raffleInfo.minRaffleEntries}
                />
              </div>
              <div className="grid grid-cols-3 w-full gap-5 p-2 ">
                <FeatureBox
                  title={"Max-Entries"}
                  content={raffleInfo.maxRaffleEntries}
                />
                <FeatureBox
                  title={"User Max-Entries"}
                  content={raffleInfo.maxEntriesPerUser}
                />

                <FeatureBox
                  title={"User Min-Entries"}
                  content={raffleInfo.minEntriesPerUser}
                />
              </div>
              <div className="grid grid-cols-3 w-full gap-5 p-2 ">
                <FeatureBox
                  title={"Entry price"}
                  content={`${raffleInfo.formattedEntryPrice} FUSDT`}
                />
                <FeatureBox
                  title={"My total Entries"}
                  content={`${raffleInfo.totalUserEntries} `}
                  className="raffleFeatureBox !bg-[#0f2446] flex flex-col justify-center items-center"
                />
              </div>

              {Number(raffleInfo.deadline * 1000n) > Number(Date.now()) ? (
                <>
                  <div className="grid grid-cols-2 w-full gap-5 p-2 ">
                    <input
                      className="inputStyle !rounded-none"
                      placeholder="The Number of entries"
                      onChange={onChangeValue}
                      value={inputValue}
                    ></input>
                    <div className="w-full text-center">
                      {`${raffleInfo.formattedEntryPrice} FUSDT x ${
                        inputValue === "" ? 0 : inputValue
                      }  = ${
                        raffleInfo.formattedEntryPrice * Number(inputValue)
                      } FUSDT`}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center w-full h-full">
                    <button onClick={enter} className="btn w-full">
                      ENTER
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center w-full h-full p-2">
                  <p>Time ended</p>
                  <Link
                    className="w-full flex justify-center "
                    href={`https://sepolia.etherscan.io/tx/${raffleInfo.announceTxHash}`}
                    target="_blank"
                  >
                    {raffleInfo.winner !== ethers.ZeroAddress ? (
                      <div className="w-full flex justify-center">
                        <p className="text-highlight-color">
                          {`Winner is ${raffleInfo.winner.slice(
                            0,
                            4
                          )}...${raffleInfo.winner.slice(-4)}`}
                        </p>
                        <CiLink className="text-highlight-color" />
                      </div>
                    ) : (
                      <div className="w-full flex justify-center">
                        <p>Visit Canceled Announce Tx hash</p>
                        <CiLink />
                      </div>
                    )}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="largeText font-bebas_neue flex flex-col w-full justify-start items-center min-h-[80vh]">
          <div className="flex flex-col justify-center items-center p-2 tracking-[0.1rem] h-full raffleCard gap-5">
            <div className="w-full flex flex-col justify-start items-center relative bigImageContainer">
              <Image
                src={raffleInfo.imageURI}
                alt="Raffle Image"
                sizes="(min-width: 768px) 400px, (min-width:640px) 300px, (min-width:475px) 250px, 200px"
                fill
              />
              <p>{`${raffleInfo.name}`}</p>
            </div>
            {raffleInfo.prizeType !== 0n ? (
              <>
                <p>DESCRIPTION</p>
                <p className="font-roboto_slab pt-2 pb-2 border-t-2 border-b-2 break-words text-center overflow-auto max-h-[200px]  customizedScrollbar">
                  {raffleInfo.description}
                </p>
                <button className="w-full textBtn">
                  <Link
                    className="w-full flex justify-center smallTile"
                    href={`https://testnets.opensea.io/assets/sepolia/${raffleInfo.prize}`}
                    target="_blank"
                  >
                    GO TO OPENSEA <CiLink />
                  </Link>
                </button>
              </>
            ) : (
              <div className="w-full text-center">
                <p>PRIZE AMOUNT</p>
                <p>{`${formattedBalance(raffleInfo.prizeAmount)} ${
                  raffleInfo.name
                }`}</p>
                <button className="w-full textBtn">
                  <Link
                    className="w-full flex justify-center"
                    href={`https://app.uniswap.org/swap?inputCurrency=${raffleInfo.prize}`}
                    target="_blank"
                  >
                    GO TO UNISWAP <CiLink />
                  </Link>
                </button>
              </div>
            )}
            <div className="flex flex-col justify-center items-start gap-3">
              <p className="text-highlight-color">{raffleInfo.status}</p>
              <p>
                {`Closed at `}
                <span className="text-highlight-color">
                  {`${timeConvert(raffleInfo.deadline).time} `}
                </span>
                in
                <span className="text-highlight-color">
                  {` ${timeConvert(raffleInfo.deadline).date}`}
                </span>
              </p>
              <div className="w-full flex justify-center gap-4"></div>
              <div className="flex w-full gap-1">
                <p>{`Created by `}</p>
                <button className="textBtn">
                  <Link
                    className="w-full flex"
                    href={`https://sepolia.etherscan.io/tx/${raffleInfo.txHash}`}
                    target="_blank"
                  >
                    {`${raffleInfo.creator.slice(
                      0,
                      4
                    )}...${raffleInfo.creator.slice(-4)}`}
                    <CiLink />
                  </Link>
                </button>
              </div>
            </div>
            <FeatureBox
              title={"Total Sale"}
              content={raffleInfo.totalEntries}
            />
            <FeatureBox
              title={"Remaining"}
              content={raffleInfo.maxRaffleEntries - raffleInfo.totalEntries}
            />
            <FeatureBox
              title={"Min-Entries"}
              content={raffleInfo.minRaffleEntries}
            />

            <FeatureBox
              title={"Max-Entries"}
              content={raffleInfo.maxRaffleEntries}
            />
            <FeatureBox
              title={"User Max-Entries"}
              content={raffleInfo.minEntriesPerUser}
            />

            <FeatureBox
              title={"User Min-Entries"}
              content={raffleInfo.maxEntriesPerUser}
            />

            <FeatureBox
              title={"Entry price"}
              content={`${raffleInfo.formattedEntryPrice} FUSDT`}
            />
            <FeatureBox
              title={"My total Entries"}
              content={`${raffleInfo.totalUserEntries}`}
              className="raffleCard flex flex-col justify-center items-center !bg-[#0f2446]"
            />
            {Number(raffleInfo.deadline * 1000n) > Number(Date.now()) ? (
              <>
                <div className="w-full text-center">
                  {`${raffleInfo.formattedEntryPrice} FUSDT x ${
                    inputValue === "" ? 0 : inputValue
                  } = ${
                    raffleInfo.formattedEntryPrice * Number(inputValue)
                  } FUSDT`}
                </div>
                <input
                  className="inputStyle !rounded-none"
                  placeholder="The Number of entries"
                  onChange={onChangeValue}
                  value={inputValue}
                ></input>
                <div className="flex flex-col justify-center items-center w-full h-full">
                  <button onClick={enter} className="btn w-full">
                    ENTER
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full p-2">
                <p>Time ended</p>
                <Link
                  className=" w-full flex justify-center "
                  href={`https://sepolia.etherscan.io/tx/${raffleInfo.announceTxHash}`}
                  target="_blank"
                >
                  {raffleInfo.winner !== ethers.ZeroAddress ? (
                    <div className="w-full flex justify-center">
                      <p className="text-[#ffc13c] ">
                        {`Winner is ${raffleInfo.winner.slice(
                          0,
                          4
                        )}...${raffleInfo.winner.slice(-4)}`}
                      </p>
                      <CiLink className="text-[#ffc13c] " />
                    </div>
                  ) : (
                    <div className="w-full flex justify-center">
                      <p className="text-[#ffc13c] ">Visit Canceled Tx hash</p>
                      <CiLink className="text-[#ffc13c] " />
                    </div>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }
  }
}

const getAIBByPrizeType = (prizeType) => {
  if (prizeType === 0n) {
    return erc20AbiJson.abi;
  } else if (prizeType === 1n) {
    return erc721AbiJson.abi;
  } else {
    return erc1155AbiJson.abi;
  }
};

const getRaffleStatus = (status, deadline) => {
  if (status === 0n) {
    return Number(deadline * 1000n) > Number(Date.now())
      ? "Open"
      : "Picking up a winner... now";
  } else if (status === 1n) {
    return "Closed";
  } else {
    return "Cancel";
  }
};

const timeConvert = (timestamp) => {
  timestamp = Number(timestamp * 1000n);
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return {
    time: `${hours}:${minutes}:${seconds}`,
    date: `${year}-${month}-${day}`,
  };
};
