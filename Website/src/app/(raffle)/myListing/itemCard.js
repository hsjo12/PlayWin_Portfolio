import axios from "axios";

import { converter } from "@/components/utils/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

import Loading from "@/components/utils/loading";

import DateTimeCounter from "../../../components/utils/dateTimeCounter";
import Link from "next/link";
import { fetchTokenInfo } from "@/components/utils/fetchRaffle";
export default function ItemCard({ info }) {
  const [metadata, setMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const {
    raffleId,
    prize,
    prizeAmount,
    prizeType,
    prizeId,
    entryPrice,
    deadline,
  } = info;

  useEffect(() => {
    if (prizeType == null || prize == null || prizeId == null) {
      return setIsLoading(false);
    } else {
      (async () => {
        const fetchedData = await fetchTokenInfo(prizeType, prize, prizeId);
        setMetadata(fetchedData);
      })();
      setIsLoading(false);
    }
  }, [prizeType, prize, prizeId]);

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center w-full  border-2">
        <Loading />
      </div>
    );
  return (
    <div className="card xSmallText  flex flex-col justify-center w-full  gap-2 ">
      {metadata.image == null ? (
        <div className="min-h-[150px] xs:min-h-[200px] flex flex-col justify-center items-center">
          <Loading />
        </div>
      ) : (
        <Image
          src={metadata.image}
          width={300}
          height={300}
          alt="img"
          className="text-center w-full"
          priority
        />
      )}
      <p>{metadata.name}</p>
      {prizeId === 0n ? (
        <p>{`${converter(prizeAmount, metadata.decimals)} ${
          metadata.symbol
        }`}</p>
      ) : (
        <p>{`#${prizeId}`}</p>
      )}
      <p>{`${converter(entryPrice, 6)} FUSDT`}</p>
      <DateTimeCounter
        className="border-2 text-center w-full"
        startDate={Number(deadline * 1000n)}
      />
      <Link href={`/raffleDetail/${raffleId}`}>
        <button className="w-full cardBtn">Enter</button>
      </Link>
    </div>
  );
}
