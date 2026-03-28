const express = require("express");
const cors = require("cors");
const { createDeck, drawCardLogic, playCard, COLORS, RECICLES } = require("./gameEngine");
const questions = require("./questions");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3005;
let gameState = {};

app.post("/start", (req, res) => {
  const deck = createDeck();
  gameState = {
    playerHand: deck.splice(0, 7),
    opponentHand: deck.splice(0, 7),
    topCard: deck.pop(),
    deck,
    discardPile: [],
    currentPlayer: "player",
    consecutiveDraws: 0,
    lives: 3,
    questionsLeft: 3,
    status: 'playing',
    lastAction: "¡Inicio! Tu turno.",
    specialRule: null,
    freePlay: false,
    lastUsedQuestionTurn: -1
  };
  res.json(gameState);
});

app.post("/play", (req, res) => {
  const { card, chosenColor, chosenRecycle } = req.body;
  const result = playCard(gameState, card, "player", chosenColor, chosenRecycle);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  if (result.needsChoice) {
    return res.json({
      needsChoice: true,
      choiceType: result.needsChoice,
      cardId: result.cardId,
      message: result.message,
      availableOptions: result.needsChoice === 'color' ? COLORS : RECICLES,
      currentTurn: "player"
    });
  }

  gameState = result;
  if (!gameState.freePlay) gameState.lastUsedQuestionTurn = -1;

  if (gameState.status !== 'gameOver' && gameState.currentPlayer === 'opponent') {
    setTimeout(() => makeOpponentMove(), 1000);
  }

  res.json(gameState);
});

app.post("/draw", (req, res) => {
  let resState = drawCardLogic(gameState, "player");
  
  // DETECCIÓN DE MAZO VACÍO FINAL (SIN REGENERACIÓN)
  if (resState.error === "MAZO_VACIO_FINAL") {
    return handleEmptyDeckGameOver(res);
  }

  // Ya no hay bloque 'else' para regenerar, solo manejo de errores normales si los hubiera
  if (resState.error) {
     return handleEmptyDeckGameOver(res);
  } 
  
  gameState = resState;
  gameState.consecutiveDraws = (gameState.consecutiveDraws || 0) + 1;
  if (gameState.consecutiveDraws >= 3) {
    gameState.lastAction = "⚠️ 3 cartas robadas. ¡Usa Pregunta Educativa!";
  }
  res.json(gameState);
});

// FUNCIÓN PARA MANEJAR FIN POR MAZO VACÍO
function handleEmptyDeckGameOver(res) {
  const playerCount = gameState.playerHand.length;
  const opponentCount = gameState.opponentHand.length;
  
  let winner = '';
  let messageTitle = '';
  
  // Regla: Gana quien tenga MENOS cartas
  if (playerCount < opponentCount) {
    winner = 'player';
    messageTitle = "Ganaste";
  } else if (opponentCount < playerCount) {
    winner = 'opponent';
    messageTitle = "Perdiste :( vuelve a intentarlo";
  } else {
    // Empate técnico
    winner = 'player'; 
    messageTitle = "Ganaste"; // Damos ventaja al jugador en empate
  }

  gameState.status = 'gameOver';
  gameState.winner = winner;
  gameState.reason = 'empty_deck';
  // Mensaje compuesto para el frontend
  gameState.lastAction = messageTitle; 
  gameState.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
  
  return res.json(gameState);
}

app.get("/question", (req, res) => {
  if (gameState.freePlay) {
     return res.status(400).json({ error: "Ya estás en modo libre. ¡Juega una carta!" });
  }
  
  if (gameState.questionsLeft <= 0) {
    gameState.status = 'gameOver';
    gameState.winner = 'opponent';
    gameState.reason = 'no_questions';
    gameState.lastAction = "Has perdido intentalo de nuevo";
    return res.json(gameState);
  }
  
  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json(q);
});

app.post("/answer-question", (req, res) => {
  const { questionId, selectedOption } = req.body;
  const q = questions.find(x => x.id === questionId);
  if (!q) return res.status(400).json({error: "Inválida"});

  const isCorrect = selectedOption === q.correct;

  if (isCorrect) {
    gameState.questionsLeft--;
    gameState.consecutiveDraws = 0;
    gameState.freePlay = true;
    gameState.lastUsedQuestionTurn = Date.now();
    gameState.lastAction = "✅ ¡Correcto! MODO LIBRE: Tira cualquier carta.";
  } else {
    gameState.lives -= 1;
    gameState.lastAction = `❌ Incorrecto. Pierdes 1 vida. (${gameState.lives} restantes)`;
    
    if (gameState.lives <= 0) {
      gameState.status = 'gameOver';
      gameState.winner = 'opponent';
      gameState.reason = 'no_lives';
      gameState.lastAction = "Has perdido intentalo de nuevo";
    }
  }
  
  res.json({ ...gameState, questionResult: isCorrect ? 'success' : 'fail', explanation: q.explanation });
});

