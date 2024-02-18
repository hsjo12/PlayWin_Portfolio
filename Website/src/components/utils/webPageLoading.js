import Loading from "./loading";

export default function WebPageLoading() {
  return (
    <div className="w-screen h-screen flex flex-col bg-[#030303] justify-center items-center">
      <Loading loaderType="hugeLoader" />
    </div>
  );
}
