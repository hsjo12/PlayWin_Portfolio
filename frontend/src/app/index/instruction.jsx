import { useCallback, useContext } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { TypeAnimation } from "react-type-animation";
import Link from "next/link";

export default function Instruction() {
  const {
    sectionRefs,
    animationOnBySection,
    setCurrentPosition,
    currentPosition,
  } = useContext(ContextAPI);
  const scrollToSection = useCallback((section) => {
    if (sectionRefs.current[section]) {
      sectionRefs.current[section].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);
  return (
    <section
      ref={(el) => (sectionRefs.current.instruction = el)}
      className={`w-full flex justify-between items-center ${
        animationOnBySection.instruction ? "" : "invisible"
      }`}
    >
      <div className="w-full flex flex-col justify-center items-start gap-6">
        <p className="title w-full">Instruction</p>
        {animationOnBySection.instruction && (
          <p>
            <TypeAnimation
              sequence={[
                `PLAYWIN offers a straightforward process to participate in its games,
          consisting of four simple steps:`,
                0,
              ]}
              wrapper="span"
              speed={120}
              style={{ display: "inline-block" }}
              repeat={0}
              cursor={false}
              preRenderFirstString={false}
            />
          </p>
        )}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-start items-start gap-3">
          <div className="w-full flex flex-col justify-center items-start gap-3 flex-grow">
            <h1 className="title">Step 1. Faucet</h1>

            {animationOnBySection.instruction && (
              <TypeAnimation
                sequence={[
                  `PLAYWIN is deployed on the Sepolia network, so users must have
              SepoliaETH to send transactions. Additionally, USDT is required
              for FUSDT to be used as a game token. To obtain SepoliaETH and
              USDT on the network for free, go to the faucet!`,
                  0,
                ]}
                wrapper="span"
                speed={120}
                style={{ display: "inline-block" }}
                repeat={0}
                cursor={false}
                preRenderFirstString={false}
              />
            )}
            <button
              className="btn w-[85%] md:hidden mx-auto"
              onClick={() => scrollToSection("faucet")}
            >
              Faucet
            </button>
          </div>

          <div className="w-full flex flex-col justify-center items-start gap-3 flex-grow">
            <h1 className="title">Step 2. Stake</h1>
            {animationOnBySection.instruction && (
              <TypeAnimation
                sequence={[
                  `To play raffle or lottery games, users must stake USDT for FUSDT.
              FUSDT is a stable token used within the PLAYWIN platform as a
              currency for games. Additionally, 1 FUSDT equals 1 USDT. By
              staking USDT, users can earn rewards from 5% of the total raffle
              sale fees and 20% of the total lottery sale fees.`,
                  0,
                ]}
                wrapper="span"
                speed={110}
                style={{ display: "inline-block" }}
                repeat={0}
                cursor={false}
                preRenderFirstString={false}
              />
            )}

            <button
              className={`btn w-[85%] md:hidden mx-auto`}
              onClick={() => scrollToSection("stake")}
            >
              Stake
            </button>
          </div>
        </div>

        <div className="w-full hidden md:grid grid-cols-2 justify-center items-start gap-3 flex-grow">
          <button
            className={`btn w-[40%] mx-auto `}
            onClick={() => scrollToSection("faucet")}
          >
            Faucet
          </button>
          <button
            className={`btn w-[40%] mx-auto `}
            onClick={() => scrollToSection("stake")}
          >
            Stake
          </button>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 justify-start items-start gap-3">
          <div className="w-full flex flex-col justify-center items-start gap-3 flex-grow">
            <h1 className="title">Step 3. Raffle</h1>
            {animationOnBySection.instruction && (
              <TypeAnimation
                sequence={[
                  `Users can be either raffle creators or participants, spending with
              FUSDT. For raffle creators, any assets such as ERC20, ERC721, and
              ERC1155 can be used for a raffle with a 10 FUSDT game deposit fee.
              However, a raffle can be canceled if it does not reach the minimum
              number of participant entries set by the creator. In this case,
              only 95% of the deposit fee will be returned, with 2.5% each going
              to the team and staking rewards. For raffle participants, FUSDT
              can be used as an entry fee for any raffles.`,
                  0,
                ]}
                wrapper="span"
                speed={100}
                style={{ display: "inline-block" }}
                repeat={0}
                cursor={false}
                preRenderFirstString={false}
              />
            )}
            <Link href="/raffleIndex" className="w-full text-center ">
              <button
                onClick={() => setCurrentPosition("raffle")}
                className={`btn w-[85%] md:hidden mx-auto`}
              >
                Raffle
              </button>
            </Link>
          </div>

          <div className="w-full flex flex-col justify-center items-start gap-3 flex-grow">
            <h1 className="title">Step 4. Lottery</h1>
            {animationOnBySection.instruction && (
              <TypeAnimation
                sequence={[
                  `Users can enter the lottery with 1 FUSDT. The lottery involves
              matching 5 numbers for the first-place prize, 4 for second, and 3
              for third. Prizes are funded by the sales fees: 70% for winners,
              20% for staking rewards, and 10% for the team. First-place winners
              receive a predetermined FUSDT amount plus 10% of total sales.
              Second and third-place winners get 60% and 40% of total sales,
              respectively. Unclaimed prizes carry over to the next round.`,
                  0,
                ]}
                wrapper="span"
                speed={90}
                style={{ display: "inline-block" }}
                repeat={0}
                cursor={false}
                preRenderFirstString={false}
              />
            )}

            <Link href="/lottery" className="w-full text-center toTop">
              <button
                onClick={() => setCurrentPosition("lottery")}
                className={`btn w-[85%] md:hidden mx-auto`}
              >
                Lottery
              </button>
            </Link>
          </div>
        </div>
        <div className="w-full hidden md:grid grid-cols-2 justify-center items-start gap-3 flex-grow toTop">
          <Link href="/raffleIndex" className="w-full text-center ">
            <button
              onClick={() => setCurrentPosition("raffle")}
              className={`btn w-[40%] mx-auto`}
            >
              Raffle
            </button>
          </Link>

          <Link href="/lottery" className="w-full text-center ">
            <button
              onClick={() => setCurrentPosition("lottery")}
              className={`btn w-[40%] mx-auto`}
            >
              Lottery
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
