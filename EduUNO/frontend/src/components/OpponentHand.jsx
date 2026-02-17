export default function OpponentHand({ count }) {
  return (
    <div className="opponent">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card back" />
      ))}
    </div>
  );
}
