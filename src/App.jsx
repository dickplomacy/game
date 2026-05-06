import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import DipMap from "./DipMap";
import territories from "./territories.json";

function getValidMoves(unit) {
  const t = territories[unit.id];
  if (!t) return [];
  const moves = (unit.type === 'A' ? t.moves.army : t.moves.fleet) || [];
  // Coast variant with no moves — fall back to base territory
  if (moves.length === 0 && unit.id.includes('-')) {
    const base = territories[unit.id.split('-')[0]];
    if (base) return (unit.type === 'A' ? base.moves.army : base.moves.fleet) || [];
  }
  return moves;
}

function getDisplayMoves(unit, allUnits) {
  if (!unit) return new Set();
  const moves = getValidMoves(unit);
  // Build occupied set including base IDs for coast variant units
  const occupiedIds = new Set();
  allUnits.forEach(u => {
    occupiedIds.add(u.id);
    if (u.id.includes('-')) occupiedIds.add(u.id.split('-')[0]);
  });
  return new Set(
    moves
      .filter(id => !occupiedIds.has(id))
      .map(id => id.includes('-') ? id.split('-')[0] : id)
  );
}

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
  const [units, setUnits] = useState(STARTING_UNITS);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hovering, setHovering] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "config", "ui")).then((snap) => {
      if (snap.exists()) setTitle(snap.data().title);
      else setTitle("dickplomacy");
    });
  }, []);

  // Find a unit at territory `id`, also matching coast variants (e.g. 'stp' finds 'stp-sc')
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
      const moves = getValidMoves(selectedUnit);
      const directMove = moves.includes(id);
      const coastMove = !directMove && moves.find(m => m.startsWith(id + '-'));
      if (directMove || coastMove) {
        const destId = coastMove || id;
        const dest = territories[destId];
        if (dest && dest.unitCoord) {
          const { x, y } = dest.unitCoord;
          setUnits(prev => {
            if (prev.find(u => u.id === destId)) return prev; // occupied
            return prev.map(u => u.id === selectedUnit.id ? { ...u, id: destId, x, y } : u);
          });
        }
        setSelectedUnit(null);
      } else {
        setSelectedUnit(findUnit(id));
      }
    } else {
      setSelectedUnit(findUnit(id));
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      background: '#fff',
      padding: '1rem',
    }}>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.25rem', letterSpacing: '0.02em' }}>
        {title}
      </h1>
      <p style={{ margin: '0 0 1rem', color: '#555', minHeight: '1.5em' }}>
        {hovering
          ? `Hovering: ${hovering}`
          : selectedUnit
          ? `${selectedUnit.power} ${selectedUnit.type} @ ${selectedUnit.id.toUpperCase()} — click a highlighted territory to move`
          : 'Click a unit to select it'}
      </p>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <DipMap
          units={units}
          selectedUnit={selectedUnit}
          validMoves={getDisplayMoves(selectedUnit, units)}
          onTerritoryClick={handleTerritoryClick}
          onTerritoryHover={setHovering}
        />
      </div>
    </div>
  );
}

export default App;
