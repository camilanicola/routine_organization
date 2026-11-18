export function MonospacedTitle({ children, className = "" }) {
  return (
    <span className={className} aria-label={children}>
      {children.split(" ").map((word, wordIndex, words) => (
        <span
          className={`mono-word${wordIndex < words.length - 1 ? " word-gap" : ""}`}
          aria-hidden="true"
          key={`${word}-${wordIndex}`}
        >
          {[...word].map((letter, letterIndex) => (
            <span className="mono-letter" key={`${letter}-${letterIndex}`}>{letter}</span>
          ))}
        </span>
      ))}
    </span>
  );
}
