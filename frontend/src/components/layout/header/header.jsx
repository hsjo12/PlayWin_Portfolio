"use client";
import { useContext, useState, useCallback, useEffect } from "react";
import { IoMdMenu } from "react-icons/io";
import Link from "next/link";
import { useMediaQuery } from "react-responsive";
import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
import Menu from "./menu";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [isClient, setIsClient] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToSection = useCallback(
    (section) => {
      if (pathname !== "/") {
        router.push("/");
        setTimeout(() => {
          if (sectionRefs.current[section]) {
            sectionRefs.current[section].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 300);
      } else {
        if (sectionRefs.current[section]) {
          sectionRefs.current[section].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    [router, pathname, sectionRefs, isClient]
  );

  const handleScrollForAnimation = useCallback(() => {
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
  }, [animationOnBySection, setCurrentPosition, setAnimationOnBySection]);

  const handleScrollForNav = useCallback(() => {
    setNavBg(window.scrollY > 100);
  }, [setNavBg]);

  useEffect(() => {
    if (pathname === "/") {
      window.addEventListener("scroll", handleScrollForAnimation);
    }
    window.addEventListener("scroll", handleScrollForNav);
    return () => {
      window.removeEventListener("scroll", handleScrollForAnimation);
      window.removeEventListener("scroll", handleScrollForNav);
    };
  }, [handleScrollForAnimation, pathname]);
  if (!isClient) return null;
  return (
    <div
      className={`w-full fixed top-0 left-0 z-30 flex flex-col justify-center items-center pt-2 pb-2 ${
        navBg ? "bg-[#252525]" : ""
      }`}
    >
      {menuOpen && (
        <Menu
          setMenuOpen={setMenuOpen}
          currentPosition={currentPosition}
          scrollToSection={scrollToSection}
        />
      )}
      <nav className="w-[95%] mx-auto flex justify-between items-center gap-3 font-bebas_neue">
        <Link href="./">
          <p className="logo textBtn">PLAYWIN</p>
        </Link>

        {isMobile ? (
          <button
            className="w-full flex justify-end items-center logo"
            onClick={() => setMenuOpen(true)}
          >
            <IoMdMenu />
          </button>
        ) : (
          <>
            <div className="w-full flex justify-start items-center">
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
                <button
                  onClick={() => setCurrentPosition("raffle")}
                  className={`textBtn  ${
                    currentPosition === "raffle" ? "text-highlight-color" : ""
                  }`}
                >
                  Raffle
                </button>
              </Link>
              <Link href="/lottery">
                <button
                  onClick={() => setCurrentPosition("lottery")}
                  className={`textBtn  ${
                    currentPosition === "lottery" ? "text-highlight-color" : ""
                  }`}
                >
                  Lottery
                </button>
              </Link>
            </div>
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
          </>
        )}
      </nav>
    </div>
  );
}
