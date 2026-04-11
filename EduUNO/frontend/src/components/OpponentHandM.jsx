import PropTypes from "prop-types";
import CardM from "./CardM";

export default function OpponentHandM({
  hand = [],
  hidden = true,
}) {
  if (!hand || hand.length === 0) {
    return (
      <section className="opponent">
        <small>🎭 Cartas ocultas</small>
      </section>
    );
  }

  return (
    <section className="opponent">
      {hand.map((card, index) => (
        <CardM
          key={card.id || index}
          card={hidden ? {} : card}
          hidden={hidden}
        />
      ))}
    </section>
  );
}

OpponentHandM.propTypes = {
  hand: PropTypes.array,
  hidden: PropTypes.bool,
};