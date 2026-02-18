import "../css/ejemplo.css";
import { useNavigate } from "react-router-dom";
import inicioImg from "../assets/inicio.png";

export default function Ejemplo() {
  const navigate = useNavigate();

  return (
    <div className="inicio-container">
      <h1 className="inicio-title">Edu UNO</h1>

      <img 
        src={inicioImg}
        alt="Inicio"
        className="inicio-img"
      />

      <button 
        className="inicio-btn"
        onClick={() => navigate("/")}
      >
        Ir al juego
      </button>
    </div>
  );
}
