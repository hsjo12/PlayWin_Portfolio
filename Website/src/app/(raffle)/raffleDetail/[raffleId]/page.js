"use client";

import RaffleInfoBox from "./raffleInfoBox";

export default function Raffle({ params }) {
  const { raffleId } = params;

  return (
    <>
      <RaffleInfoBox raffleId={raffleId} />
    </>
  );
}
