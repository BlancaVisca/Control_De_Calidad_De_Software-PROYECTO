const express = require("express");
const cors = require("cors");

const { createDeck, drawCardLogic, playCard, COLORS, RECICLES } = require("./gameEngine");
const questions = require("./questions");

const mathEngine = require("./gameEngineMath");
const questionsM = require("./questionsM");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3005;

/* ==========================================================
   ESTADO EN MEMORIA — uno por modo de juego
========================================================== */
let gameStateR = {};
let gameStateM = {};

/* ==========================================================
   ROUTER — RECICLAJE  (/recycling/*)
========================================================== */
const recyclingRouter = express.Router();

recyclingRouter.post("/start", (req, res) => {
  const deck = createDeck();
  gameStateR = {
    playerHand: deck.splice(0, 7),
    opponentHand: deck.splice(0, 7),
    topCard: deck.pop(),
    deck,
    discardPile: [],
    currentPlayer: "player",
    consecutiveDraws: 0,
    lives: 3,
    questionsLeft: 3,
    status: "playing",
    lastAction: "¡Inicio! Tu turno.",
    specialRule: null,
    freePlay: false,
    lastUsedQuestionTurn: -1
  };
  res.json(gameStateR);
});

recyclingRouter.post("/play", (req, res) => {
  const { card, chosenColor, chosenRecycle } = req.body;
  const result = playCard(gameStateR, card, "player", chosenColor, chosenRecycle);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  if (result.needsChoice) {
    return res.json({
      needsChoice: true,
      choiceType: result.needsChoice,
      cardId: result.cardId,
      message: result.message,
      availableOptions: result.needsChoice === "color" ? COLORS : RECICLES,
      currentTurn: "player"
    });
  }

  gameStateR = result;
  if (!gameStateR.freePlay) gameStateR.lastUsedQuestionTurn = -1;

  if (gameStateR.status !== "gameOver" && gameStateR.currentPlayer === "opponent") {
    setTimeout(() => makeOpponentMoveR(), 1000);
  }

  res.json(gameStateR);
});

recyclingRouter.post("/draw", (req, res) => {
  let resState = drawCardLogic(gameStateR, "player");

  if (resState.error === "MAZO_VACIO_FINAL") {
    return handleEmptyDeckR(res);
  }

  if (resState.error) {
    return handleEmptyDeckR(res);
  }

  gameStateR = resState;
  gameStateR.consecutiveDraws = (gameStateR.consecutiveDraws || 0) + 1;
  if (gameStateR.consecutiveDraws >= 3) {
    gameStateR.lastAction = "⚠️ 3 cartas robadas. ¡Usa Pregunta Educativa!";
  }
  res.json(gameStateR);
});

recyclingRouter.get("/question", (req, res) => {
  if (gameStateR.freePlay) {
    return res.status(400).json({ error: "Ya estás en modo libre. ¡Juega una carta!" });
  }

  if (gameStateR.questionsLeft <= 0) {
    gameStateR.status = "gameOver";
    gameStateR.winner = "opponent";
    gameStateR.reason = "no_questions";
    gameStateR.lastAction = "Has perdido intentalo de nuevo";
    return res.json(gameStateR);
  }

  const q = questions[Math.floor(Math.random() * questions.length)];
  res.json(q);
});

recyclingRouter.post("/answer-question", (req, res) => {
  const { questionId, selectedOption } = req.body;
  const q = questions.find(x => x.id === questionId);
  if (!q) return res.status(400).json({ error: "Inválida" });

  const isCorrect = selectedOption === q.correct;

  if (isCorrect) {
    gameStateR.questionsLeft--;
    gameStateR.consecutiveDraws = 0;
    gameStateR.freePlay = true;
    gameStateR.lastUsedQuestionTurn = Date.now();
    gameStateR.lastAction = "✅ ¡Correcto! MODO LIBRE: Tira cualquier carta.";
  } else {
    gameStateR.lives -= 1;
    gameStateR.lastAction = `❌ Incorrecto. Pierdes 1 vida. (${gameStateR.lives} restantes)`;

    if (gameStateR.lives <= 0) {
      gameStateR.status = "gameOver";
      gameStateR.winner = "opponent";
      gameStateR.reason = "no_lives";
      gameStateR.lastAction = "Has perdido intentalo de nuevo";
    }
  }

  res.json({ ...gameStateR, questionResult: isCorrect ? "success" : "fail", explanation: q.explanation });
});

