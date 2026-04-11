// gameEngineMath.js

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* =========================
   CREACIÓN DEL MAZO
========================= */

function createDeck() {
  let id = 0;

  const values = [

    // 📉 PENDIENTES
    "m_mayor_0","m_menor_0","m_cero","m_indefinida",
    "m_1","m_menos_1","m_2","m_menos_2","m_mayor_1","m_menor_menos_1",

    // 📘 ECUACIONES
    "y_x_mas_2","y_x_menos_3","y_menos_x_mas_1","y_menos_x_menos_2",
    "y_2x_mas_1","y_menos_2x_mas_3","y_3","y_menos_2","x_2","x_menos_3",
    "y_x_cuadrada","y_menos_x_cuadrada","y_2x_cuadrada",
    "x_cuadrada_y_cuadrada_igual_4","x_cuadrada_y_cuadrada_igual_9",

    // 🔢 VALORES
    0,1,"menos_1",2,"menos_2",3,"menos_3",4,"menos_4",5,

    // 📊 GRÁFICAS
    "recta","recta_creciente","recta_decreciente","recta_horizontal","recta_vertical",
    "funcion_lineal","parabola","parabola_up","parabola_down","funcion_cuadratica",
    "circulo","figura_cerrada","curva","funcion_creciente","funcion_decreciente"
  ];

  const deck = values.map(v => ({
    id: `math-${id++}`,
    value: v
  }));

  return shuffle(deck);
}

/* =========================
   MAPA DE RELACIONES
========================= */

const relations = {



  /* =========================
     📘 ECUACIONES LINEALES
  ========================= */

  y_x_mas_2: ["recta","recta_creciente","funcion_lineal","m_1","m_mayor_0",2],
  y_x_menos_3: ["recta","recta_creciente","funcion_lineal","m_1","m_mayor_0","menos_3"],
  
  y_menos_x_mas_1: ["recta","recta_decreciente","funcion_lineal","m_menos_1","m_menor_0",1],
  y_menos_x_menos_2: ["recta","recta_decreciente","funcion_lineal","m_menos_1","m_menor_0","menos_2"],

  y_2x_mas_1: ["recta","recta_creciente","funcion_lineal","m_2","m_mayor_1","menos_1"],
  y_menos_2x_mas_3: ["recta","recta_decreciente","funcion_lineal","m_menos_2","m_menor_menos_1","menos_3"],

  /* =========================
     📘 CONSTANTES
  ========================= */

  y_3: ["recta","recta_horizontal","funcion_lineal","m_cero",3],
  y_menos_2: ["recta","recta_horizontal","funcion_lineal","m_cero","menos_2"],

  x_2: ["recta_vertical","m_indefinida",2],
  x_menos_3: ["recta_vertical","m_indefinida","menos_3"],

  /* =========================
     🔵 CUADRÁTICAS
  ========================= */

  y_x_cuadrada: ["parabola","parabola_up","funcion_cuadratica"],
  y_menos_x_cuadrada: ["parabola","parabola_down","funcion_cuadratica"],
  y_2x_cuadrada: ["parabola","parabola_up","funcion_cuadratica"],

  /* =========================
     🟢 CÍRCULOS
  ========================= */

  x_cuadrada_y_cuadrada_igual_4: ["circulo","figura_cerrada",2],
  x_cuadrada_y_cuadrada_igual_9: ["circulo","figura_cerrada",3],

  /* =========================
     📉 PENDIENTES
  ========================= */

  m_1: ["recta","recta_creciente","funcion_lineal","y_x_mas_2","y_x_menos_3",1],
  m_menos_1: ["recta","recta_decreciente","funcion_lineal","y_menos_x_mas_1","y_menos_x_menos_2","menos_1"],
  
  m_2: ["recta","recta_creciente","funcion_lineal","y_2x_mas_1",2],
  m_menos_2: ["recta","recta_decreciente","funcion_lineal","y_menos_2x_mas_3","menos_2"],

  m_cero: ["recta_horizontal","y_3","y_menos_2"],
  m_indefinida: ["recta_vertical","x_2","x_menos_3"],

  m_mayor_0: ["recta_creciente"],
  m_menor_0: ["recta_decreciente"],
  m_mayor_1: ["recta_creciente"],
  m_menor_menos_1: ["recta_decreciente"],

  /* =========================
     📊 GRÁFICAS
  ========================= */

  recta: [
    "funcion_lineal",
    "y_x_mas_2","y_x_menos_3",
    "y_menos_x_mas_1","y_menos_x_menos_2",
    "y_2x_mas_1","y_menos_2x_mas_3"
  ],

  recta_creciente: ["m_mayor_0","m_1","m_2","m_mayor_1"],
  recta_decreciente: ["m_menor_0","m_menos_1","m_menos_2","m_menor_menos_1"],

  recta_horizontal: ["m_cero","y_3","y_menos_2"],
  recta_vertical: ["m_indefinida","x_2","x_menos_3"],

  funcion_lineal: [
    "recta",
    "y_x_mas_2","y_x_menos_3",
    "y_menos_x_mas_1","y_menos_x_menos_2",
    "y_2x_mas_1","y_menos_2x_mas_3"
  ],

  parabola: ["y_x_cuadrada","y_menos_x_cuadrada","y_2x_cuadrada"],
  parabola_up: ["y_x_cuadrada","y_2x_cuadrada"],
  parabola_down: ["y_menos_x_cuadrada"],

  funcion_cuadratica: ["y_x_cuadrada","y_menos_x_cuadrada","y_2x_cuadrada"],

  circulo: ["x_cuadrada_y_cuadrada_igual_4","x_cuadrada_y_cuadrada_igual_9"],
  figura_cerrada: ["circulo"]

};

