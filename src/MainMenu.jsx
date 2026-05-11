import { Link } from 'react-router-dom';

const btnStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 16px',
  marginBottom: 10,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: '0.04em',
  textAlign: 'left',
  background: '#1a1a2e',
  color: '#fff',
  border: '2px solid transparent',
  borderRadius: 4,
  cursor: 'pointer',
  textDecoration: 'none',
};

export default function MainMenu() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', userSelect: 'none', letterSpacing: '0.02em' }}>dickplomacy</h1>
      <div style={{ width: 220 }}>
        <Link to="/new" style={btnStyle}>▶ New Game</Link>
        <Link to="/join" style={btnStyle}>▶ Join Game</Link>
        <Link to="/about" style={btnStyle}>▶ About</Link>
      </div>
    </div>
  );
}