recyclingRouter.post("/check-question-usage", (req, res) => {
  if (gameStateR.freePlay) {
    gameStateR.lives -= 1;
    gameStateR.lastAction = "¡Uso indebido del comodín! Pierdes 1 vida.";
    if (gameStateR.lives <= 0) {
      gameStateR.status = "gameOver";
      gameStateR.winner = "opponent";
      gameStateR.reason = "no_lives";
      gameStateR.lastAction = "Has perdido intentalo de nuevo";
    }
    return res.json({ allowed: false, lives: gameStateR.lives, status: gameStateR.status, lastAction: gameStateR.lastAction });
  }
  return res.json({ allowed: true });
});

recyclingRouter.get("/status", (req, res) => res.json(gameStateR));

function handleEmptyDeckR(res) {
  const playerCount = gameStateR.playerHand.length;
  const opponentCount = gameStateR.opponentHand.length;

  let winner, messageTitle;

  if (playerCount < opponentCount) {
    winner = "player";
    messageTitle = "Ganaste";
  } else if (opponentCount < playerCount) {
    winner = "opponent";
    messageTitle = "Perdiste :( vuelve a intentarlo";
  } else {
    winner = "player";
    messageTitle = "Ganaste";
  }

  gameStateR.status = "gameOver";
  gameStateR.winner = winner;
  gameStateR.reason = "empty_deck";
  gameStateR.lastAction = messageTitle;
  gameStateR.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";

  return res.json(gameStateR);
}

function makeOpponentMoveR() {
  if (gameStateR.status === "gameOver") return;
  if (gameStateR.currentPlayer !== "opponent") return;

  const hand = gameStateR.opponentHand;
  const top = gameStateR.topCard;

  let playableCard = hand.find(c => {
    if (c.type === "wild") return true;
    if (gameStateR.specialRule === "skipRecycle") {
      return c.color === top.color || c.number === top.number;
    }
    if (gameStateR.freePlay) return true;
    return (c.recycle === top.recycle && c.number === top.number) ||
           (c.recycle === top.recycle && c.color === top.color);
  });

  if (playableCard) {
    let sendColor = null;
    let sendRecycle = null;
    let choiceMessage = "";

    if (playableCard.type === "wild") {
      const rColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const rRecycle = RECICLES[Math.floor(Math.random() * RECICLES.length)];

      if (playableCard.effect === "changeColor") {
        sendColor = rColor;
        choiceMessage = ` y eligió color **${rColor.toUpperCase()}**`;
      } else if (playableCard.effect === "changeRecycle") {
        sendRecycle = rRecycle;
        const recycleDisplay = rRecycle === "noreciclable" ? "NO RECICLABLE" : rRecycle.toUpperCase();
        choiceMessage = ` y eligió reciclaje **${recycleDisplay}**`;
      } else if (playableCard.effect === "drawFour") {
        sendColor = rColor;
        choiceMessage = ` (Color: **${rColor.toUpperCase()}**) ¡Roba 4!`;
      } else if (playableCard.effect === "skipRecycle") {
        choiceMessage = " (¡Solo importa Color y Número!)";
      }
    }

    const result = playCard(gameStateR, playableCard, "opponent", sendColor, sendRecycle);

    if (!result.error && !result.needsChoice) {
      gameStateR = result;
      let finalMsg = `🤖 Oponente jugó ${playableCard.name}`;
      if (choiceMessage) finalMsg += choiceMessage;

      if (gameStateR.currentPlayer === "opponent") {
        gameStateR.lastAction = finalMsg + " → Juega de nuevo.";
        setTimeout(makeOpponentMoveR, 1200);
        return;
      }

      gameStateR.lastAction = finalMsg + ". ✨ Tu turno.";
      return;
    }
  }

  const drawResult = drawCardLogic(gameStateR, "opponent");

  if (drawResult.error === "MAZO_VACIO_FINAL") {
    const playerCount = gameStateR.playerHand.length;
    const opponentCount = gameStateR.opponentHand.length;

    if (opponentCount < playerCount) {
      gameStateR.status = "gameOver";
      gameStateR.winner = "opponent";
      gameStateR.reason = "empty_deck";
      gameStateR.lastAction = "Perdiste :( vuelve a intentarlo";
      gameStateR.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
    } else {
      gameStateR.status = "gameOver";
      gameStateR.winner = "player";
      gameStateR.reason = "empty_deck";
      gameStateR.lastAction = "Ganaste";
      gameStateR.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
    }
    return;
  }

  if (!drawResult.error) {
    gameStateR = drawResult;
    gameStateR.lastAction = "🤖 Oponente robó una carta...";
    setTimeout(makeOpponentMoveR, 800);
    return;
  } else {
    gameStateR.status = "gameOver";
    gameStateR.winner = "player";
    gameStateR.reason = "empty_deck";
    gameStateR.lastAction = "Ganaste";
    gameStateR.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
  }
}

