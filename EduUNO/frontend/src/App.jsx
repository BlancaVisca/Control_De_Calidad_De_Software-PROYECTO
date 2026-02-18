import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Flashcards from "./pages/Flashcards";
import Game from "./pages/Game";
import Ejemplo from "./pages/Ejemplo";




<Route path="/game" element={<Game />} />

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/game" element={<Game />} />
        <Route path="/ejemplo" element={<Ejemplo />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;