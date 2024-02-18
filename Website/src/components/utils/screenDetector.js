"use client";
import { useContext, useEffect } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
export default function ScreenDetector() {
  const { setScreenWidth } = useContext(ContextAPI);

  useEffect(() => {
    setScreenWidth(window.innerWidth);
    const handleResizeWindow = () => setScreenWidth(window.innerWidth);
    // subscribe to window resize event "onComponentDidMount"
    window.addEventListener("resize", handleResizeWindow);
    return () => {
      // unsubscribe "onComponentDestroy"
      window.removeEventListener("resize", handleResizeWindow);
    };
  }, []);
}
