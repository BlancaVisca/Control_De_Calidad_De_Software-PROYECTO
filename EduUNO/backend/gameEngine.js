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
  const wilds = [
    { name: 'comodin-cambiocolor', effect: 'changeColor' },
    { name: 'comodin-cambioreciclaje', effect: 'changeRecycle' },
    { name: 'comodin-mascuatro', effect: 'drawFour' },
    { name: 'comodin-saltodereciclaje', effect: 'skipRecycle' }
  ];
  wilds.forEach((w, idx) => {
    deck.push({ id: `wild-${idx}`, type: 'wild', name: w.name, effect: w.effect });
  });
  return shuffle(deck);
}

function canPlayCard(card, topCard, specialRule, freePlay) {
  if (!card || !topCard) return false;
  if (card.type === 'wild') return true;
  if (freePlay) return true;
  if (specialRule === 'skipRecycle') {
    return (card.color === topCard.color || card.number === topCard.number);
  }
  if (card.recycle === topCard.recycle && card.number === topCard.number) return true;
  if (card.recycle === topCard.recycle && card.color === topCard.color) return true;
  return false;
}

function playCard(gameState, card, playerId, chosenColor = null, chosenRecycle = null) {
  if (gameState.currentPlayer !== playerId) return { error: 'No es tu turno' };

  const playerHand = gameState[playerId === 'player' ? 'playerHand' : 'opponentHand'];
  const cardIndex = playerHand.findIndex(c => c?.id === card?.id);
  if (cardIndex === -1) return { error: 'Carta no encontrada' };

  if (!chosenColor && !chosenRecycle && card.type !== 'wild') {
     if (!canPlayCard(card, gameState.topCard, gameState.specialRule, gameState.freePlay)) {
        return { error: 'Movimiento inválido' };
     }
  }

  const newHand = [...playerHand];
  newHand.splice(cardIndex, 1);

  let message = `${playerId} jugó ${card.name}`;
  let effects = {};
  let newTopCard = { ...card };
  
  if (card.type !== 'wild') {
    effects.specialRule = null;
    effects.freePlay = false;
  }

  if (card.type === 'wild') {
    if (card.effect === 'changeColor') {
      if (!chosenColor) return { needsChoice: 'color', cardId: card.id, playerId, message: "Elige un color" };
      newTopCard.color = chosenColor;
      newTopCard.recycle = gameState.topCard.recycle; 
      message += ` cambiando color a ${chosenColor}`;
    }
    else if (card.effect === 'changeRecycle') {
      if (!chosenRecycle) return { needsChoice: 'recycle', cardId: card.id, playerId, message: "Elige reciclaje" };
      newTopCard.recycle = chosenRecycle;
      newTopCard.color = gameState.topCard.color;
      message += ` cambiando reciclaje a ${chosenRecycle}`;
    }
    else if (card.effect === 'drawFour') {
      if (!chosenColor) return { needsChoice: 'color', cardId: card.id, playerId, message: "Elige color para +4" };
      newTopCard.color = chosenColor;
      newTopCard.recycle = gameState.topCard.recycle;
      
      const nextPlayer = playerId === 'player' ? 'opponent' : 'player';
      const victimKey = nextPlayer === 'player' ? 'playerHand' : 'opponentHand';
      const cardsToDraw = gameState.deck.slice(0, 4);
      if (cardsToDraw.length > 0) {
        effects[victimKey] = [...gameState[victimKey], ...cardsToDraw];
        effects.deck = gameState.deck.slice(4);
        message += " ¡+4 Cartas!";
      } else {
        // Si no hay suficientes cartas para el +4, se roban las que haya y se acaba el juego después
        if (cardsToDraw.length > 0) {
           effects[victimKey] = [...gameState[victimKey], ...cardsToDraw];
           effects.deck = [];
        }
        message += ` ¡+${cardsToDraw.length} Cartas (Mazo agotado)!`;
      }
    }
    else if (card.effect === 'skipRecycle') {
      effects.specialRule = 'skipRecycle';
      newTopCard.color = gameState.topCard.color; 
      newTopCard.recycle = gameState.topCard.recycle;
      message += " ¡Solo importa Color y Número!";
    }
  }

  if (chosenColor) newTopCard.color = chosenColor;
  if (chosenRecycle) newTopCard.recycle = chosenRecycle;
  if (card.type === 'wild') newTopCard.type = 'wild';

  let nextPlayer;
  if (card.type === 'wild' && card.effect === 'skipRecycle') {
     nextPlayer = playerId; 
  } else {
     nextPlayer = playerId === 'player' ? 'opponent' : 'player';
  }

  if (newHand.length === 0) {
    return {
      ...gameState, ...effects,
      [playerId === 'player' ? 'playerHand' : 'opponentHand']: [],
      topCard: newTopCard,
      discardPile: [...(gameState.discardPile || []), card],
      status: 'gameOver', 
      winner: playerId,
      reason: 'empty_hand',
      lastAction: `🏆 ¡${playerId.toUpperCase()} GANA! Se quedó sin cartas.`,
      currentPlayer: nextPlayer
    };
  }

  if (newHand.length === 1) message += " → ¡RECICLA!";

  return {
    ...gameState, ...effects,
    [playerId === 'player' ? 'playerHand' : 'opponentHand']: newHand,
    topCard: newTopCard,
    discardPile: [...(gameState.discardPile || []), card],
    currentPlayer: nextPlayer,
    consecutiveDraws: 0,
    lastAction: message
  };
}

// 🔥 FUNCIÓN DE ROBAR SIN REGENERACIÓN
function drawCardLogic(gameState, playerId) {
  // Si no hay cartas en el mazo, FIN DEL JUEGO INMEDIATO
  if (!gameState.deck || gameState.deck.length === 0) {
    return { 
      error: "MAZO_VACIO_FINAL", 
      message: "El mazo se ha quedado sin cartas." 
    };
  }

  const [drawn, ...rest] = gameState.deck;
  const handKey = playerId === 'player' ? 'playerHand' : 'opponentHand';
  
  return {
    ...gameState,
    deck: rest,
    [handKey]: [...gameState[handKey], drawn],
    lastAction: `${playerId} robó carta`
  };
}

module.exports = { createDeck, canPlayCard, playCard, drawCardLogic, COLORS, RECICLES };