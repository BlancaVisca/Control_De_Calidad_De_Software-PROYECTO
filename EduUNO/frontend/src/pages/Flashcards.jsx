import "../css/flashcards.css";
import { useState, useEffect } from "react";
import { flashcardsData } from "../data/flashcardsData";
import { flashcardsDataMath } from "../data/flashcardsDataMath";
import { useNavigate, useLocation } from "react-router-dom";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  
  // 🕹️ Estado para saber si el jugador seleccionó un botón especial con Arriba/Abajo
  // Puede ser: "none" (por defecto), "menu", o "quiz"
  const [focoEspecial, setFocoEspecial] = useState("none"); 

  const navigate = useNavigate();
  const location = useLocation();

  /* ===== RECIBIR THEME ===== */
  const theme = location.state?.theme || "recycling";

  /* ===== SELECCIONAR DATA ===== */
  const data = theme === "math" ? flashcardsDataMath : flashcardsData;
  const card = data[currentIndex];

  /* ===== NAVEGACION ===== */
  const nextCard = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setFocoEspecial("none"); // Reseteamos el foco al cambiar de carta
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setFocoEspecial("none"); // Reseteamos el foco al regresar
    }
  };

  /* ===== IR AL QUIZ ===== */
  const goQuiz = () => {
    navigate("/quiz", { state: { theme } });
  };

  /* ===== LÓGICA DEL MANDO 🕹️ ===== */
  useMando({
    // Izquierda o Derecha voltean la carta y devuelven el foco al centro
    onLeft: () => {
      setFlipped((prev) => !prev);
      setFocoEspecial("none");
    },
    onRight: () => {
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
    
    // Botón 1: Acción de confirmar (Depende de qué esté enfocado)
    onButton2: () => {
      if (focoEspecial === "menu") {
        navigate("/menu");
      } else if (focoEspecial === "quiz" && currentIndex === data.length - 1) {
        goQuiz();
      } else {
        nextCard(); // Acción por defecto si no hay nada más enfocado
      }
    },
    
    // Botón 2: Acción de regresar
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
    return focoEspecial === target 
      ? { outline: "4px solid #4ade80", transform: "scale(1.05)", transition: "all 0.2s" } 
      : { transition: "all 0.2s" };
  };

  return (
    <div className={`container ${theme}`}>

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

      <main className="main-content">
        <div
          className="flashcard-container"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`flashcard ${card.id} ${flipped ? "flipped" : ""}`}>
            {/* FRONT */}
            <div className="flashcard-front">
              <h2 className="card-title">{card.title}</h2>
              <p className="card-definition">{card.definition}</p>

              <div className="curiosity-box">
                <h3>¿Sabías que...?</h3>
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
          onClick={() => navigate("/menu")}
          style={getFocusStyle("menu")}
        >
          &larr; Volver al menú
        </button>
      </div>

      {/* BOTON QUIZ SOLO EN LA ULTIMA TARJETA */}
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