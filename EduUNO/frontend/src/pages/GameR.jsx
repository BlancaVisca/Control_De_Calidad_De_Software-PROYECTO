import { useEffect, useState } from "react";
import Card from "../components/Card";
import "../css/game.css";

// 🔊 AUDIOS
const drawSound = new Audio('/sounds/flash.mp3');
const clickSound = new Audio('/sounds/boton.mp3');
const badSound = new Audio('/sounds/retro_mala.mp3');

export default function GameR() {
  const [game, setGame] = useState(null);
  const [lives, setLives] = useState(3);
  const [questionsLeft] = useState(3);

  useEffect(() => {
    fetch("http://localhost:3005/start", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setGame(data))
      .catch(() => console.log("Backend no conectado"));
  }, []);

  // 💀 GAME OVER automático
  useEffect(() => {
    if (lives === 0) {
      setTimeout(() => {
        alert("💀 Game Over");
        window.location.reload();
      }, 300);
    }
  }, [lives]);

  if (!game) {
    return (
      <div className="loading-screen">
        <h1>Cargando juego...</h1>
      </div>
    );
  }

  // 🃏 ROBAR CARTA
  const drawCard = () => {
    drawSound.currentTime = 0;
    drawSound.play();

    fetch("http://localhost:3005/draw", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setGame(data);

        // 🎲 PROBABILIDAD DE ERROR (30%)
        const fallo = Math.random() < 0.3;

        if (fallo) {
          badSound.currentTime = 0;
          badSound.play();

          setLives((prev) => Math.max(prev - 1, 0));
        }
      })
      .catch((err) => console.error("Error robando carta:", err));
  };

  // 🔘 PREGUNTA EDUCATIVA
  const handleQuestion = () => {
    clickSound.currentTime = 0;
    clickSound.play();

    console.log("Aquí puedes conectar preguntas 👀");
  };

  return (
    <div className="game-container">

      {/* 🔝 PANEL SUPERIOR */}
      <div className="top-panel">

        {/* ❤️ VIDAS */}
        <div className="lives">
          {Array.from({ length: lives }).map((_, i) => (
            <img key={i} src="/img/vidas.png" alt="vida" />
          ))}
        </div>

        {/* 🏷️ TURNO */}
        <div className="turn-banner">¡Tu turno!</div>

        {/* 📦 INFO */}
        <div className="deck-info">
          <span>Mazo: {game.deck.length}</span>
          <span>Preguntas: {questionsLeft}</span>
        </div>

      </div>

      {/* 🟥 OPONENTE */}
      <div className="opponent">
        {game.opponentHand.map((card) => (
          <Card key={card.id} hidden />
        ))}
      </div>

      {/* 🟦 CENTRO */}
      <div className="center-area">

        <div className="center-card">
          {game.topCard && <Card card={game.topCard} />}
        </div>

        <div className="controls">
          <button className="draw-btn" onClick={drawCard}>
            Robar carta
          </button>

          <button className="question-btn" onClick={handleQuestion}>
            Pregunta educativa
          </button>
        </div>

      </div>

      {/* 🟩 MANO */}
      <div className="player-hand">
        {game.playerHand.map((card) => (
          <Card key={card.id} card={card} isPlayable={true} />
        ))}
      </div>

    </div>
  );
}