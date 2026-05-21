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
  
  // 🔥 ESTADO PROTECTOR: Evita los clics fantasma del menú
  const [canClick, setCanClick] = useState(false);
  
  // 🔥 ESTADO DE ANIMACIÓN: Asegura que el auto-volteo ocurra solo 1 vez
  const [hasAnimated, setHasAnimated] = useState(false);

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

  // 🔥 Bloqueamos las acciones del mando durante 400ms al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => setCanClick(true), 400);
    return () => clearTimeout(timer);
  }, []);

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
      setFocoEspecial("none"); 
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      playSound(soundButton);
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setFocoEspecial("none"); 
    }
  };

  /* ===== QUIZ ===== */
  const goQuiz = () => {
    playSound(soundButton);
    navigate("/quiz", { state: { theme } });
  };

  /* ===== LÓGICA DEL MANDO 🕹️ ===== */
  useMando({
    onLeft: () => {
      playSound(soundFlip); 
      setFlipped((prev) => !prev);
      setFocoEspecial("none");
    },
    onRight: () => {
      playSound(soundFlip); 
      setFlipped((prev) => !prev);
      setFocoEspecial("none");
    },
    onUp: () => setFocoEspecial("menu"),
    onDown: () => {
      if (currentIndex === data.length - 1) {
        setFocoEspecial("quiz");
      }
    },
    onButton2: () => {
      if (!canClick) return; // 🔥 Filtro anti-fantasmas

      if (focoEspecial === "menu") {
        playSound(soundButton);
        navigate("/menu");
      } else if (focoEspecial === "quiz" && currentIndex === data.length - 1) {
        goQuiz();
      } else {
        nextCard(); 
      }
    },
    onButton1: () => {
      if (!canClick) return;
      prevCard();
    }
  });

  /* ===== ANIMACION INICIAL ===== */
  useEffect(() => {
    // 🔥 Ahora solo se voltea si estamos en la primera y NUNCA se ha animado antes
    if (currentIndex === 0 && !hasAnimated) {
      setHasAnimated(true);
      const t1 = setTimeout(() => setFlipped(true), 600);
      const t2 = setTimeout(() => setFlipped(false), 1800);
      
      // Limpieza de temporizadores para evitar bugs si el usuario sale rápido
      return () => { clearTimeout(t1); clearTimeout(t2); }; 
    }
  }, [currentIndex, hasAnimated]);

  // Función para dar estilo visual al elemento enfocado por el mando
  const getFocusStyle = (target) => {
    const outlineColor = theme === "math" ? "#ff4d4d" : "#4ade80";
    return focoEspecial === target 
      ? { outline: `4px solid ${outlineColor}`, transform: "scale(1.05)", transition: "all 0.2s" } 
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
          onClick={() => {
            playSound(soundFlip);
            setFlipped(!flipped);
          }}
        >
          <div className={`flashcard ${card.id} ${flipped ? "flipped" : ""}`}>
{/* FRONT */}
            <div className="flashcard-front" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '15px', height: '100%', boxSizing: 'border-box' }}>
              
              {/* 🛠️ ARREGLO 1: Le quitamos el className="card-title" para matar el CSS rebelde */}
<h2 style={{ 
                textAlign: 'center', 
                margin: '0 0 10px 0', 
                fontSize: '2.5rem', // 🔥 Aumentado de 1.8rem a 2.5rem
                fontWeight: '900',  // 🔥 Un poco más grueso para que destaque
                color: '#ffffff',
                letterSpacing: '1px' // 🔥 Un toque de espacio entre letras para que se vea más limpio
              }}>
                {card.title}
              </h2>

              <p className="card-definition" style={{ textAlign: 'center', maxWidth: '95%', margin: '0 0 10px 0', fontSize: '1rem' }}>
                {card.definition}
              </p>

              {/* 🛠️ ARREGLO 2: Reducimos el canvas a 180x180 para que todo quepa sin empujar */}
              {card.graph && (
                <canvas
                  id={`graph-${currentIndex}`}
                  width="180"
                  height="180"
                  style={{ display: 'block', margin: '0 0 10px 0' }}
                ></canvas>
              )}

              <div className="curiosity-box" style={{ maxWidth: '95%', margin: '0', textAlign: 'center', padding: '10px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Ejemplo</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{card.curiosity}</p>
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

        <button
          onClick={nextCard}
          disabled={currentIndex === data.length - 1}
          style={focoEspecial === "none" && currentIndex !== data.length - 1 ? getFocusStyle("none") : {}}
        >
          Siguiente &gt;
        </button>

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