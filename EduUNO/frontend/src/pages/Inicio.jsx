import "../css/inicio.css";
import { useNavigate } from "react-router-dom";
import inicioImg from "../assets/inicio.png";

// 🔊 SONIDO
const soundButton = new Audio("/sounds/boton.mp3");

const playSound = (sound) => {
  const isMuted = localStorage.getItem("mute") === "true";
  if (isMuted) return;

  try {
    sound.currentTime = 0;
    sound.play();
  } catch (e) {}
};

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
  playSound(soundButton);
  navigate("/menu");
}}

      >
        ▶ JUGAR AHORA 
      </button>
    </div>
  );
}