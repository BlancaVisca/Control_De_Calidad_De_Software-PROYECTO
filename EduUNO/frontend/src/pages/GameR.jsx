import { useEffect, useState } from "react";
import Card from "../components/Card";
import OpponentHand from "../components/OpponentHand";
import PlayerHand from "../components/PlayerHand";
import GameHUD from "../components/GameHUD";
import "../css/game.css";

export default function GameR() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3005/start", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setGame(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Backend no conectado", err);
        setLoading(false);
      });
  }, []);

  // Polling para actualizar cuando juega la IA
  useEffect(() => {
    if (!game || game.status === 'gameOver' || game.currentPlayer === 'player') return;
    
    const interval = setInterval(() => {
      fetch("http://localhost:3005/status")
        .then(res => res.json())
        .then(data => setGame(data));
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.currentPlayer, game?.status]);

  if (loading || !game) {
    return <div className="loading-screen"><h1>Cargando juego...</h1></div>;
  }

  if (game.status === 'gameOver') {
    return (
      <div className="loading-screen" style={{flexDirection: 'column', gap: '20px'}}>
        <h1 style={{fontSize: '3rem', color: game.winner === 'player' ? '#4ade80' : '#f87171'}}>
          {game.winner === 'player' ? '¡GANASTE!' : 'PERDISTE'}
        </h1>
        <p style={{fontSize: '1.2rem'}}>{game.lastAction}</p>
        <button 
          onClick={() => window.location.reload()}
          className="draw-btn"
          style={{padding: '12px 24px', fontSize: '1rem'}}
        >
          Jugar de nuevo
        </button>
      </div>
    );
  }

  const handlePlayCard = async (card) => {
    if (game.currentPlayer !== 'player') return;

    try {
      const res = await fetch("http://localhost:3005/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card }),
      });
      const data = await res.json();

      if (data.error) {
        setModalMessage(`⚠️ ${data.error}`);
      } else {
        setGame(data);
        if (data.lastAction.includes("¡RECICLA!")) {
          setModalMessage("⚠️ ¡RECICLA! Te queda 1 carta.");
        }
      }
    } catch (err) {
      console.error("Error jugando carta:", err);
    }
  };

  const handleDrawCard = async () => {
    if (game.currentPlayer !== 'player') return;
    try {
      const res = await fetch("http://localhost:3005/draw", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setModalMessage(data.error);
      } else {
        setGame(data);
        if (data.consecutiveDraws >= 3) {
          setModalMessage("⚠️ Has robado 3 cartas. ¡Usa una Pregunta Educativa!");
        }
      }
    } catch (err) {
      console.error("Error robando:", err);
    }
  };

  const handleOpenQuestion = async () => {
    if (game.questionsLeft <= 0) {
      setModalMessage("No te quedan preguntas disponibles.");
      return;
    }
    if (game.currentPlayer !== 'player') return;

    try {
      const res = await fetch("http://localhost:3005/question");
      const data = await res.json();
      if (data.error) {
        setModalMessage(data.error);
      } else {
        setSelectedQuestion(data);
        setUserAnswer(null);
      }
    } catch (err) {
      console.error("Error cargando pregunta:", err);
    }
  };

  const handleSubmitAnswer = async (optionIndex) => {
    if (!selectedQuestion) return;
    setUserAnswer(optionIndex);

    try {
      const res = await fetch("http://localhost:3005/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          selectedOption: optionIndex
        }),
      });
      const data = await res.json();
      
      setGame(data);
      
      if (data.questionResult === 'success') {
        setModalMessage("✅ ¡Correcto! Ahora puedes jugar libremente (simulado).");
      } else {
        setModalMessage(`❌ Incorrecto. ${data.message}`);
      }
      
      setTimeout(() => {
        setSelectedQuestion(null);
        setModalMessage(null);
      }, 2000);
    } catch (err) {
      console.error("Error enviando respuesta:", err);
    }
  };

  const canPlay = (card, topCard) => {
    if (card.type === 'wild') return true;
    if (card.recycle === topCard.recycle && card.number === topCard.number) return true;
    if (card.recycle === topCard.recycle && card.color === topCard.color) return true;
    return false;
  };

  return (
    <div className="game-container">
      <GameHUD 
        deckCount={game.deck.length}
        lives={game.lives}
        questionsAvailable={game.questionsLeft}
        currentPlayer={game.currentPlayer}
        lastAction={game.lastAction}
      />

      <OpponentHand hand={game.opponentHand} hidden={true} />

      <div className="center-area">
        <div className="center-card">
          {game.topCard && <Card card={game.topCard} />}
        </div>

        <div className="controls">
          <button 
            className="draw-btn" 
            onClick={handleDrawCard}
            disabled={game.currentPlayer !== 'player'}
          >
            Robar carta
          </button>

          <button 
            className="question-btn" 
            onClick={handleOpenQuestion}
            disabled={game.currentPlayer !== 'player' || game.questionsLeft <= 0}
          >
            Pregunta educativa ({game.questionsLeft})
          </button>
        </div>
      </div>

      <PlayerHand 
        hand={game.playerHand}
        topCard={game.topCard}
        onPlay={handlePlayCard}
        canPlay={canPlay}
        currentPlayer={game.currentPlayer}
        isProcessing={false}
      />

      {/* Modal de Pregunta */}
      {selectedQuestion && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#1e293b', padding: '2rem', borderRadius: '16px', 
            maxWidth: '500px', width: '90%', border: '1px solid #3b82f6',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
          }}>
            <h3 style={{color: '#60a5fa', marginBottom: '1.5rem', textAlign: 'center'}}>❓ {selectedQuestion.question}</h3>
            <div className="options-grid" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {selectedQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmitAnswer(idx)}
                  disabled={userAnswer !== null}
                  style={{
                    padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: userAnswer === idx 
                      ? (idx === selectedQuestion.correct ? '#22c55e' : '#ef4444') 
                      : '#334155',
                    color: 'white', fontWeight: 'bold', transition: 'all 0.2s'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {userAnswer !== null && (
              <p style={{marginTop: '1rem', textAlign: 'center', color: '#cbd5e1'}}>
                {selectedQuestion.explanation}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mensajes Flotantes (Toast) */}
      {modalMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: modalMessage.includes('❌') ? '#ef4444' : (modalMessage.includes('✅') ? '#22c55e' : '#f59e0b'),
          color: 'white', padding: '12px 24px', borderRadius: '50px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 1001, fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {modalMessage}
          <button onClick={() => setModalMessage(null)} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '10px'}}>✕</button>
        </div>
      )}
    </div>
  );
}