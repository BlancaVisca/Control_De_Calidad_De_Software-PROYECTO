const express = require("express");
const cors = require("cors");
const http = require("http"); // 🔌 Requerido para Socket.io
const { Server } = require("socket.io"); // 🔌 Requerido para Socket.io
const { SerialPort, ReadlineParser } = require("serialport"); // 🕹️ Requerido para el mando

const { createDeck, drawCardLogic } = require("./gameEngine");
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
// LÓGICA DEL JUEGO (Tu código intacto)
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
    };
    console.log("Juego creado correctamente");
    res.json(gameState);
  } catch (error) {
    console.error("ERROR creando juego:", error);
    res.status(500).json({ error: "Error creando juego" });
  }
});

app.post("/draw", (req, res) => {
  try {
    gameState = drawCardLogic(gameState, "player");
    res.json(gameState);
  } catch (error) {
    console.error("Error al robar carta:", error);
    res.status(500).json({ error: "Error al robar carta" });
  }
});

app.get("/question", (req, res) => {
  const random = questions[Math.floor(Math.random() * questions.length)];
  res.json(random);
});

// ===============================
// INICIO DEL SERVIDOR
// ===============================
// 🔌 OJO: Ahora usamos server.listen en lugar de app.listen
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