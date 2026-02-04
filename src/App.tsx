import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import GoldenEgg from "@/pages/GoldenEgg";
import HorseRacing from "@/pages/HorseRacing";
import HorseRacingJoin from "@/pages/HorseRacingJoin";
import HorseRacingGame from "@/pages/HorseRacingGame";
import Result from "@/pages/Result";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/golden-egg" element={<GoldenEgg />} />
        <Route path="/horse-racing" element={<HorseRacing />} />
        <Route path="/join/:gameId" element={<HorseRacingJoin />} />
        <Route path="/game/:gameId" element={<HorseRacingGame />} />
        <Route path="/result/:gameType" element={<Result />} />
      </Routes>
    </Router>
  );
}
