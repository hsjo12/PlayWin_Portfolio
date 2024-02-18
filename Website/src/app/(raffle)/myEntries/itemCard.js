import {
  converter,
  getContract,
  getContractForReadOnly,
  ipfsToHttpConverter,
} from "@/components/utils/utils";
import Image from "next/image";
import { useCallback, useContext, useEffect, useState } from "react";
import Loading from "@/components/utils/loading";
import DateTimeCounter from "../../../components/utils/dateTimeCounter";
import Link from "next/link";
import { ContextAPI } from "@/components/contextAPI/playWinContextAPI";
import { fetchTokenInfo } from "@/components/utils/fetchRaffle";
import { toastMessage, txMessage } from "@/components/utils/toastMessage";
import raffleVaultJson from "../../../abis/raffleVault.json";
import raffleJson from "../../../abis/raffle.json";
export default function ItemCard({ info }) {
  const { user, setUpdate } = useContext(ContextAPI);
  const [metadata, setMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const {
    status,
    raffleId,
    prize,
    prizeAmount,
    prizeType,
    prizeId,
    entryPrice,
    deadline,
  } = info;

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const raffleVault = await getContractForReadOnly(
        raffleVaultJson.address,
        raffleVaultJson.abi
      );
      const refundTakenByUser = await raffleVault.getRefundTakenByUser(
        raffleId,
        user
      );
      const fetchedData = await fetchTokenInfo(prizeType, prize, prizeId);
      fetchedData.refundTakenByUser = refundTakenByUser;
      setMetadata(fetchedData);
      setIsLoading(false);
    })();
  }, [info]);

  const refund = useCallback(async () => {
    if (!user) {
      const user = await connectMetamask();
      setUser(user);
      return toastMessage("Please Connect Wallet", "warn");
    }

    const raffleInstance = await getContract(
      raffleJson.address,
      raffleJson.abi
    );
    const raffleVaultInstance = await getContract(
      raffleVaultJson.address,
      raffleVaultJson.abi
    );
    const refundTakenByUser = await raffleVaultInstance.getRefundTakenByUser(
      raffleId,
      user
    );

    if (refundTakenByUser)
      return toastMessage("Refund has already been claimed", "warn");

    const tx = await raffleInstance.refundEntryFee(raffleId);
    await txMessage(tx);
    setUpdate(Date.now());
  }, [user]);

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center w-full h-full border-2">
        <Loading />
      </div>
    );
  return (
    <div className="card xSmallText  flex flex-col justify-center w-full h-full gap-2 ">
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
      <p>{`${converter(entryPrice)} FUSDT`}</p>
      <DateTimeCounter
        className="border-2 text-center w-full"
        startDate={Number(deadline * 1000n)}
      />
      <Link href={`/raffleDetail/${raffleId}`}>
        <button className="w-full cardBtn">Enter</button>
      </Link>

      {status === 2n ? (
        metadata.refundTakenByUser === true ? (
          <div className="border-2 text-center w-full">Claimed</div>
        ) : (
          <button onClick={refund} className="refundBtn w-full">
            Refund
          </button>
        )
      ) : null}
    </div>
  );
}
