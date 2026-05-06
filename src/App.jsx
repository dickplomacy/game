import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import DipMap from "./DipMap";
import territories from "./territories.json";

// Format a territory id for display: 'stp-sc' → 'STP/SC', 'lon' → 'LON'
function displayId(id) {
  return id.replace('-', '/').toUpperCase();
}

// Only true restriction: armies can't go to water, fleets can't go to landlocked
function canOrderTo(unitType, destId) {
  const baseId = destId.includes('-') ? destId.split('-')[0] : destId;
  const dest = territories[baseId];
  if (!dest) return false;
  if (unitType === 'A' && dest.type === 'water') return false;
  if (unitType === 'F' && dest.type === 'land') return false;
  return true;
}

// Adjacency-based highlighting (visual guide only — orders are not restricted to these)
function getDisplayMoves(unit) {
  if (!unit) return new Set();
  const t = territories[unit.id];
  if (!t) return new Set();
  let moves = (unit.type === 'A' ? t.moves.army : t.moves.fleet) || [];
  if (moves.length === 0 && unit.id.includes('-')) {
    const base = territories[unit.id.split('-')[0]];
    if (base) moves = (unit.type === 'A' ? base.moves.army : base.moves.fleet) || [];
  }
  return new Set(moves.map(id => id.includes('-') ? id.split('-')[0] : id));
}

const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];

const POWER_COLOR = {
  AUSTRIA: '#b22',
  ENGLAND: '#226',
  FRANCE:  '#07c',
  GERMANY: '#666',
  ITALY:   '#171',
  RUSSIA:  '#999',
  TURKEY:  '#c80',
};

// Standard Diplomacy starting positions
// Unit coordinates from SvgStandardMetadata.js (AGPL-3.0, Philip Paquette, Steven Bocco)
const STARTING_UNITS = [
  { id: 'bud', type: 'A', power: 'AUSTRIA',  x: 950.5,  y: 904.0  },
  { id: 'vie', type: 'A', power: 'AUSTRIA',  x: 855.5,  y: 864.0  },
  { id: 'tri', type: 'F', power: 'AUSTRIA',  x: 825.5,  y: 996.0  },
  { id: 'edi', type: 'F', power: 'ENGLAND',  x: 473.5,  y: 514.0  },
  { id: 'lon', type: 'F', power: 'ENGLAND',  x: 488.5,  y: 675.0  },
  { id: 'lvp', type: 'A', power: 'ENGLAND',  x: 450.5,  y: 576.0  },
  { id: 'par', type: 'A', power: 'FRANCE',   x: 488.5,  y: 845.0  },
  { id: 'mar', type: 'A', power: 'FRANCE',   x: 524.5,  y: 975.0  },
  { id: 'bre', type: 'F', power: 'FRANCE',   x: 404.5,  y: 819.0  },
  { id: 'ber', type: 'A', power: 'GERMANY',  x: 771.5,  y: 690.0  },
  { id: 'mun', type: 'A', power: 'GERMANY',  x: 693.5,  y: 828.0  },
  { id: 'kie', type: 'F', power: 'GERMANY',  x: 683.5,  y: 701.0  },
  { id: 'ven', type: 'A', power: 'ITALY',    x: 707.5,  y: 994.0  },
  { id: 'rom', type: 'A', power: 'ITALY',    x: 731.5,  y: 1102.0 },
  { id: 'nap', type: 'F', power: 'ITALY',    x: 806.5,  y: 1170.0 },
  { id: 'mos', type: 'A', power: 'RUSSIA',   x: 1200.5, y: 590.0  },
  { id: 'war', type: 'A', power: 'RUSSIA',   x: 983.5,  y: 740.0  },
  { id: 'sev', type: 'F', power: 'RUSSIA',   x: 1284.5, y: 845.0  },
  { id: 'stp-sc', type: 'F', power: 'RUSSIA', x: 1066.0, y: 487.0 },
  { id: 'con', type: 'A', power: 'TURKEY',   x: 1145.5, y: 1137.0 },
  { id: 'smy', type: 'A', power: 'TURKEY',   x: 1253.5, y: 1210.0 },
  { id: 'ank', type: 'F', power: 'TURKEY',   x: 1301.5, y: 1110.0 },
];

function App() {
  const [title, setTitle] = useState("loading...");
  // setUnits will be used when resolver updates unit positions
  const [units, setUnits] = useState(STARTING_UNITS); // eslint-disable-line no-unused-vars
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [orders, setOrders] = useState({}); // { unitId: destId }

  useEffect(() => {
    getDoc(doc(db, "config", "ui")).then((snap) => {
      if (snap.exists()) setTitle(snap.data().title);
      else setTitle("dickplomacy");
    });
  }, []);

  function findUnit(id) {
    return units.find(u => u.id === id || u.id.startsWith(id + '-')) || null;
  }

  function handleTerritoryClick(id) {
    if (selectedUnit) {
      const isSelected = selectedUnit.id === id || selectedUnit.id.startsWith(id + '-');
      if (isSelected) {
        setSelectedUnit(null);
        return;
      }
      if (canOrderTo(selectedUnit.type, id)) {
        setOrders(prev => ({ ...prev, [selectedUnit.id]: id }));
        setSelectedUnit(null);
      } else {
        // Invalid type: try to switch to a unit on that territory
        setSelectedUnit(findUnit(id));
      }
    } else {
      setSelectedUnit(findUnit(id));
    }
  }

  function cancelOrder(unitId) {
    setOrders(prev => { const next = { ...prev }; delete next[unitId]; return next; });
  }

  function resolveOrders() {
    // TODO: implement resolution
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
      <h1 style={{ textAlign: 'center', margin: '0.5rem 0 0', fontSize: '2rem', flexShrink: 0 }}>{title}</h1>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '0.75rem', padding: '0.5rem 0.75rem' }}>

        {/* Orders panel */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={resolveOrders}
            style={{ padding: '7px 10px', fontWeight: 'bold', cursor: 'pointer', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, letterSpacing: '0.03em' }}
          >
            ▶ Resolve Orders
          </button>
          {POWERS.map(power => {
            const powerUnits = units.filter(u => u.power === power);
            return (
              <div key={power} style={{ borderLeft: `3px solid ${POWER_COLOR[power]}`, paddingLeft: 7 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[power], textTransform: 'uppercase', marginBottom: 3 }}>
                  {power}
                </div>
                {powerUnits.map(u => {
                  const dest = orders[u.id];
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', fontSize: 11, marginBottom: 2, color: dest ? '#111' : '#bbb' }}>
                      <span style={{ fontFamily: 'monospace', flex: 1 }}>
                        {u.type} {displayId(u.id)}{dest ? ` → ${displayId(dest)}` : ''}
                      </span>
                      {dest && (
                        <button
                          onClick={() => cancelOrder(u.id)}
                          style={{ marginLeft: 3, fontSize: 9, padding: '1px 4px', cursor: 'pointer', border: '1px solid #ccc', background: 'none', borderRadius: 2, lineHeight: 1.6, color: '#888' }}
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4, minHeight: '1.4em' }}>
            {selectedUnit
              ? `${selectedUnit.power} ${selectedUnit.type} ${displayId(selectedUnit.id)} — click any territory to order`
              : 'Click a unit to select it'}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <DipMap
              units={units}
              selectedUnit={selectedUnit}
              validMoves={getDisplayMoves(selectedUnit)}
              onTerritoryClick={handleTerritoryClick}
              onTerritoryHover={() => {}}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
