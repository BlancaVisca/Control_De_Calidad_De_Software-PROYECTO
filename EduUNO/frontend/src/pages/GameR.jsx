import { useEffect, useState } from "react";
import Card from "../components/Card";
import OpponentHand from "../components/OpponentHand";
import PlayerHand from "../components/PlayerHand";
import GameHUD from "../components/GameHUD";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando
import "../css/game.css";
import RulesModalRec from "./RulesModalRec";

// 🔊 SONIDOS
const soundButton = new Audio("/sounds/boton.mp3");
const soundCard = new Audio("/sounds/flash.mp3");
const soundCorrect = new Audio("/sounds/correcto.mp3");
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

export default function GameR() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [pendingChoice, setPendingChoice] = useState(null);

  // 🕹️ ESTADOS PARA EL MANDO (Cursor Virtual)
  // Zonas: "hand" (cartas), "actions" (botones), "question" (modal quiz), "choice" (modal comodín), "gameOver"
  const [focusZone, setFocusZone] = useState("hand");
  const [focusIndex, setFocusIndex] = useState(0);

  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3005/recycling/start", { method: "POST" })
      .then(res => res.json())
      .then(data => { 
        setGame(data); 
        setLoading(false); 
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!game || game.status === 'gameOver' || game.currentPlayer === 'player') return;
    const interval = setInterval(() => {
      fetch("http://localhost:3005/recycling/status")
        .then(res => res.json())
        .then(data => setGame(prev => ({ ...prev, ...data })));
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.currentPlayer, game?.status]);

  // 🔊 Efecto de sonido de victoria/derrota (De la rama main)
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
    else if (pendingChoice) { setFocusZone("choice"); setFocusIndex(0); }
    else if (game?.status === 'gameOver') { setFocusZone("gameOver"); setFocusIndex(0); }
    else { setFocusZone("hand"); setFocusIndex(0); }
  }, [selectedQuestion, pendingChoice, game?.status]);

  // 🕹️ Prevenir que el índice se salga de rango si juegas una carta y tu mano se reduce
  useEffect(() => {
    if (focusZone === "hand" && game?.playerHand) {
      if (focusIndex >= game.playerHand.length) {
        setFocusIndex(Math.max(0, game.playerHand.length - 1));
      }
    }
  }, [game?.playerHand, focusZone]);

  /* ===== LÓGICA DEL MANDO 🕹️ ===== */
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
      else if (focusZone === "choice") setFocusIndex(prev => Math.max(0, prev - 1));
    },
    onRight: () => {
      if (game?.status === 'gameOver') return;
      if (focusZone === "hand") setFocusIndex(prev => Math.min(game.playerHand.length - 1, prev + 1));
      else if (focusZone === "actions") setFocusIndex(1);
      else if (focusZone === "choice") setFocusIndex(prev => Math.min(pendingChoice.options.length - 1, prev + 1));
    },
    onButton2: () => { // 🟢 BOTÓN CONFIRMAR
      playSound();
      if (game?.status === 'gameOver') {
        window.location.reload();
      } else if (focusZone === "question" && userAnswer === null) {
        handleSubmitAnswer(focusIndex);
      } else if (focusZone === "choice") {
        handleChoice(pendingChoice.options[focusIndex]);
      } else if (game?.currentPlayer === 'player') {
        if (focusZone === "actions") {
          if (focusIndex === 0) handleDrawCard();
          else handleOpenQuestion();
        } else if (focusZone === "hand") {
          const cardToPlay = game.playerHand[focusIndex];
          if (cardToPlay && canPlay(cardToPlay, game.topCard)) {
            handlePlayCard(cardToPlay);
          } else {
            setModalMessage("⚠️ No puedes jugar esta carta ahora mismo.");
            setTimeout(() => setModalMessage(null), 2000);
          }
        }
      }
    },
    onButton1: () => { // 🔴 BOTÓN REGRESAR / CANCELAR
      if (focusZone === "choice") setPendingChoice(null);
      else if (focusZone === "actions") { setFocusZone("hand"); setFocusIndex(0); }
      else if (focusZone === "question" && userAnswer === null) { setSelectedQuestion(null); setFocusZone("hand"); }
    }
  });

  // 🕹️ Helper visual para elementos enfocados
  const getFocusStyle = (isActive) => isActive ? { outline: "4px solid #4ade80", transform: "scale(1.08)", transition: "all 0.2s", zIndex: 10, boxShadow: "0 0 20px rgba(74, 222, 128, 0.6)" } : { transition: "all 0.2s" };

  if (loading || !game) return <div className="loading-screen"><h1>Cargando...</h1></div>;

  // 🔥 FUNCIÓN AUXILIAR PARA FORMATEAR TEXTO DE RECICLAJE
  const formatRecycleText = (recycle) => {
    if (!recycle) return '';
    if (recycle === 'organico') return 'Orgánico';
    if (recycle === 'inorganico') return 'Inorgánico Reciclable';
    if (recycle === 'noreciclable') return 'Inorgánico No Reciclable';
    if (recycle === 'metal') return 'Metal';
    return recycle;
  };

  // 🔥 FUNCIÓN AUXILIAR PARA COLOR DEL TEXTO
  const getColorStyle = (color) => {
    if (!color) return '#ffffff';
    if (color === 'rojo') return '#ef4444';
    if (color === 'azul') return '#3b82f6';
    if (color === 'amarillo') return '#eab308';
    if (color === 'verde') return '#22c55e';
    return '#ffffff';
  };

  if (game.status === 'gameOver') {
    let title = "";
    let subTitle = "";
    let color = "#f87171"; 
    let borderColor = "rgba(239, 68, 68, 0.5)";
    let shadowColor = "rgba(239, 68, 68, 0.35)";
    let bgGradient = "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))";

    if (game.reason === 'empty_deck') {
      subTitle = game.endMessageSub || "Partida finalizada, el mazo se ha quedado sin cartas";
      if (game.winner === 'player') {
        title = "¡GANASTE!";
        color = "#4ade80";
        borderColor = "rgba(34, 197, 94, 0.5)";
        shadowColor = "rgba(34, 197, 94, 0.35)";
        bgGradient = "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15))";
      } else {
        title = "😔 Perdiste";
        color = "#f87171";
      }
    } else if (game.reason === 'no_questions') {
      title = "⚠️ Sin Preguntas";
      subTitle = "Te has quedado sin preguntas educativas.";
      color = "#fbbf24";
      borderColor = "rgba(245, 158, 11, 0.5)";
      shadowColor = "rgba(245, 158, 11, 0.35)";
      bgGradient = "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))";
    } else if (game.winner === 'player') {
      title = "🎉 ¡GANASTE!";
      subTitle = "El oponente se quedó sin cartas o vidas.";
      color = "#4ade80";
      borderColor = "rgba(34, 197, 94, 0.5)";
      shadowColor = "rgba(34, 197, 94, 0.35)";
      bgGradient = "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15))";
    } else {
      title = "💔 PERDISTE";
      subTitle = game.lastAction || "Inténtalo de nuevo.";
      color = "#f87171";
    }

    return (
      <div 
        className="game-over"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(circle at 50% 70%, ${shadowColor}, transparent 60%), linear-gradient(180deg, #050b1f 0%, #071530 50%, #050b1f 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.2), transparent)`, animation: 'twinkle 4s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 30px', maxWidth: '650px', width: '90%', animation: 'gameOverPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ fontSize: '5rem', marginBottom: '25px', animation: 'float 3s ease-in-out infinite', filter: `drop-shadow(0 0 30px ${shadowColor})`, display: 'inline-block' }}>
            {game.winner === 'player' ? '🏆' : game.reason === 'no_questions' ? '❓' : '💔'}
          </div>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '3.5rem', color: color, margin: '0 0 20px 0', textShadow: `0 0 40px ${shadowColor}`, letterSpacing: '3px', textTransform: 'uppercase', lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: '1.3rem', color: '#cbd5e1', margin: '0 0 30px 0', lineHeight: 1.6, opacity: 0.95, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>{subTitle}</p>
          {game.reason === 'empty_deck' && (
            <div style={{ fontSize: '1.1rem', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.4)', padding: '18px 30px', borderRadius: '16px', border: `1px solid ${borderColor}`, marginBottom: '30px', display: 'inline-flex', justifyContent: 'center', gap: '40px', backdropFilter: 'blur(10px)', boxShadow: `0 10px 40px ${shadowColor}` }}>
              <span style={{ color: '#60a5fa' }}>🫵 Tus cartas: <strong style={{ color: '#e5e7eb', fontSize: '1.3rem' }}>{game.playerHand.length}</strong></span>
              <span style={{ color: '#f472b6' }}>🤖 Oponente: <strong style={{ color: '#e5e7eb', fontSize: '1.3rem' }}>{game.opponentHand.length}</strong></span>
            </div>
          )}
          {/* 🕹️ Aplicamos el foco al botón original de jugar de nuevo */}
          <button onClick={() => { playSound(); window.location.reload(); }} style={{ ...getFocusStyle(focusZone === "gameOver"), padding: '18px 55px', fontSize: '1.25rem', background: game.winner === 'player' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%)', border: `2px solid ${borderColor}`, borderRadius: '16px', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: `0 15px 50px ${shadowColor}`, textTransform: 'uppercase', letterSpacing: '2px' }} onMouseOver={(e) => { e.target.style.transform = 'translateY(-5px) scale(1.02)'; e.target.style.boxShadow = `0 25px 60px ${shadowColor}`; }} onMouseOut={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = `0 15px 50px ${shadowColor}`; }}>🔄 Jugar de nuevo</button>
          <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: `1px solid ${borderColor}`, opacity: 0.5, fontSize: '0.9rem', color: '#64748b', letterSpacing: '1px' }}>
            <span style={{ marginRight: '12px' }}>♻️ ReUNOvables</span><span>•</span><span style={{ marginLeft: '12px' }}>Educa y Juega</span>
          </div>
        </div>
        <style>{`@keyframes gameOverPopIn { 0% { opacity: 0; transform: scale(0.7) translateY(40px); } 100% { opacity: 1; transform: scale(1) translateY(0); } } @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } } @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }`}</style>
      </div>
    );
  }

  const handlePlayCard = async (card) => {
    if (game.currentPlayer !== 'player') return;
    playSound(soundCard);
    try {
      const res = await fetch("http://localhost:3005/recycling/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ card }) });
      const data = await res.json();
      if (data.status === 'gameOver') { setGame(data); return; }
      if (data.error) { setModalMessage(`⚠️ ${data.error}`); } 
      else if (data.needsChoice) { setPendingChoice({ card: card, type: data.choiceType, options: data.availableOptions, message: data.message }); } 
      else {
        setGame(data);
        if (data.currentPlayer === 'player' && card.type === 'wild' && card.effect === 'skipRecycle') setModalMessage("✨ ¡Salto de Reciclaje! Tira otra carta.");
        else if (data.freePlay) setModalMessage("🌟 ¡MODO LIBRE! Tira cualquier carta.");
        else if (data.lastAction.includes("¡RECICLA!")) setModalMessage("⚠️ ¡RECICLA!");
      }
    } catch (err) { console.error(err); }
  };

  const handleChoice = async (selection) => {
    if (!pendingChoice) return;
    try {
      const body = { card: pendingChoice.card, chosenColor: pendingChoice.type === 'color' ? selection : null, chosenRecycle: pendingChoice.type === 'recycle' ? selection : null };
      const res = await fetch("http://localhost:3005/recycling/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.status === 'gameOver') { setGame(data); setPendingChoice(null); return; }
      if (data.error) { setModalMessage(`Error: ${data.error}`); } 
      else {
        setGame(data);
        setPendingChoice(null);
        if (data.freePlay) setModalMessage("🌟 ¡MODO LIBRE!");
        else if (data.lastAction.includes("¡RECICLA!")) setModalMessage("¡RECICLA!");
      }
    } catch (err) { console.error(err); }
  };

  const handleDrawCard = async () => {
    if (game.currentPlayer !== 'player') return;

    playSound(soundCard);

    const res = await fetch("http://localhost:3005/recycling/draw", { method: "POST" });
    const data = await res.json();
    if (data.status === 'gameOver') { setGame(data); return; }
    if (data.error) setModalMessage(data.error);
    else {
      setGame(data);
      if (data.consecutiveDraws >= 3) setModalMessage("⚠️ 3 cartas robadas. ¡Usa Pregunta!");
    }
  };

  const handleOpenQuestion = async () => {
    if (game.currentPlayer !== 'player') return;

    playSound(soundButton);

    if (game.freePlay) {
       const res = await fetch("http://localhost:3005/recycling/check-question-usage", { method: "POST" });
       const data = await res.json();
       if (data.status === 'gameOver') { setGame(data); return; }
       setGame(data);
       setModalMessage(`⚠️ ${data.lastAction} Vidas: ${data.lives}`);
       return;
    }
    const res = await fetch("http://localhost:3005/recycling/question");
    const data = await res.json();
    if (data.status === 'gameOver') { setGame(data); return; }
    if (data.error) {
      if (data.error.includes("Sin preguntas")) setModalMessage("Has perdido intentalo de nuevo");
      else setModalMessage(data.error);
    } else {
      setSelectedQuestion(data);
      setUserAnswer(null);
    }
  };

  const handleSubmitAnswer = async (optionIndex) => {
    if (!selectedQuestion) return;
    setUserAnswer(optionIndex);
    
    try {
      const res = await fetch("http://localhost:3005/recycling/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedQuestion.id, selectedOption: optionIndex })
      });
      const data = await res.json();
      
      if (data.status === 'gameOver') {
        setGame(data);
        return;
      }

      setGame(data);

      let msg = "";
      if (data.questionResult === 'success') {
        playSound(soundCorrect);
        msg = "✅ ¡Correcto!  MODO LIBRE ACTIVADO.";
      } else {
        // Se mantiene la lógica combinada: suena el error y muestra las vidas restantes
        playSound(soundWrong); 
        const vidasRestantes = data.lives; 
        msg = `❌ Incorrecto. Pierdes 1 vida. Te quedan: ${vidasRestantes} ❤️`;
      }
      
      setModalMessage(msg);

      setTimeout(() => { 
        setSelectedQuestion(null); 
        setModalMessage(null); 
        setFocusZone("hand"); // Regresamos el foco a la mano
      }, 3000);

    } catch (err) {
      console.error("Error al enviar respuesta:", err);
      setModalMessage("❌ Error de conexión al responder.");
    }
  };

  const canPlay = (card, topCard) => {
    if (!topCard) return true;
    if (card.type === 'wild') return true;
    if (game.freePlay) return true;
    if (game.specialRule === 'skipRecycle') {
       return (card.color === topCard.color || card.number === topCard.number);
    }
    if (card.recycle === topCard.recycle) {
       if (card.number === topCard.number) return true;
       if (card.color === topCard.color) return true;
    }
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
      
      {/* Panel de Información de Carta Actual (Diseño Original Intacto) */}
      {game.topCard && (
        <div style={{
          position: 'absolute', top: '90px', right: '20px', width: '240px',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '16px',
          padding: '20px', color: '#ffffff', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93c5fd', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', paddingBottom: '8px', fontWeight: '700' }}>♻️ Carta en Juego</h4>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>🎨 COLOR</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase', color: getColorStyle(game.topCard.color), textShadow: `0 0 10px ${getColorStyle(game.topCard.color)}66` }}>{game.topCard.color || 'Comodín'}</div>
          </div>
          {game.topCard.number && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>🔢 NÚMERO</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff', fontFamily: "'Archivo Black', sans-serif" }}>{game.topCard.number}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>♻️ RECICLAJE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', lineHeight: '1.3', color: '#e2e8f0' }}>{formatRecycleText(game.topCard.recycle)}</div>
          </div>
          {game.specialRule === 'skipRecycle' && (
            <div style={{ marginTop: '15px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px', animation: 'pulse 2s infinite' }}>⚡ Solo Color y Número</div>
          )}
        </div>
      )}

      <OpponentHand hand={game.opponentHand} hidden={true} />
      <div className="center-area">
        <div className="center-card">{game.topCard && <Card card={game.topCard} />}</div>
        <div className="controls">
          {/* 🕹️ Controles con getFocusStyle mantenido de la rama Obed-Mando */}
          <button 
            className="draw-btn" 
            onClick={() => { playSound(); handleDrawCard(); }} 
            disabled={game.currentPlayer !== 'player'}
            style={getFocusStyle(focusZone === "actions" && focusIndex === 0)}
          >
            Robar
          </button>
          <button 
            className="question-btn" 
            onClick={() => { playSound(); handleOpenQuestion(); }} 
            disabled={game.currentPlayer !== 'player' || game.questionsLeft <= 0} 
            style={{ opacity: game.freePlay ? 0.6 : 1, ...getFocusStyle(focusZone === "actions" && focusIndex === 1) }}
          >
            {game.freePlay ? "¡Modo Libre Activo!" : `Pregunta (${game.questionsLeft})`}
          </button>
        </div>
      </div>
      
      {/* 🕹️ Pasamos el focusedIndex al PlayerHand */}
      <PlayerHand 
        hand={game.playerHand} 
        topCard={game.topCard} 
        onPlay={(card) => { playSound(); handlePlayCard(card); }} 
        canPlay={canPlay} 
        currentPlayer={game.currentPlayer}
        focusedIndex={focusZone === "hand" ? focusIndex : -1} 
      />

      {pendingChoice && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'#1e293b', padding:'2rem', borderRadius:'16px', border:'1px solid #3b82f6', textAlign:'center', maxWidth:'400px', width:'90%'}}>
            <h3 style={{color:'#60a5fa', marginBottom:'1rem'}}>{pendingChoice.message}</h3>
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap', justifyContent:'center'}}>
              {pendingChoice.options.map((opt, idx) => (
                <button 
                  key={opt} 
                  onClick={() => { playSound(); handleChoice(opt); }} 
                  style={{...getFocusStyle(focusZone === "choice" && focusIndex === idx), padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', textTransform:'capitalize'}}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={() => setPendingChoice(null)} style={{marginTop:'20px', background:'transparent', border:'1px solid #ef4444', color:'#ef4444', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>Cancelar</button>
          </div>
        </div>
      )}

      {selectedQuestion && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'#1e293b', padding:'2rem', borderRadius:'16px', border:'1px solid #f59e0b', maxWidth:'500px', width:'90%', textAlign:'center'}}>
            <h3 style={{color:'#f59e0b', marginBottom:'1rem'}}>❓ {selectedQuestion.question}</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {selectedQuestion.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { playSound(); handleSubmitAnswer(idx); }} 
                  disabled={userAnswer !== null} 
                  style={{...getFocusStyle(focusZone === "question" && focusIndex === idx && userAnswer === null), padding:'12px', background: userAnswer === idx ? (idx === selectedQuestion.correct ? '#22c55e' : '#ef4444') : '#334155', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}
                >
                  {opt}
                </button>
              ))}
            </div>
            {userAnswer !== null && <p style={{marginTop:'1rem'}}>{selectedQuestion.explanation}</p>}
          </div>
        </div>
      )}

      {modalMessage && (
        <div style={{position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', background: modalMessage.includes('❌') ? '#ef4444' : (modalMessage.includes('🌟') ? '#8b5cf6' : '#f59e0b'), color:'white', padding:'12px 24px', borderRadius:'50px', zIndex:2000, fontWeight:'bold'}}>
          {modalMessage} <span onClick={()=>setModalMessage(null)} style={{marginLeft:'10px', cursor:'pointer'}}>✕</span>
        </div>
      )}

      {showRules && (
        <RulesModalRec onClose={() => setShowRules(false)} />
      )}

    </div>
  );
}