"use client";

import { createContext, useState, useRef } from "react";

export const ContextAPI = createContext();

export const PlayWInContextAPI = ({ children }) => {
  const offset = 20;
  const xl = 1280;
  const md = 768;
  const maxTicket = 200;
  const [screenWidth, setScreenWidth] = useState(1920);
  const [user, setUser] = useState(null);
  const [update, setUpdate] = useState(0);
  const [myEntryList, setMyEntryList] = useState(null);
  const [myListingList, setMyListingList] = useState(null);
  const [raffleList, setRaffleList] = useState(null);
  const [sortType, setSortType] = useState("End time");
  const [itemType, setItemType] = useState("All Types");
  const [activeType, setActiveType] = useState("Active");

  const [tempLotteryNumList, setTempLotteryNumList] = useState([]);
  const [lotteryNumList, setLotteryNumList] = useState([]);

  const fromIndexForMain = useRef(0);
  const fromIndexForMyEntries = useRef(0);
  const fromIndexForMyListing = useRef(0);

  return (
    <ContextAPI.Provider
      value={{
        update,
        setUpdate,
        user,
        setUser,
        offset,
        sortType,
        setSortType,
        itemType,
        setItemType,
        activeType,
        setActiveType,
        raffleList,
        setRaffleList,
        myEntryList,
        setMyEntryList,
        myListingList,
        setMyListingList,
        fromIndexForMain,
        fromIndexForMyEntries,
        fromIndexForMyListing,
        screenWidth,
        setScreenWidth,
        xl,
        md,
        tempLotteryNumList,
        setTempLotteryNumList,
        lotteryNumList,
        setLotteryNumList,
        maxTicket,
      }}
    >
      {children}
    </ContextAPI.Provider>
  );
};

export default PlayWInContextAPI;
