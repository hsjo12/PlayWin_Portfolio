"use client";
import Loading from "@/components/utils/loading";
import { getContractForReadOnly, getProvider } from "@/components/utils/utils";
import { useEffect, useState } from "react";
import lotteryJson from "../../../abis/lottery.json";
export default function ExpectedTime() {
  const [expectedEndTime, setExpectedEndTime] = useState(null);

  useEffect(() => {
    let timeStamp;
    (async () => {
      const lotteryInstance = await getContractForReadOnly(
        lotteryJson.address,
        lotteryJson.abi
      );

      let deadline = Number(await lotteryInstance.getDeadline());
      timeStamp = await timerConverter(deadline);
      setExpectedEndTime(timeStamp);
    })();
  }, []);

  if (!expectedEndTime) {
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

const timerConverter = async (deadline) => {
  const timeStamp = Date.now();
  const expectedEndTimeStamp = new Date(Number(deadline * 1000));
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
