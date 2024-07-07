import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formattedBalance } from "@/utils/utils";
import Loading from "@/utils/loading";
import DateTimeCounter from "@/utils/dateTimeCounter";
import { fetchTokenInfo } from "@/utils/fetch/fetchUtils";

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
      <div className="flex flex-col justify-center items-center w-full border-2">
        <Loading />
      </div>
    );
  return (
    <div className="raffleCard flex flex-col justify-center w-full gap-2 ">
      {metadata.image == null ? (
        <div className="min-h-[125px] md:min-h-[250px] xl:min-h-[300px] flex flex-col justify-center items-center">
          <Loading />
        </div>
      ) : (
        <div className="w-full flex flex-col justify-center items-center relative imageContainer">
          <Image
            src={metadata.image}
            alt="Raffle Image"
            sizes="(min-width:640px) 200px, (min-width:475px) 250px, 160px"
            fill
          />
        </div>
      )}
      <p>{metadata.name}</p>
      {prizeId === 0n ? (
        <p>{`${formattedBalance(prizeAmount, metadata.decimals)} ${
          metadata.symbol
        }`}</p>
      ) : (
        <p>{`#${prizeId}`}</p>
      )}
      <p>{`${formattedBalance(entryPrice, 6)} FUSDT`}</p>
      <DateTimeCounter
        className="border-2 text-center w-full"
        startDate={Number(deadline * 1000n)}
      />
      <Link href={`/raffleDetail/${raffleId}`}>
        <button className="btn w-full">Enter</button>
      </Link>
    </div>
  );
}
