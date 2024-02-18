export default function FifthSection() {
  return (
    <section className="w-full flex flex-col justify-center items-center">
      <div className="flex flex-col w-[90%] xl:w-[100%] ">
        <div className=" mx-auto gap-5 justify-start lotterySmallInformationCard">
          <p className="lotterySmallInformationCardHead">Info</p>
          <div className="flex flex-col items-start justify-start h-full min-h-[211px] p-4 gap-5 ">
            <div className="flex flex-col gap-3">
              <p className="subTitle">Lottery Numbers</p>
              <p className="smallInfoText">
                Pick 5 numbers and wait for the results! We announce the winning
                number every 42,600 blocks, which is roughly every 23 hours and
                50 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="subTitle">Winning Process</p>
              <p className="smallInfoText">
                We use Chainlink's VRF to randomly generate the winning number.
                Then, in about 10 minutes, we determine the lucky winners! Match
                5, 4, or 3 numbers to the winning combination to win big!
              </p>
              <div className="smallInfoText flex flex-col gap-2">
                <p>For example, if the winning number is 12345:</p>
                <p>First place: 12345</p>
                <p>Second place: 12344, 12545, 22345, etc.</p>
                <p>Third place: 12300, 00345, 02340, etc.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="subTitle">Allocation of Funds</p>
              <p className="smallInfoText">
                70% of total sales contribute to the lottery pool. The remaining
                20% and 10% are set aside for rewarding stakers and supporting
                our platform's operations.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="subTitle">Prizes</p>
              <p className="smallInfoText">
                Get ready to win! The first-place prize is a whopping 10,000
                FUSDT, plus an extra 10% from the lottery pool. Second and third
                place prizes are 60% and 20% of the lottery pool, respectively.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
