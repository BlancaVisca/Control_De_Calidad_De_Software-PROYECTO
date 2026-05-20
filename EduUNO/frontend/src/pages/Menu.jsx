import "../css/styles.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");

const playSound = (sound) => {
  const isMuted = localStorage.getItem("mute") === "true";
  if (isMuted) return;

  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
};

export default function Menu() {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [error, setError] = useState("");
  
  // Del main: Estado para saber si está muteado
  const [muted, setMuted] = useState(
    localStorage.getItem("mute") === "true"
  );

  // 🕹️ Estado para saber en qué opción estamos parados (0: Select, 1: Jugar, 2: Flashcards, 3: Botón de Sonido)
  const [focusedIndex, setFocusedIndex] = useState(0); 

  
  // 🕹️ Estado para saber en qué opción estamos parados (0: Select, 1: Jugar, 2: Flashcards)
  const [focusedIndex, setFocusedIndex] = useState(0); 
  
  const navigate = useNavigate();

  // Opciones de temas para iterar fácilmente con el joystick
  const temas = [
    { id: "recycling", nombre: "Separación de residuos" },
    { id: "math", nombre: "Matemáticas" }
  ];

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

  // Función auxiliar para el mute
  const toggleMute = () => {
    const newValue = !muted;
    setMuted(newValue);
    localStorage.setItem("mute", newValue);
  };

  // 🕹️ Lógica del Mando
  useMando({
    // Navegar hacia abajo
    onDown: () => {
      setFocusedIndex((prev) => Math.min(prev + 1, 3)); // Aumentamos el límite a 3 para alcanzar el botón de sonido
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
        playSound(soundButton); 
        startGame();
      } else if (focusedIndex === 2) {
        playSound(soundButton); 
        goFlashcards();
      } else if (focusedIndex === 3) {
        toggleMute(); // Usamos el joystick para cambiar el sonido
      }
    }
  });

  // Estilo visual para que el usuario sepa dónde está el foco
  const getFocusStyle = (index) => {
    return focusedIndex === index 
      ? { outline: "4px solid #4ade80", transform: "scale(1.02)", transition: "all 0.2s" } 
      : { transition: "all 0.2s" };
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
        {/* 🕹️ Le aplicamos el estilo dinámico dependiendo del focusedIndex */}
        <select
          className={`theme-dropdown ${error ? "input-error" : ""}`}
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.target.value);
            setError("");
          }}
          style={getFocusStyle(0)} 
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
          {temas.map(tema => (
            <option key={tema.id} value={tema.id}>{tema.nombre}</option>
          ))}
        </select>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="btn-primary" 
        <button 
          className="btn-primary" 
          onClick={() => {
            playSound(soundButton);
            startGame();
          }}
          style={getFocusStyle(1)}
          style={getFocusStyle(1)}
        >
          INICIAR JUEGO →
        </button>

        <button 
          className="btn-secondary" 
        <button 
          className="btn-secondary" 
          onClick={() => {
            playSound(soundButton);
            goFlashcards();
          }}
          style={getFocusStyle(2)}
          style={getFocusStyle(2)}
        >
           VER FLASHCARDS
           VER FLASHCARDS
        </button>

        {/* 🕹️ Le agregamos el getFocusStyle(3) al botón de mute */}
        <button
          className="btn-secondary"
          onClick={toggleMute}
          style={getFocusStyle(3)}
        >
          {muted ? "🔇 Sonido OFF" : "🔊 Sonido ON"}
        </button>

      </div>
    </div>
  );
}