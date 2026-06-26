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
  const [passivePowers, setPassivePowers] = useState(new Set());
  // powerSlots: { [power]: slotKey } — powers sharing the same slotKey are controlled by one player
  const [powerSlots, setPowerSlots] = useState(() => Object.fromEntries(POWERS.map(p => [p, p])));
  const [mergeSource, setMergeSource] = useState(null);

  function togglePassive(p) {
    setPassivePowers(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const activePowersList = POWERS.filter(p => !passivePowers.has(p));
      const pSlots = Object.fromEntries(activePowersList.map(p => [p, powerSlots[p] ?? p]));
      const g = await createGame({ autoResolve, passivePowers: [...passivePowers], powerSlots: pSlots });
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
          {/* Admin link */}
          {[['ADMIN', []]].concat((() => {
            const activePowersInGame = POWERS.filter(p => !game.settings?.passivePowers?.includes(p));
            const tokenSlotMap = {};
            activePowersInGame.forEach(p => {
              const token = game.players[p];
              if (!tokenSlotMap[token]) tokenSlotMap[token] = [];
              tokenSlotMap[token].push(p);
            });
            return Object.entries(tokenSlotMap);
          })()).map(([tokenOrRole, powers]) => {
            const isAdmin = tokenOrRole === 'ADMIN';
            const label = isAdmin ? 'ADMIN' : powers.join(' + ');
            const link = isAdmin ? linkFor('ADMIN') : `${BASE_URL}/${game.code}/${tokenOrRole}`;
            const copyKey = isAdmin ? 'ADMIN' : tokenOrRole;
            return (
              <div key={copyKey} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                <span style={{ width: 90, flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#333' }}>{label}</span>
                <span style={{ flex: 1, fontSize: 10, fontFamily: 'monospace', background: '#f5f5f5', padding: '4px 8px', borderRadius: 3, border: '1px solid #ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(link); setCopied(copyKey); setTimeout(() => setCopied(null), 1500); }}
                  style={{ flexShrink: 0, padding: '4px 10px', fontSize: 11, fontWeight: 'bold', background: copied === copyKey ? '#2a6e2a' : '#444', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                >
                  {copied === copyKey ? '✓' : 'Copy'}
                </button>
              </div>
            );
          })}
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
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Exclude from game (passive)</div>
          {POWERS.map(p => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer', userSelect: 'none', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={passivePowers.has(p)}
                onChange={() => togglePassive(p)}
                style={{ width: 13, height: 13, cursor: 'pointer', accentColor: '#b22' }}
              />
              <span style={{ color: passivePowers.has(p) ? '#b22' : '#333', fontWeight: passivePowers.has(p) ? 700 : 400 }}>{p}</span>
            </label>
          ))}
        </div>
        {/* Slot grouping — only show when 2+ active powers */}
        {(() => {
          const activePowersList = POWERS.filter(p => !passivePowers.has(p));
          if (activePowersList.length < 2) return null;
          const slotGroups = {};
          activePowersList.forEach(p => {
            const key = powerSlots[p];
            if (!slotGroups[key]) slotGroups[key] = [];
            slotGroups[key].push(p);
          });
          const slotEntries = Object.values(slotGroups);
          return (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Group powers into player slots</div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>
                {mergeSource ? `Merging ${mergeSource} — click another power to group` : 'Click a power to select, then click another to merge'}
              </div>
              {slotEntries.map((powers, idx) => (
                <div key={powers[0]} style={{ border: `1px solid ${mergeSource && powers.includes(mergeSource) ? '#226' : '#ddd'}`, borderRadius: 4, padding: '4px 7px', marginBottom: 4, background: powers.length > 1 ? '#edf2ff' : '#fafafa' }}>
                  <span style={{ fontSize: 9, color: '#999', fontWeight: 700, marginRight: 6 }}>SLOT {idx + 1}</span>
                  {powers.map(p => (
                    <button key={p} onClick={() => {
                      if (!mergeSource) { setMergeSource(p); }
                      else if (mergeSource === p) { setMergeSource(null); }
                      else { setPowerSlots(prev => ({ ...prev, [p]: prev[mergeSource] })); setMergeSource(null); }
                    }} style={{ marginRight: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: mergeSource === p ? '#226' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10 }}>
                      {p}
                      {powers.length > 1 && (
                        <span onClick={e => { e.stopPropagation(); setPowerSlots(prev => ({ ...prev, [p]: p + '_split' })); if (mergeSource === p) setMergeSource(null); }} style={{ marginLeft: 4, opacity: 0.75, fontSize: 10 }}>×</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
        <button onClick={handleCreate} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Creating...' : '▶ Create Game'}
        </button>
        <Link to="/" style={{ display: 'block', padding: '8px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>← Back</Link>
      </div>
    </div>
  );
}
