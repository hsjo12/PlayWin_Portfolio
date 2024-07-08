import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { useCallback, useContext } from "react";

export default function Hero() {
  const { sectionRefs } = useContext(ContextAPI);
  const scrollToSection = useCallback((section) => {
    if (sectionRefs.current[section]) {
      sectionRefs.current[section].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);
  return (
    <div className="w-full flex flex-col justify-center items-center gap-6 h-[90vh]">
      <div className="w-full h-screen absolute top-0 left-0 heroBackground" />
      <p className="hero toBottom z-10">Welcome To PlayWin</p>
      <p className="showingUp z-10">Dive into thrilling raffle and lottery</p>
      <button
        onClick={() => scrollToSection("about")}
        className="btn showingUp z-10"
      >
        Explore
      </button>
    </div>
  );
}
