/**
 * Card.jsx - Componente de carta individual musicalizado
 */

import PropTypes from "prop-types";

// --- AUDIO (Ana) ---
const sfxFlash = new Audio('/sounds/flash.mp3');

export default function Card({
  card,
  hidden = false,
  onClick = null,
  disabled = false,
  isPlayable = false,
}) {
  const isClickable = onClick && !disabled;

  // Función para manejar el clic y el sonido (Ana)
  const handleCardClick = (e) => {
    if (isClickable) {
      sfxFlash.currentTime = 0; // Reinicia el sonido por si el usuario hace clics rápidos
      sfxFlash.play().catch(err => console.log("Audio esperando interacción"));
      onClick(e); // Ejecuta la función original del juego
    }
  };

  // 🔴 Carta volteada (Mazo o mano del oponente)
  if (hidden || card?.type === "hidden") {
    return (
      <img
        src="/img/atras.jpg"
        alt="Reverso de carta"
        className="card-img"
        onClick={handleCardClick}
        draggable={false}
        loading="lazy"
      />
    );
  }

  // ⭐ COMODINES (.png)
  if (card?.type === "wild" && card?.name) {
    return (
      <img
        src={`/img/comodines/${card.name}.png`}
        alt={card.description || card.name}
        title={card.description || card.name}
        className={`card-img ${isPlayable ? "playable" : ""}`}
        onClick={handleCardClick}
        draggable={false}
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.dataset.fallbackTried) {
            e.currentTarget.dataset.fallbackTried = "true";
            e.currentTarget.src = `/img/${card.name}.png`;
            return;
          }
          console.error(`❌ Error cargando comodín: ${card.name}.png`);
        }}
      />
    );
  }

  // 🃏 CARTAS NORMALES (.jpg)
  if (card?.number && card?.color && card?.recycle) {
    const cardName = `${card.number}-${card.color}-${card.recycle}`;

    return (
      <img
        src={`/img/cartas/${cardName}.jpg`}
        alt={cardName}
        title={cardName}
        className={`card-img ${isPlayable ? "playable" : ""}`}
        onClick={handleCardClick}
        draggable={false}
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.dataset.fallbackTried) {
            e.currentTarget.dataset.fallbackTried = "true";
            e.currentTarget.src = "/img/atras.jpg";
            return;
          }
          console.error(`❌ Error cargando carta: ${cardName}.jpg`);
        }}
      />
    );
  }

  // 🚫 Fallback
  return (
    <div className="card-img error-card">
      ⚠️ Carta inválida
    </div>
  );
}

Card.propTypes = {
  card: PropTypes.object,
  hidden: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  isPlayable: PropTypes.bool,
};