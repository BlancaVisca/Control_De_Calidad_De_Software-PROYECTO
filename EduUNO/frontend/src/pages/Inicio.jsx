import "../css/inicio.css";
import { useNavigate } from "react-router-dom";
import inicioImg from "../assets/inicio.png";

const clickSound = new Audio('/sounds/boton.mp3');

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <div className="inicio-container">
      <h1 className="inicio-title">EduUNO</h1>

      <p className="inicio-subtitle">¡ Aprende jugando !</p>

      <div className="inicio-img-wrapper">
        <img 
          src={inicioImg}
          alt="Inicio"
          className="inicio-img"
        />
      </div>

      <button 
        className="inicio-btn"
        onClick={() => {
          clickSound.currentTime = 0;
          clickSound.play();
          navigate("/menu");
        }}
      >
        ▶ JUGAR AHORA 
      </button>
    </div>
  );
}