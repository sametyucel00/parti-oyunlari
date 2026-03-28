import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainMenu from './pages/MainMenu';
import HighScores from './pages/HighScores';
import Settings from './pages/Settings';
import Credits from './pages/Credits';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import PlayerSetup from './pages/PlayerSetup';
import GamePlay from './pages/GamePlay';
import { Notification } from './components/Notification';
import ScrollToTop from './components/ScrollToTop';

function App() {
  useEffect(() => {
    const version = "1.0.1";
    if (localStorage.getItem("app_version") !== version) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("game_pool_") || key.includes("party_games_pools_"))) {
          localStorage.removeItem(key);
          i--; // Adjust index after removal
        }
      }
      localStorage.setItem("app_version", version);
    }
  }, []);

  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/games/:gameId" element={<GameDetail />} />
          <Route path="/setup/:gameId" element={<PlayerSetup />} />
          <Route path="/play/:gameId" element={<GamePlay />} />
          <Route path="/scores" element={<HighScores />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/credits" element={<Credits />} />
          {/* Catch all to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Notification />
      </Router>
    </AppProvider>
  );
}

export default App;
