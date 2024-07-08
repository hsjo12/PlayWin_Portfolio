import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";

export default function Menu({
  setMenuOpen,
  currentPosition,
  scrollToSection,
}) {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  return (
    <div className="fixed top-0 right-0 w-screen h-screen z-40 bg-[#0000008a] ">
      <div className="absolute top-0 right-0 w-[30vh] h-screen flex flex-col items-center justify-center bg-[#001247] toLeft">
        <button
          className="absolute top-3 right-6 w-full flex justify-end items-center logo"
          onClick={() => setMenuOpen(false)}
        >
          <IoMdClose />
        </button>
        <div className="flex flex-col justify-center items-center gap-3 font-bebas_neue">
          {["about", "instruction", "faucet", "stake"].map((section) => (
            <button
              key={section}
              className={`textBtn ${
                currentPosition === section ? "text-highlight-color" : ""
              }`}
              onClick={() => {
                scrollToSection(section);
                return setMenuOpen(false);
              }}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}

          <Link href="/raffleIndex">
            <button className="textBtn" onClick={() => setMenuOpen(false)}>
              Raffle
            </button>
          </Link>
          <Link href="/lottery">
            <button className="textBtn" onClick={() => setMenuOpen(false)}>
              Lottery
            </button>
          </Link>
          <div className="w-full flex flex-col justify-center items-center">
            {isConnected ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  return open();
                }}
                className="textBtn"
              >
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  return open();
                }}
                className="btn"
              >
                CONNECT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
