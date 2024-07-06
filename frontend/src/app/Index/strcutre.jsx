"use client";
import About from "./about";
import Faucet from "./faucet";
import Hero from "./hero";
import Instruction from "./instruction";
import Stake from "./stake";

export default function Structure() {
  return (
    <main className="w-full flex flex-col justify-center items-center gap-10 ">
      <Hero />
      <About />
      <Instruction />
      <Faucet />
      <Stake />
    </main>
  );
}
