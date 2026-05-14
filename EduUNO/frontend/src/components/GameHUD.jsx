/**
 * GameHUD.jsx - Panel superior con vidas, mazo y turno
 * Ubicación: EDUUNO/frontend/src/components/GameHUD.jsx
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

export default function GameHUD({ 
  deckCount, 
  lives, 
  questionsAvailable, 
  currentPlayer,
  turnInfo = '',
  lastAction = ''
}) {
  const navigate = useNavigate();
  
  return (
    <header className="game-hud" role="banner" aria-label="Panel de información del juego">
      
      {/* ❤️ VIDAS */}
      <div className="lives" key={`lives-container-${lives}`} aria-label={`Vidas restantes: ${lives} de 3`}>
        {[...Array(3)].map((_, index) => {
          const isLost = index >= lives;
          return (
            <img 
              key={`vida-${index}`} 
              src="/img/vidas.png" 
              alt={isLost ? "Vida perdida" : "Vida activa"}
              className={isLost ? 'lost' : ''}
              title={isLost ? "💔 Vida perdida" : "❤️ Vida disponible"}
              style={{ opacity: isLost ? 0 : 1, transition: 'opacity 0.3s ease' }}
              loading="lazy"
            />
          );
        })}
      </div>

      {/* 📦 INFO DEL MAZO */}
      <div className="deck-info" role="status" aria-live="polite">
        <div>
          <span aria-hidden="true">📦</span> 
          Mazo: <strong aria-label={`${deckCount} cartas en el mazo`}>{deckCount}</strong>
        </div>
        <div>
          <span aria-hidden="true">❓</span> 
          Preguntas: <strong aria-label={`${questionsAvailable} preguntas disponibles`}>{questionsAvailable}</strong>
        </div>
      </div>

      {/* 🔄 BANNER DE TURNO */}
      <div className="turn-banner" role="alert" aria-live="assertive" aria-atomic="true">
        {currentPlayer === 'player' 
          ? "✨ ¡Tu turno! Juega una carta o roba del mazo" 
          : "🤖 Turno del oponente..."}
        {turnInfo && (
          <small style={{ display: 'block', marginTop: '4px', opacity: 0.9, fontSize: '0.9em', fontWeight: 'normal' }}>
            {turnInfo}
          </small>
        )}
      </div>

      {/* 📝 ÚLTIMA ACCIÓN */}
      {lastAction && (
        <small style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }} aria-live="polite">
          {lastAction}
        </small>
      )}

      {/* 🔙 REGRESAR AL MENÚ */}
      <button
        onClick={() => navigate('/menu')}
        className="back-btn"
      >
        Regresar al menú
      </button>

    </header>
  );
}

GameHUD.propTypes = {
  deckCount: PropTypes.number.isRequired,
  lives: PropTypes.number.isRequired,
  questionsAvailable: PropTypes.number.isRequired,
  currentPlayer: PropTypes.oneOf(['player', 'opponent']).isRequired,
  turnInfo: PropTypes.string,
  lastAction: PropTypes.string
};

GameHUD.defaultProps = {
  turnInfo: '',
  lastAction: ''
};