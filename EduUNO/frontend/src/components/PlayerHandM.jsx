import PropTypes from "prop-types";
import CardM from "./CardM";

export default function PlayerHandM({
  hand = [],
  topCard = null,
  onPlay = () => {},
  canPlay = null,
  currentPlayer = "player",
  isProcessing = false,
}) {
  if (!hand || hand.length === 0) {
    return (
      <section className="player-hand">
        <small>🎉 ¡Ganaste!</small>
      </section>
    );
  }

  const isTurn = currentPlayer === "player" && !isProcessing;

  return (
    <section className="player-hand">
      {hand.map((card, index) => {
        const playable =
          isTurn && (canPlay ? canPlay(card, topCard) : true);

        return (
          <CardM
            key={card.id || index}
            card={card}
            onClick={playable ? () => onPlay(card) : undefined}
            disabled={!isTurn || !playable}
            isPlayable={playable}
          />
        );
      })}
    </section>
  );
}

PlayerHandM.propTypes = {
  hand: PropTypes.array,
  topCard: PropTypes.object,
  onPlay: PropTypes.func,
  canPlay: PropTypes.func,
  currentPlayer: PropTypes.string,
  isProcessing: PropTypes.bool,
};