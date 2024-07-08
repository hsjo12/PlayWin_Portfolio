import { useContext } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { TypeAnimation } from "react-type-animation";

export default function About() {
  const { sectionRefs, animationOnBySection } = useContext(ContextAPI);
  return (
    <section
      ref={(el) => (sectionRefs.current.about = el)}
      className={`w-full flex flex-col md:flex-row md:justify-between justify-center items-center ${
        animationOnBySection.about ? "" : "invisible"
      }`}
    >
      {animationOnBySection.about ? (
        <>
          <div className="w-full flex flex-col justify-center items-center toLeft">
            <p className="playwin ">PLAYWIN</p>
          </div>
          <div className="w-full flex flex-col justify-center items-start gap-3 toRight">
            <p className="title w-full">About</p>
            <p>
              PLAYWIN is a web3 playground for users to participate in raffles
              and lottery games. It offers a secure and transparent gaming
              experience powered by blockchain technology.
            </p>
            <p>
              Users can stake FUSDT, pegged to USDT, to earn rewards from the
              total tickets sold. This unique feature combines fun and financial
              benefits, enhancing user engagement.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="w-full flex flex-col justify-center items-center ">
            <p className="playwin toLeft">PLAYWIN</p>
          </div>
          <div className="w-full flex flex-col justify-center items-start gap-3 ">
            <p className="title w-full">About</p>
            <p>
              PLAYWIN is a web3 playground for users to participate in raffles
              and lottery games. It offers a secure and transparent gaming
              experience powered by blockchain technology.
            </p>
            <p>
              Users can stake FUSDT, pegged to USDT, to earn rewards from the
              total tickets sold. This unique feature combines fun and financial
              benefits, enhancing user engagement.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
