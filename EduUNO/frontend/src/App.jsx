import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from "./pages/Menu";
import Flashcards from "./pages/Flashcards";
import GameR from "./pages/GameR";
import Inicio from "./pages/Inicio";
import Quiz from "./pages/Quiz";

function App() {
  useEffect(() => {
    const MANDO_URL = "http://172.20.48.26/joystick";
    let isProcessing = false; // "Seguro" para evitar peticiones simultáneas

    const EscanearMando = setInterval(async () => {
      // Si ya hay una petición en curso, saltamos este ciclo
      if (isProcessing) return;

      try {
        isProcessing = true;
        const respuesta = await fetch(MANDO_URL);
        const datos = await respuesta.text();

        // Buscamos los controles de navegación en el DOM
        const botones = Array.from(document.querySelectorAll('.navigation-controls button'));

        // 1. JOYSTICK DERECHA O BOTÓN ARCADE 1 -> SIGUIENTE
        if (datos.includes("RIGHT:0") || datos.includes("B1:0")) {
          console.log("Mando Obed: Acción Siguiente");
          const btnSiguiente = botones.find(b => b.innerText.includes('Siguiente'));
          
          if (btnSiguiente) {
            btnSiguiente.click();
            // Pausa táctica de 400ms para evitar saltar dos cartas (Debounce)
            await new Promise(resolve => setTimeout(resolve, 400));
          } else {
            document.querySelector('.flashcard')?.click();
          }
        }

        // 2. JOYSTICK IZQUIERDA -> ANTERIOR
        if (datos.includes("LEFT:0")) {
          console.log("Mando Obed: Acción Anterior");
          const btnAnterior = botones.find(b => b.innerText.includes('Anterior'));
          
          if (btnAnterior) {
            btnAnterior.click();
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }

      } catch (error) {
        // Log de diagnóstico para Control de Calidad
        console.warn("Señal intermitente del mando...");
      } finally {
        isProcessing = false; // Liberamos el seguro para la siguiente lectura
      }
    }, 300); // Intervalo de 250ms para estabilidad en la laptop HP

    return () => clearInterval(EscanearMando);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/gamer" element={<GameR />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;