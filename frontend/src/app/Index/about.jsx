import { useContext } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";

export default function About() {
  const { sectionRefs, animationOnBySection } = useContext(ContextAPI);
  return (
    <section
      ref={(el) => (sectionRefs.current.about = el)}
      className={`w-full flex flex-col md:flex-row md:justify-between justify-center items-center ${
        animationOnBySection.about ? "" : "invisible"
      }`}
    >
      <div className="w-full flex flex-col justify-center items-center">
        <p className="logo">PLAYWIN</p>
      </div>
      <div className="w-full flex flex-col justify-center items-start gap-3">
        <p className="title w-full">About</p>
        <p>
          PLAYWIN is a web3 playground for users to participate in raffles and
          lottery games. It offers a secure and transparent gaming experience
          powered by blockchain technology.
        </p>
        <p>
          Users can stake FUSDT, pegged to USDT, to earn rewards from the total
          tickets sold. This unique feature combines fun and financial benefits,
          enhancing user engagement.
        </p>
        {/*  
        <TypeAnimation
          sequence={[
            "PLAYWIN is a web3 playground for users to participate in raffles and lottery games. It offers a secure and transparent gaming experience powered by blockchain technology.",
            0,
          ]}
          wrapper="span"
          omitDeletionAnimation={true}
          speed={100}
          style={{ display: "inline-block" }}
          repeat={0}
          cursor={false}
          preRenderFirstString={false}
        />
        <TypeAnimation
          sequence={[
            `Users can stake FUSDT, pegged to USDT, to earn rewards from the total
          tickets sold. This unique feature combines fun and financial benefits,
          enhancing user engagement.`,
            0,
          ]}
          wrapper="span"
          speed={50}
          style={{ display: "inline-block" }}
          repeat={0}
          cursor={false}
          preRenderFirstString={false}
        />
        */}
      </div>
    </section>
  );
}
