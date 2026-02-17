import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Flashcards from "./pages/Flashcards";
import Game from "./pages/Game";

<Route path="/game" element={<Game />} />

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
