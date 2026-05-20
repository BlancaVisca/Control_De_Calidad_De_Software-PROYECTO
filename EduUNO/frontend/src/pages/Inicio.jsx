import "../css/inicio.css";
import { useNavigate } from "react-router-dom";
import inicioImg from "../assets/inicio.png";
import { useMando } from "../hooks/useMando"; // 🕹️ Importamos el mando

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

  // 🕹️ Activamos el mando para esta pantalla
  useMando({
    // Cuando el jugador presione el Botón 2 (Confirmar) en la maquinita
    onButton2: () => {
      console.log("¡Botón detectado! Pasando al menú...");
      playSound(soundButton); // Reproducimos el sonido también con el mando
      navigate("/menu");
    }
  });

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