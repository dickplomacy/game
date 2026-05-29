import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getGame } from './gameService';

const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];

const POWER_COLOR = {
  AUSTRIA: '#b22',
  ENGLAND: '#226',
  FRANCE:  '#07c',
  GERMANY: '#666',
  ITALY:   '#171',
  RUSSIA:  '#999',
  TURKEY:  '#c80',
};

const FLAGS = Object.fromEntries(
  POWERS.map(p => [p, `${import.meta.env.BASE_URL}flags/${p.toLowerCase()}.svg`])
);

export default function JoinGame() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [game, setGame] = useState(null);
  const [foundCode, setFoundCode] = useState('');

  async function handleLookup(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setGame(null);
    try {
      const g = await getGame(trimmed);
      if (!g) {
        setError(`No game found with code "${trimmed}".`);
      } else {
        setGame(g);
        setFoundCode(trimmed);
      }
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handlePickPower(power) {
    const token = game?.players?.[power];
    if (!token) return;
    navigate(`/${foundCode}/${token}`);
  }

  const containerStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8f8f8', padding: '1rem',
  };
  const cardStyle = {
    background: '#fff', borderRadius: 10, padding: '2rem 1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 380, boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: 22, fontWeight: 800, textAlign: 'center', letterSpacing: '0.02em' }}>
          Join a Game
        </h2>

        {/* Code entry */}
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          <input
            autoFocus
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setGame(null); setError(null); }}
            placeholder="Game code…"
            maxLength={8}
            style={{
              flex: 1, padding: '9px 12px', fontSize: 16, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '2px solid #ccc', borderRadius: 6, outline: 'none',
              fontFamily: 'system-ui, sans-serif',
            }}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              padding: '9px 16px', fontWeight: 700, fontSize: 14, cursor: loading || !code.trim() ? 'default' : 'pointer',
              background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 6, opacity: loading || !code.trim() ? 0.5 : 1,
            }}
          >
            {loading ? '…' : 'Find'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ color: '#b22', fontSize: 13, marginBottom: '1rem', textAlign: 'center' }}>{error}</div>
        )}

        {/* Power picker */}
        {game && (
          <>
            <div style={{ fontSize: 12, color: '#666', textAlign: 'center', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
              GAME <strong style={{ color: '#111' }}>{foundCode}</strong> — choose your country
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {POWERS.map(power => (
                <button
                  key={power}
                  onClick={() => handlePickPower(power)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: POWER_COLOR[power], color: '#fff',
                    fontWeight: 700, fontSize: 14, letterSpacing: '0.04em',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    transition: 'opacity 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <img src={FLAGS[power]} alt={power} style={{ height: 20, width: 30, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  {power}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>← Back to menu</Link>
        </div>
      </div>
    </div>
  );
}

