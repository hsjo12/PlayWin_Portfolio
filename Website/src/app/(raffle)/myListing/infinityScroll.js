"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import raffleJson from "../../../abis/raffle.json";
import { getContractForReadOnly } from "@/components/utils/utils";
import {
  fetchEndTimeMyListing,
  fetchNewestMyListing,
  fetchOldestMyListing,
} from "@/components/utils/fetchRaffle";
export function InfinityScroll() {
  const [safeGuard, setSafeGuard] = useState(false);
  const {
    myListingList,
    setMyListingList,
    user,
    offset,
    fromIndexForMyListing,
    sortType,
    itemType,
    activeType,
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
    myListingList,
    user,
    offset,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyListing,
  ]);

  const handleOldestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (!user || safeGuard || !myListingList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const totalUserRaffle = await raffle.getUserCreatedRaffleListLength(user);

      if (Number(totalUserRaffle) <= myListingList.length)
        return setSafeGuard(false);

      const userRaffleInfo = await fetchOldestMyListing(
        user,
        fromIndexForMyListing,
        offset,
        itemType,
        activeType
      );

      setMyListingList([...myListingList, ...userRaffleInfo]);
      setSafeGuard(false);
    }
  }, [
    myListingList,
    user,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyListing,
  ]);

  const handleEndTimeScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (
        !user ||
        safeGuard ||
        !myListingList ||
        fromIndexForMyListing.noMoreLoadInTimeEndOrder
      )
        return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const totalUserRaffle = await raffle.getUserCreatedRaffleListLength(user);

      if (Number(totalUserRaffle) <= myListingList.length)
        return setSafeGuard(false);
      const userRaffleInfo = await fetchEndTimeMyListing(
        user,
        fromIndexForMyListing,
        offset,
        itemType,
        activeType
      );

      setMyListingList([...myListingList, ...userRaffleInfo]);
      setSafeGuard(false);
    }
  }, [
    myListingList,
    user,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyListing,
  ]);

  const handleNewestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (!user || safeGuard || !myListingList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const totalUserRaffle = await raffle.getUserCreatedRaffleListLength(user);

      if (Number(totalUserRaffle) <= myListingList.length)
        return setSafeGuard(false);

      const userRaffleInfo = await fetchNewestMyListing(
        user,
        fromIndexForMyListing,
        offset,
        itemType,
        activeType
      );

      setMyListingList([...myListingList, ...userRaffleInfo]);

      setSafeGuard(false);
    }
  }, [
    myListingList,
    user,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyListing,
  ]);
}
