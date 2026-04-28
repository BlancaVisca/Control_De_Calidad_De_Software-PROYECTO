import { useState } from "react";
import "../css/RulesModal.css";

export default function RulesModalMath({ onClose }) {
  const [page, setPage] = useState(0);

  const titles = ["Reglas del juego", "Vidas, ayudas y objetivo"];

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
            <p className="rules-section-title">Cómo conectar cartas</p>
            <div className="rules-box">
              <p>Coloca una carta sobre otra si tienen relación matemática. Puedes conectar cartas por:</p>
              <ul className="rules-list">
                <li>Pendiente (m)</li>
                <li>Tipo de gráfica</li>
                <li>Ecuación equivalente</li>
              </ul>
            </div>

            <p className="rules-section-title">Ejemplo de conexión</p>
            <div className="rules-box-row">
              <div className="rules-card-img">
                <img src="/img/cartas_M/x_2.png" alt="Carta en mesa" />
                <span>Carta en mesa</span>
              </div>
              <div className="rules-card-img">
                <img src="/img/cartas_M/funcion_lineal.png" alt="Carta compatible" />
                <span>Carta compatible</span>
              </div>
            </div>
            <div className="rules-box">
<p>Ejemplo: <strong>y = x - 2</strong> es una <strong>función lineal creciente</strong>, por lo tanto conecta con cualquier carta de <strong>recta creciente</strong> o con la misma pendiente.</p>            </div>

            <hr className="rules-divider" />

            <p className="rules-section-title">Regla general</p>
            <div className="rules-box">
              <p>Recibes 7 cartas. Si no puedes conectar ninguna, roba 1 carta. Gana quien se quede sin cartas primero. Si el mazo se termina, gana quien tenga menos cartas.</p>
            </div>
          </div>
        )}

        {page === 1 && (
          <div>
            <p className="rules-section-title">Vidas</p>
            <div className="rules-box">
              <p>Tienes <strong>3 vidas</strong>. Si fallas una pregunta, pierdes una vida.</p>
            </div>

            <p className="rules-section-title">Preguntas educativas y modo libre</p>
            <div className="rules-box">
              <p>Puedes usar las preguntas educativas para activar el <strong>Modo Libre</strong>, que te permite jugar cualquier carta ese turno. Pero cuidado: si te equivocas en la pregunta, pierdes una vida.</p>
            </div>

            <hr className="rules-divider" />

            <p className="rules-section-title">Objetivo</p>
            <div className="rules-box">
              <p>Gana quien se quede sin cartas primero. Si el mazo se termina antes, gana quien tenga menos cartas. Piensa rápido y conecta correctamente.</p>
            </div>

            <p className="rules-section-title">Consejo</p>
            <div className="rules-box">
              <p>Recuerda las propiedades de cada función: pendiente, tipo de curva y forma de la ecuación. Eso es lo que determina si dos cartas conectan.</p>
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