const express = require("express");
const cors = require("cors");

const mathEngine = require("./gameEngineMath");
const questionsM = require("./questionsM");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3006; // 🔥 diferente puerto

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

app.listen(PORT, () => console.log(`Math server en puerto ${PORT}`));