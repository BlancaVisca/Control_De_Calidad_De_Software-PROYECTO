export default function Card({ color, value, onClick, playable }) {
  return (
    <div
      onClick={onClick}
      className={`card ${color} ${playable ? "playable" : ""}`}
      style={{
        border: playable ? "3px solid white" : "none",
        cursor: playable ? "pointer" : "default"
      }}
    >
      {value}
    </div>
  );
}
