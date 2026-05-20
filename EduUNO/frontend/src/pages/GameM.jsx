import { useEffect, useState } from "react";
import CardM from "../components/CardM";
import OpponentHandM from "../components/OpponentHandM";
import PlayerHandM from "../components/PlayerHandM";
import GameHUD from "../components/GameHUD";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando
import { useNavigate } from "react-router-dom";
import RulesModalMath from "./RulesModalMath";
import "../css/gameM.css";

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");
const playSound = () => {
  soundButton.currentTime = 0;
  soundButton.play();
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

  /* =========================
     START
  ========================= */
  useEffect(() => {
    fetch("http://localhost:3006/start", { method: "POST" })
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
      fetch("http://localhost:3006/status")
        .then(res => res.json())
        .then(data => setGame(prev => ({ ...prev, ...data })));
    }, 800);

    return () => clearInterval(interval);
  }, [game?.currentPlayer]);

  // 🕹️ Auto-gestión de las Zonas de Foco
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
      playSound();
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
     🏆 GAME OVER (Original intacto)
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
// 🔊 SONIDOS
const soundButton = new Audio("/sounds/boton.mp3");
const soundCard   = new Audio("/sounds/flash.mp3");
const soundWrong  = new Audio("/sounds/equivocacion.mp3");
const soundWin    = new Audio("/sounds/retro_buena.mp3");
const soundLose   = new Audio("/sounds/retro_mala.mp3");

const playSound = (sound = soundButton) => {
  if (localStorage.getItem("mute") === "true") return;
  try { sound.currentTime = 0; sound.play(); } catch (e) {}
};

const FUN_FACTS = {
  slope: [
    "Una pendiente de 45° significa que por cada metro que avanzas, subes exactamente uno.",
    "Si m = 2, la recta sube el doble de rápido de lo que avanza.",
    "Una pendiente negativa siempre baja de izquierda a derecha, sin excepción.",
    "Dos rectas paralelas siempre tienen exactamente la misma pendiente.",
    "Una recta vertical no tiene pendiente definida porque dividiría entre cero.",
  ],
  type: [
    "Una función lineal siempre cruza el eje Y en exactamente un punto.",
    "Si b = 0, la recta siempre pasa por el origen (0, 0).",
    "y = 5 es una recta horizontal que nunca sube ni baja.",
    "Dos rectas perpendiculares tienen pendientes que multiplicadas dan -1.",
    "Una recta creciente y una decreciente siempre se cruzan en algún punto.",
  ],
  equation: [
    "En y = x², el valor de y siempre es positivo sin importar el signo de x.",
    "Un círculo con radio 1 se llama círculo unitario y es clave en trigonometría.",
    "La parábola y = -x² es el reflejo exacto de y = x² sobre el eje X.",
    "En x² + y² = r², si r se duplica, el área del círculo se cuadruplica.",
    "La parábola y = x² tiene su punto más bajo exactamente en el origen.",
  ],
};

