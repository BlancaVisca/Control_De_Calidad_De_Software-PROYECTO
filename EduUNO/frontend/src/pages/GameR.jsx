import { useEffect, useState } from "react";
import Card from "../components/Card";
import "../css/game.css";

export default function GameR() {
  const [game, setGame] = useState(null);
  const [lives] = useState(3);
  const [questionsLeft] = useState(3);

  useEffect(() => {
    fetch("http://localhost:3005/start", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setGame(data))
      .catch(() => console.log("Backend no conectado"));
  }, []);

  if (!game) {
    return (
      <div className="loading-screen">
        <h1>Cargando juego...</h1>
      </div>
    );
  }

  const drawCard = () => {
    fetch("http://localhost:3005/draw", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setGame(data))
      .catch((err) => console.error("Error robando carta:", err));
  };

  return (
    <div className="game-container">
      {/* =======================
          🔝 PANEL SUPERIOR
      ======================== */}
      <div className="top-panel">
        {/* ❤️ VIDAS */}
        <div className="lives">
          {Array.from({ length: lives }).map((_, i) => (
            <img key={i} src="/img/vidas.png" alt="vida" />
          ))}
        </div>

        {/* 🏷️ TURNO */}
        <div className="turn-banner">¡Tu turno!</div>

        {/* 📦 INFO MAZO */}
        <div className="deck-info">
          <span>Mazo: {game.deck.length}</span>
          <span>Preguntas: {questionsLeft}</span>
        </div>
      </div>

      {/* =======================
          🟥 OPONENTE
      ======================== */}
      <div className="opponent">
        {game.opponentHand.map((card) => (
          <Card key={card.id} hidden />
        ))}
      </div>

      {/* =======================
          🟦 ZONA CENTRAL
      ======================== */}
      <div className="center-area">
        <div className="center-card">
          {game.topCard && <Card card={game.topCard} />}
        </div>

        <div className="controls">
          <button className="draw-btn" onClick={drawCard}>
            Robar carta
          </button>

          <button className="question-btn">Pregunta educativa</button>
        </div>
      </div>

      {/* =======================
          🟩 MANO DEL JUGADOR
      ======================== */}
      <div className="player-hand">
        {game.playerHand.map((card) => (
          <Card key={card.id} card={card} isPlayable={true} />
        ))}
      </div>
    </div>
  );
}
