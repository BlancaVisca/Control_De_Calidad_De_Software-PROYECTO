import PropTypes from "prop-types";

export default function CardM({
  card,
  hidden = false,
  onClick = null,
  disabled = false,
  isPlayable = false,
}) {
  const isClickable = onClick && !disabled;

  if (hidden) {
    return (
      <img
        src="/img/atras.jpg"
        alt="Reverso"
        className="card-img"
      />
    );
  }

  const name = card?.value;

  return (
    <img
      src={`/img/cartas_M/${name}.png`}
      alt={name}
      title={name}
      className={`card-img ${isPlayable ? "playable" : ""}`}
      onClick={isClickable ? onClick : undefined}
      draggable={false}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = "/img/atras.jpg";
      }}
    />
  );
}

CardM.propTypes = {
  card: PropTypes.object,
  hidden: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  isPlayable: PropTypes.bool,
};