export default function Loading({ loaderType = "loader" }) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] w-full">
      <span className={loaderType}></span>
    </div>
  );
}