app.post("/check-question-usage", (req, res) => {
   if (gameState.freePlay) {
       gameState.lives -= 1;
       gameState.lastAction = "¡Uso indebido del comodín! Pierdes 1 vida.";
       if (gameState.lives <= 0) {
          gameState.status = 'gameOver';
          gameState.winner = 'opponent';
          gameState.reason = 'no_lives';
          gameState.lastAction = "Has perdido intentalo de nuevo";
       }
       return res.json({ allowed: false, lives: gameState.lives, status: gameState.status, lastAction: gameState.lastAction });
   }
   return res.json({ allowed: true });
});

app.get("/status", (req, res) => res.json(gameState));

function makeOpponentMove() {
  if (gameState.status === 'gameOver') return;
  if (gameState.currentPlayer !== 'opponent') return;

  const hand = gameState.opponentHand;
  const top = gameState.topCard;
  
  let playableCard = hand.find(c => {
    if (c.type === 'wild') return true;
    if (gameState.specialRule === 'skipRecycle') {
       return c.color === top.color || c.number === top.number;
    }
    if (gameState.freePlay) return true;
    return (c.recycle === top.recycle && c.number === top.number) || 
           (c.recycle === top.recycle && c.color === top.color);
  });

  if (playableCard) {
    let sendColor = null;
    let sendRecycle = null;
    let choiceMessage = "";

    if (playableCard.type === 'wild') {
       const rColor = COLORS[Math.floor(Math.random() * COLORS.length)];
       const rRecycle = RECICLES[Math.floor(Math.random() * RECICLES.length)];

       if (playableCard.effect === 'changeColor') {
         sendColor = rColor;
         choiceMessage = ` y eligió color **${rColor.toUpperCase()}**`;
       } 
       else if (playableCard.effect === 'changeRecycle') {
         sendRecycle = rRecycle;
         let recycleDisplay = rRecycle === 'noreciclable' ? 'NO RECICLABLE' : rRecycle.toUpperCase();
         choiceMessage = ` y eligió reciclaje **${recycleDisplay}**`;
       } 
       else if (playableCard.effect === 'drawFour') {
         sendColor = rColor;
         choiceMessage = ` (Color: **${rColor.toUpperCase()}**) ¡Roba 4!`;
       }
       else if (playableCard.effect === 'skipRecycle') {
         choiceMessage = " (¡Solo importa Color y Número!)";
       }
    }

    const result = playCard(gameState, playableCard, "opponent", sendColor, sendRecycle);
    
    if (!result.error && !result.needsChoice) {
      gameState = result;
      let finalMsg = `🤖 Oponente jugó ${playableCard.name}`;
      if (choiceMessage) finalMsg += choiceMessage;
      
      if (gameState.currentPlayer === 'opponent') {
        gameState.lastAction = finalMsg + " → Juega de nuevo.";
        setTimeout(makeOpponentMove, 1200);
        return;
      }
      
      gameState.lastAction = finalMsg + ". ✨ Tu turno.";
      return; 
    }
  }

  // 🔥 INTENTO DE ROBO DE IA (SIN REGENERACIÓN)
  const drawResult = drawCardLogic(gameState, "opponent");
  
  if (drawResult.error === "MAZO_VACIO_FINAL") {
    // Fin del juego por mazo vacío durante turno de IA
    const playerCount = gameState.playerHand.length;
    const opponentCount = gameState.opponentHand.length;
    
    if (opponentCount < playerCount) {
        gameState.status = 'gameOver';
        gameState.winner = 'opponent';
        gameState.reason = 'empty_deck';
        gameState.lastAction = "Perdiste :( vuelve a intentarlo";
        gameState.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
    } else {
        gameState.status = 'gameOver';
        gameState.winner = 'player';
        gameState.reason = 'empty_deck';
        gameState.lastAction = "Ganaste";
        gameState.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
    }
    return;
  }

  if (!drawResult.error) {
    gameState = drawResult;
    gameState.lastAction = "🤖 Oponente robó una carta...";
    setTimeout(makeOpponentMove, 800); 
    return;
  } else {
    // Fallback por seguridad
    gameState.status = 'gameOver';
    gameState.winner = 'player';
    gameState.reason = 'empty_deck';
    gameState.lastAction = "Ganaste";
    gameState.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
    return;
  }
}

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));