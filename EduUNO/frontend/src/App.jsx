import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Flashcards from "./pages/Flashcards";
import GameR from "./pages/GameR";
import Inicio from "./pages/Inicio";





function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/gameR" element={<GameR />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;