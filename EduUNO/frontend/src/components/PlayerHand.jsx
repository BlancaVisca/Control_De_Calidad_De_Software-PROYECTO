/**
 * PlayerHand.jsx - Mano del jugador con interacción y Mando Arcade
 * Ubicación: EDUUNO/frontend/src/components/PlayerHand.jsx
 */

import PropTypes from 'prop-types';
import Card from './Card';

export default function PlayerHand({ 
  hand = [], 
  topCard = null, 
  onPlay = () => {}, 
  canPlay = null,
  currentPlayer = 'player',
  isProcessing = false,
  focusedIndex = -1 // 🕹️ Nueva propiedad para el mando
}) {
  
  if (!hand || hand.length === 0) {
    return (
      <section className="player-hand" aria-label="Tu mano" role="region">
        <small style={{ color: '#60a5fa', fontWeight: '600', padding: '10px', animation: 'pulse 1.5s infinite' }}>
          🎉 ¡Sin cartas! ¡Ganaste!
        </small>
      </section>
    );
  }

  const isTurn = currentPlayer === 'player' && !isProcessing;

  return (
    <section className="player-hand" aria-label={`Tu mano: ${hand.length} cartas`} role="region">
      {hand.map((card, index) => {
        const playable = isTurn && (
          canPlay 
            ? canPlay(card, topCard) 
            : true
        );
        
        const cardKey = card?.id || `player-card-${index}-${card?.name || 'unknown'}`;
        
        // 🕹️ Verificamos si esta es la carta que el joystick está señalando
        const isFocused = focusedIndex === index;
        
        return (
          // 🕹️ Envolvemos la carta en un div para aplicarle las animaciones del joystick
          <div
            key={cardKey}
            style={{
              outline: isFocused ? "4px solid #4ade80" : "none",
              transform: isFocused ? "translateY(-25px) scale(1.1)" : "none",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)", // Animación fluida
              zIndex: isFocused ? 100 : 1,
              borderRadius: "14px", // Ajusta según lo redondeadas que sean tus cartas
              cursor: playable ? "pointer" : "default"
            }}
          >
            <Card
              card={card}
              onClick={playable ? () => onPlay(card) : undefined}
              disabled={!isTurn || !playable || isProcessing}
              isPlayable={playable}
            />
          </div>
        );
      })}
    </section>
  );
}

PlayerHand.propTypes = {
  hand: PropTypes.arrayOf(PropTypes.object).isRequired,
  topCard: PropTypes.object,
  onPlay: PropTypes.func.isRequired,
  canPlay: PropTypes.func,
  currentPlayer: PropTypes.oneOf(['player', 'opponent']).isRequired,
  isProcessing: PropTypes.bool,
  focusedIndex: PropTypes.number // 🕹️ Agregado a las validaciones
};

PlayerHand.defaultProps = {
  topCard: null,
  canPlay: null,
  isProcessing: false,
  focusedIndex: -1
};