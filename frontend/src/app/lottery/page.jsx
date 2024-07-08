import FirstSection from "./firstSection/firstSection";
import SecondSection from "./secondSection";
import ThirdSection from "./thirdSection/thirdSection";
import FourthSection from "./fourthSection/fourthSection";
import FifthSection from "./fifthSection";
export default async function Lottery() {
  return (
    <main className="largeText font-bebas_neue flex flex-col justify-start items-center mx-auto w-full min-h-[80vh] gap-y-10 xl:gap-y-20">
      <div className="w-full flex flex-col justify-center items-center title mt-10">
        <p className="mx-auto w-full text-center lottoMainTitle">LOTTERY</p>
      </div>
      <FirstSection />
      <SecondSection />
      <ThirdSection />
      <FourthSection />
      <FifthSection />
    </main>
  );
}
