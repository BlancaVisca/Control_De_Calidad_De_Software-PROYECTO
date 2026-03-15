/**
 * gameEngine.js - Motor lógico del juego ReUNOvables
 * Ubicación: EDUUNO/backend/gameEngine.js
 */

const COLORS = ['amarillo', 'azul', 'verde', 'rojo'];
const RECICLES = ['organico', 'inorganico', 'noreciclable', 'metal'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Mapeo exacto de tus imágenes
const RECYCLE_BY_NUMBER_AND_COLOR = {
  1: { amarillo: 'organico', azul: 'organico', verde: 'organico', rojo: 'organico' },
  2: { amarillo: 'organico', azul: 'organico', verde: 'organico', rojo: 'organico' },
  3: { amarillo: 'organico', azul: 'noreciclable', verde: 'noreciclable', rojo: 'noreciclable' },
  4: { amarillo: 'noreciclable', azul: 'noreciclable', verde: 'noreciclable', rojo: 'noreciclable' },
  5: { amarillo: 'noreciclable', azul: 'inorganico', verde: 'inorganico', rojo: 'inorganico' },
  6: { amarillo: 'noreciclable', azul: 'inorganico', verde: 'inorganico', rojo: 'inorganico' },
  7: { amarillo: 'inorganico', azul: 'metal', verde: 'metal', rojo: 'inorganico' },
  8: { amarillo: 'inorganico', azul: 'metal', verde: 'metal', rojo: 'metal' },
  9: { amarillo: 'metal', azul: 'metal', verde: 'metal', rojo: 'metal' }
};

const WILD_CARDS = [
  { name: 'comodin-cambiocolor', effect: 'changeColor' },
  { name: 'comodin-cambioreciclaje', effect: 'changeRecycle' },
  { name: 'comodin-mascuatro', effect: 'drawFour' },
  { name: 'comodin-saltodereciclaje', effect: 'skipRecycle' }
];

const QUESTIONS = [
  {
    id: 1,
    question: "¿Cuál de estos materiales es reciclaje orgánico?",
    options: ["Cáscara de plátano", "Botella PET", "Lata de aluminio", "Vidrio"],
    correct: 0,
    explanation: "Los residuos orgánicos son biodegradables como cáscaras y restos de comida."
  },
  {
    id: 2,
    question: "¿El cartón y papel van en reciclaje...?",
    options: ["Orgánico", "Inorgánico reciclable", "Inorgánico no reciclable", "Metal"],
    correct: 1,
    explanation: "El papel y cartón son materiales inorgánicos que se pueden reciclar."
  },
  {
    id: 3,
    question: "¿Cuántas vidas tienes al inicio de ReUNOvables?",
    options: ["1", "2", "3", "5"],
    correct: 2,
    explanation: "Cada jugador comienza con 3 vidas representadas por ❤️."
  },
  {
    id: 4,
    question: "¿Qué comodín hace que el siguiente jugador robe 4 cartas?",
    options: ["cambiocolor", "cambioreciclaje", "mascuatro", "saltodereciclaje"],
    correct: 2,
    explanation: "El comodín +4 obliga al siguiente jugador a tomar 4 cartas del mazo."
  },
  {
    id: 5,
    question: "¿Las botellas de vidrio son reciclables infinitamente?",
    options: ["Sí", "No, solo 3 veces", "No, se rompen", "Solo si son verdes"],
    correct: 0,
    explanation: "El vidrio es 100% reciclable infinitas veces sin perder calidad."
  }
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createDeck() {
  const deck = [];
  let id = 0;

  // Cartas normales
  for (const num of NUMBERS) {
    for (const color of COLORS) {
      const recycle = RECYCLE_BY_NUMBER_AND_COLOR[num]?.[color];
      if (!recycle) continue;
      deck.push({
        id: `card-${id++}`,
        type: 'normal',
        number: num,
        color,
        recycle,
        name: `${num}-${color}-${recycle}`
      });
    }
  }

  // Comodines
  WILD_CARDS.forEach((wild, idx) => {
    deck.push({
      id: `wild-${idx}`,
      type: 'wild',
      name: wild.name,
      effect: wild.effect
    });
  });

  return shuffle(deck);
}

// 🔹 VALIDACIÓN DE REGLAS (Tu lógica específica)
function canPlayCard(card, topCard) {
  if (!topCard || !card) return true;
  if (card.type === 'wild') return true;
  
  // Regla 1: Mismo reciclaje y mismo número
  if (card.recycle === topCard.recycle && card.number === topCard.number) return true;
  
  // Regla 2: Mismo reciclaje y mismo color
  if (card.recycle === topCard.recycle && card.color === topCard.color) return true;
  
  return false;
}

// 🔹 LÓGICA PRINCIPAL DE JUGADA
function playCard(gameState, card, playerId) {
  if (gameState.currentPlayer !== playerId) {
    return { error: 'No es tu turno' };
  }

  const playerHand = playerId === 'player' ? gameState.playerHand : gameState.opponentHand;
  const cardIndex = playerHand.findIndex(c => c?.id === card?.id);
  
  if (cardIndex === -1) return { error: 'Carta no encontrada en tu mano' };

  // Validar reglas
  if (!canPlayCard(card, gameState.topCard)) {
    return { error: 'Movimiento inválido. Debe coincidir reciclaje+número o reciclaje+color (o ser comodín).' };
  }

  // Ejecutar jugada
  const newHand = [...playerHand];
  newHand.splice(cardIndex, 1);

  let nextPlayer = playerId === 'player' ? 'opponent' : 'player';
  let message = `${playerId} jugó ${card.name}`;
  let effects = {};

  // Efectos de Comodines
  if (card.type === 'wild') {
    if (card.effect === 'drawFour') {
      const victimHandKey = nextPlayer === 'player' ? 'playerHand' : 'opponentHand';
      const victimHand = gameState[victimHandKey];
      const cardsToDraw = gameState.deck.slice(0, 4);
      
      if (cardsToDraw.length > 0) {
        effects[victimHandKey] = [...victimHand, ...cardsToDraw];
        effects.deck = gameState.deck.slice(4);
        message += " ¡+4 Cartas!";
      }
    } else if (card.effect === 'skipRecycle') {
      nextPlayer = playerId; // Repite turno
      message += " ¡Salto de turno!";
    } else {
      message += " ¡Cambio especial!";
    }
  }

  // Resetear contador de robos si se jugó carta
  effects.consecutiveDraws = 0;

  // Verificar Victoria
  if (newHand.length === 0) {
    return {
      ...gameState,
      ...effects,
      [playerId === 'player' ? 'playerHand' : 'opponentHand']: [],
      topCard: card,
      discardPile: [...(gameState.discardPile || []), card],
      status: 'gameOver',
      winner: playerId,
      lastAction: `🏆 ¡${playerId.toUpperCase()} GANA LA PARTIDA!`,
      currentPlayer: nextPlayer
    };
  }

  // Alerta "¡RECICLA!"
  if (newHand.length === 1) {
    message += " → ¡RECICLA!";
  }

  return {
    ...gameState,
    ...effects,
    [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
    topCard: card,
    discardPile: [...(gameState.discardPile || []), card],
    currentPlayer: nextPlayer,
    lastAction: message
  };
}

function drawCardLogic(gameState, playerId) {
  if (!gameState.deck || gameState.deck.length === 0) {
    if (gameState.discardPile && gameState.discardPile.length > 1) {
      const topCard = gameState.discardPile[0];
      const cardsToShuffle = gameState.discardPile.slice(1);
      const newDeck = shuffle(cardsToShuffle);
      return {
        ...gameState,
        deck: newDeck,
        discardPile: [topCard],
        lastAction: '🔄 Mazo regenerado desde descarte'
      };
    }
    return { error: 'Mazo vacío' };
  }

  const [drawnCard, ...restDeck] = gameState.deck;
  const currentHand = gameState[playerId === 'player' ? 'playerHand' : 'opponentHand'];
  const newHand = [...currentHand, drawnCard];

  return {
    ...gameState,
    [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
    deck: restDeck,
    lastAction: `${playerId} robó una carta`
  };
}

function generateQuestion() {
  const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
  return { ...QUESTIONS[randomIndex] };
}

function validateAnswer(questionId, selectedOption) {
  const question = QUESTIONS.find(q => q.id === questionId);
  if (!question) return { error: 'Pregunta no encontrada' };
  
  const isCorrect = selectedOption === question.correct;
  return {
    correct: isCorrect,
    explanation: question.explanation,
    correctAnswer: question.options[question.correct]
  };
}

module.exports = {
  createDeck,
  canPlayCard,
  playCard,
  drawCardLogic,
  generateQuestion,
  validateAnswer,
  COLORS, RECICLES, NUMBERS, WILD_CARDS, QUESTIONS, RECYCLE_BY_NUMBER_AND_COLOR
};