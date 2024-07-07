"use client";

import Link from "next/link";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { TiArrowBack } from "react-icons/ti";
import { usePathname } from "next/navigation";
export default function RaffleDetailLayout({ children, params }) {
  const { isConnected } = useWeb3ModalAccount();
  const pathname = usePathname();

  return (
    <main className="mx-auto flex flex-col w-full">
      <div className="flex flex-col gap-5  mx-auto w-full ">
        <div className="flex justify-between border-b-2 w-full font-acme">
          <p className="smallTitle">{`Raffle #${pathname.split("/")[2]}`}</p>
          {isConnected && (
            <div className="flex items-center justify-between btnText gap-3">
              <button className="textBtn">
                <Link href={"/raffleIndex"} className="flex">
                  <TiArrowBack /> Back
                </Link>
              </button>
            </div>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}
