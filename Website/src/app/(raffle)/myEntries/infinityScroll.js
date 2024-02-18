"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";

import { useCallback, useContext, useEffect, useState } from "react";
import raffleJson from "../../../abis/raffle.json";
import { getContractForReadOnly } from "@/components/utils/utils";
import {
  fetchOldestMyEntryList,
  fetchTimeEndEntryListOfMine,
  fetchNewestMyEntryList,
} from "@/components/utils/fetchRaffle";
export function InfinityScroll() {
  const [safeGuard, setSafeGuard] = useState(false);
  const {
    myEntryList,
    setMyEntryList,
    user,
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
    user,
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
      if (!user || safeGuard || !myEntryList) return;
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
        user,
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
    user,
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
        !user ||
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
        user,
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
    user,
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
      if (!user || safeGuard || !myEntryList) return;
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
        user,
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
    user,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyEntries,
  ]);
}
