export default function FeatureBox({
  title,
  content,
  className = "featureCard biggerInfoText flex flex-col justify-center items-center",
}) {
  return (
    <div className={className}>
      <p className=" w-full text-center biggerInfoText">{title}</p>
      <p className="biggerInfoText">{content}</p>
    </div>
  );
}
