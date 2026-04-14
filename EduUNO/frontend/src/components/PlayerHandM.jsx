import PropTypes from "prop-types";
import CardM from "./CardM";

export default function PlayerHandM({
  hand = [],
  topCard = null,
  onPlay = () => {},
  canPlay = null,
  currentPlayer = "player",
  isProcessing = false,
  focusedIndex = -1, // 🕹️ Nueva propiedad para el mando
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

        // 🕹️ Verificamos si esta es la carta que el joystick está señalando
        const isFocused = focusedIndex === index;

        return (
          // 🕹️ Envolvemos la carta en un div para aplicarle las animaciones del joystick
          <div
            key={card.id || index}
            style={{
              outline: isFocused ? "4px solid #4ade80" : "none",
              transform: isFocused ? "translateY(-25px) scale(1.1)" : "none",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              zIndex: isFocused ? 100 : 1,
              borderRadius: "14px",
              cursor: playable ? "pointer" : "not-allowed"
            }}
          >
            <CardM
              card={card}
              onClick={playable ? () => onPlay(card) : undefined}
              disabled={!isTurn || !playable}
              isPlayable={playable}
            />
          </div>
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
  focusedIndex: PropTypes.number, // 🕹️ Agregado a las validaciones
};