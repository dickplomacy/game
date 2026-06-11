import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { POWERS } from './winCondition';
import territories from './territories.json';

const POWER_COLOR = {
  AUSTRIA: '#b22', ENGLAND: '#226', FRANCE: '#07c',
  GERMANY: '#666', ITALY: '#171', RUSSIA: '#999', TURKEY: '#c80',
};

const TREATY_TYPES = [
  {
    id: 'demilitarization',
    label: 'Demilitarization',
    desc: 'All parties agree to keep the listed territories free of their units.',
  },
];

// All non-impassable territories (land, coast, sea) — no coast variants
const LAND_TERRITORIES = Object.values(territories)
  .filter(t => t.type !== 'impassable' && !t.id.includes('-'))
  .map(t => ({ id: t.id, name: t.name }))
  .sort((a, b) => a.id.localeCompare(b.id));

function displayId(id) {
  return id.replace('-', '/').toUpperCase();
}

function phaseLabel(t) {
  return t.phase ? t.phase.replace('-', '\u00a0').replace(/\b\w/g, c => c.toUpperCase()) : '';
}

/**
 * In-game treaty panel.
 *
 * Treaty document schema (games/{gameCode}/treaties/{id}):
 *   { type, proposedBy, parties: string[], territories: string[],
 *     status: 'pending'|'active', signatures: string[], year, phase, createdAt }
 *
 * - proposedBy auto-signs on creation.
 * - When all parties have signed → status becomes 'active'.
 * - Any party (or admin) deleting → removes the document entirely.
 */
