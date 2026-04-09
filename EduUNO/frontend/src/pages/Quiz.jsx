import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { preguntasMath } from "../data/preguntasMath";
import { preguntasRec } from "../data/preguntasRec";

import "../css/quiz.css";

// 🔊 SONIDOS
const soundButton = new Audio("/sounds/boton.mp3");
const soundSuccess = new Audio("/sounds/correcto.mp3");
const soundFail = new Audio("/sounds/equivocacion.mp3");

// 🔊 helper
const playSound = (sound) => {
  sound.currentTime = 0;
  sound.play();
};

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();

  const theme = location.state?.theme || "recycling";

  const preguntasBase =
    theme === "math" ? preguntasMath : preguntasRec;

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const [questions] = useState(() =>
    shuffleArray(preguntasBase).slice(0, 5)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(5).fill(null));
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const selected = answers[currentIndex];
  const passed = score >= 4;

  /* ===== SELECCIONAR ===== */
  const selectOption = (index) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
  };

  /* ===== SIGUIENTE ===== */
  
    const nextQuestion = () => {
      if (selected === null) return;

      playSound(soundButton);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        finishQuiz();
      }
    };

  /* ===== REGRESAR ===== */

const prevQuestion = () => {
  if (currentIndex > 0) {
    playSound(soundButton);
    setCurrentIndex(currentIndex - 1);
  }
};

  /* ===== TERMINAR ===== */

  const finishQuiz = () => {
  let correctCount = 0;

  answers.forEach((ans, i) => {
    if (ans === questions[i].correct) correctCount++;
  });

  setScore(correctCount);
  setFinished(true);

  // 🔊 retrasamos el sonido para no romper render
  setTimeout(() => {
    if (correctCount >= 4) {
      playSound(soundSuccess);
    } else {
      playSound(soundFail);
    }
  }, 100);
};

  return (
    <div className={`quiz-container ${theme}`}>

      {/* HEADER */}
      <header className="quiz-header">
        <h1 className="quiz-title">
          {finished
            ? "Resultado"
            : "Pongamos a prueba tus conocimientos"}
        </h1>

        {!finished && (
          <span className="quiz-progress-text">
            Pregunta {currentIndex + 1} de {questions.length}
          </span>
        )}
      </header>

      {/* MAIN */}
      <main className="quiz-main">

        {!finished ? (
          <div className="quiz-card">

            <h2 className="quiz-question">
              {currentQuestion.question}
            </h2>

            <div className="quiz-options">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  className={`quiz-option ${
                    selected === i ? "selected" : ""
                  }`}
                 
                onClick={() => {
                  playSound(soundButton);
                  selectOption(i);
                }}

                >
                  {opt}
                </button>
              ))}
            </div>

            {/* CONTROLES DENTRO DEL CARD */}
            <div className="quiz-card-controls">

              <button
                className="quiz-btn secondary"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
              >
                ← Regresar
              </button>

              <button
                className="quiz-btn primary"
                onClick={nextQuestion}
                disabled={selected === null}
              >
                Siguiente →
              </button>

            </div>

          </div>
        ) : (
          <div className="quiz-card">

            <h2 className="quiz-result-title">
              {passed
                ? "🎉 ¡Estas listo para comenzar a jugar!"
                : "😅 Uys, yo creo que deberías echarle un ojo de nuevo a las flashcards"}
            </h2>

            <p className="quiz-score">
              Puntaje: {score} / {questions.length}
            </p>

            <div className="quiz-actions">

              <button
                className="quiz-btn primary"
                onClick={() =>
                  navigate(theme === "math" ? "/gameM" : "/gameR", {
                    state: { theme }
                  })
                }
              >
                Ir al juego
              </button>

              <button
                className="quiz-btn secondary"
                onClick={() =>
                  navigate("/flashcards", { state: { theme } })
                }
              >
                Ver flashcards
              </button>

            </div>

          </div>
        )}

      </main>

      {/* PROGRESO CIRCULOS */}
      {!finished && (
        <div className="quiz-pagination">
          {questions.map((_, index) => (
            <span
              key={index}
              className={`quiz-dot ${
                index === currentIndex ? "active" : ""
              } ${
                answers[index] !== null ? "answered" : ""
              }`}
            />
          ))}
        </div>
      )}

    </div>
  );
}