"use client";

import Link from "next/link";
import SelectOptions from "../selectOptions";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function MyEntriesLayout({ children, params }) {
  const router = useRouter();
  const { isConnected } = useWeb3ModalAccount();
  useEffect(() => {
    if (!isConnected) return router.push("./raffleIndex");
  }, []);

  return (
    <main className="mx-auto flex flex-col w-full">
      <div className="flex flex-col gap-5  mx-auto w-full ">
        <div className="flex justify-between border-b-2 w-full font-acme">
          <p className="smallTitle">My Entries</p>
          {isConnected && (
            <div className="flex items-center justify-between btnText gap-3">
              <button className="textBtn">
                <Link href={"./raffleIndex"}>Raffle</Link>
              </button>
              <button className="textBtn">
                <Link href={"./myListing"}>My Listing</Link>
              </button>
              <button className="textBtn">
                <Link href={"./raffleCreate"}>Create</Link>
              </button>
            </div>
          )}
        </div>
        <SelectOptions />
        {children}
      </div>
    </main>
  );
}
