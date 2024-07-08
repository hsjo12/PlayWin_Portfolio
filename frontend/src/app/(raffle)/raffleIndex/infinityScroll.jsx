"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import {
  newestOrder,
  oldestOrder,
  timeEndSoon,
  timeEndSoonForInActiveRaffles,
} from "@/utils/fetch/raffleIndex";
import { getContractForReadOnly } from "@/utils/utils";
import raffleJson from "../../../abis/raffle.json";

export function InfinityScroll() {
  const [safeGuard, setSafeGuard] = useState(false);
  const {
    raffleList,
    setRaffleList,
    offset,
    fromIndexForMain,
    sortType,
    itemType,
    activeType,
  } = useContext(ContextAPI);

  const handleEndTimeScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (safeGuard) return;
      if (raffleList != null || (raffleList && raffleList.length !== 0)) {
        setSafeGuard(true);
        const raffle = getContractForReadOnly(
          raffleJson.address,
          raffleJson.abi
        );

        let fetchedRaffleList;

        if (activeType === "Active") {
          const currentLength = Number(await raffle.listLength());
          if (raffleList.length >= currentLength) return setSafeGuard(false);
          if (fromIndexForMain.noMoreLoadInTimeEndOrder)
            return setSafeGuard(false);

          fetchedRaffleList = await timeEndSoon(
            fromIndexForMain,
            offset,
            itemType
          );
        } else {
          /// inActive
          const currentLength = Number(
            await raffle.getInactiveRaffleListLength()
          );
          if (raffleList.length >= currentLength) return setSafeGuard(false);

          fetchedRaffleList = await timeEndSoonForInActiveRaffles(
            fromIndexForMain,
            offset,
            itemType
          );
        }

        fetchedRaffleList = [...raffleList, ...fetchedRaffleList];
        const uniqueRaffleMaps = new Map();
        fetchedRaffleList.forEach((raffle) =>
          uniqueRaffleMaps.set(raffle.raffleId, raffle)
        );

        setRaffleList(Array.from(uniqueRaffleMaps.values()));
        setSafeGuard(false);
      }
    }
  }, [
    raffleList,
    offset,
    setRaffleList,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMain,
  ]);

  const handleNewestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (safeGuard) return;
      if (raffleList != null || (raffleList && raffleList.length !== 0)) {
        setSafeGuard(true);
        /// raffle id 0 does not exist.
        if (fromIndexForMain.current === 0) return setSafeGuard(false);
        let fetchedRaffleList = await newestOrder(
          fromIndexForMain,
          offset,
          itemType,
          activeType
        );
        fetchedRaffleList = [...raffleList, ...fetchedRaffleList];
        const uniqueRaffleMaps = new Map();
        fetchedRaffleList.forEach((raffle) =>
          uniqueRaffleMaps.set(raffle.raffleId, raffle)
        );
        setRaffleList(Array.from(uniqueRaffleMaps.values()));
        setSafeGuard(false);
      }
    }
  }, [
    raffleList,
    offset,
    setRaffleList,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMain,
  ]);

  const handleOldestScroll = useCallback(async () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 10
    ) {
      if (safeGuard) return setSafeGuard(false);
      if (raffleList != null || (raffleList && raffleList.length !== 0)) {
        setSafeGuard(true);
        const raffle = getContractForReadOnly(
          raffleJson.address,
          raffleJson.abi
        );

        if (fromIndexForMain.current === Number(await raffle.currentId()) + 1)
          return setSafeGuard(false);

        let fetchedRaffleList = await oldestOrder(
          fromIndexForMain,
          offset,
          itemType,
          activeType
        );
        fetchedRaffleList = [...raffleList, ...fetchedRaffleList];
        const uniqueRaffleMaps = new Map();
        fetchedRaffleList.forEach((raffle) =>
          uniqueRaffleMaps.set(raffle.raffleId, raffle)
        );
        setRaffleList(Array.from(uniqueRaffleMaps.values()));
        setSafeGuard(false);
      }
    }
  }, [
    raffleList,
    offset,
    setRaffleList,
    itemType,
    activeType,
    safeGuard,
    fromIndexForMain,
  ]);

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
  }, [sortType, handleEndTimeScroll, handleNewestScroll, handleOldestScroll]);
}
