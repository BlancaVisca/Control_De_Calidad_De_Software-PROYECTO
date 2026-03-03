/**
 * OpponentHand.jsx - Mano del oponente (cartas ocultas)
 * Ubicación: EDUUNO/frontend/src/components/OpponentHand.jsx
 */

import PropTypes from 'prop-types';
import Card from './Card';

export default function OpponentHand({ 
  hand = [], 
  hidden = true,
  cardCount = null 
}) {
  
  if (!hand || hand.length === 0) {
    return (
      <section className="opponent" aria-label="Mano del oponente" role="region">
        <small style={{ color: '#64748b', fontStyle: 'italic', padding: '10px' }}>
          {hidden ? '🎭 Cartas ocultas' : 'Sin cartas'}
        </small>
      </section>
    );
  }

  const cardsToShow = hidden ? hand : hand.slice(0, cardCount || hand.length);

  return (
    <section className="opponent" aria-label={`Mano del oponente: ${hand.length} cartas`} role="region">
      {cardsToShow.map((card, index) => (
        <Card 
          key={`opponent-${card?.id || `card-${index}`}`} 
          card={hidden ? { type: 'hidden' } : card}
          hidden={hidden}
          disabled={true}
          isPlayable={false}
        />
      ))}
    </section>
  );
}

OpponentHand.propTypes = {
  hand: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  cardCount: PropTypes.number
};

OpponentHand.defaultProps = {
  hand: [],
  hidden: true,
  cardCount: null
};