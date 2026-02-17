const colors = ["red", "green", "blue", "yellow"];
const values = ["0","1","2","3","4","5","6","7","8","9","skip","reverse","+2"];

function createDeck() {
  let deck = [];

  colors.forEach(color => {
    values.forEach(value => {
      deck.push({ color, value });
      if (value !== "0") deck.push({ color, value });
    });
  });

  // comodines
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild" });
    deck.push({ color: "wild", value: "+4" });
  }

  return shuffle(deck);
}

function shuffle(deck) {
  return deck.sort(() => Math.random() - 0.5);
}

function canPlay(card, topCard) {
  return (
    card.color === topCard.color ||
    card.value === topCard.value ||
    card.color === "wild"
  );
}

module.exports = { createDeck, canPlay };
