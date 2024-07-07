"use client";

import SelectOptions from "../selectOptions";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
export default function RootLayout({ children, params }) {
  const { address, isConnected } = useWeb3ModalAccount();

  if (!isConnected) {
    return (
      <main className="mx-auto flex flex-col w-full">
        <div className="flex flex-col gap-10  mx-auto w-full ">
          <div className="flex justify-start border-b-2 w-full font-acme">
            <p className="smallTitle">RAFFLE</p>
          </div>
          <SelectOptions />
          {children}
        </div>
      </main>
    );
  }
}
