import Card from "./Card";

export default function PlayerHand({ cards }) {
  return (
    <div className="player-hand">
      {cards.map((card, i) => (
        <Card
          key={i}
          color={card.color}
          value={card.value}
          playable={true}
        />
      ))}
    </div>
  );
}
