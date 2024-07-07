"use client";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import Link from "next/link";
import { TiArrowBack } from "react-icons/ti";
import { usePathname } from "next/navigation";
import SelectOptions from "./selectOptions";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
export default function RootLayout({ children, params }) {
  const pathname = usePathname();
  const { address, isConnected } = useWeb3ModalAccount();

  if (!isConnected) {
    if (pathname.toLowerCase().includes("raffleindex")) {
      return (
        <main className="mx-auto flex flex-col w-full min-h-[90vh]">
          <div className="flex flex-col gap-10  mx-auto w-full ">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <p>RAFFLE</p>
            </div>
            <SelectOptions />
            {children}
          </div>
        </main>
      );
    } else if (pathname.toLowerCase().includes("raffledetail")) {
      return (
        <main className="mx-auto flex flex-col w-full  min-h-[90vh] border-2">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full  !font-major_mono_display">
              <p>{`Raffle #${pathname.split("/")[2]}`}</p>
              <button className="textBtn">
                <Link href={"/raffleIndex"} className="btnText flex">
                  <TiArrowBack /> Back
                </Link>
              </button>
            </div>
            {children}
          </div>
        </main>
      );
    } else return null;
  } else {
    if (pathname.toLowerCase().includes("raffleindex")) {
      return (
        <main className="mx-auto flex flex-col w-full min-h-[90vh]">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <p>RAFFLE</p>
              <div className="flex flex-nowrap justify-between btnText gap-5">
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
            </div>
            <SelectOptions />
            {children}
          </div>
        </main>
      );
    } else if (pathname.toLowerCase().includes("myentries")) {
      return (
        <main className="mx-auto flex flex-col w-full min-h-[90vh] ">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <div>My ENTRIES</div>
              <div className="flex flex-nowrap justify-between btnText gap-3 sm:gap-5">
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
            </div>
            <SelectOptions />
            {children}
          </div>
        </main>
      );
    } else if (pathname.toLowerCase().includes("rafflecreate")) {
      return (
        <main className="mx-auto flex flex-col w-full min-h-[90vh] ">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <div>Create</div>
              <div className="flex flex-nowrap justify-between btnText gap-3 sm:gap-5">
                <button className="textBtn">
                  <Link href={"./raffleIndex"}>Raffle</Link>
                </button>
                <button className="textBtn">
                  <Link href={"./myEntries"}>My Entries</Link>
                </button>
                <button className="textBtn">
                  <Link href={"./myListing"}>My Listing</Link>
                </button>
              </div>
            </div>
            {children}
          </div>
        </main>
      );
    } else if (pathname.toLowerCase().includes("mylisting")) {
      return (
        <main className="mx-auto flex flex-col w-full min-h-[90vh] ">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <div>My Listing</div>
              <div className="flex flex-nowrap justify-between btnText gap-3 sm:gap-5">
                <button className="textBtn">
                  <Link href={"./raffleIndex"}>Raffle</Link>
                </button>
                <button className="textBtn">
                  <Link href={"./myEntries"}>My Entries</Link>
                </button>
                <button className="textBtn">
                  <Link href={"./raffleCreate"}>Create</Link>
                </button>
              </div>
            </div>
            <SelectOptions />
            {children}
          </div>
        </main>
      );
    } else if (pathname.toLowerCase().toLowerCase().includes("raffledetail")) {
      return (
        <main className="mx-auto flex flex-col w-full  min-h-[90vh]">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <p>{`Raffle #${pathname.split("/")[2]}`}</p>
              <button className="textBtn">
                <Link href={"/raffleIndex"} className="btnText flex">
                  <TiArrowBack /> Back
                </Link>
              </button>
            </div>
            {children}
          </div>
        </main>
      );
    } else {
      return null;
    }
  }
}
