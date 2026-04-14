import { useEffect, useState } from "react";
import CardM from "../components/CardM";
import OpponentHandM from "../components/OpponentHandM";
import PlayerHandM from "../components/PlayerHandM";
import GameHUD from "../components/GameHUD";
import "../css/gameM.css";

export default function GameM() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  /* =========================
     START
  ========================= */
  useEffect(() => {
    fetch("http://localhost:3005/math/start", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        setGame(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* =========================
     POLLING OPONENTE
  ========================= */
  useEffect(() => {
    if (!game || game.currentPlayer === "player") return;

    const interval = setInterval(() => {
      fetch("http://localhost:3005/math/status")
        .then(res => res.json())
        .then(data => setGame(prev => ({ ...prev, ...data })));
    }, 800);

    return () => clearInterval(interval);
  }, [game?.currentPlayer]);

  if (loading || !game) return <h1>Cargando...</h1>;

  /* =========================
     🏆 GAME OVER
  ========================= */
  if (game.status === "gameOver") {
    const isWinner = game.winner === "player";

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle, #020617, #0f172a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white",
          zIndex: 9999,
        }}
      >
        <h1 style={{ fontSize: "3rem" }}>
          {isWinner ? "🏆 GANASTE" : "💔 PERDISTE"}
        </h1>

        {game.reason === "empty_deck" && (
          <p>Se acabó el mazo</p>
        )}

        <p style={{ marginTop: "15px" }}>
          🫵 Tú: {game.playerHand.length} cartas <br />
          🤖 Oponente: {game.opponentHand.length} cartas
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#22d3ee",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔄 Jugar otra vez
        </button>
      </div>
    );
  }

  /* =========================
     🎮 JUGAR CARTA
  ========================= */
  const handlePlayCard = async (card) => {
    if (game.currentPlayer !== "player") return;

    const res = await fetch("http://localhost:3005/math/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card }),
    });

    const data = await res.json();

    if (data.error) {
      setModalMessage(`⚠️ ${data.error}`);
    } else {
      setGame(data);
    }
  };

  /* =========================
     📦 ROBAR
  ========================= */
  const handleDrawCard = async () => {
    if (game.currentPlayer !== "player") return;

    const res = await fetch("http://localhost:3005/math/draw", {
      method: "POST",
    });

    const data = await res.json();

    if (data.status === "gameOver") {
      setGame(data);
      return;
    }

    setGame(data);
  };

  /* =========================
     ❓ PREGUNTA
  ========================= */
  const handleOpenQuestion = async () => {
    if (game.currentPlayer !== "player") return;

    const res = await fetch("http://localhost:3005/math/question");
    const data = await res.json();

    if (data.error) {
      setModalMessage(data.error);
    } else {
      setSelectedQuestion(data);
      setUserAnswer(null);
    }
  };

  /* =========================
     ✅ RESPUESTA
  ========================= */
  const handleSubmitAnswer = async (index) => {
    if (!selectedQuestion) return;

    setUserAnswer(index);

    try {
      const res = await fetch("http://localhost:3005/math/answer-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          selectedOption: index,
        }),
      });

      const data = await res.json();

      if (data.status === "gameOver") {
        setGame(data);
        return;
      }

      setGame(data);

      if (data.questionResult === "success") {
        setModalMessage("✅ ¡Correcto! Modo libre activado.");
      } else {
        setModalMessage(`❌ Incorrecto. Vidas: ${data.lives}`);
      }

      setTimeout(() => {
        setSelectedQuestion(null);
        setUserAnswer(null);
      }, 2500);

    } catch (err) {
      console.error(err);
      setModalMessage("Error al responder");
    }
  };

  /* =========================
     🧠 REGLAS (BACKEND)
  ========================= */
  const canPlay = () => true;

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="game-container">

      <GameHUD
        deckCount={game.deck.length}
        lives={game.lives}
        questionsAvailable={game.questionsLeft}
        currentPlayer={game.currentPlayer}
        lastAction={game.lastAction}
      />

      <OpponentHandM hand={game.opponentHand} />

      <div className="center-area">
        <div className="center-card">
          {game.topCard && <CardM card={game.topCard} />}
        </div>

        <div className="controls">
          <button className="draw-btn" onClick={handleDrawCard}>
            Robar
          </button>

          <button className="question-btn" onClick={handleOpenQuestion}>
            Pregunta ({game.questionsLeft})
          </button>
        </div>
      </div>

      <PlayerHandM
        hand={game.playerHand}
        topCard={game.topCard}
        onPlay={handlePlayCard}
        canPlay={canPlay}
        currentPlayer={game.currentPlayer}
      />

      {/* =========================
         MODAL PREGUNTA
      ========================= */}
      {selectedQuestion && (
        <div className="modal">
          <div className="modal-content">

            <h3>❓ {selectedQuestion.question}</h3>

            {selectedQuestion.options.map((opt, idx) => {
              let className = "";

              if (userAnswer !== null) {
                if (idx === selectedQuestion.correct) {
                  className = "correct";
                } else if (idx === userAnswer) {
                  className = "incorrect";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSubmitAnswer(idx)}
                  disabled={userAnswer !== null}
                  className={className}
                >
                  {opt}
                </button>
              );
            })}

            {userAnswer !== null && (
              <p>{selectedQuestion.explanation}</p>
            )}

          </div>
        </div>
      )}

      {/* =========================
         TOAST
      ========================= */}
      {modalMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              modalMessage.includes("❌")
                ? "#ef4444"
                : "#22c55e",
            color: "white",
            padding: "12px 24px",
            borderRadius: "50px",
            fontWeight: "bold",
            zIndex: 2000,
          }}
        >
          {modalMessage}
          <span
            onClick={() => setModalMessage(null)}
            style={{ marginLeft: "10px", cursor: "pointer" }}
          >
            ✕
          </span>
        </div>
      )}
    </div>
  );
}