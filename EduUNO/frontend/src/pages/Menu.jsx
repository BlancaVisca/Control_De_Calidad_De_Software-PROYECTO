import "../css/styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");

const playSound = (sound) => {
  sound.currentTime = 0;
  sound.play();
};

export default function Menu() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [error, setError] = useState("");
  
  // 🕹️ Estado para saber en qué opción estamos parados (0: Select, 1: Jugar, 2: Flashcards)
  const [focusedIndex, setFocusedIndex] = useState(0); 
  
  const navigate = useNavigate();

  // Opciones de temas para iterar fácilmente con el joystick
  const temas = [
    { id: "recycling", nombre: "Separación de residuos" },
    { id: "math", nombre: "Matemáticas" }
  ];

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

  // 🕹️ Lógica del Mando
  useMando({
    // Navegar hacia abajo
    onDown: () => {
      setFocusedIndex((prev) => Math.min(prev + 1, 2)); // No pasa del índice 2
    },
    // Navegar hacia arriba
    onUp: () => {
      setFocusedIndex((prev) => Math.max(prev - 1, 0)); // No baja del índice 0
    },
    // Cambiar tema hacia la derecha (solo si estamos parados en el Select)
    onRight: () => {
      if (focusedIndex === 0) {
        const indexActual = temas.findIndex(t => t.id === selectedTheme);
        const nuevoIndex = indexActual === -1 ? 0 : (indexActual + 1) % temas.length;
        setSelectedTheme(temas[nuevoIndex].id);
        setError(""); // Limpiamos el error si ya eligió algo
      }
    },
    // Cambiar tema hacia la izquierda
    onLeft: () => {
      if (focusedIndex === 0) {
        const indexActual = temas.findIndex(t => t.id === selectedTheme);
        const nuevoIndex = indexActual === -1 ? 0 : (indexActual - 1 + temas.length) % temas.length;
        setSelectedTheme(temas[nuevoIndex].id);
        setError("");
      }
    },
    // Confirmar acción (Enter)
    onButton2: () => {
      if (focusedIndex === 1) {
        playSound(soundButton); // Reproduce sonido al presionar el botón del arcade
        startGame();
      } else if (focusedIndex === 2) {
        playSound(soundButton); // Reproduce sonido al presionar el botón del arcade
        goFlashcards();
      }
    }
  });

  // Estilo visual para que el usuario sepa dónde está el foco
  const getFocusStyle = (index) => {
    return focusedIndex === index 
      ? { outline: "4px solid #4ade80", transform: "scale(1.02)", transition: "all 0.2s" } 
      : { transition: "all 0.2s" };
  };

  return (
    <div className="home-bg">
      <div className="home-card">

        <h1 className="home-title">EduUNO</h1>
        <p className="home-subtitle">¡ Aprende jugando !</p>

        <h2 className="theme-title">Selecciona un tema:</h2>

        {/* 🕹️ Le aplicamos el estilo dinámico dependiendo del focusedIndex */}
        <select
          className={`theme-dropdown ${error ? "input-error" : ""}`}
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.target.value);
            setError("");
          }}
          style={getFocusStyle(0)} 
        >
          <option value="" disabled hidden>
            Selecciona un tema...
          </option>
          {temas.map(tema => (
            <option key={tema.id} value={tema.id}>{tema.nombre}</option>
          ))}
        </select>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="btn-primary" 
          onClick={() => {
            playSound(soundButton);
            startGame();
          }}
          style={getFocusStyle(1)}
        >
          INICIAR JUEGO →
        </button>

        <button 
          className="btn-secondary" 
          onClick={() => {
            playSound(soundButton);
            goFlashcards();
          }}
          style={getFocusStyle(2)}
        >
           VER FLASHCARDS
        </button>

      </div>
    </div>
  );
}