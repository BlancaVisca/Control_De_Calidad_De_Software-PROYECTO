/**
 * PlayerHand.jsx - Mano del jugador con interacción
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
  isProcessing = false 
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
        
       return (
      <Card
        key={cardKey}
        card={card}
        // Ahora siempre mandamos una función para que el sonido se active:
        onClick={() => {
          if (playable) {
            onPlay(card);
          } else {
            console.log("Esta carta no se puede jugar, pero el sonido debería sonar.");
          }
        }}
        // Quitamos el disabled total para que el clic llegue al componente Card
        disabled={isProcessing} 
        isPlayable={playable}
      />
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
  isProcessing: PropTypes.bool
};

PlayerHand.defaultProps = {
  topCard: null,
  canPlay: null,
  isProcessing: false
};