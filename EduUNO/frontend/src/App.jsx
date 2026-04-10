import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Menu from "./pages/Menu";
import Flashcards from "./pages/Flashcards";
import GameR from "./pages/GameR";
import Inicio from "./pages/Inicio";
import Quiz from "./pages/Quiz";

function App() {
  // 🧹 ¡Adiós al setInterval y al fetch! 
  // Ahora cada componente usará el hook useMando internamente.
  
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