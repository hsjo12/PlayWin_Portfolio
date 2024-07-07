export default function Loading({ loaderType = "loader" }) {
  return (
    <div className="flex flex-col items-center  justify-center h-full w-full">
      <span className={loaderType}></span>
    </div>
  );
}
