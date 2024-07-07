export default function FeatureBox({
  title,
  content,
  className = "raffleFeatureBox",
}) {
  return (
    <div
      className={`font-bebas_neue flex flex-col justify-center items-center gap-3 ${className}`}
    >
      <p>{title}</p>
      <p>{content}</p>
    </div>
  );
}
