/**
 * gameEngine.js - Motor lógico del juego ReUNOvables
 * Ubicación: EDUUNO/backend/gameEngine.js
 * 
 * ✅ Exporta funciones individuales para usar con require()
 * ✅ Compatible con CommonJS (Node.js tradicional)
 */

// 🔹 Configuración del juego
const COLORS = ['amarillo', 'azul', 'verde', 'rojo'];
const RECICLES = ['organico', 'inorganico', 'noreciclable', 'metal'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
  }
];

// 🔹 Crear mazo usando solo combinaciones con imagen disponible (36 normales + 4 comodines = 40 cartas)
function createDeck() {
  const deck = [];
  let id = 0;

  // Cartas normales: 9 números × 4 colores con reciclaje definido por los assets existentes.
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

// 🔹 Barajar con Fisher-Yates
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Validar si una carta es jugable
function canPlayCard(card, topCard) {
  if (!topCard || !card) return true;
  if (card.type === 'wild') return true;
  
  // Mismo reciclaje + mismo número
  if (card.recycle === topCard.recycle && card.number === topCard.number) {
    return true;
  }
  
  // Mismo reciclaje + mismo color
  if (card.recycle === topCard.recycle && card.color === topCard.color) {
    return true;
  }
  
  return false;
}

// 🔹 Procesar jugada de carta
function playCardLogic(gameState, card, playerId) {
  // Validar turno
  if (gameState.currentPlayer !== playerId) {
    return { error: 'No es tu turno' };
  }

  // Validar que la carta esté en la mano
  const playerHand = playerId === 'player' ? gameState.playerHand : gameState.opponentHand;
  if (!playerHand || !playerHand.some(c => c?.id === card?.id)) {
    return { error: 'Carta no está en tu mano' };
  }

  // Validar regla de juego
  if (!canPlayCard(card, gameState.topCard) && card?.type !== 'wild') {
    return { error: 'Carta no válida para jugar' };
  }

  // Remover carta de la mano
  const newHand = playerHand.filter(c => c?.id !== card?.id);

  // 🔹 Verificar victoria
  if (newHand.length === 0) {
    return {
      ...gameState,
      [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
      discardPile: [...(gameState.discardPile || []), card],
      topCard: card,
      status: 'gameOver',
      winner: playerId,
      lastAction: `${playerId} jugó ${card?.name || 'carta'} y ¡GANÓ!`
    };
  }

  // 🔹 Aplicar efectos de comodines (simplificado)
  let newTopCard = card;
  if (card?.type === 'wild') {
    newTopCard = { 
      ...card, 
      color: gameState.topCard?.color || 'amarillo',
      recycle: gameState.topCard?.recycle || 'organico'
    };
  }

  // 🔹 Actualizar estado
  return {
    ...gameState,
    [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
    discardPile: [...(gameState.discardPile || []), card],
    topCard: newTopCard,
    currentPlayer: playerId === 'player' ? 'opponent' : 'player',
    drawnCards: 0,
    lastAction: `${playerId} jugó ${card?.name || 'carta'}`
  };
}

// 🔹 Robar carta del mazo
function drawCardLogic(gameState, playerId) {
  if (!gameState.deck || gameState.deck.length === 0) {
    // 🔹 Regenerar mazo desde descarte si está vacío
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
    return { error: 'Mazo vacío y sin cartas para regenerar' };
  }

  // Extraer carta del mazo
  const [drawnCard, ...restDeck] = gameState.deck;
  
  // Agregar a la mano del jugador
  const currentHand = playerId === 'player' ? gameState.playerHand : gameState.opponentHand;
  const newHand = [...(currentHand || []), drawnCard];

  const newDrawnCount = (gameState.drawnCards || 0) + 1;

  return {
    ...gameState,
    [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
    deck: restDeck,
    drawnCards: newDrawnCount,
    lastAction: `${playerId} robó ${drawnCard?.name || 'una carta'}`
  };
}

// 🔹 Generar pregunta aleatoria
function generateQuestion() {
  const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
  return { ...QUESTIONS[randomIndex] };
}

// 🔹 Validar respuesta
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

// 🔹 Exportar funciones para usar con require()
module.exports = {
  createDeck,
  canPlayCard,
  playCardLogic,
  drawCardLogic,
  generateQuestion,
  validateAnswer,
  // Constants también disponibles si se necesitan
  COLORS,
  RECICLES,
  NUMBERS,
  WILD_CARDS,
  QUESTIONS,
  RECYCLE_BY_NUMBER_AND_COLOR
};