/* ==========================================================
   ROUTER — MATEMÁTICAS  (/math/*)
========================================================== */
const mathRouter = express.Router();

mathRouter.post("/start", (req, res) => {
  const deck = mathEngine.createDeck();
  gameStateM = {
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
  res.json(gameStateM);
});

mathRouter.post("/play", (req, res) => {
  const { card } = req.body;
  const result = mathEngine.playCard(gameStateM, card, "player");

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  gameStateM = result;

  if (gameStateM.status !== "gameOver" && gameStateM.currentPlayer === "opponent") {
    setTimeout(makeOpponentMoveM, 800);
  }

  res.json(gameStateM);
});

mathRouter.post("/draw", (req, res) => {
  const result = mathEngine.drawCardLogic(gameStateM, "player");

  if (result.error === "MAZO_VACIO_FINAL") {
    return handleEmptyDeckM(res);
  }

  gameStateM = result;
  res.json(gameStateM);
});

mathRouter.get("/question", (req, res) => {
  if (gameStateM.questionsLeft <= 0) {
    gameStateM.status = "gameOver";
    gameStateM.winner = "opponent";
    gameStateM.reason = "no_questions";
    return res.json(gameStateM);
  }

  const q = questionsM[Math.floor(Math.random() * questionsM.length)];
  res.json(q);
});

mathRouter.post("/answer-question", (req, res) => {
  const { questionId, selectedOption } = req.body;
  const q = questionsM.find(x => x.id === questionId);
  if (!q) return res.status(400).json({ error: "Pregunta inválida" });

  const correct = selectedOption === q.correct;

  if (correct) {
    gameStateM.freePlay = true;
    gameStateM.questionsLeft--;
    gameStateM.lastAction = "✅ Correcto - Modo libre";
  } else {
    gameStateM.lives--;
    gameStateM.lastAction = `❌ Incorrecto (${gameStateM.lives} vidas)`;

    if (gameStateM.lives <= 0) {
      gameStateM.status = "gameOver";
      gameStateM.winner = "opponent";
    }
  }

  res.json({
    ...gameStateM,
    questionResult: correct ? "success" : "fail",
    explanation: q.explanation
  });
});

mathRouter.get("/status", (req, res) => res.json(gameStateM));

function handleEmptyDeckM(res) {
  const player = gameStateM.playerHand.length;
  const opponent = gameStateM.opponentHand.length;

  gameStateM.status = "gameOver";
  gameStateM.winner = player <= opponent ? "player" : "opponent";
  gameStateM.reason = "empty_deck";

  res.json(gameStateM);
}

function makeOpponentMoveM() {
  if (gameStateM.status === "gameOver") return;
  if (gameStateM.currentPlayer !== "opponent") return;

  const hand = gameStateM.opponentHand;
  const top = gameStateM.topCard;

  const playable = hand.find(c =>
    mathEngine.canPlayCard(c, top, null, gameStateM.freePlay)
  );

  if (playable) {
    const result = mathEngine.playCard(gameStateM, playable, "opponent");
    if (!result.error) {
      gameStateM = result;
      gameStateM.lastAction = `🤖 Oponente jugó ${playable.value}`;
    }
  } else {
    const draw = mathEngine.drawCardLogic(gameStateM, "opponent");
    if (draw.error === "MAZO_VACIO_FINAL") return;
    gameStateM = draw;
    gameStateM.lastAction = "🤖 Oponente robó carta";
  }
}

/* ==========================================================
   MONTAR ROUTERS
========================================================== */
app.use("/recycling", recyclingRouter);
app.use("/math", mathRouter);

app.listen(PORT, () => console.log(`Servidor unificado en puerto ${PORT}`));
