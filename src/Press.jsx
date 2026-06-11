import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { POWERS } from './winCondition';

const POWER_COLOR = {
  AUSTRIA: '#b22',
  ENGLAND: '#226',
  FRANCE:  '#07c',
  GERMANY: '#666',
  ITALY:   '#171',
  RUSSIA:  '#999',
  TURKEY:  '#c80',
};

/**
 * In-game messaging (press) panel.
 *
 * Visibility rules:
 *   - Admin sees all messages.
 *   - Otherwise: messages you sent, messages addressed to you, and public messages (to = []).
 *   - Observers (myPower = null): public messages only.
 *
 * Message schema (games/{gameCode}/messages/{autoId}):
 *   { from, to: string[], body, year, phase, sentAt }
 *   to = [] means public (all powers can see it).
 */
export default function Press({ gameCode, myPower, isAdmin, year, phase, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('inbox'); // 'inbox' | 'compose'
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState([]); // [] = public / all
  const [sending, setSending] = useState(false);
  // Timestamp (ms) of the last time the user looked at the inbox — used for unread badge
  const [lastSeen, setLastSeen] = useState(() => Date.now());
  const bottomRef = useRef(null);

  // Subscribe to the messages subcollection, ordered oldest-first
  useEffect(() => {
    if (!gameCode) return;
    const q = query(
      collection(db, 'games', gameCode.toUpperCase(), 'messages'),
      orderBy('sentAt', 'asc'),
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [gameCode]);

  // Filter to only messages this player can see
  const visibleMessages = messages.filter(m => {
    if (isAdmin) return true;
    if (!myPower) return m.to.length === 0; // observer: public only
    if (m.from === myPower) return true;    // own messages
    if (m.to.length === 0) return true;     // public
    return m.to.includes(myPower);          // addressed to me
  });

  // Messages received (not sent by me) after the last inbox view
  const unread = visibleMessages.filter(m => {
    if (m.from === myPower) return false;
    const ts = m.sentAt?.toMillis?.() ?? 0;
    return ts > lastSeen;
  }).length;

  // Notify parent of unread count changes (for the tab badge in App.jsx)
  useEffect(() => { onUnreadChange?.(unread); }, [unread]);

  // When switching to inbox, mark as seen and scroll to bottom
  useEffect(() => {
    if (tab !== 'inbox') return;
    setLastSeen(Date.now());
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    return () => clearTimeout(id);
  }, [tab, messages.length]);

  function toggleRecipient(p) {
    setRecipients(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function send() {
    if (!body.trim() || !myPower || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'games', gameCode.toUpperCase(), 'messages'), {
        from: myPower,
        to: recipients,
        body: body.trim(),
        year: year ?? null,
        phase: phase ?? null,
        sentAt: serverTimestamp(),
      });
      setBody('');
      setRecipients([]);
      setTab('inbox');
    } finally {
      setSending(false);
    }
  }

  const otherPowers = POWERS.filter(p => p !== myPower);
  const phaseLabel = phase ? phase.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Inbox / Compose tabs */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setTab('inbox')}
          style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: tab === 'inbox' ? '#1a1a2e' : '#f0f0f0', color: tab === 'inbox' ? '#fff' : '#555', border: 'none', borderRight: '1px solid #ddd' }}
        >
          Inbox
          {unread > 0 && (
            <span style={{ marginLeft: 4, background: '#b22', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9 }}>
              {unread}
            </span>
          )}
        </button>
        {myPower && (
          <button
            onClick={() => setTab('compose')}
            style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: tab === 'compose' ? '#1a1a2e' : '#f0f0f0', color: tab === 'compose' ? '#fff' : '#555', border: 'none' }}
          >
            + Compose
          </button>
        )}
      </div>

      {/* Inbox */}
      {tab === 'inbox' && (
        <div style={{ overflowY: 'auto', flex: 1, padding: '2px 0' }}>
          {visibleMessages.length === 0 ? (
            <div style={{ color: '#bbb', fontSize: 11, padding: '18px 8px', textAlign: 'center' }}>
              No messages yet
            </div>
          ) : visibleMessages.map(m => {
            const toLabel = m.to.length === 0 ? 'ALL' : m.to.join(', ');
            const isOwn = m.from === myPower;
            const msgPhase = m.phase ? m.phase.replace('-', '\u00a0').replace(/\b\w/g, c => c.toUpperCase()) : '';
            return (
              <div
                key={m.id}
                style={{ borderLeft: `3px solid ${POWER_COLOR[m.from] ?? '#999'}`, padding: '5px 6px 5px 7px', margin: '2px 0', background: isOwn ? '#f9f9f9' : '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2, gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[m.from] ?? '#555', flexShrink: 0 }}>
                    {m.from}
                  </span>
                  <span style={{ fontSize: 9, color: '#aaa', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    → {toLabel} · {msgPhase} {m.year}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#222', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Compose */}
      {tab === 'compose' && myPower && (
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Phase context */}
          {phaseLabel && (
            <div style={{ fontSize: 10, color: '#888' }}>
              Sending for <strong>{phaseLabel} {year}</strong>
            </div>
          )}

          {/* Recipient picker */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              To:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={recipients.length === 0}
                  onChange={() => setRecipients([])}
                  style={{ margin: 0, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: recipients.length === 0 ? 700 : 400 }}>All powers (public)</span>
              </label>
              {otherPowers.map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={recipients.includes(p)}
                    onChange={() => toggleRecipient(p)}
                    style={{ margin: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: recipients.includes(p) ? 700 : 400, color: POWER_COLOR[p] }}>
                    {p}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Message body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
            placeholder={`Write your message…\n(Ctrl+Enter to send)`}
            rows={5}
            style={{ resize: 'vertical', fontSize: 12, padding: '6px', border: '1px solid #ccc', borderRadius: 3, fontFamily: 'system-ui, sans-serif', lineHeight: 1.4 }}
          />

          <button
            onClick={send}
            disabled={sending || !body.trim()}
            style={{ padding: '7px', fontWeight: 'bold', cursor: sending || !body.trim() ? 'default' : 'pointer', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, opacity: sending || !body.trim() ? 0.5 : 1 }}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      )}
    </div>
  );
}
