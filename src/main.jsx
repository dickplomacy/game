import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './MainMenu.jsx';
import NewGame from './NewGame.jsx';
import JoinGame from './JoinGame.jsx';
import About from './About.jsx';
import GameBoard from './GameBoard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new" element={<NewGame />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/about" element={<About />} />
        <Route path="/:gameCode/:playerToken" element={<GameBoard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
