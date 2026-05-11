// DipMap.jsx - Interactive Diplomacy board SVG map
// Territory data from territories.json; original SVG from diplomacy/diplomacy (AGPL-3.0, Philip Paquette, Steven Bocco)
import './DipMap.css';
import territories from './territories.json';

function getClass(t, owners) {
  if (t.id.includes('-')) return 'coast-variant';
  if (t.type === 'water') return 'water';
  if (t.type === 'impassable') return 'impassable';
  const owner = owners && owners[t.id];
  return owner ? owner.toLowerCase() : 'neutral';
}

const POWER_COLORS = {
  AUSTRIA: '#c48f85',
  ENGLAND: 'darkviolet',
  FRANCE: 'royalblue',
  GERMANY: '#a08a75',
  ITALY: 'forestgreen',
  RUSSIA: '#757d91',
  TURKEY: '#b9a61c',
};

const POWER_RGBA = {
  AUSTRIA: [196, 143, 133],
  ENGLAND: [148,   0, 211],
  FRANCE:  [ 65, 105, 225],
  GERMANY: [160, 138, 117],
  ITALY:   [ 34, 139,  34],
  RUSSIA:  [117, 125, 145],
  TURKEY:  [185, 166,  28],
};

function territoryFill(t, unitsByTerritory, territoryOwners) {
  if (t.id.includes('-') || t.type === 'water' || t.type === 'impassable') return null;
  const power = territoryOwners[t.id];
  const rgb = power && POWER_RGBA[power];
  if (!rgb) return null;
  const alpha = t.supplyCenter ? 0.5 : 0.25;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

const SC_TERRITORIES = Object.values(territories).filter(t => t.supplyCenter && t.unitCoord && !t.id.includes('-'));

function starPoints(cx, cy, outerR = 7, innerR = 3) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function SupplyCenterStar({ t }) {
  const { x, y } = t.unitCoord;
  return (
    <polygon points={starPoints(x, y)} fill="gold" stroke="#333" strokeWidth={1}
      style={{ pointerEvents: 'none' }} />
  );
}

function UnitSymbol({ unit, selected }) {
  const { x, y, type, power } = unit;
  const color = POWER_COLORS[power] || '#999';
  const r = 13;
  return (
    <g style={{ pointerEvents: 'none' }}>
      {type === 'A'
        ? <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={3}
            fill={color} stroke={selected ? '#ffcc00' : '#222'} strokeWidth={selected ? 2.5 : 1.5} />
        : <circle cx={x} cy={y} r={r}
            fill={color} stroke={selected ? '#ffcc00' : '#222'} strokeWidth={selected ? 2.5 : 1.5} />
      }
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}>{type}</text>
    </g>
  );
}

export default function DipMap({ territoryOwners = {}, units = [], selectedUnit = null, validMoves = new Set(), onTerritoryClick, onTerritoryHover }) {
  const tList = Object.values(territories);
  const unitsByTerritory = {};
  units.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    unitsByTerritory[base] = u;
  });
  return (
    <svg
      viewBox="0 0 1835 1360"
      style={{ width: '100%', height: '100%', maxWidth: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(-195 -170)">
        {tList.map(t => {
          if (!t.svg) return null;
          const cls = getClass(t, territoryOwners) + (validMoves.has(t.id) ? ' valid-move' : '');
          const fill = territoryFill(t, unitsByTerritory, territoryOwners);
          const handlers = {
            onClick: () => onTerritoryClick && onTerritoryClick(t.id),
            onMouseOver: () => onTerritoryHover && onTerritoryHover(t.id),
            onMouseOut: () => onTerritoryHover && onTerritoryHover(null),
            style: fill ? { cursor: 'pointer', fill } : { cursor: 'pointer' },
          };
          if (Array.isArray(t.svg)) {
            return (
              <g key={t.id} id={t.id} className={cls} {...handlers}>
                {t.svg.map((d, i) => <path key={i} d={d} />)}
              </g>
            );
          }
          return <path key={t.id} id={t.id} className={cls} d={t.svg} {...handlers} />;
        })}
      </g>
      <g>
        {(() => {
          const occupied = new Set(units.map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
          return SC_TERRITORIES.filter(t => !occupied.has(t.id)).map(t => <SupplyCenterStar key={t.id} t={t} />);
        })()}
      </g>
      <g>
        {units.map(unit => (
          <UnitSymbol
            key={unit.id}
            unit={unit}
            selected={selectedUnit !== null && selectedUnit.id === unit.id}
          />
        ))}
      </g>
    </svg>
  );
}
