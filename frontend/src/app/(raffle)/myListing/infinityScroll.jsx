"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import { getContractForReadOnly } from "@/utils/utils";
import {
  fetchEndTimeMyListing,
  fetchNewestMyListing,
  fetchOldestMyListing,
} from "@/utils/fetch/myListing";
import raffleJson from "../../../abis/raffle.json";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
export function InfinityScroll() {
  const { address, isConnected } = useWeb3ModalAccount();
  const [safeGuard, setSafeGuard] = useState(false);
  const {
    myListingList,
    setMyListingList,
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
    address,
    isConnected,
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
      if (!isConnected || !address || safeGuard || !myListingList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const totalUserRaffle = await raffle.getUserCreatedRaffleListLength(user);

      if (Number(totalUserRaffle) <= myListingList.length)
        return setSafeGuard(false);

      const userRaffleInfo = await fetchOldestMyListing(
        address,
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
    address,
    isConnected,
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
        !isConnected ||
        !address ||
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
        address,
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
    address,
    isConnected,
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
      if (!isConnected || !address || safeGuard || !myListingList) return;
      setSafeGuard(true);
      const raffle = await getContractForReadOnly(
        raffleJson.address,
        raffleJson.abi
      );
      const totalUserRaffle = await raffle.getUserCreatedRaffleListLength(user);

      if (Number(totalUserRaffle) <= myListingList.length)
        return setSafeGuard(false);

      const userRaffleInfo = await fetchNewestMyListing(
        address,
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
    address,
    isConnected,
    sortType,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMyListing,
  ]);
}
