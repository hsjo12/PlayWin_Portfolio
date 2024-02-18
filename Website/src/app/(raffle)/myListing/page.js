"use client";

import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { InfinityScroll } from "./infinityScroll";
import { getUserAddress } from "@/components/utils/storage";
import { fetchMyListing } from "@/components/utils/fetchRaffle";
import MyListingList from "./myListingList";

export default function MyListing() {
  const router = useRouter();
  const { user } = useContext(ContextAPI);
  useEffect(() => {
    (async () => {
      if (!user && getUserAddress == null) {
        toastMessage("Please Connect Wallet", "warn");
        return router.push("./raffleIndex");
      }
    })();
  }, [user]);

  return (
    <>
      <InfinityScroll />
      <MyListingList />
    </>
  );
}
