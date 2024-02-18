"use client";
import Loading from "@/components/utils/loading";
import { useEffect, useState } from "react";

export default function ExpectedTime({ currentBlock, deadlineBlocks }) {
  const [expectedEndTime, setExpectedEndTime] = useState(null);

  useEffect(() => {
    let blockNumberToAnnounce;
    let timeStamp;
    (async () => {
      blockNumberToAnnounce = Number(deadlineBlocks);
      timeStamp = await deadline(currentBlock, blockNumberToAnnounce);
      setExpectedEndTime(timeStamp);
    })();
  }, [currentBlock, deadlineBlocks]);

  if (!currentBlock || !deadlineBlocks || !expectedEndTime) {
    return (
      <div className="flex flex-col w-full gap-3 ">
        <Loading loaderType="smallLoader" />
      </div>
    );
  } else if (expectedEndTime.passed) {
    return <div className=" w-full text-right">Time Ends</div>;
  } else {
    return (
      <p className="  w-full text-right">{`${expectedEndTime.hours}:${expectedEndTime.mins} ${expectedEndTime.amOrPm}`}</p>
    );
  }
}

const deadline = async (currentBlock, blockNumberToAnnounce) => {
  const leftOver = Number(blockNumberToAnnounce) - Number(currentBlock);
  const expectedAddedTime = Math.floor(leftOver * 2.2); /// around 2.2~2.5 per block

  const timeStamp = Date.now();
  const expectedEndTimeStamp = new Date(
    timeStamp + Number(expectedAddedTime * 1000)
  );
  let amOrPm = "am";

  if (expectedEndTimeStamp.getHours() >= 12) amOrPm = "pm";

  return {
    hours: expectedEndTimeStamp.getHours(),
    mins:
      String(expectedEndTimeStamp.getMinutes()).length === 1
        ? `0${expectedEndTimeStamp.getMinutes()}`
        : expectedEndTimeStamp.getMinutes(),
    amOrPm,
    passed: expectedEndTimeStamp < timeStamp,
  };
};
