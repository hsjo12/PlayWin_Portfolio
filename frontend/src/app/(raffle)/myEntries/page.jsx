"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InfinityScroll } from "./infinityScroll";
import { toastMessage } from "@/utils/toastMessage";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import MyEntryList from "./myEntryList";

export default function MyEntries() {
  const router = useRouter();
  const { isConnected } = useWeb3ModalAccount();

  useEffect(() => {
    (async () => {
      if (!isConnected) {
        toastMessage("Please Connect Wallet", "warn");
        return router.push("./raffleIndex");
      }
    })();
  }, [isConnected]);

  return (
    <>
      <InfinityScroll />
      <MyEntryList />
    </>
  );
}
