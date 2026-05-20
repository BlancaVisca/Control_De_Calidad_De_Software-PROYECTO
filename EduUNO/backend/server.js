const express = require("express");
const cors = require("cors");
const http = require("http"); // 🔌 Requerido para Socket.io
const { Server } = require("socket.io"); // 🔌 Requerido para Socket.io
const { SerialPort, ReadlineParser } = require("serialport"); // 🕹️ Requerido para el mando por cable
const dgram = require('dgram'); // 📡 Requerido para el mando por WiFi

const { createDeck, drawCardLogic, playCard, COLORS, RECICLES } = require("./gameEngine");
const questions = require("./questions");
const db = require("./db");

const mathEngine = require("./gameEngineMath");
const questionsM = require("./questionsM"); // Restaurado para el juego de matemáticas

const app = express();
// 🔌 Creamos el servidor HTTP envolviendo la app de Express
const server = http.createServer(app); 

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || "127.0.0.1";

/* ==========================================================
   🔌 CONFIGURACIÓN DE WEBSOCKETS (REACT)
========================================================== */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Frontend (React) conectado por WebSockets:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Frontend desconectado");
  });
});

/* ==========================================================
   📡 CONFIGURACIÓN UDP (MANDO WIFI)
========================================================== */
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
  const data = msg.toString();
  // Retransmitimos a React por el WebSocket
  io.emit("mando_estado", data); 
});

udpServer.bind(4210, '0.0.0.0'); 
console.log("📡 Servidor UDP escuchando para el mando inalámbrico");

/* ==========================================================
   🕹️ CONFIGURACIÓN DEL MANDO (SERIAL - Backup por cable)
========================================================== */
const PUERTO_ESP32 = "COM7"; 

const port = new SerialPort({
  path: PUERTO_ESP32,
  baudRate: 115200,
  autoOpen: true
}, (err) => {
  if (err) {
    console.log("⚠️ Info: Cable serial no detectado (Ignorar si se usa WiFi).");
  }
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on("data", (data) => {
  io.emit("mando_estado", data); 
});

/* ==========================================================
   ESTADO EN MEMORIA — uno por modo de juego
========================================================== */
let gameStateR = {};
let gameStateM = {};

/* ==========================================================
   FLASHCARDS (Ruta global)
========================================================== */
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

/* ==========================================================
   ♻️ ROUTER — RECICLAJE  (/recycling/*)
========================================================== */
const recyclingRouter = express.Router();

function handleEmptyDeckR(res) {
  const playerCount = gameStateR.playerHand.length;
  const opponentCount = gameStateR.opponentHand.length;
  gameStateR.status = "gameOver";
  gameStateR.winner = opponentCount < playerCount ? "opponent" : "player";
  gameStateR.reason = "empty_deck";
  gameStateR.lastAction = gameStateR.winner === "player" ? "Ganaste" : "Perdiste :( vuelve a intentarlo";
  gameStateR.endMessageSub = "Partida finalizada, el mazo se ha quedado sin cartas";
  return res.json(gameStateR);
}

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

  if (resState.error === "MAZO_VACIO_FINAL" || resState.error) {
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
   🔢 ROUTER — MATEMÁTICAS  (/math/*)
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

  if (result.error) return res.status(400).json({ error: result.error });
  gameStateM = result;

  if (gameStateM.status !== "gameOver" && gameStateM.currentPlayer === "opponent") {
    setTimeout(makeOpponentMoveM, 800);
  }
  res.json(gameStateM);
});

mathRouter.post("/draw", (req, res) => {
  const result = mathEngine.drawCardLogic(gameStateM, "player");

  if (result.error === "MAZO_VACIO_FINAL") {
    const player = gameStateM.playerHand.length;
    const opponent = gameStateM.opponentHand.length;
    gameStateM.status = "gameOver";
    gameStateM.winner = player <= opponent ? "player" : "opponent";
    gameStateM.reason = "empty_deck";
    return res.json(gameStateM);
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
   ENDPOINTS DE BASE DE DATOS (SQlite)
========================================================== */
const insertResult = db.prepare(`
  INSERT INTO quiz_results (theme, score, total, passed, created_at)
  VALUES (@theme, @score, @total, @passed, @created_at)
`);

const insertAnswer = db.prepare(`
  INSERT INTO quiz_answers (quiz_result_id, question_text, selected_index, correct_index, is_correct)
  VALUES (@quiz_result_id, @question_text, @selected_index, @correct_index, @is_correct)
`);

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

app.post("/quiz-result", (req, res) => {
  const { theme, score, total, answers } = req.body;
  if (!theme || score == null || !total || !Array.isArray(answers)) return res.status(400).json({ error: "Datos incompletos" });
  if (!["math", "recycling"].includes(theme)) return res.status(400).json({ error: "Tema inválido" });
  
  const id = saveQuizResult(theme, score, total, answers);
  res.status(201).json({ id, message: "Resultado guardado" });
});

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

/* ==========================================================
   INICIO DEL SERVIDOR UNIFICADO (HTTP + WebSockets)
========================================================== */
server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor HTTP y WebSockets unificado en http://${HOST}:${PORT}`);
});

server.on("error", (error) => {
  console.error("Error del servidor:", error);
});

process.on("SIGINT", () => {
  console.log("SIGINT recibido, cerrando servidor...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM recibido, cerrando servidor...");
  server.close(() => process.exit(0));
});