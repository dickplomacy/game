import { Link } from 'react-router-dom';

const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];
const FLAGS = Object.fromEntries(
  POWERS.map(p => [p, `${import.meta.env.BASE_URL}flags/${p.toLowerCase()}.svg`])
);

export default function About() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8f8f8', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 4 }}>dickplomacy</h1>
        <p style={{ color: '#555', marginTop: 0, marginBottom: '2rem', fontSize: 14 }}>
          A web-based multiplayer implementation of the classic board game <em>Diplomacy</em> — set in Europe, 1901.
        </p>

        <Section title="The Great Powers">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POWERS.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: 700 }}>
                <img src={FLAGS[p]} alt={p} style={{ height: 16, width: 24, objectFit: 'cover', borderRadius: 1, border: '1px solid rgba(0,0,0,0.1)' }} />
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </div>
            ))}
          </div>
          <P>Each power starts with 3 units (except Russia with 4). The goal is to capture 18 of the 34 supply centres on the map.</P>
        </Section>

        <Section title="How to Play">
          <P>One player creates a game and shares the 7 country links with the other players. Each player gets a private link that lets them submit orders only for their own country.</P>
          <P>The game creator (admin) sees all submitted orders and clicks <strong>Resolve Orders</strong> to advance the game.</P>
        </Section>

        <Section title="Phases">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {[
                ['Spring Move', 'All players submit orders simultaneously. Admin resolves.'],
                ['Spring Retreat', 'Dislodged units must retreat or disband.'],
                ['Fall Move', 'Same as Spring. Supply centres change hands after resolution.'],
                ['Fall Retreat', 'Dislodged units retreat. SC ownership is finalised.'],
                ['Winter', 'Powers with more SCs than units build; those with fewer disband.'],
              ].map(([phase, desc]) => (
                <tr key={phase} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 10px 6px 0', fontWeight: 700, whiteSpace: 'nowrap', color: '#333' }}>{phase}</td>
                  <td style={{ padding: '6px 0', color: '#555' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Order Types">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {[
                ['Hold', 'Default — unit stays put.'],
                ['Move (M)', 'Move to an adjacent territory.'],
                ['Support (S)', "Strengthen an ally's hold or attack. Uses your move to back another unit."],
                ['Convoy (C)', 'A fleet at sea carries an army across water to a non-adjacent coast.'],
              ].map(([order, desc]) => (
                <tr key={order} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 10px 6px 0', fontWeight: 700, whiteSpace: 'nowrap', color: '#333' }}>{order}</td>
                  <td style={{ padding: '6px 0', color: '#555' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <P style={{ fontSize: 12, color: '#888' }}>Keyboard shortcuts: <strong>M</strong> Move · <strong>S</strong> Support · <strong>C</strong> Convoy</P>
        </Section>

        <Section title="Winning">
          <P>Control 18 or more supply centres at the end of any Fall phase. That's a majority of the 34 SCs on the board.</P>
        </Section>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/" style={{ padding: '8px 18px', background: '#1a1a2e', color: '#fff', borderRadius: 5, textDecoration: 'none', fontSize: 13, fontWeight: 'bold' }}>← Back to menu</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#333', margin: '0 0 0.6rem', borderBottom: '2px solid #e0e0e0', paddingBottom: 4 }}>{title}</h2>
      {children}
    </div>
  );
}

function P({ children, style }) {
  return <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: '0.5rem 0 0', ...style }}>{children}</p>;
}