/* =========================
   MATCH LOGIC
========================= */

function matchLogic(a, b) {
  return (
    relations[a.value]?.includes(b.value) ||
    relations[b.value]?.includes(a.value)
  );
}

/* =========================
   VALIDAR JUGADA
========================= */

function canPlayCard(card, topCard, specialRule, freePlay) {
  if (!card || !topCard) return false;

  if (freePlay) return true;

  if (card.value === topCard.value) return true;

  return matchLogic(card, topCard);
}

/* =========================
   JUGAR CARTA
========================= */

function playCard(gameState, card, playerId) {
  const handKey = playerId === "player" ? "playerHand" : "opponentHand";
  const hand = gameState[handKey];

  const index = hand.findIndex(c => c.id === card.id);
  if (index === -1) return { error: "Carta no encontrada" };

  if (!canPlayCard(card, gameState.topCard, null, gameState.freePlay)) {
    return { error: "Movimiento inválido" };
  }

  const newHand = [...hand];
  newHand.splice(index, 1);

  if (newHand.length === 0) {
    return {
      ...gameState,
      [handKey]: [],
      topCard: card,
      status: "gameOver",
      winner: playerId,
      reason: "empty_hand",
      lastAction: `🏆 ${playerId} gana`
    };
  }

  return {
    ...gameState,
    [handKey]: newHand,
    topCard: card,
    currentPlayer: playerId === "player" ? "opponent" : "player",
    lastAction: `${playerId} jugó ${card.value}`
  };
}

/* =========================
   ROBAR CARTA
========================= */

function drawCardLogic(gameState, playerId) {
  if (!gameState.deck.length) {
    return { error: "MAZO_VACIO_FINAL" };
  }

  const card = gameState.deck[0];
  const rest = gameState.deck.slice(1);

  const handKey = playerId === "player" ? "playerHand" : "opponentHand";

  return {
    ...gameState,
    deck: rest,
    [handKey]: [...gameState[handKey], card]
  };
}

module.exports = {
  createDeck,
  playCard,
  drawCardLogic,
  canPlayCard
};