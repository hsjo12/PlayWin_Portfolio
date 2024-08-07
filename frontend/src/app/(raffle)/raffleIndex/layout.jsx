"use client";

import Link from "next/link";
import SelectOptions from "../selectOptions";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
export default function RaffleIndexLayout({ children, params }) {
  const { isConnected } = useWeb3ModalAccount();

  return (
    <main className="mx-auto flex flex-col w-full">
      <div className="flex flex-col gap-5  mx-auto w-full ">
        <div className="flex justify-between border-b-2 w-full font-acme">
          <p className="smallTitle">RAFFLE</p>
          {isConnected && (
            <div className="flex items-center justify-between btnText gap-3">
              <button className="textBtn">
                <Link href={"./myEntries"}>My entries</Link>
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
