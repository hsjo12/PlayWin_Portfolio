"use client";
import { useState, useCallback, useContext } from "react";
import { ContextAPI } from "@/app/contextAPI/playWinContextAPI";
export default function SelectOptions() {
  const {
    setRaffleList,
    setMyEntryList,
    setMyListingList,
    setSortType,
    setItemType,
    setActiveType,
    fromIndexForMain,
    fromIndexForMyEntries,
    fromIndexForMyListing,
  } = useContext(ContextAPI);

  const option1 = [
    { value: "End time", name: "End time" },
    { value: "Newest", name: "Newest" },
    { value: "Oldest", name: "Oldest" },
  ];
  const option2 = [
    { value: "All Types", name: "All Types" },
    { value: "Token", name: "Token" },
    { value: "NFT", name: "NFT" },
  ];
  const option3 = [
    { value: "Active", name: "Active" },
    { value: "InActive", name: "InActive" },
  ];

  const [select1, setSelect1] = useState("End time");
  const [select2, setSelect2] = useState("All Types");
  const [select3, setSelect3] = useState("Active");

  const selectOption1 = useCallback(
    async (e) => {
      const value = e.target.value;
      setSelect1(value);
      setSortType(value);
      /// init infinity scroll variable
      fromIndexForMain.current = 0;
      fromIndexForMyEntries.current = 0;
      fromIndexForMyListing.current = 0;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      fromIndexForMain.noMoreLoadInTimeEndOrder = false;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      setRaffleList(null);
      setMyEntryList(null);
      setMyListingList(null);
    },
    [select1]
  );
  const selectOption2 = useCallback(
    (e) => {
      const value = e.target.value;
      setSelect2(value);
      setItemType(value);
      /// init infinity scroll variable
      fromIndexForMain.current = 0;
      fromIndexForMyEntries.current = 0;
      fromIndexForMyListing.current = 0;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      fromIndexForMain.noMoreLoadInTimeEndOrder = false;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      setRaffleList(null);
      setMyEntryList(null);
      setMyListingList(null);
    },
    [select2]
  );
  const selectOption3 = useCallback(
    (e) => {
      const value = e.target.value;
      setSelect3(value);
      setActiveType(value);
      /// init infinity scroll variable
      fromIndexForMain.current = 0;
      fromIndexForMyEntries.current = 0;
      fromIndexForMyListing.current = 0;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      fromIndexForMain.noMoreLoadInTimeEndOrder = false;
      fromIndexForMyListing.noMoreLoadInTimeEndOrder = false;
      setRaffleList(null);
      setMyEntryList(null);
      setMyListingList(null);
    },
    [select3]
  );
  return (
    <div className="w-full flex md:justify-start md:flex-row flex-col justify-center items-center selectStyle gap-3">
      <select value={select1} onChange={selectOption1}>
        {option1.map((option) => (
          <option key={option.name} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
      <select value={select2} onChange={selectOption2}>
        {option2.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
      <select value={select3} onChange={selectOption3}>
        {option3.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
      <div className="hidden sm:block sm:col-span-1 md:col-span-3 "></div>
    </div>
  );
}
