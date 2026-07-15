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

function powerRgba(power, alpha) {
  const rgb = POWER_RGBA[power];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// Stable id for the diagonal-stripe pattern of a contested SC (owner + occupier).
function stripeId(owner, occupier) {
  return `stripe-${owner}-${occupier}`;
}

// Returns true when an owned supply center is occupied by a unit of a different
// power — i.e. the center is contested and its ownership may change at Fall's end.
function isContestedSC(t, unitsByTerritory, territoryOwners) {
  if (!t.supplyCenter || t.id.includes('-')) return false;
  const owner = territoryOwners[t.id];
  const occupier = unitsByTerritory[t.id]?.power;
  return !!(owner && occupier && owner !== occupier && POWER_RGBA[owner] && POWER_RGBA[occupier]);
}

export function territoryFill(t, unitsByTerritory, territoryOwners, lastOccupied = {}) {
  if (t.id.includes('-') || t.type === 'water' || t.type === 'impassable') return null;
  const owner = territoryOwners[t.id];
  const occupier = unitsByTerritory[t.id]?.power;
  // Contested: an owned SC occupied by another power. Stripe the owner's colour
  // with the lighter shade of the occupier so both claims are visible at a glance.
  if (isContestedSC(t, unitsByTerritory, territoryOwners)) {
    return `url(#${stripeId(owner, occupier)})`;
  }
  // Darker (0.5): a supply center whose ownership is official. SC ownership only
  // transfers at the end of Fall, so an owned SC stays this shade even if empty.
  if (t.supplyCenter && owner && POWER_RGBA[owner]) {
    return powerRgba(owner, 0.5);
  }
  // Lighter (0.25): currently occupied (any territory), or for non-SC territories:
  // last known occupier from lastOccupied, with fallback to owner map for old games.
  const power = occupier || (!t.supplyCenter ? (lastOccupied[t.id] || owner) : null);
  if (power && POWER_RGBA[power]) {
    return powerRgba(power, 0.25);
  }
  return null;
}

// Collect the distinct (owner, occupier) pairs of every contested SC currently on
// the board, so a stripe <pattern> can be defined once per pair.
function contestedStripePairs(tList, unitsByTerritory, territoryOwners) {
  const pairs = new Map();
  tList.forEach(t => {
    if (!isContestedSC(t, unitsByTerritory, territoryOwners)) return;
    const owner = territoryOwners[t.id];
    const occupier = unitsByTerritory[t.id].power;
    pairs.set(stripeId(owner, occupier), { owner, occupier });
  });
  return [...pairs.values()];
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

// Returns {x, y} for a territory id (base or coast variant)
function coord(id) {
  const base = id.includes('-') ? id.split('-')[0] : id;
  return territories[id]?.unitCoord ?? territories[base]?.unitCoord ?? null;
}

// Shorten a line segment so arrowhead doesn't overlap unit symbol
function shorten(x1, y1, x2, y2, amount) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < amount * 2) return { x2, y2 };
  return { x2: x2 - (dx / len) * amount, y2: y2 - (dy / len) * amount };
}

