import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', userSelect: 'none' }}>About</h1>
      <div style={{ width: 220 }}>
        <Link to="/" style={{ display: 'block', padding: '8px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 'bold', background: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>← Back</Link>
      </div>
    </div>
  );
}