export default function Treaties({ gameCode, myPower, isAdmin, year, phase, onPendingChange, onActiveTreaties }) {
  const [treaties, setTreaties] = useState([]);
  const [showCompose, setShowCompose] = useState(false);
  const [treatyType, setTreatyType] = useState('demilitarization');
  const [selectedTerritories, setSelectedTerritories] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [terrFilter, setTerrFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [breakConfirm, setBreakConfirm] = useState(null); // treaty id pending break confirm

  // Subscribe to treaties subcollection
  useEffect(() => {
    if (!gameCode) return;
    const q = query(
      collection(db, 'games', gameCode.toUpperCase(), 'treaties'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, snap => {
      setTreaties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [gameCode]);

  const visibleTreaties = treaties.filter(t =>
    isAdmin || (myPower && t.parties.includes(myPower))
  );

  const activeTreaties = visibleTreaties.filter(t => t.status === 'active');
  const pendingTreaties = visibleTreaties.filter(t => t.status === 'pending');
  const awaitingMe = pendingTreaties.filter(t => myPower && !t.signatures.includes(myPower));

  useEffect(() => { onPendingChange?.(awaitingMe.length); }, [awaitingMe.length]);
  useEffect(() => { onActiveTreaties?.(activeTreaties); }, [JSON.stringify(activeTreaties.map(t => ({ id: t.id, territories: t.territories, parties: t.parties, type: t.type })))]);

  async function handleSign(treaty) {
    const newSigs = [...new Set([...treaty.signatures, myPower])];
    const allSigned = treaty.parties.every(p => newSigs.includes(p));
    await updateDoc(doc(db, 'games', gameCode.toUpperCase(), 'treaties', treaty.id), {
      signatures: newSigs,
      ...(allSigned ? { status: 'active' } : {}),
    });
  }

  async function handleBreak(treatyId) {
    await deleteDoc(doc(db, 'games', gameCode.toUpperCase(), 'treaties', treatyId));
    setBreakConfirm(null);
  }

  async function handlePropose() {
    if (!myPower || selectedParties.length === 0 || selectedTerritories.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'games', gameCode.toUpperCase(), 'treaties'), {
        type: treatyType,
        proposedBy: myPower,
        parties: [myPower, ...selectedParties],
        territories: selectedTerritories,
        status: 'pending',
        signatures: [myPower], // proposer auto-signs
        year: year ?? null,
        phase: phase ?? null,
        createdAt: serverTimestamp(),
      });
      setSelectedTerritories([]);
      setSelectedParties([]);
      setTerrFilter('');
      setShowCompose(false);
    } finally {
      setSubmitting(false);
    }
  }

  const otherPowers = POWERS.filter(p => p !== myPower);
  const filteredTerrs = LAND_TERRITORIES.filter(({ id, name }) =>
    terrFilter === '' ||
    id.includes(terrFilter.toLowerCase()) ||
    name.toLowerCase().includes(terrFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>

      {/* ── Active treaties ── */}
      {activeTreaties.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#7a5c10', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 0 3px', borderBottom: '1px solid #e8d5a3' }}>
            ⚖ Active Treaties
          </div>
          {activeTreaties.map(t => {
            const canAct = isAdmin || (myPower && t.parties.includes(myPower));
            const confirming = breakConfirm === t.id;
            return (
              <div key={t.id} style={{ border: '1px solid #c8a84b', borderRadius: 4, background: '#fdf9f0', padding: '8px', margin: '4px 0' }}>
                {/* Type */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a5c10', marginBottom: 4 }}>
                  {TREATY_TYPES.find(tt => tt.id === t.type)?.label ?? t.type}
                </div>
                {/* Parties */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                  {t.parties.map(p => (
                    <span key={p} style={{ fontSize: 9, fontWeight: 700, color: POWER_COLOR[p] ?? '#555', background: (POWER_COLOR[p] ?? '#999') + '22', padding: '1px 6px', borderRadius: 8 }}>
                      {p}
                    </span>
                  ))}
                </div>
                {/* Terms */}
                <div style={{ fontSize: 10, color: '#444', marginBottom: 4, lineHeight: 1.4 }}>
                  No units in: <strong>{t.territories.map(displayId).join(', ')}</strong>
                </div>
                <div style={{ fontSize: 9, color: '#aaa', marginBottom: canAct ? 5 : 0 }}>
                  Signed {phaseLabel(t)} {t.year}
                </div>
                {/* Break */}
                {canAct && (
                  confirming ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleBreak(t.id)} style={{ flex: 1, padding: '4px', fontSize: 10, background: '#b22', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 700 }}>
                        Confirm Break
                      </button>
                      <button onClick={() => setBreakConfirm(null)} style={{ flex: 1, padding: '4px', fontSize: 10, background: '#eee', color: '#555', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setBreakConfirm(t.id)} style={{ width: '100%', padding: '3px 0', fontSize: 10, background: 'none', color: '#b22', border: '1px solid #b22', borderRadius: 3, cursor: 'pointer', fontWeight: 600 }}>
                      Break Treaty
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pending proposals ── */}
      {pendingTreaties.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '5px 0 3px', borderBottom: '1px solid #ddd' }}>
            Pending Proposals
          </div>
          {pendingTreaties.map(t => {
            const iHaveSigned = myPower && t.signatures.includes(myPower);
            const needsMyAction = myPower && !iHaveSigned && !isAdmin;
            const unsigned = t.parties.filter(p => !t.signatures.includes(p));
            return (
              <div key={t.id} style={{ border: needsMyAction ? '1px solid #c8a84b' : '1px solid #ddd', borderLeft: needsMyAction ? '3px solid #c8a84b' : '1px solid #ddd', borderRadius: 4, background: needsMyAction ? '#fffef8' : '#fafafa', padding: '8px', margin: '4px 0' }}>
                {/* Type + proposer */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 3 }}>
                  {TREATY_TYPES.find(tt => tt.id === t.type)?.label ?? t.type}
                  {' — proposed by '}
                  <span style={{ color: POWER_COLOR[t.proposedBy] }}>{t.proposedBy}</span>
                </div>
                {/* Signature status */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 3 }}>
                  {t.parties.map(p => {
                    const signed = t.signatures.includes(p);
                    return (
                      <span key={p} style={{ fontSize: 9, fontWeight: 700, color: signed ? '#2a6e2a' : '#aaa', background: signed ? '#e8f5e8' : '#f0f0f0', padding: '1px 5px', borderRadius: 8 }}>
                        {signed ? '✓ ' : ''}{p}
                      </span>
                    );
                  })}
                </div>
                {/* Terms */}
                <div style={{ fontSize: 10, color: '#444', marginBottom: 4, lineHeight: 1.4 }}>
                  No units in: <strong>{t.territories.map(displayId).join(', ')}</strong>
                </div>
                <div style={{ fontSize: 9, color: '#aaa', marginBottom: needsMyAction ? 7 : 0 }}>
                  {phaseLabel(t)} {t.year} · {t.signatures.length}/{t.parties.length} signed
                </div>
                {/* Sign / Reject */}
                {needsMyAction && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      onClick={() => handleSign(t)}
                      title="Sign this treaty"
                      style={{
                        flex: 2, padding: '8px 10px',
                        background: '#fdf6e3', color: '#2c1810',
                        border: '1px solid #8b6914', borderRadius: 3,
                        cursor: 'pointer',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: 14, fontStyle: 'italic', letterSpacing: '0.04em',
                        boxShadow: '0 1px 3px rgba(139,105,20,0.28)',
                      }}
                    >
                      ✍&thinsp;<span style={{ borderBottom: '1px solid #2c1810', paddingBottom: 2 }}>Sign Treaty</span>
                    </button>
                    <button
                      onClick={() => handleBreak(t.id)}
                      style={{ flex: 1, padding: '8px 4px', background: 'none', color: '#888', border: '1px solid #ccc', borderRadius: 3, cursor: 'pointer', fontSize: 10 }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {/* Waiting on others */}
                {iHaveSigned && unsigned.length > 0 && (
                  <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic' }}>
                    Awaiting {unsigned.join(', ')}…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTreaties.length === 0 && pendingTreaties.length === 0 && (
        <div style={{ color: '#bbb', fontSize: 11, padding: '16px 8px', textAlign: 'center' }}>
          No treaties in effect
        </div>
      )}

      {/* ── Propose button ── */}
      {myPower && !showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          style={{ margin: '2px 0 4px', padding: '6px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#f5f0e8', color: '#3c2c10', border: '1px solid #c8a84b', borderRadius: 3 }}
        >
          + Propose Treaty
        </button>
      )}

      {/* ── Compose form ── */}
      {showCompose && myPower && (
        <div style={{ border: '1px solid #c8a84b', borderRadius: 4, background: '#fdf9f0', padding: '8px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7a5c10' }}>Propose Treaty</div>

          {/* Treaty type */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
            {TREATY_TYPES.map(tt => (
              <label key={tt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, cursor: 'pointer', marginBottom: 3, userSelect: 'none' }}>
                <input type="radio" name="treaty-type" value={tt.id} checked={treatyType === tt.id} onChange={() => setTreatyType(tt.id)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  <strong>{tt.label}</strong>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{tt.desc}</div>
                </span>
              </label>
            ))}
          </div>

          {/* Co-signatories */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Co-signatories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {otherPowers.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={selectedParties.includes(p)}
                    onChange={() => setSelectedParties(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: selectedParties.includes(p) ? 700 : 400, color: POWER_COLOR[p] }}>{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Territories */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Territories</div>
            <input
              type="text"
              value={terrFilter}
              onChange={e => setTerrFilter(e.target.value)}
              placeholder="Filter…"
              style={{ width: '100%', fontSize: 11, padding: '3px 6px', border: '1px solid #ccc', borderRadius: 3, boxSizing: 'border-box', marginBottom: 4 }}
            />
            <div style={{ maxHeight: 90, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 3, background: '#fff' }}>
              {filteredTerrs.map(({ id, name }) => (
                <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 5px', cursor: 'pointer', background: selectedTerritories.includes(id) ? '#fef3cd' : 'transparent', fontSize: 11, userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={selectedTerritories.includes(id)}
                    onChange={() => setSelectedTerritories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontWeight: 600, minWidth: 28 }}>{displayId(id)}</span>
                  <span style={{ color: '#888', fontSize: 10 }}>{name}</span>
                </label>
              ))}
            </div>
            {selectedTerritories.length > 0 && (
              <div style={{ fontSize: 10, color: '#7a5c10', marginTop: 3, lineHeight: 1.4 }}>
                {selectedTerritories.map(displayId).join(', ')}
              </div>
            )}
          </div>

          {/* Submit / Cancel */}
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={handlePropose}
              disabled={submitting || selectedParties.length === 0 || selectedTerritories.length === 0}
              style={{ flex: 1, padding: '7px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: '#7a5c10', color: '#fff', border: 'none', borderRadius: 3, opacity: (selectedParties.length === 0 || selectedTerritories.length === 0 || submitting) ? 0.5 : 1 }}
            >
              {submitting ? 'Proposing…' : 'Propose Treaty'}
            </button>
            <button
              onClick={() => { setShowCompose(false); setSelectedTerritories([]); setSelectedParties([]); setTerrFilter(''); }}
              style={{ padding: '7px 10px', fontSize: 11, cursor: 'pointer', background: '#eee', color: '#555', border: '1px solid #ccc', borderRadius: 3 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