function getRandomFact(cardType) {
  const pool = FUN_FACTS[cardType] || FUN_FACTS.equation;
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeAngle(accumulated) {
  return ((accumulated % 180) + 180) % 180;
}

function isCorrectAngle(accumulated, acceptAngles) {
  const a = normalizeAngle(accumulated);
  return acceptAngles.includes(a);
}

function visualAngle(deg) {
  return ((deg % 360) + 360) % 360;
}

const ALL_CHALLENGES = [
  { id: 1,  type: "linear",    acceptAngles: [45, 135], cardType: "slope",    cardContent: "m > 0",        cardSub: "Pendiente positiva"   },
  { id: 2,  type: "linear",    acceptAngles: [45, 135], cardType: "slope",    cardContent: "m < 0",        cardSub: "Pendiente negativa"   },
  { id: 3,  type: "linear",    acceptAngles: [0],       cardType: "slope",    cardContent: "m = 0",        cardSub: "Recta horizontal"     },
  { id: 4,  type: "linear",    acceptAngles: [90],      cardType: "slope",    cardContent: "m = ∞",        cardSub: "Recta vertical"       },
  { id: 5,  type: "linear",    acceptAngles: [45, 135], cardType: "type",     cardContent: "↗",            cardSub: "Recta creciente"      },
  { id: 6,  type: "linear",    acceptAngles: [45, 135], cardType: "type",     cardContent: "↘",            cardSub: "Recta decreciente"    },
  { id: 7,  type: "linear",    acceptAngles: [45, 135], cardType: "equation", cardContent: "y = x + 2",    cardSub: "Ecuación lineal"      },
  { id: 8,  type: "linear",    acceptAngles: [45, 135], cardType: "equation", cardContent: "y = −x + 1",   cardSub: "Ecuación lineal"      },
  { id: 9,  type: "quadratic", acceptAngles: [],        cardType: "equation", cardContent: "y = x²",       cardSub: "Función cuadrática"   },
  { id: 10, type: "quadratic", acceptAngles: [],        cardType: "equation", cardContent: "y = −x²",      cardSub: "Función cuadrática"   },
  { id: 11, type: "circle",    acceptAngles: [],        cardType: "equation", cardContent: "x² + y² = r²", cardSub: "Ecuación"             },
  { id: 12, type: "linear",    acceptAngles: [90],      cardType: "slope",    cardContent: "m indefinida", cardSub: "Pendiente indefinida" },
];

function pickChallenges() {
  const arr = [...ALL_CHALLENGES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 5).map(c => ({ ...c, fact: getRandomFact(c.cardType) }));
}

function getStars(correct) {
  return Math.min(5, Math.max(0, correct));
}

/* ── CARTA ── */
function ChallengeCard({ challenge, index, total }) {
  const isEquation = challenge.cardType === "equation";
  const isSlope    = challenge.cardType === "slope";
  return (
    <div className="challenge-card">
      <div className="challenge-card__header">
        <span className="challenge-card__counter">{index + 1} / {total}</span>
        <span className="challenge-card__badge">
          {isEquation ? "📘 ECUACIÓN" : isSlope ? "📉 PENDIENTE" : "📊 TIPO"}
        </span>
      </div>
      <div className="challenge-card__body">
        <div className="challenge-card__main">{challenge.cardContent}</div>
        <div className="challenge-card__sub">{challenge.cardSub}</div>
      </div>
      <div className="challenge-card__fact">
        <span className="challenge-card__fact-icon">💡</span>
        <span>{challenge.fact}</span>
      </div>
    </div>
  );
}

/* ── SVG SHAPES ── */
function LinearLine({ angle }) {
  const cx = 110, cy = 110, len = 90;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * len;
  const dy = Math.sin(rad) * len;
  return (
    <g>
      <defs>
        <filter id="glow-line">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <line x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy}
        stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" filter="url(#glow-line)" />
      <circle cx={cx} cy={cy} r="5" fill="#f97316" filter="url(#glow-line)" />
    </g>
  );
}

function QuadraticPath({ rotationAngle }) {
  const points = [];
  for (let px = -85; px <= 85; px += 4) {
    const py = (px * px) / 85;
    points.push([110 + px, 110 - py]);
  }
  const d = "M " + points.map(p => p.join(",")).join(" L ");
  return (
    <g transform={`rotate(${rotationAngle}, 110, 110)`}>
      <defs>
        <filter id="glow-curve">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={d} stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#glow-curve)" />
      <circle cx="110" cy="110" r="5" fill="#a855f7" filter="url(#glow-curve)" />
    </g>
  );
}

function CirclePath() {
  return (
    <g>
      <defs>
        <filter id="glow-circle">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="110" cy="110" r="75" stroke="#22d3ee" strokeWidth="3" fill="none" filter="url(#glow-circle)" />
      <circle cx="110" cy="110" r="4" fill="#22d3ee" filter="url(#glow-circle)" />
    </g>
  );
}

/* ── GRÁFICA ── */
function InteractiveGraph({ angle, graphMode, parabolaAngle }) {
  const isQuadratic  = graphMode === "quadratic";
  const isCircle     = graphMode === "circle";
  const vAngle       = visualAngle(angle);
  const displayAngle = normalizeAngle(angle);
  return (
    <div className="graph-container">
      <svg viewBox="0 0 220 220" className="graph-svg" xmlns="http://www.w3.org/2000/svg">
        {[55, 110, 165].map(v => (
          <g key={v}>
            <line x1={v}  y1="10"  x2={v}   y2="210" stroke="rgba(34,211,238,0.12)" strokeWidth="1" />
            <line x1="10" y1={v}   x2="210" y2={v}   stroke="rgba(34,211,238,0.12)" strokeWidth="1" />
          </g>
        ))}
        <line x1="10"  y1="110" x2="210" y2="110" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" />
        <line x1="110" y1="10"  x2="110" y2="210" stroke="rgba(148,163,184,0.45)" strokeWidth="1.5" />
        <polygon points="210,110 203,106 203,114" fill="rgba(148,163,184,0.45)" />
        <polygon points="110,10 106,17 114,17"   fill="rgba(148,163,184,0.45)" />
        <text x="214" y="114" fill="rgba(148,163,184,0.5)" fontSize="10">x</text>
        <text x="114" y="8"   fill="rgba(148,163,184,0.5)" fontSize="10">y</text>
        {isCircle    ? <CirclePath /> :
         isQuadratic ? <QuadraticPath rotationAngle={parabolaAngle} /> :
                       <LinearLine angle={vAngle} />}
      </svg>
      <div className="graph-angle-label">
        {isCircle    ? "Círculo" :
         isQuadratic ? `Parábola ${((parabolaAngle % 360) + 360) % 360}°` :
                       `${displayAngle}°`}
      </div>
    </div>
  );
}

/* ── RESULTADO FINAL ── */
function FinalResult({ score, onRestart }) {
  const navigate = useNavigate();
  const stars = getStars(score);
  const msgs  = ["Sin aciertos, ¡sigue intentando!", "Sigue practicando", "Casi lo logras", "¡Buen trabajo!", "¡Muy bien!", "¡Perfecto!"];
  useEffect(() => { playSound(score >= 3 ? soundWin : soundLose); }, []);
  return (
    <div className="final-result">
      <div className="final-result__inner">
        <h2 className="final-result__title">Resultado Final</h2>
        <div className="final-result__stars">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`star ${s <= stars ? "star--active" : ""}`}>★</span>
          ))}
        </div>
        <div className="final-result__score">{score * 20}<span>/100</span></div>
        <div className="final-result__msg">{msgs[stars]}</div>
        <div className="final-result__detail">{score} de 5 respuestas correctas</div>
        <button className="final-result__btn" onClick={onRestart}>Jugar otra vez</button>
        <button className="final-result__menu" onClick={() => navigate("/menu")}>Regresar al menu</button>
      </div>
    </div>
  );
}

