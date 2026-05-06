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
          const handlers = {
            onClick: () => onTerritoryClick && onTerritoryClick(t.id),
            onMouseOver: () => onTerritoryHover && onTerritoryHover(t.id),
            onMouseOut: () => onTerritoryHover && onTerritoryHover(null),
            style: { cursor: 'pointer' },
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
