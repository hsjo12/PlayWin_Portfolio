"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { getContractForReadOnly } from "@/utils/utils";
import {
  fetchOldestMyEntryList,
  fetchTimeEndEntryListOfMine,
  fetchNewestMyEntryList,
} from "@/utils/fetch/myEntries";
import raffleJson from "../../../abis/raffle.json";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
export function InfinityScroll() {
  const { address, isConnected } = useWeb3ModalAccount();
  const [safeGuard, setSafeGuard] = useState(false);
  const {
    myEntryList,
    setMyEntryList,
    offset,
    sortType,
    itemType,
    activeType,
    fromIndexForMyEntries,
  } = useContext(ContextAPI);

  useEffect(() => {
    if (sortType === "End time" || sortType == null) {
      window.addEventListener("scroll", handleEndTimeScroll);
      return () => window.removeEventListener("scroll", handleEndTimeScroll);
    } else if (sortType === "Newest") {
      window.addEventListener("scroll", handleNewestScroll);
      return () => window.removeEventListener("scroll", handleNewestScroll);
    } else {
      // sortType === "oldest"
      window.addEventListener("scroll", handleOldestScroll);
      return () => window.removeEventListener("scroll", handleOldestScroll);
    }
  }, [
    myEntryList,
    address,
    isConnected,
    offset,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyEntries,
  ]);
  const handleOldestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (!isConnected || !address || safeGuard || !myEntryList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const userEntryListLength = Number(
        await raffle.getUserJoinedRaffleListLength(user)
      );

      if (userEntryListLength <= myEntryList.length) return setSafeGuard(false);

      const userRaffleInfo = await fetchOldestMyEntryList(
        address,
        fromIndexForMyEntries,
        offset,
        itemType,
        activeType
      );

      setMyEntryList([...myEntryList, ...userRaffleInfo]);
      setSafeGuard(false);
    }
  }, [
    myEntryList,
    address,
    isConnected,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyEntries,
  ]);

  const handleEndTimeScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (
        !isConnected ||
        !address ||
        safeGuard ||
        !myEntryList ||
        fromIndexForMyEntries.noMoreLoadInTimeEndOrder
      )
        return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const userEntryListLength = Number(
        await raffle.getUserJoinedRaffleListLength(user)
      );

      if (userEntryListLength <= myEntryList.length) return setSafeGuard(false);

      const userRaffleInfo = await fetchTimeEndEntryListOfMine(
        address,
        fromIndexForMyEntries,
        offset,
        itemType,
        activeType
      );

      setMyEntryList([...myEntryList, ...userRaffleInfo]);
      setSafeGuard(false);
    }
  }, [
    myEntryList,
    address,
    isConnected,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyEntries,
  ]);

  const handleNewestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (!isConnected || !address || safeGuard || !myEntryList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const userEntryListLength = Number(
        await raffle.getUserJoinedRaffleListLength(user)
      );

      if (userEntryListLength <= myEntryList.length) return setSafeGuard(false);

      const userRaffleInfo = await fetchNewestMyEntryList(
        address,
        fromIndexForMyEntries,
        offset,
        itemType,
        activeType
      );

      setMyEntryList([...myEntryList, ...userRaffleInfo]);
      setSafeGuard(false);
    }
  }, [
    myEntryList,
    address,
    isConnected,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyEntries,
  ]);
}
