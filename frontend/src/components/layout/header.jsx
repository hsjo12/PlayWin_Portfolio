"use client";
import { useContext, useState, useCallback, useEffect } from "react";
import { FiAlignJustify } from "react-icons/fi";

import Link from "next/link";
import { useMediaQuery } from "react-responsive";
import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";

export default function Header() {
  const { open } = useWeb3Modal();
  const {
    sectionRefs,
    animationOnBySection,
    setAnimationOnBySection,
    currentPosition,
    setCurrentPosition,
  } = useContext(ContextAPI);
  const { address, isConnected } = useWeb3ModalAccount();
  const [navBg, setNavBg] = useState(false);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });

  const scrollToSection = useCallback((section) => {
    if (sectionRefs.current[section]) {
      sectionRefs.current[section].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const sectionPositions = Object.keys(sectionRefs.current).map((section) => {
      return {
        section,
        offsetTop: sectionRefs.current[section].offsetTop,
        offsetBottom:
          sectionRefs.current[section].offsetTop +
          sectionRefs.current[section].offsetHeight,
      };
    });

    // const middleOfViewport = window.scrollY + window.innerHeight / 2;
    const viewPort = window.scrollY + window.innerHeight / 2 + 100;

    for (let i = sectionPositions.length - 1; i >= 0; i--) {
      if (
        viewPort >= sectionPositions[i].offsetTop &&
        viewPort < sectionPositions[i].offsetBottom
      ) {
        setCurrentPosition(sectionPositions[i].section);

        if (!animationOnBySection[sectionPositions[i].section]) {
          setAnimationOnBySection({
            ...animationOnBySection,
            [sectionPositions[i].section]: true,
          });
        }

        break;
      }
    }

    setNavBg(window.scrollY > 100);
  }, [
    animationOnBySection,
    setCurrentPosition,
    setAnimationOnBySection,
    setNavBg,
  ]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);
  return (
    <div
      className={`w-full fixed top-0 left-0 z-10 ${
        navBg ? "bg-[#424242]" : ""
      }`}
    >
      <nav className="w-[95%] mx-auto flex justify-between items-center gap-3 font-bebas_neue">
        <Link href="./">
          <p className="logo textBtn">PLAYWIN</p>
        </Link>
        {["about", "instruction", "faucet", "stake"].map((section, i) => {
          return (
            <button
              key={i}
              className={`textBtn  ${
                currentPosition === section ? "text-highlight-color" : ""
              }`}
              onClick={() => scrollToSection(section)}
            >
              <p className="textBtn">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </p>
            </button>
          );
        })}

        <Link href="/raffleIndex">
          <p className="textBtn">Raffle</p>
        </Link>
        <Link href="./">
          <p className="textBtn">Lottery</p>
        </Link>

        <div className="w-[20%] flex flex-col justify-center items-end">
          {isConnected ? (
            <button onClick={() => open()} className="textBtn">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </button>
          ) : (
            <button onClick={() => open()} className="btn">
              CONNECT
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
