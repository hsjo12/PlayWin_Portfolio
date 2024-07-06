export const AnimatedText = ({ text }) => {
  return (
    <div className="animated-text-wrapper">
      {text.split(" ").map((word, index) => (
        <span
          key={index}
          className="animated-text"
          style={{ animationDelay: `${index * 0.3}s` }}
        >
          {word}&nbsp;
        </span>
      ))}
    </div>
  );
};
