"use client";
import { useContext, useState } from "react";
import { FiAlignJustify } from "react-icons/fi";

import Link from "next/link";

import Wallet from "./wallet";
import { ContextAPI } from "../contextAPI/playWinContextAPI";

export default function Header() {
  const { xl, screenWidth } = useContext(ContextAPI);
  const [open, setOpen] = useState(false);
  if (screenWidth == null) {
    return <div className="w-full flex bg-black"></div>;
  } else if (screenWidth > xl) {
    return (
      <div className="flex flex-col infoText items-center justify-end  w-screen mx-auto left-0 top-0 fixed bg-[#00000096]">
        <div className="mx-auto w-[90%] grid grid-cols-11 border-main-color border-b-2  tracking-[0.15rem] gap-5 ">
          <button className="textBtn flex flex-col justify-center  items-start w-full h-full col-span-3 largeText tracking-[0.3rem]">
            <Link href="/">PLAYWIN</Link>
          </button>

          <div className="flex flex-col justify-end items-center w-full ">
            <button className="textBtn ">
              <Link href="/faucet">Faucet</Link>
            </button>
          </div>

          <div className="flex flex-col justify-end items-center w-full ">
            <button className="textBtn ">
              <Link href="/staking">Staking</Link>
            </button>
          </div>
          <div className="flex flex-col justify-end items-center w-full ">
            <button className="textBtn ">
              <Link href="/raffleIndex">Raffle</Link>
            </button>
          </div>
          <div className="flex flex-col justify-end items-center w-full ">
            <button className="textBtn ">
              <Link href="/lottery">Lottery</Link>
            </button>
          </div>

          <div className="flex flex-col col-span-4 justify-end items-end w-full">
            <Wallet
              className1="btnText connectButton mb-1 w-full xl:w-[50%] "
              className2="btnText grid grid-cols-2 w-full  justify-center items-center"
            />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className=" flex flex-col  infoText  mx-auto w-screen left-0 top-0 fixed items-center justify-end bg-[#00000096]">
        <div className=" mx-auto w-[90%] grid grid-cols-2 border-main-color border-b-2 pl-1 pr-1 tracking-[0.15rem]">
          <button className=" flex flex-col justify-center  items-start  tracking-[0.3rem]">
            <Link href="/">PLAYWIN</Link>
          </button>

          <button
            onClick={() => setOpen(true)}
            className="textBtn flex flex-col justify-center  items-end "
          >
            <FiAlignJustify size="2.5rem" className="zoomInAndOut" />
          </button>
          {open ? (
            <div className="menuBox w-full h-full fixed top-0 left-0 flex flex-col infoText items-center justify-center">
              <div className="p-5 ">
                <Wallet
                  className1="btnText connectButton flex flex-col justify-end items-center p-2"
                  className2="btnText flex flex-col justify-end items-center"
                />
              </div>

              <button className="textBtn flex flex-col justify-end items-center w-full">
                <Link href="/faucet">Faucet</Link>
              </button>
              <button className="textBtn flex flex-col justify-end items-center w-full ">
                <Link href="/staking">Staking</Link>
              </button>
              <button className="textBtn flex flex-col justify-end items-center w-full ">
                <Link href="/raffleIndex">Raffle</Link>
              </button>
              <button className="textBtn flex flex-col justify-end items-center w-full ">
                <Link href="/lottery">Lottery</Link>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="textBtn flex flex-col justify-end items-center w-full "
              >
                Back
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
