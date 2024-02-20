import FirstSection from "./firstSection/firstSection.js";
import lotteryJson from "../../abis/lottery.json";
import { getContractForReadOnly, getProvider } from "@/components/utils/utils";
import SecondSection from "./secondSection.js";
import ThirdSection from "./thirdSection/thirdSection.js";
import FourthSection from "./fourthSection/fourthSection.js";
import FifthSection from "./FifthSection.js";
export default async function Lottery() {
  return (
    <main className="flex flex-col justify-start items-center mx-auto xl:container w-screen min-h-[80vh] gap-y-10 xl:gap-y-20">
      <div className="w-full flex flex-col justify-center items-center title mt-10">
        <p className="mx-auto w-full text-center mainTitle">PLAYWIN Lottery</p>
      </div>
      <FirstSection />
      <SecondSection />
      <ThirdSection />
      <FourthSection />
      <FifthSection />
    </main>
  );
}
