import { Link } from 'react-router-dom';

const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];
const FLAGS = Object.fromEntries(
  POWERS.map(p => [p, `${import.meta.env.BASE_URL}flags/${p.toLowerCase()}.svg`])
);

const btnStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 18px',
  marginBottom: 10,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: '0.06em',
  textAlign: 'left',
  background: 'rgba(10, 10, 30, 0.82)',
  color: '#e8e0cc',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  cursor: 'pointer',
  textDecoration: 'none',
  backdropFilter: 'blur(4px)',
};

export default function MainMenu() {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#e8e2d5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

      {/* Background map */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('${import.meta.env.BASE_URL}ww1-europe.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        opacity: 0.22,
        zIndex: 0,
      }} />

      {/* Vignette overlay — darkens edges, keeps centre readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>

        {/* Title */}
        <h1 style={{
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 'clamp(2rem, 6vw, 3.8rem)',
          fontWeight: 700,
          margin: '0 0 0.2rem',
          color: '#1a1208',
          letterSpacing: '0.04em',
          textShadow: '0 2px 12px rgba(255,255,255,0.6)',
        }}>
          Dickplomacy
        </h1>
        <p style={{ margin: '0 0 1.8rem', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a3a1a', fontWeight: 600 }}>
          Europe, 1901
        </p>

        {/* Nation flags + buttons — share the same width so they align */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            {POWERS.map(p => (
              <img
                key={p}
                src={FLAGS[p]}
                alt={p}
                title={p.charAt(0) + p.slice(1).toLowerCase()}
                style={{
                  height: 22,
                  width: 33,
                  objectFit: 'cover',
                  borderRadius: 2,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </div>

          <Link to="/new" style={btnStyle}>▶ New Game</Link>
          <Link to="/join" style={btnStyle}>▶ Join Game</Link>
          <Link to="/about" style={btnStyle}>▶ About</Link>
        </div>
      </div>
    </div>
  );
}
