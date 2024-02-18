import Link from "next/link";
import Hero from "./index/hero";

export default function Home() {
  return (
    <main className="mx-auto flex flex-col justify-center items-center xl:container w-screen min-h-[90vh] ">
      <div className="flex flex-col justify-center items-center h-full w-[80%] mx-auto gap-10 ">
        <p className="mainTitle text-center">PLAYWIN Protocol</p>
        <Hero />
        <div className=" mx-auto flex flex-col justify-center items-center gap-5 md:grid md:grid-cols-4  smallText w-full ">
          <button className="btn p-2 ">
            <Link href="/faucet" className="btnText">
              Faucet
            </Link>
          </button>
          <button className="btn p-2">
            <Link href="/staking" className="btnText">
              Staking
            </Link>
          </button>
          <button className="btn p-2">
            <Link href="/raffleIndex" className="btnText">
              raffle
            </Link>
          </button>
          <button className="btn p-2 ">
            <Link href="/lottery" className="btnText">
              lottery
            </Link>
          </button>
        </div>
      </div>
    </main>
  );
}
