const express = require("express");
const cors = require("cors");
const http = require("http"); // 🔌 Requerido para Socket.io
const { Server } = require("socket.io"); // 🔌 Requerido para Socket.io
const { SerialPort, ReadlineParser } = require("serialport"); // 🕹️ Requerido para el mando
const dgram = require('dgram');
const udpServer = dgram.createSocket('udp4');

// Escuchamos en el mismo puerto que definimos en Arduino
udpServer.on('message', (msg, rinfo) => {
  const data = msg.toString();
  // Retransmitimos a React por el WebSocket que ya tenemos
  io.emit("mando_estado", data); 
});

udpServer.bind(4210); 
console.log("📡 Servidor UDP escuchando para el mando inalámbrico");

const mathEngine = require("./gameEngineMath");
const questionsM = require("./questionsM");

const app = express();
// 🔌 Creamos el servidor HTTP envolviendo la app de Express
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const PORT = 3006; // 🔥 diferente puerto
const HOST = "127.0.0.1";

// ===============================
// 🔌 CONFIGURACIÓN DE WEBSOCKETS
// ===============================
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Frontend conectado a Math Server por WebSockets:", socket.id);
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
    console.log("⚠️ Error al abrir COM7 en serverM (¿Está en uso por el otro server?):", err.message);
  }
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on("data", (data) => {
  io.emit("mando_estado", data); 
});

let gameState = {};

/* =========================
   START
========================= */
app.post("/start", (req, res) => {
  const deck = mathEngine.createDeck();

  gameState = {
    playerHand: deck.splice(0, 7),
    opponentHand: deck.splice(0, 7),
    topCard: deck.pop(),
    deck,
    currentPlayer: "player",
    status: "playing",
    lives: 3,
    questionsLeft: 3,
    freePlay: false,
    lastAction: "¡Inicio! Tu turno."
  };

  res.json(gameState);
});

/* =========================
   PLAY
========================= */
app.post("/play", (req, res) => {
  const { card } = req.body;

  const result = mathEngine.playCard(gameState, card, "player");

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  gameState = result;

  // turno del oponente
  if (gameState.status !== "gameOver" && gameState.currentPlayer === "opponent") {
    setTimeout(makeOpponentMove, 800);
  }

  res.json(gameState);
});

/* =========================
   DRAW
========================= */
app.post("/draw", (req, res) => {
  const result = mathEngine.drawCardLogic(gameState, "player");

  if (result.error === "MAZO_VACIO_FINAL") {
    return handleEmptyDeck(res);
  }

  gameState = result;
  res.json(gameState);
});

/* =========================
   QUESTIONS
========================= */
app.get("/question", (req, res) => {
  if (gameState.questionsLeft <= 0) {
    gameState.status = "gameOver";
    gameState.winner = "opponent";
    gameState.reason = "no_questions";
    return res.json(gameState);
  }

  const q = questionsM[Math.floor(Math.random() * questionsM.length)];
  res.json(q);
});

app.post("/answer-question", (req, res) => {
  const { questionId, selectedOption } = req.body;

  const q = questionsM.find(x => x.id === questionId);
  if (!q) return res.status(400).json({ error: "Pregunta inválida" });

  const correct = selectedOption === q.correct;

  if (correct) {
    gameState.freePlay = true;
    gameState.questionsLeft--;
    gameState.lastAction = "✅ Correcto - Modo libre";
  } else {
    gameState.lives--;
    gameState.lastAction = `❌ Incorrecto (${gameState.lives} vidas)`;

    if (gameState.lives <= 0) {
      gameState.status = "gameOver";
      gameState.winner = "opponent";
    }
  }

  res.json({
    ...gameState,
    questionResult: correct ? "success" : "fail",
    explanation: q.explanation
  });
});

/* =========================
   OPONENTE
========================= */
function makeOpponentMove() {
  if (gameState.status === "gameOver") return;
  if (gameState.currentPlayer !== "opponent") return;

  const hand = gameState.opponentHand;
  const top = gameState.topCard;

  const playable = hand.find(c =>
    mathEngine.canPlayCard(c, top, null, gameState.freePlay)
  );

  if (playable) {
    const result = mathEngine.playCard(gameState, playable, "opponent");

    if (!result.error) {
      gameState = result;
      gameState.lastAction = `🤖 Oponente jugó ${playable.value}`;
    }
  } else {
    const draw = mathEngine.drawCardLogic(gameState, "opponent");

    if (draw.error === "MAZO_VACIO_FINAL") return;

    gameState = draw;
    gameState.lastAction = "🤖 Oponente robó carta";
  }
}

/* =========================
   FIN MAZO
========================= */
function handleEmptyDeck(res) {
  const player = gameState.playerHand.length;
  const opponent = gameState.opponentHand.length;

  gameState.status = "gameOver";
  gameState.winner = player <= opponent ? "player" : "opponent";
  gameState.reason = "empty_deck";

  res.json(gameState);
}

/* =========================
   STATUS
========================= */
app.get("/status", (req, res) => res.json(gameState));

// 🔌 server.listen en lugar de app.listen
server.listen(PORT, () => console.log(`🚀 Math server con WebSockets en http://${HOST}:${PORT}`));

// Control de cierres
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));