/* ── COMPONENTE PRINCIPAL ── */
export default function GameM() {

    const navigate = useNavigate(); 

  const [showRules,     setShowRules]     = useState(true);
  const [challenges,    setChallenges]    = useState([]);
  const [roundIndex,    setRoundIndex]    = useState(0);
  const [angle,         setAngle]         = useState(0);
  const [parabolaAngle, setParabolaAngle] = useState(0);
  const [graphMode,     setGraphMode]     = useState("linear");
  const [score,         setScore]         = useState(0);
  const [feedback,      setFeedback]      = useState(null);
  const [gameOver,      setGameOver]      = useState(false);
  const [validated,     setValidated]     = useState(false);

  useEffect(() => { if (!showRules) startGame(); }, [showRules]);

  function startGame() {
    setChallenges(pickChallenges());
    setRoundIndex(0);
    setAngle(0);
    setParabolaAngle(0);
    setGraphMode("linear");
    setScore(0);
    setFeedback(null);
    setGameOver(false);
    setValidated(false);
  }

  const challenge   = challenges[roundIndex];
  const totalRounds = 5;

  function rotate(deg) {
    if (validated) return;
    playSound(soundButton);
    setAngle(prev => prev + deg);
  }

  function rotateParabola(deg) {
    if (validated) return;
    playSound(soundButton);
    setParabolaAngle(prev => prev + deg);
  }

  function toggleGraphMode() {
    if (validated) return;
    playSound(soundButton);
    setGraphMode(prev => {
      if (prev === "linear")    return "quadratic";
      if (prev === "quadratic") return "circle";
      return "linear";
    });
  }

  function validate() {
    if (!challenge || validated) return;
    playSound(soundButton);
    let correct = false;
    if (challenge.type === "circle")        correct = graphMode === "circle";
    else if (challenge.type === "quadratic") correct = graphMode === "quadratic";
    else correct = graphMode === "linear" && isCorrectAngle(angle, challenge.acceptAngles);

    const newScore = score + (correct ? 1 : 0);
    setValidated(true);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) { setScore(newScore); playSound(soundCard); }
    else playSound(soundWrong);

    setTimeout(() => {
      if (roundIndex + 1 >= totalRounds) {
        setGameOver(true);
      } else {
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
        setRoundIndex(prev => prev + 1);
        setAngle(0);
        setParabolaAngle(0);
        setGraphMode("linear");
        setFeedback(null);
        setValidated(false);
      }
    }, 1500);
  }

  if (showRules)  return <RulesModalMath onClose={() => setShowRules(false)} />;
  if (gameOver)   return <FinalResult score={score} onRestart={() => { setGameOver(false); startGame(); }} />;
  if (!challenge) return <div className="game-loading">Cargando...</div>;

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
            {/* Usa .value o .number dependiendo de cómo venga tu API de mate */}
            <div style={{ fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.3', color: '#ffffff', fontFamily: "'Archivo Black', sans-serif" }}>{game.topCard.value || game.topCard.number || "🎲"}</div>
          </div>
        </div>
      )}

      <OpponentHandM hand={game.opponentHand} />

      <div className="center-area">
        <div className="center-card">
          {game.topCard && <CardM card={game.topCard} />}
    <div className="game-container gamem-new">


      {/* 🔙 REGRESAR AL MENÚ */}
      <button
        className="back-btn"
        onClick={() => navigate('/menu')}
      >
        Regresar al menú
      </button>

      <div className="gamem-layout">

        {/* ── COL 1: CARTA ── */}
        <ChallengeCard challenge={challenge} index={roundIndex} total={totalRounds} />

        {/* ── COL 2: GRÁFICA ── */}
        <div className="gamem-center">
          <InteractiveGraph angle={angle} graphMode={graphMode} parabolaAngle={parabolaAngle} />
        </div>

        <div className="controls">
          {/* 🕹️ Controles Centrales con Joystick */}
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
        {/* ── COL 3: PANEL DERECHO (stats + controles + validar) ── */}
        <div className="gamem-right">

          {/* Stats */}
          <div className="gamem-stats">
            <div className="stats-box">
              <span className="stats-box__icon">🏆</span>
              <span className="stats-box__label">PUNTOS</span>
              <span className="stats-box__value">{score * 20}</span>
            </div>
            <div className="stats-box">
              <span className="stats-box__label">RONDA</span>
              <span className="stats-box__value">{roundIndex + 1}<small>/5</small></span>
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
          <span className="move-graph">MODIFICA LA GRÁFICA</span>

          {/* Cambiar tipo */}
          <button
            className={`graph-mode-btn ${graphMode !== "linear" ? "graph-mode-btn--active" : ""}`}
            onClick={toggleGraphMode}
          >
            {graphMode === "linear"    ? "📈 Lineal"     :
             graphMode === "quadratic" ? "📉 Cuadrática" : "⭕ Círculo"}
            <span className="graph-mode-btn__hint">Cambiar tipo</span>
          </button>

          {/* Controles de rotación */}
          {graphMode === "linear" && (
            <div className="rotation-controls">
              <span className="rotation-label">CONTROLES DE ROTACIÓN</span>
              <div className="rotation-btns">
                <button className="rot-btn" onClick={() => rotate(45)}>↻ 45°</button>
                <button className="rot-btn" onClick={() => rotate(90)}>↻ 90°</button>
                <button className="rot-btn" onClick={() => rotate(180)}>↻ 180°</button>
              </div>
            </div>
          )}

          {graphMode === "quadratic" && (
            <div className="rotation-controls">
              <span className="rotation-label">ROTAR PARÁBOLA</span>
              <div className="rotation-btns">
                <button className="rot-btn" onClick={() => rotateParabola(45)}>↻ 45°</button>
                <button className="rot-btn" onClick={() => rotateParabola(90)}>↻ 90°</button>
                <button className="rot-btn" onClick={() => rotateParabola(180)}>↻ 180°</button>
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`feedback-banner feedback-banner--${feedback}`}>
              {feedback === "correct" ? "✅ ¡Correcto!" : "❌ Incorrecto"}
            </div>
          )}

          {/* Validar */}
          <button
            className={`validate-btn ${validated ? "validate-btn--done" : ""}`}
            onClick={validate}
            disabled={validated}
          >
            ✓ VALIDAR
          </button>

        </div>
      </div>
    </div>
  );
}