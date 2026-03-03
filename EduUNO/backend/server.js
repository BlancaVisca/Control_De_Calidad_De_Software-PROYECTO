const express = require("express");
const cors = require("cors");
const { createDeck, drawCardLogic } = require("./gameEngine");
const questions = require("./questions");

const app = express();
app.use(cors());
app.use(express.json());

const flashcards = [
  {
    id: "organic",
    title: "Orgánico",
    definition: "Residuos biodegradables de plantas y animales",
    curiosity: "El 40% de los residuos diarios son orgánicos"
  },
  {
    id: "recyclable",
    title: "Inorgánicos Reciclables",
    definition: "Materiales reutilizables como plástico o vidrio",
    curiosity: "Una botella puede tardar 450 años en degradarse"
  }
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
      drawnCards: 0
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

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});