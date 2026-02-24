import "../css/flashcards.css";
import { useState, useEffect } from "react";
import { flashcardsData } from "../data/flashcardsData";
import { useNavigate } from "react-router-dom";



export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  const card = flashcardsData[currentIndex];

  const nextCard = () => {
    if (currentIndex < flashcardsData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  useEffect(() => {
  if (currentIndex === 0) {
    setTimeout(() => setFlipped(true), 600);
    setTimeout(() => setFlipped(false), 1800);
  }
}, [currentIndex]);
 
  return (
    <div className="container">
      <header className="header">
     

        <h1 className="header-title">
          Aprende sobre Separación de Residuos
        </h1>

        <span className="progress-text">
          Tarjeta {currentIndex + 1} de {flashcardsData.length}
        </span>

        <span className="instruction">
          (Da click sobre la tarjeta)
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
      
      <div className="pagination">
        {flashcardsData.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
          />
        ))}
      </div>


      <div className="navigation-controls">
        <button onClick={prevCard} disabled={currentIndex === 0}>
          &lt; Anterior
        </button>

        <button
          onClick={nextCard}
          disabled={currentIndex === flashcardsData.length - 1}
        >
          Siguiente &gt;
        </button>

        <button className="back-menu-btn" onClick={() => navigate("/menu")}>
           &larr; Volver al menú
        </button>
      </div>
    </div>
  );
}
