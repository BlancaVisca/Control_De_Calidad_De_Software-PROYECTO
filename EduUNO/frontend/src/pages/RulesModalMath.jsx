import { useState, useEffect, useRef } from "react";
import "../css/RulesModal.css";

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");
const playSound = () => {
  const isMuted = localStorage.getItem("mute") === "true";
  if (isMuted) return;
  try { soundButton.currentTime = 0; soundButton.play(); } catch (e) {}
};

export default function RulesModalMath({ onClose, focusedIndex }) {
  const [page, setPage] = useState(0);
  
  // 🕹️ Referencia para controlar el scroll del modal
  const modalRef = useRef(null);

  const titles = ["Cómo se juega", "Ejemplo y consejos"];

  // 🕹️ ESCUCHADOR DE EVENTOS DEL MANDO INALÁMBRICO
  useEffect(() => {
    const handleScroll = (e) => {
      if (modalRef.current) {
        const scrollAmount = 80; // Píxeles de desplazamiento
        if (e.detail === 'down') {
          modalRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        } else if (e.detail === 'up') {
          modalRef.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        }
      }
    };

    const handlePrev = () => {
      setPage(p => Math.max(0, p - 1));
    };

    const handleNext = () => {
      setPage(p => {
        if (p === 1) { onClose(); return p; }
        return p + 1;
      });
    };

    // Suscribir los eventos del window
    window.addEventListener('modal-scroll', handleScroll);
    window.addEventListener('modal-prev', handlePrev);
    window.addEventListener('modal-next', handleNext);

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('modal-scroll', handleScroll);
      window.removeEventListener('modal-prev', handlePrev);
      window.removeEventListener('modal-next', handleNext);
    };
  }, [onClose]);

  // 🕹️ Estilo visual para los botones enfocados
  const getFocusStyle = (index) => {
    return focusedIndex === index 
      ? { outline: "4px solid #4ade80", transform: "scale(1.05)", transition: "all 0.2s", zIndex: 10 } 
      : { transition: "all 0.2s" };
  };

  return (
    <div className="rules-overlay">
      {/* 🕹️ Aplicamos la referencia y habilitamos el scroll interno */}
      <div 
        className="rules-modal"
        ref={modalRef} 
        style={{ overflowY: 'auto', maxHeight: '90vh', scrollBehavior: 'smooth' }}
      >

        <div className="rules-header">
          <span className="rules-page-label">Página {page + 1} de 2</span>
          
          {/* 🕹️ Foco 0: Cerrar */}
          <button 
            className="rules-close" 
            onClick={() => { playSound(); onClose(); }}
            style={getFocusStyle(0)}
          >
            Cerrar
          </button>
        </div>

        <h2 className="rules-title">{titles[page]}</h2>

        {page === 0 && (
          <div>

            <div className="rules-box" style={{ borderLeft: "4px solid #f0c040", background: "rgba(240,192,64,0.07)" }}>
              <p>
                Cada ronda te muestra una carta matemática — puede ser una <strong>ecuación</strong>,
                una <strong>pendiente</strong> o un <strong>tipo de recta</strong>. Tu misión es rotar
                la línea en pantalla hasta que coincida con lo que describe la carta.
              </p>
            </div>

            <p className="rules-section-title">Paso a paso</p>
            <div className="rules-box">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", minWidth: "22px", color: "#f0c040" }}>1.</span>
                  <p style={{ margin: 0 }}>
                    <strong>Observa la carta con atención.</strong> Lee si tiene una ecuación como
                    <em> y = 2x + 1</em>, solo una pendiente como <em>m = -3</em>, o describe
                    el tipo de recta, por ejemplo "decreciente". Cada detalle cambia la respuesta.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", minWidth: "22px", color: "#f0c040" }}>2.</span>
                  <p style={{ margin: 0 }}>
                    <strong>Usa los botones de rotación.</strong> Tienes tres opciones:
                    <strong> 45°</strong>, <strong>90°</strong> y <strong>180°</strong>. Cada
                    toque gira la línea en sentido de las manecillas del reloj. Puedes
                    combinarlos las veces que necesites.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", minWidth: "22px", color: "#f0c040" }}>3.</span>
                  <p style={{ margin: 0 }}>
                    <strong>Confirma cuando estés seguro.</strong> Una vez que la línea tenga
                    la orientación correcta, presiona confirmar. No hay correcciones ni segundos
                    intentos, así que piensa bien antes de responder.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontWeight: "bold", minWidth: "22px", color: "#f0c040" }}>4.</span>
                  <p style={{ margin: 0 }}>
                    <strong>Recibe tu calificación al final.</strong> La partida tiene exactamente
                    <strong> 5 cartas</strong>. Al terminar verás cuántas acertaste y ganarás de
                    <strong> 1 a 5 estrellas</strong> según tu desempeño.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

        {page === 1 && (
          <div>

            <p className="rules-section-title">Ejemplo de coincidencia</p>
            <div className="rules-box-row">
              <div className="rules-card-img">
                <img src="/img/cartas_M/reglas1.png" alt="Carta con ecuación" />
                <span>Ecuación en carta</span>
              </div>
              <div className="rules-card-img">
                <img src="/img/cartas_M/reglas2.png" alt="Línea orientada correctamente" />
                <span>Orientación correcta</span>
              </div>
            </div>

            <div className="rules-box" style={{ borderLeft: "4px solid #5ec8a0", background: "rgba(94,200,160,0.07)" }}>
              <p>
                La carta muestra la ecuación de una <strong>circunferencia</strong>. La orientación
                correcta es una línea que forma un <strong>círculo centrado en el origen</strong>.
                Identifica el tipo de curva y orienta la línea para que coincida.
              </p>
            </div>

            <hr className="rules-divider" />

            <p className="rules-section-title">Para tener en cuenta</p>
            <div className="rules-box" style={{ borderLeft: "4px solid #a78bfa", background: "rgba(167,139,250,0.07)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ margin: 0 }}>
                  <strong>Pendiente positiva</strong> — la recta sube de izquierda a derecha.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Pendiente negativa</strong> — la recta baja de izquierda a derecha.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Pendiente cero</strong> — la recta es completamente horizontal.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Pendiente indefinida</strong> — la recta es completamente vertical.
                </p>
              </div>
            </div>

          </div>
        )}

        <div className="rules-nav">
          
          {/* 🕹️ Foco 1: Anterior */}
          <button
            className="rules-btn"
            onClick={() => { playSound(); setPage(p => p - 1); }}
            disabled={page === 0}
            style={getFocusStyle(1)}
          >
            Anterior
          </button>
          
          <div className="rules-dots">
            <span className={`rules-dot ${page === 0 ? "active" : ""}`} />
            <span className={`rules-dot ${page === 1 ? "active" : ""}`} />
          </div>
          
          {/* 🕹️ Foco 2: Siguiente / Entendido */}
          <button
            className="rules-btn primary"
            onClick={() => { playSound(); page === 1 ? onClose() : setPage(p => p + 1); }}
            style={getFocusStyle(2)}
          >
            {page === 1 ? "Entendido" : "Siguiente"}
          </button>
        </div>

      </div>
    </div>
  );
}