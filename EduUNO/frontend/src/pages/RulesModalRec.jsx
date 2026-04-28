import { useState } from "react";
import "../css/RulesModal.css";

export default function RulesModalRec({ onClose }) {
  const [page, setPage] = useState(0);

  const titles = ["Reglas del juego", "Cartas comodín"];

  return (
    <div className="rules-overlay">
      <div className="rules-modal">

        <div className="rules-header">
          <span className="rules-page-label">Página {page + 1} de 2</span>
          <button className="rules-close" onClick={onClose}>Cerrar</button>
        </div>

        <h2 className="rules-title">{titles[page]}</h2>

        {page === 0 && (
          <div>
            <p className="rules-section-title">Reglas generales</p>
            <div className="rules-box">
              <p>Recibes 7 cartas. En tu turno, juega una que coincida en tipo de reciclaje y color o número, o usa un comodín. Si no puedes jugar, roba 1 carta. Gana quien se quede sin cartas primero.</p>
            </div>

            <p className="rules-section-title">Cartas compatibles — ejemplo</p>
            <div className="rules-box-row">
              <div className="rules-card-img">
                <img src="/img/cartas/1-amarillo-organico.jpg" alt="Carta en mesa" />
                <span>Carta en mesa</span>
              </div>
              <div className="rules-card-img">
                <img src="/img/cartas/1-verde-organico.jpg" alt="Carta compatible" />
                <span>Carta compatible</span>
              </div>
            </div>
            <div className="rules-box">
              <p>Estas dos cartas son compatibles porque comparten el mismo <strong>número</strong> y ambas son de la categoría <strong>orgánico</strong>. También puedes jugar si coinciden en color y en tipo de reciclaje.</p>
            </div>

            <hr className="rules-divider" />

            <p className="rules-section-title">Vidas y comodín especial</p>
            <div className="rules-box">
              <p>Tienes <strong>3 vidas</strong>. Si tras robar 3 cartas no puedes jugar, puedes cambiar tipo, color o número usando una vida. Pierdes una vida si fallas o vuelves a usar este beneficio.</p>
            </div>
          </div>
        )}

        {page === 1 && (
          <div>
            <p className="rules-section-title">Cartas comodín</p>
            <div className="rules-wildcard-grid">

              <div className="rules-wildcard-item">
                <div className="rules-wildcard-img">
                  <img src="/img/comodines/comodin-mascuatro.png" alt="+4" />
                </div>
                <div className="rules-wildcard-desc">
                  <strong>+4</strong>
                  <span>Cambias color y el rival roba 4 cartas.</span>
                </div>
              </div>

              <div className="rules-wildcard-item">
                <div className="rules-wildcard-img">
                  <img src="/img/comodines/comodin-cambioreciclaje.png" alt="Reciclaje" />
                </div>
                <div className="rules-wildcard-desc">
                  <strong>Reciclaje</strong>
                  <span>Cambia el tipo de reciclaje ignorando las demás reglas.</span>
                </div>
              </div>

              <div className="rules-wildcard-item">
                <div className="rules-wildcard-img">
                  <img src="/img/comodines/comodin-saltodereciclaje.png" alt="Libre" />
                </div>
                <div className="rules-wildcard-desc">
                  <strong>Libre</strong>
                  <span>Puedes jugar cualquier carta ese turno.</span>
                </div>
              </div>

              <div className="rules-wildcard-item">
                <div className="rules-wildcard-img">
                  <img src="/img/comodines/comodin-cambiocolor.png" alt="Color" />
                </div>
                <div className="rules-wildcard-desc">
                  <strong>Color</strong>
                  <span>Cambia el color activo de la partida.</span>
                </div>
              </div>

            </div>

            <div className="rules-box">
              <p>Los comodines pueden jugarse en cualquier momento de tu turno, incluso si tienes otras cartas válidas.</p>
            </div>
          </div>
        )}

        <div className="rules-nav">
          <button
            className="rules-btn"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
          >
            ← Anterior
          </button>
          <div className="rules-dots">
            <span className={`rules-dot ${page === 0 ? "active" : ""}`} />
            <span className={`rules-dot ${page === 1 ? "active" : ""}`} />
          </div>
          <button
            className="rules-btn primary"
            onClick={() => page === 1 ? onClose() : setPage(p => p + 1)}
          >
            {page === 1 ? "¡Entendido!" : "Siguiente →"}
          </button>
        </div>

      </div>
    </div>
  );
}