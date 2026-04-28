import { useEffect, useState } from "react";
import CardM from "../components/CardM";
import OpponentHandM from "../components/OpponentHandM";
import PlayerHandM from "../components/PlayerHandM";
import GameHUD from "../components/GameHUD";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando
import "../css/gameM.css";
import RulesModalMath from "./RulesModalMath";

// 🔊 SONIDOS 
const soundButton = new Audio("/sounds/boton.mp3");
const soundCard = new Audio("/sounds/flash.mp3");
const soundWrong = new Audio("/sounds/equivocacion.mp3");
const soundWin = new Audio("/sounds/retro_buena.mp3");
const soundLose = new Audio("/sounds/retro_mala.mp3");

// Se combinó la lógica de ambas ramas: permite mute y usa el sonido del botón por defecto
const playSound = (sound = soundButton) => {
  const isMuted = localStorage.getItem("mute") === "true";
  if (isMuted) return;

  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
};

export default function GameM() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  // 🕹️ ESTADOS PARA EL MANDO (Cursor Virtual)
  const [focusZone, setFocusZone] = useState("hand");
  const [focusIndex, setFocusIndex] = useState(0);

  const [showRules, setShowRules] = useState(true);

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

  // 🔊 Efecto de sonido de victoria/derrota (Mantenido de la rama main)
  useEffect(() => {
    if (game?.status === "gameOver") {
      if (game.winner === "player") {
        playSound(soundWin);
      } else {
        playSound(soundLose);
      }
    }
  }, [game?.status]);

  // 🕹️ Auto-gestión de las Zonas de Foco (De la rama Obed-Mando)
  useEffect(() => {
    if (selectedQuestion) { setFocusZone("question"); setFocusIndex(0); }
    else if (game?.status === 'gameOver') { setFocusZone("gameOver"); setFocusIndex(0); }
    else { setFocusZone("hand"); setFocusIndex(0); }
  }, [selectedQuestion, game?.status]);

  // 🕹️ Prevenir que el índice se salga de rango si juegas una carta y tu mano se reduce
  useEffect(() => {
    if (focusZone === "hand" && game?.playerHand) {
      if (focusIndex >= game.playerHand.length) {
        setFocusIndex(Math.max(0, game.playerHand.length - 1));
      }
    }
  }, [game?.playerHand, focusZone]);

  /* =========================
     LÓGICA DEL MANDO 🕹️
  ========================= */
  useMando({
    onUp: () => {
      if (game?.status === 'gameOver') return;
      if (focusZone === "question") setFocusIndex(prev => Math.max(0, prev - 1));
      else if (focusZone === "hand") { setFocusZone("actions"); setFocusIndex(0); }
    },
    onDown: () => {
      if (game?.status === 'gameOver') return;
      if (focusZone === "question") setFocusIndex(prev => Math.min(selectedQuestion.options.length - 1, prev + 1));
      else if (focusZone === "actions") { setFocusZone("hand"); setFocusIndex(0); }
    },
    onLeft: () => {
      if (game?.status === 'gameOver') return;
      if (focusZone === "hand") setFocusIndex(prev => Math.max(0, prev - 1));
      else if (focusZone === "actions") setFocusIndex(0);
    },
    onRight: () => {
      if (game?.status === 'gameOver') return;
      if (focusZone === "hand") setFocusIndex(prev => Math.min(game.playerHand.length - 1, prev + 1));
      else if (focusZone === "actions") setFocusIndex(1);
    },
    onButton2: () => { // 🟢 BOTÓN CONFIRMAR
      playSound(); // Llama al sonido por defecto (soundButton)
      if (game?.status === 'gameOver') {
        window.location.reload();
      } else if (focusZone === "question" && userAnswer === null) {
        handleSubmitAnswer(focusIndex);
      } else if (game?.currentPlayer === 'player') {
        if (focusZone === "actions") {
          if (focusIndex === 0) handleDrawCard();
          else handleOpenQuestion();
        } else if (focusZone === "hand") {
          const cardToPlay = game.playerHand[focusIndex];
          if (cardToPlay && canPlay()) {
            handlePlayCard(cardToPlay);
          }
        }
      }
    },
    onButton1: () => { // 🔴 BOTÓN REGRESAR / CANCELAR
      if (focusZone === "actions") { setFocusZone("hand"); setFocusIndex(0); }
      else if (focusZone === "question" && userAnswer === null) { setSelectedQuestion(null); setFocusZone("hand"); }
    }
  });

  // 🕹️ Helper visual para elementos enfocados
  const getFocusStyle = (isActive) => isActive ? { outline: "4px solid #4ade80", transform: "scale(1.08)", transition: "all 0.2s", zIndex: 10, boxShadow: "0 0 20px rgba(74, 222, 128, 0.6)" } : { transition: "all 0.2s" };

  // 🔥 FUNCIÓN AUXILIAR PARA COLOR DEL TEXTO EN INFO BOX
  const getColorStyle = (color) => {
    if (!color) return '#ffffff';
    if (color === 'rojo') return '#ef4444';
    if (color === 'azul') return '#3b82f6';
    if (color === 'amarillo') return '#eab308';
    if (color === 'verde') return '#22c55e';
    return '#ffffff';
  };

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

        {/* 🕹️ Aplicamos foco visual al botón */}
        <button
          onClick={() => { playSound(); window.location.reload(); }}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#22d3ee",
            cursor: "pointer",
            fontWeight: "bold",
            ...getFocusStyle(focusZone === "gameOver")
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
      playSound(soundCard);
      setGame(data);
    }
  };

  /* =========================
     📦 ROBAR
  ========================= */
  const handleDrawCard = async () => {
    if (game.currentPlayer !== "player") return;

    playSound(soundCard); 

    const res = await 
    fetch("http://localhost:3005/math/draw", {
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

    playSound(soundButton);

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
         playSound(new Audio("/sounds/correcto.mp3"));
        setModalMessage("✅ ¡Correcto! Modo libre activado.");
      } else {
        playSound(soundWrong);
        setModalMessage(`❌ Incorrecto. Vidas: ${data.lives}`);
      }

      setTimeout(() => {
        setSelectedQuestion(null);
        setUserAnswer(null);
        setFocusZone("hand"); // Regresa a la mano
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

      {/* ♻️ PANEL DE INFO: CARTA ACTUAL */}
      {game.topCard && (
        <div style={{
          position: 'absolute', top: '90px', right: '20px', width: '240px',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '16px',
          padding: '20px', color: '#ffffff', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93c5fd', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', paddingBottom: '8px', fontWeight: '700' }}>🔢 Carta en Juego</h4>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>🎨 COLOR</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase', color: getColorStyle(game.topCard.color), textShadow: `0 0 10px ${getColorStyle(game.topCard.color)}66` }}>{game.topCard.color || 'Comodín'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>VALOR / OPERACIÓN</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.3', color: '#ffffff', fontFamily: "'Archivo Black', sans-serif" }}>{game.topCard.value || game.topCard.number || "🎲"}</div>
          </div>
        </div>
      )}

      <OpponentHandM hand={game.opponentHand} />

      <div className="center-area">
        <div className="center-card">
          {game.topCard && <CardM card={game.topCard} />}
        </div>

        <div className="controls">
          {/* 🕹️ Controles Centrales con Joystick (Se mantuvo la rama Obed-Mando) */}
          <button 
            className="draw-btn" 
            onClick={() => { playSound(); handleDrawCard(); }}
            style={getFocusStyle(focusZone === "actions" && focusIndex === 0)}
          >
            Robar
          </button>

          <button 
            className="question-btn" 
            onClick={() => { playSound(); handleOpenQuestion(); }}
            style={getFocusStyle(focusZone === "actions" && focusIndex === 1)}
          >
            Pregunta ({game.questionsLeft})
          </button>
        </div>
      </div>

      {/* 🕹️ Pasamos el focusedIndex */}
      <PlayerHandM
        hand={game.playerHand}
        topCard={game.topCard}
        onPlay={(card) => { playSound(); handlePlayCard(card); }}
        canPlay={canPlay}
        currentPlayer={game.currentPlayer}
        focusedIndex={focusZone === "hand" ? focusIndex : -1} 
      />

      {/* =========================
         MODAL PREGUNTA
      ========================= */}
      {selectedQuestion && (
        <div className="modal" style={{ zIndex: 1000 }}>
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
                  onClick={() => { playSound(); handleSubmitAnswer(idx); }}
                  disabled={userAnswer !== null}
                  className={className}
                  style={{ ...getFocusStyle(focusZone === "question" && focusIndex === idx && userAnswer === null), padding: "10px", margin: "5px" }}
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

      {showRules && (
        <RulesModalMath onClose={() => setShowRules(false)} />
      )}

    </div>

  );
}