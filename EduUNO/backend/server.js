const express = require("express");
const cors = require("cors");
const { createDeck, drawCardLogic } = require("./gameEngine");
const questions = require("./questions");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || "127.0.0.1";

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

// ===============================
// 🎮 INICIAR JUEGO
// ===============================
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

// ===============================
// 🃏 ROBAR CARTA
// ===============================
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

const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor en http://${HOST}:${PORT}`);
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
