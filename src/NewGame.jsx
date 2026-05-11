import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createGame, getGame, getRoleForToken } from './gameService';

const BASE_URL = 'https://dickplomacy.github.io/game';

export default function NewGame() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testCreateGame() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const game = await createGame();
      // Immediately fetch it back to verify round-trip
      const fetched = await getGame(game.code);
      const role = getRoleForToken(fetched, fetched.players.ENGLAND);
      setResult({ game, fetched, roleCheck: role });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', userSelect: 'none' }}>New Game</h1>
      <div style={{ width: 360 }}>
        <button
          onClick={testCreateGame}
          disabled={loading}
          style={{ display: 'block', width: '100%', padding: '10px 16px', marginBottom: 12, fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 'bold', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Creating...' : '▶ Test: Create Game'}
        </button>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #c00', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#c00', marginBottom: 12 }}>
            Error: {error}
          </div>
        )}

        {result && (
          <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, padding: 12, fontSize: 11, fontFamily: 'monospace', overflowX: 'auto', marginBottom: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 700, fontFamily: 'system-ui', fontSize: 12 }}>
              ✓ Game created: <strong>{result.game.code}</strong> &nbsp;|&nbsp; Phase: {result.fetched.phase} &nbsp;|&nbsp; Year: {result.fetched.year}
            </div>
            <div style={{ marginBottom: 6, fontWeight: 700, fontFamily: 'system-ui', fontSize: 12 }}>
              ✓ getRoleForToken(ENGLAND token) → <strong>{result.roleCheck}</strong>
            </div>
            <div style={{ marginBottom: 4, fontWeight: 700, fontFamily: 'system-ui', fontSize: 12 }}>Player links:</div>
            {Object.entries(result.game.players).map(([role, token]) => (
              <div key={role} style={{ marginBottom: 2 }}>
                <span style={{ display: 'inline-block', width: 72 }}>{role}:</span>
                {`${BASE_URL}/#/${result.game.code}/${token}`}
              </div>
            ))}
          </div>
        )}

        <Link to="/" style={{ display: 'block', padding: '8px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>← Back</Link>
      </div>
    </div>
  );
}