function OrderArrows({ orders, units }) {
  const unitById = {};
  units.forEach(u => { unitById[u.id] = u; });

  const arrows = [];
  Object.entries(orders).forEach(([uid, order]) => {
    const src = unitById[uid];
    if (!src) return;
    const { x: x1, y: y1, power } = src;
    const color = POWER_COLORS[power] || '#999';

    if (order.type === 'move') {
      const dst = coord(order.dest);
      if (!dst) return;
      const { x2, y2 } = shorten(x1, y1, dst.x, dst.y, 16);
      arrows.push(
        <line key={uid} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth={2.5} markerEnd="url(#arrow)"
          style={{ pointerEvents: 'none' }} />
      );
    }

    if (order.type === 'support') {
      const tgt = unitById[order.target];
      if (!tgt) return;
      if (order.dest) {
        // Support move: quadratic bezier using attacker as control point.
        // The curve is pulled toward the attacking unit then continues to the destination.
        const dst = coord(order.dest);
        if (!dst) return;
        const { x2, y2 } = shorten(tgt.x, tgt.y, dst.x, dst.y, 16);
        arrows.push(
          <path key={uid} d={`M ${x1} ${y1} Q ${tgt.x} ${tgt.y} ${x2} ${y2}`}
            stroke={color} strokeWidth={2} strokeDasharray="6 3" fill="none"
            markerEnd="url(#arrow-dashed)"
            style={{ pointerEvents: 'none' }} />
        );
      } else {
        // Support hold: dashed line from supporter to supported unit
        const { x2, y2 } = shorten(x1, y1, tgt.x, tgt.y, 16);
        arrows.push(
          <line key={uid} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth={2} strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }} />
        );
        // Small ring around supported unit
        arrows.push(
          <circle key={uid + '-ring'} cx={tgt.x} cy={tgt.y} r={17}
            fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }} />
        );
      }
    }

    if (order.type === 'convoy') {
      // Find the army being convoyed
      const army = unitById[order.army];
      if (!army) return;
      const dst = coord(order.dest);
      if (!dst) return;
      // Dashed arrow from army toward destination (shows the intended path)
      const { x2, y2 } = shorten(army.x, army.y, dst.x, dst.y, 16);
      arrows.push(
        <line key={uid + '-convoy'} x1={army.x} y1={army.y} x2={x2} y2={y2}
          stroke={color} strokeWidth={2} strokeDasharray="8 4" markerEnd="url(#arrow-dashed)"
          style={{ pointerEvents: 'none' }} />
      );
      // Ring around the convoying fleet
      arrows.push(
        <circle key={uid + '-ring'} cx={x1} cy={y1} r={17}
          fill="none" stroke={color} strokeWidth={2}
          style={{ pointerEvents: 'none' }} />
      );
    }
  });

  return <g>{arrows}</g>;
}

function UnitSymbol({ unit, selected, allianceBorder = null }) {
  const { x, y, type, power } = unit;
  const color = POWER_COLORS[power] || '#999';
  const r = 13;
  const mkShape = (props) => type === 'A'
    ? <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={3} {...props} />
    : <circle cx={x} cy={y} r={r} {...props} />;
  return (
    <g style={{ pointerEvents: 'none' }}>
      {allianceBorder === 'ally' ? <>
        {mkShape({ fill: 'none', stroke: '#111', strokeWidth: 6 })}
        {mkShape({ fill: color, stroke: '#00cc44', strokeWidth: 4 })}
      </> : allianceBorder === 'enemy' ? <>
        {mkShape({ fill: 'none', stroke: '#111', strokeWidth: 4 })}
        {mkShape({ fill: color, stroke: '#cc2200', strokeWidth: 3 })}
      </> : allianceBorder === 'conflict' ? <>
        {mkShape({ fill: 'none', stroke: '#111', strokeWidth: 4 })}
        {mkShape({ fill: color, stroke: '#ff8800', strokeWidth: 3 })}
      </> : mkShape({ fill: color, stroke: selected ? '#ffcc00' : '#222', strokeWidth: selected ? 2.5 : 1.5 })}
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}>{type}</text>
    </g>
  );
}

