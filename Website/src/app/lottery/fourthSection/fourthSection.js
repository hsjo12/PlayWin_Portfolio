"use client";

import TicketList from "./ticketList";
import PrizeList from "./prizeList";

export default function FourthSection() {
  return (
    <section className="w-full flex flex-col justify-center items-center ">
      <div className=" w-[90%] grid-cols-1 xl:grid-cols-2 xl:w-full gap-10 xl:gap-5 grid ">
        <TicketList />
        <PrizeList />
      </div>
    </section>
  );
}
