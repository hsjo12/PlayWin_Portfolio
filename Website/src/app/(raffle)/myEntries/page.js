"use client";
import { useRouter } from "next/navigation";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { useContext, useEffect, useState } from "react";
import { InfinityScroll } from "./infinityScroll";
import { toastMessage } from "@/components/utils/toastMessage";
import MyEntryList from "./myEntryList";
import { getUserAddress } from "@/components/utils/storage";

export default function Myentries() {
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
      <MyEntryList />
    </>
  );
}
