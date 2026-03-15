const express = require("express");
const cors = require("cors");
const { createDeck, drawCardLogic, playCard, validateAnswer } = require("./gameEngine");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || "127.0.0.1";

let gameState = {};

// Iniciar Juego
app.post("/start", (req, res) => {
  try {
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
      lastAction: "¡Juego iniciado! Tu turno."
    };
    console.log("Juego creado correctamente");
    res.json(gameState);
  } catch (error) {
    console.error("ERROR creando juego:", error);
    res.status(500).json({ error: "Error creando juego" });
  }
});

// Jugar Carta
app.post("/play", (req, res) => {
  try {
    const { card } = req.body;
    if (!card) return res.status(400).json({ error: "Falta la carta" });

    const newState = playCard(gameState, card, "player");

    if (newState.error) {
      return res.status(400).json({ error: newState.error });
    }

    gameState = newState;

    // Si el turno pasa al oponente y el juego no terminó
    if (gameState.status !== 'gameOver' && gameState.currentPlayer === 'opponent') {
      setTimeout(() => makeOpponentMove(), 1500);
    }

    res.json(gameState);
  } catch (error) {
    console.error("Error al jugar carta:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// Robar Carta
app.post("/draw", (req, res) => {
  try {
    let stateAfterDraw = drawCardLogic(gameState, "player");
    
    // Manejo de mazo vacío
    if (stateAfterDraw.error) {
      if (gameState.discardPile && gameState.discardPile.length > 1) {
        const topCard = gameState.discardPile[0];
        const cardsToShuffle = gameState.discardPile.slice(1);
        gameState.deck = cardsToShuffle.sort(() => Math.random() - 0.5);
        gameState.discardPile = [topCard];
        stateAfterDraw = drawCardLogic(gameState, "player");
      } else {
        return res.status(400).json({ error: "No hay cartas disponibles" });
      }
    } else {
      gameState = stateAfterDraw;
    }

    gameState.consecutiveDraws = (gameState.consecutiveDraws || 0) + 1;
    gameState.lastAction = `Robaste carta (${gameState.consecutiveDraws}/3)`;

    if (gameState.consecutiveDraws >= 3) {
      gameState.lastAction = "⚠️ ¡3 cartas robadas! Usa una Pregunta Educativa.";
    }

    res.json(gameState);
  } catch (error) {
    console.error("Error al robar:", error);
    res.status(500).json({ error: "Error al robar" });
  }
});

// Obtener Pregunta
app.get("/question", (req, res) => {
  if (gameState.questionsLeft <= 0) {
    return res.status(403).json({ error: "No te quedan preguntas" });
  }
  const q = require("./gameEngine").generateQuestion();
  res.json(q);
});

// Responder Pregunta
app.post("/answer-question", (req, res) => {
  const { questionId, selectedOption } = req.body;
  const result = validateAnswer(questionId, selectedOption);
  
  if (result.error) return res.status(400).json(result);

  if (result.correct) {
    gameState.questionsLeft -= 1;
    gameState.consecutiveDraws = 0;
    gameState.lastAction = "✅ ¡Correcto! Puedes ignorar reglas en este turno (simulado).";
    // Nota: Para implementar "ignorar reglas" completamente se requeriría un flag temporal en el estado.
    // Por ahora, el usuario puede intentar jugar cualquier carta y el backend validará, 
    // pero podrías añadir un flag 'freePlay' aquí si quisieras saltar la validación en el siguiente /play.
    res.json({ ...gameState, questionResult: 'success', message: result.explanation });
  } else {
    gameState.lives -= 1;
    gameState.lastAction = "❌ Incorrecto. Pierdes una vida ❤️.";
    
    if (gameState.lives <= 0) {
      gameState.status = 'gameOver';
      gameState.winner = 'opponent';
      gameState.lastAction = "💀 Te quedaste sin vidas. ¡Perdiste!";
    }
    res.json({ ...gameState, questionResult: 'fail', message: result.explanation });
  }
});

// Estado del juego (Polling para IA)
app.get("/status", (req, res) => {
  res.json(gameState);
});

// IA Simple del Oponente
function makeOpponentMove() {
  if (gameState.status === 'gameOver') return;

  const hand = gameState.opponentHand;
  const top = gameState.topCard;
  
  // Buscar carta válida
  const validCard = hand.find(c => {
    if (c.type === 'wild') return true;
    if (c.recycle === top.recycle && c.number === top.number) return true;
    if (c.recycle === top.recycle && c.color === top.color) return true;
    return false;
  });

  if (validCard) {
    const newState = playCard(gameState, validCard, "opponent");
    if (!newState.error) {
      gameState = newState;
      console.log("IA jugó:", validCard.name);
    }
  } else {
    // IA roba
    const drawState = drawCardLogic(gameState, "opponent");
    if (!drawState.error) {
      gameState = drawState;
      gameState.lastAction = "🤖 Oponente robó una carta";
      
      // Intentar jugar la carta robada inmediatamente si es válida
      const newCard = gameState.opponentHand[gameState.opponentHand.length - 1];
      if (newCard && (newCard.type === 'wild' || newCard.recycle === top.recycle)) {
         setTimeout(() => makeOpponentMove(), 1000);
         return; 
      }
    }
  }
  
  gameState.currentPlayer = 'player';
  gameState.lastAction = "✨ Es tu turno";
}

const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor en http://${HOST}:${PORT}`);
});

process.on("SIGINT", () => { server.close(() => process.exit(0)); });
process.on("uncaughtException", (err) => console.error("Excepción:", err));