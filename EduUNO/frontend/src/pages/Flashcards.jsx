import "../css/flashcards.css";
import { useState, useEffect } from "react";
import { flashcardsData } from "../data/flashcardsData";
import { flashcardsDataMath } from "../data/flashcardsDataMath";
import { useNavigate, useLocation } from "react-router-dom";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando

// 🔊 SONIDOS
const soundFlip = new Audio("/sounds/flash.mp3");
const soundButton = new Audio("/sounds/boton.mp3");

const playSound = (sound) => {
  const isMuted = localStorage.getItem("mute") === "true";
  if (isMuted) return;

  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
};

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // 🕹️ Estado para saber si el jugador seleccionó un botón especial con Arriba/Abajo
  // Puede ser: "none" (por defecto), "menu", o "quiz"
  const [focoEspecial, setFocoEspecial] = useState("none"); 

  const navigate = useNavigate();
  const location = useLocation();

  /* ===== THEME ===== */
  const theme = location.state?.theme || "recycling";

  /* ===== DATA ===== */
  const data = theme === "math" ? flashcardsDataMath : flashcardsData;
  const card = data[currentIndex];

  /* ===== GRAFICAS DINAMICAS ===== */
  useEffect(() => {
    const canvas = document.getElementById(`graph-${currentIndex}`);
    if (!canvas || !card.graph) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Ejes
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.strokeStyle = "#888";
    ctx.stroke();

    ctx.strokeStyle = "red";

    /* ===== LINEAL ===== */
    if (card.graph.type === "linear") {
      const { m, b } = card.graph;

      ctx.beginPath();
      for (let x = -10; x <= 10; x++) {
        let y = m * x + b;
        let px = w / 2 + x * 10;
        let py = h / 2 - y * 10;

        if (x === -10) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    /* ===== PARABOLA ===== */
    if (card.graph.type === "parabola") {
      const { a } = card.graph;

      ctx.beginPath();
      for (let x = -10; x <= 10; x++) {
        let y = a * x * x;
        let px = w / 2 + x * 10;
        let py = h / 2 - y * 5;

        if (x === -10) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    /* ===== CIRCULO ===== */
    if (card.graph.type === "circle") {
      const { r } = card.graph;

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r * 20, 0, Math.PI * 2);
      ctx.stroke();
    }

  }, [currentIndex, flipped, card]);

  /* ===== NAVEGACION ===== */
  const nextCard = () => {
    if (currentIndex < data.length - 1) {
      playSound(soundButton);
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setFocoEspecial("none"); // Reseteamos el foco al cambiar de carta
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      playSound(soundButton);
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setFocoEspecial("none"); // Reseteamos el foco al regresar
    }
  };

  /* ===== QUIZ ===== */
  const goQuiz = () => {
    playSound(soundButton);
    navigate("/quiz", { state: { theme } });
  };

  /* ===== LÓGICA DEL MANDO 🕹️ ===== */
  useMando({
    // Izquierda o Derecha voltean la carta y devuelven el foco al centro
    onLeft: () => {
      playSound(soundFlip); // Agregamos el sonido al mando
      setFlipped((prev) => !prev);
      setFocoEspecial("none");
    },
    onRight: () => {
      playSound(soundFlip); // Agregamos el sonido al mando
      setFlipped((prev) => !prev);
      setFocoEspecial("none");
    },
    // Arriba selecciona el botón de Volver al menú
    onUp: () => setFocoEspecial("menu"),
    
    // Abajo selecciona el botón de Quiz (solo si estamos en la última carta)
    onDown: () => {
      if (currentIndex === data.length - 1) {
        setFocoEspecial("quiz");
      }
    },
    
    // Botón 2: Acción de confirmar (Depende de qué esté enfocado)
    onButton2: () => {
      if (focoEspecial === "menu") {
        playSound(soundButton);
        navigate("/menu");
      } else if (focoEspecial === "quiz" && currentIndex === data.length - 1) {
        goQuiz();
      } else {
        nextCard(); // Acción por defecto si no hay nada más enfocado
      }
    },
    
    // Botón 1: Acción de regresar
    onButton1: () => prevCard()
  });

  /* ===== ANIMACION INICIAL ===== */
  useEffect(() => {
    if (currentIndex === 0) {
      setTimeout(() => setFlipped(true), 600);
      setTimeout(() => setFlipped(false), 1800);
    }
  }, [currentIndex]);

  // Función para dar estilo visual al elemento enfocado por el mando
const getFocusStyle = (target) => {
  const outlineColor = theme === "math" ? "#ff4d4d" : "#4ade80";
  return focoEspecial === target 
    ? { outline: `4px solid ${outlineColor}`, transform: "scale(1.05)", transition: "all 0.2s" } 
    : { transition: "all 0.2s" };
};

  return (
    <div className={`container ${theme}`}>

      {/* HEADER */}
      <header className="header">
        <h1 className="header-title">
          {theme === "math"
            ? "Aprende Matemáticas"
            : "Aprende sobre Separación de Residuos"}
        </h1>

        <span className="progress-text">
          Tarjeta {currentIndex + 1} de {data.length}
        </span>

        <span className="instruction">
          (Mueve izquierda/derecha para voltear)
        </span>
      </header>

      {/* MAIN */}
      <main className="main-content">
        <div
          className="flashcard-container"
          onClick={() => {
            playSound(soundFlip);
            setFlipped(!flipped);
          }}
        >
          <div className={`flashcard ${card.id} ${flipped ? "flipped" : ""}`}>
            {/* FRONT */}
            <div className="flashcard-front">
              <h2 className="card-title">{card.title}</h2>

              <p className="card-definition">{card.definition}</p>

              {/* GRAFICA EN FRONT */}
              {card.graph && (
                <canvas
                  id={`graph-${currentIndex}`}
                  width="250"
                  height="250"
                ></canvas>
              )}

              <div className="curiosity-box">
                <h3>Ejemplo</h3>
                <p>{card.curiosity}</p>
              </div>
            </div>

            {/* BACK */}
            <div className="flashcard-back">
              <h2>{card.backContent.title}</h2>
              <p>{card.backContent.text}</p>

              <ul>
                {card.backContent.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* PAGINACION */}
      <div className="pagination">
        {data.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
          />
        ))}
      </div>

      {/* CONTROLES */}
      <div className="navigation-controls">
        <button onClick={prevCard} disabled={currentIndex === 0}>
          &lt; Anterior
        </button>

        {/* 🕹️ Le damos el foco visual de "Siguiente" cuando nada especial está enfocado */}
        <button
          onClick={nextCard}
          disabled={currentIndex === data.length - 1}
          style={focoEspecial === "none" && currentIndex !== data.length - 1 ? getFocusStyle("none") : {}}
        >
          Siguiente &gt;
        </button>

        {/* 🕹️ Foco visual para Volver al menú */}
        <button
          className="back-menu-btn"
          onClick={() => {
            playSound(soundButton);
            navigate("/menu");
          }}
          style={getFocusStyle("menu")}
        >
          &larr; Volver al menú
        </button>
      </div>

      {/* QUIZ */}
      {currentIndex === data.length - 1 && (
        <div className="quiz-start-container">
          <button
            className="quiz-start-btn"
            onClick={goQuiz}
            style={getFocusStyle("quiz")}
          >
            Iniciar cuestionario →
          </button>
        </div>
      )}

    </div>
  );
}