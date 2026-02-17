import "../css/styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const navigate = useNavigate();

  const startGame = () => {
    if (!selectedTheme) return alert("Selecciona un tema");
    alert(`¡Iniciando juego de ${selectedTheme}!`);
  };

  const goFlashcards = () => {
    if (!selectedTheme) return alert("Selecciona un tema");
    navigate("/flashcards");
  };

  return (
    <div className="container">
      <div className="recycling-icon">♻️</div>

      <h1 className="main-title">EduUNO</h1>
      <p className="subtitle">Aprende jugando</p>

      <h2 className="theme-title">Selecciona un tema:</h2>

      <select
        className="theme-dropdown"
        onChange={(e) => setSelectedTheme(e.target.value)}
      >
        <option value="">Elige un tema...</option>
        <option value="recycling">Separación de residuos</option>
        <option value="math">Matemáticas</option>
      </select>

      <div className="action-buttons">
        <button className="btn-primary" onClick={() => navigate("/game")}>
          Iniciar juego
        </button>

        <button className="btn-secondary" onClick={goFlashcards}>
          Ver flashcards
        </button>
      </div>
    </div>
  );
}
