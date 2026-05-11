import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getGame, getRoleForToken } from './gameService';
import App from './App.jsx';

export default function GameBoard() {
  const { gameCode, playerToken } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'invalid' | 'ready'
  const [role, setRole] = useState(null);

  useEffect(() => {
    getGame(gameCode).then(game => {
      if (!game) { setStatus('invalid'); return; }
      const r = getRoleForToken(game, playerToken);
      if (!r) { setStatus('invalid'); return; }
      setRole(r);
      setStatus('ready');
    });
  }, [gameCode, playerToken]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#555' }}>
        Loading game {gameCode}…
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Invalid game link</div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Game <strong>{gameCode}</strong> not found or token is invalid.</div>
        <Link to="/" style={{ padding: '8px 16px', background: '#444', color: '#fff', borderRadius: 4, textDecoration: 'none', fontSize: 13, fontWeight: 'bold' }}>← Main Menu</Link>
      </div>
    );
  }

  // Phase 3 will replace this with the live Firestore-connected board.
  // For now, render the local App with the role shown in the title area.
  return <App role={role} gameCode={gameCode} playerToken={playerToken} />;
}
