"use client";
import { useContext, useEffect, useState } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import {
  fetchEndTimeMyListing,
  fetchNewestMyListing,
  fetchOldestMyListing,
} from "@/utils/fetch/myListing";
import Loading from "@/utils/loading";
import ItemCard from "../itemCard";
import Empty from "@/utils/empty";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";

export default function MyListingList() {
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useWeb3ModalAccount();
  const {
    myListingList,
    setMyListingList,
    fromIndexForMyListing,
    offset,
    sortType,
    itemType,
    activeType,
  } = useContext(ContextAPI);

  useEffect(() => {
    if (!isConnected) return setIsLoading(false);
    else {
      try {
        (async () => {
          if (sortType === "End time" || sortType == null) {
            try {
              /// Initialize 0
              fromIndexForMyListing.current = 0;
              const userRaffleInfo = await fetchEndTimeMyListing(
                address,
                fromIndexForMyListing,
                offset,
                itemType,
                activeType
              );
              setMyListingList(userRaffleInfo);
              setIsLoading(false);
            } catch (error) {
              setMyListingList([]);
              setIsLoading(false);
            }
          } else if (sortType === "Newest") {
            try {
              /// Initialize 0
              fromIndexForMyListing.current = 0;
              const userRaffleInfo = await fetchNewestMyListing(
                address,
                fromIndexForMyListing,
                offset,
                itemType,
                activeType
              );
              setMyListingList(userRaffleInfo);
              setIsLoading(false);
            } catch (error) {
              setMyListingList([]);
              setIsLoading(false);
            }
          } else {
            try {
              /// Initialize 0
              fromIndexForMyListing.current = 0;
              const userRaffleInfo = await fetchOldestMyListing(
                address,
                fromIndexForMyListing,
                offset,
                itemType,
                activeType
              );
              setMyListingList(userRaffleInfo);
              setIsLoading(false);
            } catch (error) {
              setMyListingList([]);
              setIsLoading(false);
            }
          }
        })();
      } catch (error) {
        console.log(error);
        return;
      }
    }
  }, [address, isConnected, sortType, itemType, activeType]);
  if (isLoading || myListingList == null) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-[50vh]">
        <Loading loaderType="hugeLoader" />
      </div>
    );
  }
  if (myListingList.length === 0) {
    return <Empty />;
  } else {
    return (
      <div className="w-full  grid grid-cols-2  md:grid-cols-4 xl:grid-cols-6 justify-start gap-5">
        {myListingList.map((v, i) => {
          return <ItemCard key={i} info={v} />;
        })}
      </div>
    );
  }
}
