"use client";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import Link from "next/link";
import { TiArrowBack } from "react-icons/ti";
import { useContext } from "react";
import { usePathname } from "next/navigation";
import SelectOptions from "./selectOptions";
export default function RootLayout({ children, params }) {
  const pathname = usePathname();

  const { user } = useContext(ContextAPI);

  if (!user) {
    if (pathname.includes("/raffleIndex")) {
      return (
        <main className="mx-auto flex flex-col w-screen  min-h-[90vh]">
          <div className="flex flex-col gap-10  mx-auto w-[90%]">
            <div className="flex justify-between border-b-2 w-full infoText !font-major_mono_display p-0">
              <p>RAFFLE</p>
            </div>
            <SelectOptions />
            {children}
          </div>
        </main>
      );
    } else if (pathname.includes("raffleDetail")) {
      return (
        <main className="mx-auto flex flex-col w-screen  min-h-[90vh]">
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
    } else return null;
  } else {
    if (pathname.includes("/raffleIndex")) {
      return (
        <main className="mx-auto flex flex-col w-screen min-h-[90vh]">
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
    } else if (pathname.includes("/myEntries")) {
      return (
        <main className="mx-auto flex flex-col w-screen min-h-[90vh] ">
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
    } else if (pathname.includes("/raffleCreate")) {
      return (
        <main className="mx-auto flex flex-col w-screen min-h-[90vh] ">
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
    } else if (pathname.includes("/myListing")) {
      return (
        <main className="mx-auto flex flex-col w-screen min-h-[90vh] ">
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
    } else if (pathname.includes("/raffleDetail")) {
      return (
        <main className="mx-auto flex flex-col w-screen  min-h-[90vh]">
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
