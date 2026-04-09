import "../css/styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");

const playSound = (sound) => {
  sound.currentTime = 0;
  sound.play();
};

export default function Menu() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    if (!selectedTheme) {
      setError("⚠️ Debes seleccionar un tema para continuar");
      return false;
    }
    setError("");
    return true;
  };

  // 🔥 CORRECCIÓN AQUÍ
  const startGame = () => {
    if (!validate()) return;

    if (selectedTheme === "math") {
      navigate("/gameM");
    } else {
      navigate("/gameR");
    }
  };

  const goFlashcards = () => {
    if (!validate()) return;

    navigate("/flashcards", {
      state: { theme: selectedTheme }
    });
  };

  return (
    <div className="home-bg">
      <div className="home-card">

        <h1 className="home-title">EduUNO</h1>
        <p className="home-subtitle">¡ Aprende jugando !</p>

        <h2 className="theme-title">Selecciona un tema:</h2>

        <select
          className={`theme-dropdown ${error ? "input-error" : ""}`}
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
        >
          <option value="" disabled hidden>
            Selecciona un tema...
          </option>

          <option value="recycling">Separación de residuos</option>
          <option value="math">Matemáticas</option>
        </select>

        {error && <div className="error-message">{error}</div>}

        <button
          className="btn-primary"
          onClick={() => {
            playSound(soundButton);
            startGame();
          }}
        >
          INICIAR JUEGO →
        </button>

        <button
          className="btn-secondary"
          onClick={() => {
            playSound(soundButton);
            goFlashcards();
          }}
        >
          VER FLASHCARDS
        </button>

      </div>
    </div>
  );
}