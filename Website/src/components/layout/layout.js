"use client";
import { useState } from "react";
import Footer from "./footer";
import Header from "./header";

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState();
  useState(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return null;
  } else {
    return (
      <div className="w-[95%] mx-auto flex flex-col justify-center items-center">
        <Header />
        <div className="mt-20">{children}</div>
        <Footer />
      </div>
    );
  }
}
