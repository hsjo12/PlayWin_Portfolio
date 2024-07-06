"use client";
import { useState } from "react";
import Footer from "./footer";
import Header from "./header";

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState();
  useState(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  return (
    <div className="w-[95%] mx-auto flex flex-col justify-center items-center">
      <Header />
      <div className="min-h-[100vh] mt-20 w-full">{children}</div>
      <Footer />
    </div>
  );
}
