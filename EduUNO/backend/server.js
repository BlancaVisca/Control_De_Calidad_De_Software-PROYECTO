const express = require("express");
const cors = require("cors");

const { createDeck, drawCardLogic, playCard, COLORS, RECICLES } = require("./gameEngine");
const questions = require("./questions");
const db = require("./db");

const mathEngine = require("./gameEngineMath");

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






mathRouter.get("/status", (req, res) => res.json(gameStateM));



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

/* ==========================================================
   ENDPOINTS DE BASE DE DATOS
========================================================== */

// Sentencias preparadas (compiladas una sola vez)
const insertResult = db.prepare(`
  INSERT INTO quiz_results (theme, score, total, passed, created_at)
  VALUES (@theme, @score, @total, @passed, @created_at)
`);

const insertAnswer = db.prepare(`
  INSERT INTO quiz_answers (quiz_result_id, question_text, selected_index, correct_index, is_correct)
  VALUES (@quiz_result_id, @question_text, @selected_index, @correct_index, @is_correct)
`);

// Transacción: guarda resultado + todas las respuestas de forma atómica
const saveQuizResult = db.transaction((theme, score, total, answers) => {
  const passed = score >= 4 ? 1 : 0;
  const created_at = new Date().toISOString();

  const { lastInsertRowid } = insertResult.run({ theme, score, total, passed, created_at });

  for (const ans of answers) {
    insertAnswer.run({
      quiz_result_id: lastInsertRowid,
      question_text:  ans.question_text,
      selected_index: ans.selected_index,
      correct_index:  ans.correct_index,
      is_correct:     ans.selected_index === ans.correct_index ? 1 : 0
    });
  }

  return lastInsertRowid;
});

/*
  POST /quiz-result
  Body: {
    theme: "math" | "recycling",
    score: number,
    total: number,
    answers: [{ question_text, selected_index, correct_index }]
  }
*/
app.post("/quiz-result", (req, res) => {
  const { theme, score, total, answers } = req.body;

  if (!theme || score == null || !total || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  if (!["math", "recycling"].includes(theme)) {
    return res.status(400).json({ error: "Tema inválido" });
  }

  const id = saveQuizResult(theme, score, total, answers);
  res.status(201).json({ id, message: "Resultado guardado" });
});

/*
  GET /results?theme=math|recycling
  Devuelve todos los resultados con su detalle de respuestas.
*/
app.get("/results", (req, res) => {
  const { theme } = req.query;

  const results = theme
    ? db.prepare("SELECT * FROM quiz_results WHERE theme = ? ORDER BY created_at DESC").all(theme)
    : db.prepare("SELECT * FROM quiz_results ORDER BY created_at DESC").all();

  const resultIds = results.map(r => r.id);

  let answers = [];
  if (resultIds.length > 0) {
    const placeholders = resultIds.map(() => "?").join(",");
    answers = db.prepare(
      `SELECT * FROM quiz_answers WHERE quiz_result_id IN (${placeholders})`
    ).all(...resultIds);
  }

  // Agrupar respuestas por quiz_result_id
  const answersMap = {};
  for (const ans of answers) {
    if (!answersMap[ans.quiz_result_id]) answersMap[ans.quiz_result_id] = [];
    answersMap[ans.quiz_result_id].push(ans);
  }

  const data = results.map(r => ({
    ...r,
    passed: r.passed === 1,
    answers: answersMap[r.id] || []
  }));

  res.json(data);
});

/*
  GET /stats?theme=math|recycling
  Devuelve métricas agregadas para análisis de progreso.
*/
app.get("/stats", (req, res) => {
  const { theme } = req.query;
  const where = theme ? "WHERE theme = ?" : "";
  const params = theme ? [theme] : [];

  const summary = db.prepare(`
    SELECT
      COUNT(*)                          AS total_quizzes,
      ROUND(AVG(score), 2)              AS avg_score,
      ROUND(AVG(passed) * 100, 1)       AS pass_rate,
      MAX(score)                        AS best_score,
      MIN(score)                        AS worst_score
    FROM quiz_results ${where}
  `).get(...params);

  const byTheme = db.prepare(`
    SELECT
      theme,
      COUNT(*)                    AS quizzes,
      ROUND(AVG(score), 2)        AS avg_score,
      ROUND(AVG(passed) * 100, 1) AS pass_rate
    FROM quiz_results
    GROUP BY theme
  `).all();

  res.json({ summary, by_theme: byTheme });
});

app.listen(PORT, () => console.log(`Servidor unificado en puerto ${PORT}`));
