import "../css/inicio.css";
import { useNavigate } from "react-router-dom";
import inicioImg from "../assets/inicio.png";

// 🕹️ 1. Importamos nuestro Custom Hook (Verifica que la ruta sea correcta)
import { useMando } from "../hooks/useMando"; 

export default function Inicio() {
  const navigate = useNavigate();

  // 🕹️ 2. Activamos el mando para esta pantalla
  useMando({
    // Cuando el jugador presione el Botón 1 en la maquinita, navegamos al menú
    onButton2: () => {
      console.log("¡Botón 1 detectado! Pasando al menú...");
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
        onClick={() => navigate("/menu")}
      >
        ▶ JUGAR AHORA 
      </button>
    </div>
  );
}