"use client";
import Loading from "@/components/utils/loading";
import EthDater from "ethereum-block-by-date";
import Image from "next/image";
import axios from "axios";
import {
  converter,
  getContract,
  getContractForReadOnly,
  getProvider,
  ipfsToHttpConverter,
} from "@/components/utils/utils";
import fusdtJSon from "../../../../abis/fusdt.json";
import raffleJson from "../../../../abis/raffle.json";
import erc20AbiJson from "../../../../abis/erc20Abi.json";
import erc721AbiJson from "../../../../abis/erc721Abi.json";
import erc1155AbiJson from "../../../../abis/erc1155Abi.json";
import { useCallback, useContext, useEffect, useState } from "react";
import { fetchCreatorTx } from "@/components/utils/fetchRaffle";
import { CiLink } from "react-icons/ci";
import Link from "next/link";
import FeatureBox from "./featureBox";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import { connectMetamask } from "@/components/metamask/connector";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { ethers } from "ethers";
export default function RaffleInfoBox({ raffleId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [raffleInfo, setRaffleInfo] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const { user, setUser, update, setUpdate, xl, screenWidth } =
    useContext(ContextAPI);
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

      const totalUserEntries = !user
        ? 0
        : await raffle.getUserEntryCounterByRaffle(user, raffleId);

      let announceTxHash = await announceEventFHashFetch(
        status,
        raffle,
        deadline
      );

      setRaffleInfo({
        status: getRaffleStatus(status, deadline),
        raffleId,
        prize, // prize address
        prizeAmount,
        prizeType,
        prizeId, // if it is a nft
        formattedEntryPrice: converter(entryPrice, 6),
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
  }, [raffleId, user, update]);

  const announceEventFHashFetch = async (status, raffle, deadline) => {
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
    if (!user) {
      const userAddress = await connectMetamask();
      setUser(userAddress);
      return toastMessage("Please Connect Wallet", "warn");
    }

    const fusdtInstance = await getContract(fusdtJSon.address, fusdtJSon.abi);
    const raffleInstance = await getContract(
      raffleJson.address,
      raffleJson.abi
    );

    // 0. total entry check
    const totalUserEntry = Number(
      await raffleInstance.getUserEntryCounterByRaffle(
        user,
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
    const userBalance = await fusdtInstance.balanceOf(user);
    const totalEntryPrice = Number(inputValue) * Number(raffleInfo.entryPrice);

    if (userBalance < totalEntryPrice)
      return toastMessage("Insufficient FUSDT", "warn");

    // 5.Approval Check
    const approvalAmount = await fusdtInstance.allowance(
      user,
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
  }, [user, raffleInfo, inputValue]);

  if (isLoading || raffleInfo == null)
    return (
      <div className="flex flex-col justify-center items-center w-full h-full min-h-[90vh] ">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  else {
    if (screenWidth > xl) {
      return (
        <div className="biggerInfoText flex flex-col w-full justify-center items-center min-h-[80vh] ">
          <div className=" grid grid-cols-3 !w-[80%] !p-0 justify-center items-center card">
            <div className="flex flex-col justify-evenly  items-center gap-2 p-2 tracking-[0.1rem] w-full h-full">
              <div className="text-center w-full ">
                <Image
                  src={raffleInfo.imageURI}
                  width={0}
                  height={0}
                  sizes="100%"
                  alt="img"
                  className=" w-full"
                  priority
                />
              </div>

              {raffleInfo.prizeType !== 0n ? (
                <div className="w-full biggerInfoText text-center">
                  <p>{`${raffleInfo.name}`}</p>
                  <p>DESCRIPTION</p>
                  <p className="pt-2 pb-2 border-t-2 border-b-2  w-full break-words text-center overflow-auto max-h-[150px] customizedScrollbar">
                    {raffleInfo.description}
                  </p>
                  <button className="biggerInfoText w-full">
                    <Link
                      className="w-full flex justify-center subTitle"
                      href={`https://testnets.opensea.io/assets/sepolia/${raffleInfo.prize}`}
                      target="_blank"
                    >
                      GO TO OPENSEA <CiLink />
                    </Link>
                  </button>
                </div>
              ) : (
                <div className="w-full biggerInfoText text-center ">
                  <p>{`${raffleInfo.name}`}</p>
                  <p>{`${converter(raffleInfo.prizeAmount)} ${
                    raffleInfo.name
                  }`}</p>
                  <button className="biggerInfoText w-full">
                    <Link
                      className="w-full flex justify-center subTitle"
                      href={`https://app.uniswap.org/swap?inputCurrency=${raffleInfo.prize}`}
                      target="_blank"
                    >
                      GO TO UNISWAP <CiLink />
                    </Link>
                  </button>
                </div>
              )}
            </div>

            <div className=" biggerInfoText  col-span-2 border-l-[1px] h-full w-full p-2 flex flex-col gap-5">
              <p className="text-highlight-color biggerInfoText">
                {raffleInfo.status}
              </p>
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
              <div className="w-full flex gap-5">
                <p>{`Created by`}</p>

                <button className="biggerInfoText">
                  <Link
                    className="subTitle w-full flex "
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
              <div className="biggerInfoText grid grid-cols-3 w-full gap-5 p-2 ">
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
              <div className="biggerInfoText grid grid-cols-3 w-full gap-5 p-2 ">
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
              <div className="biggerInfoText grid grid-cols-3 w-full gap-5 p-2 ">
                <FeatureBox
                  title={"Entry price"}
                  content={`${raffleInfo.formattedEntryPrice} FUSDT`}
                />
                <FeatureBox
                  title={"My total Entries"}
                  content={`${raffleInfo.totalUserEntries} `}
                  className="bg-[#0f2446] biggerInfoText outline-[whitesmoke] outline outline-3 outline-offset-1 p-4 flex flex-col justify-center items-center"
                />
                <div></div>
              </div>

              {Number(raffleInfo.deadline * 1000n) > Number(Date.now()) ? (
                <>
                  <div className=" biggerInfoText grid grid-cols-2 w-full gap-5 p-2 ">
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
                    <button
                      onClick={enter}
                      className="connectButton biggerInfoText w-full"
                    >
                      ENTER
                    </button>
                  </div>
                </>
              ) : (
                <div className="biggerInfoText flex flex-col justify-center items-center w-full h-full  p-2">
                  <p className="biggerInfoText">Time ended</p>
                  <Link
                    className="biggerInfoText w-full flex justify-center "
                    href={`https://mumbai.polygonscan.com/tx/${raffleInfo.announceTxHash}`}
                    target="_blank"
                  >
                    {raffleInfo.winner !== ethers.ZeroAddress ? (
                      <div className="w-full biggerInfoText flex justify-center">
                        <p className="text-highlight-color biggerInfoText ">
                          {`Winner is ${raffleInfo.winner.slice(
                            0,
                            4
                          )}...${raffleInfo.winner.slice(-4)}`}
                        </p>
                        <CiLink className="text-highlight-color" />
                      </div>
                    ) : (
                      <div className="w-full biggerInfoText flex justify-center">
                        <p className="subTitle ">
                          Visit Canceled Announce Tx hash
                        </p>
                        <CiLink className="subTitle " />
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
        <div className="biggerInfoText flex flex-col w-full justify-start items-center min-h-[80vh]  ">
          <div className="flex flex-col justify-center items-center p-2 tracking-[0.1rem]  h-full card gap-5">
            <div className="w-full flex flex-col justify-start items-center ">
              <Image
                src={raffleInfo.imageURI}
                width={0}
                height={0}
                sizes="100%"
                alt="img"
                className="raffleInfoImage"
                priority
              />
            </div>
            {raffleInfo.prizeType !== 0n ? (
              <>
                <p>{`Name: ${raffleInfo.name}`}</p>
                <p>DESCRIPTION</p>
                <p className="pt-2 pb-2 border-t-2 border-b-2  w-[90%] break-words text-center overflow-auto max-h-[150px] customizedScrollbar">
                  {raffleInfo.description}
                </p>
                <button className="biggerInfoText w-full">
                  <Link
                    className="w-full flex justify-center subTitle"
                    href={`https://testnets.opensea.io/assets/mumbai/${raffleInfo.prize}`}
                    target="_blank"
                  >
                    GO TO OPENSEA <CiLink />
                  </Link>
                </button>
              </>
            ) : (
              <div className="w-full  text-center ">
                <p>{`${raffleInfo.name}`}</p>
                <p>PRIZE AMOUNT</p>
                <p>{`${converter(raffleInfo.prizeAmount)} ${
                  raffleInfo.name
                }`}</p>
                <button className="biggerInfoText w-full ">
                  <Link
                    className="w-full flex justify-center subTitle"
                    href={`https://app.uniswap.org/swap?inputCurrency=${raffleInfo.prize}`}
                    target="_blank"
                  >
                    GO TO UNISWAP <CiLink />
                  </Link>
                </button>
              </div>
            )}
            <p className="text-highlight-color"> {raffleInfo.status} </p>
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
            <div className="w-full flex justify-center gap-4">
              <p>{`Created by `}</p>
              <button className="biggerInfoText">
                <Link
                  className="text-highlight-color w-full flex"
                  href={`https://mumbai.polygonscan.com/tx/${raffleInfo.txHash}`}
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
              className="featureCard flex flex-col justify-center items-center !bg-[#0f2446]"
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
                  <button onClick={enter} className="connectButton w-full">
                    Buy
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center w-full h-full  p-2   ">
                <p className="biggerInfoText">Time ended</p>
                <Link
                  className="biggerInfoText w-full flex justify-center "
                  href={`https://mumbai.polygonscan.com/tx/${raffleInfo.announceTxHash}`}
                  target="_blank"
                >
                  {raffleInfo.winner !== ethers.ZeroAddress ? (
                    <div className="w-full biggerInfoText flex justify-center">
                      <p className="text-[#ffc13c] ">
                        {`Winner is ${raffleInfo.winner.slice(
                          0,
                          4
                        )}...${raffleInfo.winner.slice(-4)}`}
                      </p>
                      <CiLink className="text-[#ffc13c] " />
                    </div>
                  ) : (
                    <div className="w-full biggerInfoText flex justify-center">
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
