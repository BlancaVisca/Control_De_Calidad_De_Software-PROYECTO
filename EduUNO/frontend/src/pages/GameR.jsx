import "../css/game.css"; // 👈 IMPORTANTE: CSS del juego
import { useEffect, useState } from "react";

export default function Game() {
  const [game, setGame] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/start", { method: "POST" })
      .then(res => res.json())
      .then(data => setGame(data))
      .catch(() => console.log("Backend no conectado"));
  }, []);

  if (!game) return <h1 style={{ textAlign: "center" }}>Cargando...</h1>;

  return (
    <div className="game-container">

      {/* ❤️ VIDAS (arriba izquierda) */}
      <div className="lives">
        ❤️ ❤️ ❤️
      </div>

      {/* 🃏 MAZO Y PREGUNTAS (arriba derecha) */}
      <div className="deck-info">
        <div>Cartas: {game.deck.length}</div>
        <div>Preguntas: 3</div>
      </div>

      {/* 🟢 TURNO */}
      <div className="turn-banner">
        ¡Tu turno! Juega una carta o roba del mazo
      </div>

      {/* 🔴 OPONENTE */}
      <div className="opponent">
        {game.opponentHand.map((_, i) => (
          <div key={i} className="card back" />
        ))}
      </div>

      {/* 🟢 CARTA CENTRAL */}
      <div className={`card center ${game.topCard.color}`}>
        ♻️
      </div>

      {/* 🔵 CONTROLES */}
      <div className="controls">
        <button className="draw-btn">Robar carta</button>
        <button className="question-btn">Usar Pregunta Educativa</button>
      </div>

      {/* 🟡 MANO DEL JUGADOR */}
      <div className="player-hand">
        {game.playerHand.map((card, i) => (
          <div
            key={i}
            className={`card ${card.color} ${i === 0 ? "playable" : ""}`}
          >
            {card.value}
          </div>
        ))}
      </div>

    </div>
  );
}
