"use client";

import RaffleInfoBox from "./raffleInfoBox";

export default function RaffleDetail({ params }) {
  const { raffleId } = params;

  return (
    <>
      <RaffleInfoBox raffleId={raffleId} />
    </>
  );
}
