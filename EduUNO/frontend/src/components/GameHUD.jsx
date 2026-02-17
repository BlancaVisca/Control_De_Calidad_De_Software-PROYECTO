export default function GameHUD({ deckCount, questions }) {
  return (
    <div className="hud">
      <div className="lives">❤️ ❤️ ❤️</div>

      <div>
        <div>Cartas restantes: {deckCount}</div>
        <div>Preguntas: {questions}</div>
      </div>

      <div className="turn-banner">
        ¡Tu turno! Juega una carta o roba
      </div>
    </div>
  );
}
