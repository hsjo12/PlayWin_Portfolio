"use client";
import { useContext, useState, useEffect, useCallback } from "react";
import { ContextAPI } from "../contextAPI/playWinContextAPI";
import { connectMetamask } from "../metamask/connector";
export default function Connect({ className, text }) {
  const { setUser } = useContext(ContextAPI);
  const connect = useCallback(async () => {
    const user = await connectMetamask();
    setUser(user);
  }, []);

  return (
    <button onClick={connect} className={className}>
      {text}
    </button>
  );
}
