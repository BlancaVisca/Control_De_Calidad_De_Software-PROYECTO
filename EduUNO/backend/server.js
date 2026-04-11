const express = require("express");
const cors = require("cors");
const http = require("http"); // 🔌 Requerido para Socket.io
const { Server } = require("socket.io"); // 🔌 Requerido para Socket.io
const { SerialPort, ReadlineParser } = require("serialport"); // 🕹️ Requerido para el mando

const { createDeck, drawCardLogic, playCard, COLORS, RECICLES } = require("./gameEngine");
const questions = require("./questions");

const app = express();
// 🔌 Creamos el servidor HTTP envolviendo la app de Express
const server = http.createServer(app); 

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || "127.0.0.1";

// ===============================
// 🔌 CONFIGURACIÓN DE WEBSOCKETS
// ===============================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // El puerto de tu frontend en Vite
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Frontend (React) conectado por WebSockets:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("🔌 Frontend desconectado");
  });
});

// ===============================
// 🕹️ CONFIGURACIÓN DEL MANDO (SERIAL)
// ===============================
const PUERTO_ESP32 = "COM7"; 

const port = new SerialPort({
  path: PUERTO_ESP32,
  baudRate: 115200,
  autoOpen: true
}, (err) => {
  if (err) {
    console.log("⚠️ Error al abrir el puerto serial del mando (¿Está conectada la ESP32?):", err.message);
  }
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Cada vez que la ESP32 envía una línea por el cable, la retransmitimos a React al instante
parser.on("data", (data) => {
  // data se ve así: "U:0,D:0,L:1,R:0,B1:1,B2:0"
  io.emit("mando_estado", data); 
});

// ===============================
// LÓGICA DEL JUEGO
// ===============================
const flashcards = [
  {
    id: "organic",
    title: "Orgánico",
    definition: "Residuos biodegradables de plantas y animales",
    curiosity: "El 40% de los residuos diarios son orgánicos",
  },
  {
    id: "recyclable",
    title: "Inorgánicos Reciclables",
    definition: "Materiales reutilizables como plástico o vidrio",
    curiosity: "Una botella puede tardar 450 años en degradarse",
  },
];

app.get("/flashcards", (req, res) => {
  res.json(flashcards);
});

let gameState = {};

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
      drawnCards: 0,
      consecutiveDraws: 0,
      lives: 3,
      questionsLeft: 3,
      status: 'playing',
      lastAction: "¡Inicio! Tu turno.",
      specialRule: null,
      freePlay: false,
      lastUsedQuestionTurn: -1
    };
    console.log("Juego creado correctamente");
    res.json(gameState);
  } catch (error) {
    console.error("ERROR creando juego:", error);
    res.status(500).json({ error: "Error creando juego" });
  }
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
  try {
    let resState = drawCardLogic(gameState, "player");
    
    // DETECCIÓN DE MAZO VACÍO FINAL (SIN REGENERACIÓN)
    if (resState.error === "MAZO_VACIO_FINAL" || resState.error) {
      return handleEmptyDeckGameOver(res);
    }
    
    gameState = resState;
    gameState.consecutiveDraws = (gameState.consecutiveDraws || 0) + 1;
    if (gameState.consecutiveDraws >= 3) {
      gameState.lastAction = "⚠️ 3 cartas robadas. ¡Usa Pregunta Educativa!";
    }
    res.json(gameState);
  } catch (error) {
    console.error("Error al robar carta:", error);
    res.status(500).json({ error: "Error al robar carta" });
  }
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

// ===============================
// INICIO DEL SERVIDOR
// ===============================
// 🔌 OJO: Ahora usamos server.listen en lugar de app.listen para soportar WebSockets
server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor HTTP y WebSockets en http://${HOST}:${PORT}`);
});

server.on("error", (error) => {
  console.error("Error del servidor:", error);
});

server.on("close", () => {
  console.log("Servidor cerrado");
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  server.close(() => process.exit(0));
});

process.on("uncaughtException", (error) => {
  console.error("Excepcion no controlada:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Promesa rechazada sin catch:", reason);
});