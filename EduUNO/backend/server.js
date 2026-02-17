const express = require("express");
const cors = require("cors");
const { createDeck } = require("./gameEngine");
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

app.post("/start", (req, res) => {
  const deck = createDeck();

  gameState = {
    playerHand: deck.splice(0, 7),
    opponentHand: deck.splice(0, 7),
    topCard: deck.pop(),
    deck
  };

  res.json(gameState);
});




app.get("/question", (req, res) => {
  const random = questions[Math.floor(Math.random() * questions.length)];
  res.json(random);
});



app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
