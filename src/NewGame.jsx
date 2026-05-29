import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createGame } from './gameService';

const BASE_URL = 'https://dickplomacy.github.io/game/#';
const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];

const btnStyle = {
  display: 'block', width: '100%', padding: '10px 16px', marginBottom: 10,
  fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 'bold',
  background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
};

export default function NewGame() {
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [autoResolve, setAutoResolve] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const g = await createGame({ autoResolve });
      setGame(g);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function linkFor(role) {
    return `${BASE_URL}/${game.code}/${game.players[role]}`;
  }

  function copyLink(role) {
    navigator.clipboard.writeText(linkFor(role));
    setCopied(role);
    setTimeout(() => setCopied(null), 1500);
  }

  if (game) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 4, userSelect: 'none' }}>Game Created</h1>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Code: <strong>{game.code}</strong> · {game.phase} {game.year}</div>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 16px', boxSizing: 'border-box' }}>
          <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Player Links — share each link with the respective player</div>
          {['ADMIN', ...POWERS].map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
              <span style={{ width: 72, flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#333' }}>{role}</span>
              <span style={{ flex: 1, fontSize: 10, fontFamily: 'monospace', background: '#f5f5f5', padding: '4px 8px', borderRadius: 3, border: '1px solid #ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {linkFor(role)}
              </span>
              <button
                onClick={() => copyLink(role)}
                style={{ flexShrink: 0, padding: '4px 10px', fontSize: 11, fontWeight: 'bold', background: copied === role ? '#2a6e2a' : '#444', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
              >
                {copied === role ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <a href={linkFor('ADMIN')} style={{ flex: 1, display: 'block', padding: '9px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
              ▶ Enter as Admin
            </a>
            <Link to="/" style={{ flex: 1, display: 'block', padding: '9px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
              ← Main Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', userSelect: 'none' }}>New Game</h1>
      <div style={{ width: 260 }}>
        {error && (
          <div style={{ background: '#fee', border: '1px solid #c00', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#c00', marginBottom: 12 }}>
            {error}
          </div>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, cursor: 'pointer', userSelect: 'none', fontSize: 13, color: '#333' }}>
          <input
            type="checkbox"
            checked={autoResolve}
            onChange={e => setAutoResolve(e.target.checked)}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#1a1a2e' }}
          />
          Auto-resolve when all orders are submitted
        </label>
        <button onClick={handleCreate} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Creating...' : '▶ Create Game'}
        </button>
        <Link to="/" style={{ display: 'block', padding: '8px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>← Back</Link>
      </div>
    </div>
  );
}