export default function DipMap({ territoryOwners = {}, units = [], orders = {}, selectedUnit = null, validMoves = new Set(), onTerritoryClick, onTerritoryHover, demilTerritories = new Set(), alliedPowers = new Set(), enemyPowers = new Set(), conflictPowers = new Set(), claimBorders = {}, lastOccupied = {} }) {
  const tList = Object.values(territories);
  // Hydrate all units with current unitCoord so stale Firestore x/y never misplaces symbols or arrows
  const hydratedUnits = units.map(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    const c = territories[base]?.unitCoord;
    return c ? { ...u, x: c.x, y: c.y } : u;
  });
  const unitsByTerritory = {};
  hydratedUnits.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    unitsByTerritory[base] = u;
  });
  const stripePairs = contestedStripePairs(tList, unitsByTerritory, territoryOwners);
  return (
    <svg
      viewBox="0 0 1835 1360"
      style={{ width: '100%', height: '100%', maxWidth: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="context-stroke" />
        </marker>
        <marker id="arrow-dashed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="context-stroke" />
        </marker>
        {/* Diagonal stripes for contested supply centers: the owner's colour (0.5)
            interleaved with the lighter shade (0.25) of the occupying power. */}
        {stripePairs.map(({ owner, occupier }) => (
          <pattern key={stripeId(owner, occupier)} id={stripeId(owner, occupier)}
            patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
            <rect width="14" height="14" fill={powerRgba(owner, 0.5)} />
            <rect width="7" height="14" fill={powerRgba(occupier, 0.25)} />
          </pattern>
        ))}
      </defs>
      <g transform="translate(-195 -170)">
        {tList.map(t => {
          if (!t.svg) return null;
          const isValidMove = validMoves.has(t.id);
          const cls = getClass(t, territoryOwners) + (isValidMove ? ' valid-move' : '');
          const fill = isValidMove ? 'rgba(255, 215, 0, 0.5)' : territoryFill(t, unitsByTerritory, territoryOwners, lastOccupied);
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
          const occupied = new Set(hydratedUnits.map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
          return SC_TERRITORIES.filter(t => !occupied.has(t.id)).map(t => <SupplyCenterStar key={t.id} t={t} />);
        })()}
      </g>
      {demilTerritories.size > 0 && (
        <g transform="translate(-195 -170)" style={{ pointerEvents: 'none' }}>
          {Object.values(territories).filter(t => demilTerritories.has(t.id) && t.svg).map(t => {
            const props = { fill: 'none', stroke: '#cc0000', strokeWidth: 3, strokeDasharray: '8 5' };
            if (Array.isArray(t.svg)) {
              return <g key={t.id}>{t.svg.map((d, i) => <path key={i} d={d} {...props} />)}</g>;
            }
            return <path key={t.id} d={t.svg} {...props} />;
          })}
        </g>
      )}
      {Object.keys(claimBorders).length > 0 && (
        <g transform="translate(-195 -170)" style={{ pointerEvents: 'none' }}>
          {Object.values(territories).filter(t => claimBorders[t.id] && t.svg).map(t => {
            const color = claimBorders[t.id] === 'CONFLICT' ? '#ff8800' : (POWER_COLORS[claimBorders[t.id]] || '#999');
            const props = { fill: 'none', stroke: color, strokeWidth: 4 };
            if (Array.isArray(t.svg)) {
              return <g key={t.id}>{t.svg.map((d, i) => <path key={i} d={d} {...props} />)}</g>;
            }
            return <path key={t.id} d={t.svg} {...props} />;
          })}
        </g>
      )}
      <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {tList.filter(t => !t.id.includes('-') && t.type !== 'impassable' && t.unitCoord).map(t => {
          const { x, y } = t.unitCoord;
          return (
            <text
              key={t.id + '-lbl'}
              x={x}
              y={y - 18}
              textAnchor="middle"
              fontSize={9}
              fontWeight="600"
              fontFamily="sans-serif"
              fill="rgba(0,0,0,0.42)"
            >
              {t.id.toUpperCase()}
            </text>
          );
        })}
      </g>
      <g>
        <OrderArrows orders={orders} units={hydratedUnits} />
      </g>
      <g>
        {hydratedUnits.map(unit => (
          <UnitSymbol
            key={unit.id}
            unit={unit}
            selected={selectedUnit !== null && selectedUnit.id === unit.id}
            allianceBorder={
              conflictPowers.has(unit.power) ? 'conflict' :
              alliedPowers.has(unit.power) ? 'ally' :
              enemyPowers.has(unit.power) ? 'enemy' :
              null
            }
          />
        ))}
      </g>
    </svg>
  );
}
