import { useEffect, useRef, useState } from "react";
import DipMap from "./DipMap";
import territories from "./territories.json";
import { resolve } from "./resolver";
import { submitOrders, unsubmitOrders, saveDraftOrders, writeResolution, submitRetreatOrders, submitWinterOrders, writeWinterResolution, setCountryLock, onTreatiesSnapshot } from "./gameService";
import { checkWinner, POWERS, SC_IDS } from "./winCondition";
import { HOME_SCS, computeAdjustments, buildWinterData, getAvailableBuildSCs, ownersFromUnits } from "./adjustments";
import Press from "./Press";
import Treaties from "./Treaties";

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

// For a fleet move order, resolve the specific coast variant dest if unambiguous.
// e.g. fleet at 'bot' moving to 'stp' → 'stp-sc' (only coast in bot's move list)
//      fleet at 'mid' moving to 'spa' → 'spa' (ambiguous: both spa-nc and spa-sc reachable)
function resolveFleetDest(fleetId, destBaseId) {
  const fleetMoves = territories[fleetId]?.moves.fleet || [];
  const coastsInMoves = fleetMoves.filter(m => m.startsWith(destBaseId + '-'));
  if (coastsInMoves.length === 1) return coastsInMoves[0]; // unambiguous — auto-resolve
  return destBaseId; // ambiguous or no coast variant — keep base
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
  // Include both the coast variant id and its base id so the SVG territory gets highlighted
  const result = new Set();
  moves.forEach(id => {
    result.add(id);
    if (id.includes('-')) result.add(id.split('-')[0]);
  });
  return result;
}

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

// Render an order as a short notation string
function renderOrderText(u, orders, units) {
  const order = orders[u.id];
  if (!order) return `${u.type} ${displayId(u.id)}`;
  if (order.type === 'move') return `${u.type} ${displayId(u.id)} → ${displayId(order.dest)}`;
  if (order.type === 'support') {
    const tgt = units.find(t => t.id === order.target);
    if (!tgt) return `${u.type} ${displayId(u.id)} S ?`;
    if (order.dest) return `${u.type} ${displayId(u.id)} S ${tgt.type} ${displayId(tgt.id)} → ${displayId(order.dest)}`;
    return `${u.type} ${displayId(u.id)} S ${tgt.type} ${displayId(tgt.id)} H`;
  }
  if (order.type === 'convoy') {
    const army = units.find(t => t.id === order.army);
    if (!army) return `${u.type} ${displayId(u.id)} C ?`;
    return `${u.type} ${displayId(u.id)} C ${army.type} ${displayId(army.id)} → ${displayId(order.dest)}`;
  }
  return `${u.type} ${displayId(u.id)}`;
}

// ── Full order-history formatting (grouped by power, Diplomacy notation) ──────
// Move phase: every unit is listed, unordered units shown as an explicit hold.
function historyMoveOrders(unitList, flatOrders) {
  const byPower = {};
  unitList.forEach(u => {
    const s = flatOrders[u.id] ? renderOrderText(u, flatOrders, unitList) : `${u.type} ${displayId(u.id)} H`;
    (byPower[u.power] ??= []).push(s);
  });
  return byPower;
}

// Retreat phase: 'A SEV R MOS' (retreat) or 'A SEV D' (disband).
function historyRetreatOrders(dislodged, retreatOrders) {
  const byPower = {};
  dislodged.forEach(({ unit }) => {
    const dest = retreatOrders[unit.id];
    const s = (!dest || dest === 'disband')
      ? `${unit.type} ${displayId(unit.id)} D`
      : `${unit.type} ${displayId(unit.id)} R ${displayId(dest)}`;
    (byPower[unit.power] ??= []).push(s);
  });
  return byPower;
}

// Modal dialog listing every recorded turn's orders, grouped by power.
function FullOrderHistory({ history, onClose }) {
  const SEASON = { 'spring-move': 'Spring', 'spring-retreat': 'Spring', 'fall-move': 'Fall', 'fall-retreat': 'Fall', 'winter': 'Winter' };
  const KIND = { 'spring-move': 'Moves', 'fall-move': 'Moves', 'spring-retreat': 'Retreats', 'fall-retreat': 'Retreats', 'winter': 'Adjustments' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, width: 'min(680px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Full order history</div>
          <button onClick={onClose} style={{ padding: '4px 10px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '10px 16px', fontSize: 12 }}>
          {history.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: '16px 0' }}>No turns recorded yet.</div>}
          {history.map((turn, ti) => {
            const heading = `${SEASON[turn.phase] ?? turn.phase} ${turn.year ?? ''} — ${KIND[turn.phase] ?? ''}`;
            const powers = Object.keys(turn.ordersByPower ?? {}).filter(p => (turn.ordersByPower[p] ?? []).length > 0);
            return (
              <div key={ti} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e', borderBottom: '2px solid #1a1a2e', paddingBottom: 3, marginBottom: 6, letterSpacing: '0.03em' }}>{heading}</div>
                {powers.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', paddingLeft: 6 }}>No orders.</div>}
                {powers.map(power => (
                  <div key={power} style={{ marginBottom: 6, borderLeft: `3px solid ${POWER_COLOR[power] ?? '#999'}`, paddingLeft: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 10, color: POWER_COLOR[power] ?? '#999', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{power}</div>
                    {turn.ordersByPower[power].map((line, li) => (
                      <div key={li} style={{ color: '#333', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, lineHeight: 1.5 }}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Initial territory ownership — all land territories each nation starts with
const INITIAL_OWNERS = {
  // Austria-Hungary
  bud: 'AUSTRIA', tri: 'AUSTRIA', vie: 'AUSTRIA',
  boh: 'AUSTRIA', gal: 'AUSTRIA', tyr: 'AUSTRIA',
  // England
  edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND',
  cly: 'ENGLAND', wal: 'ENGLAND', yor: 'ENGLAND',
  // France
  bre: 'FRANCE', mar: 'FRANCE', par: 'FRANCE',
  bur: 'FRANCE', gas: 'FRANCE', pic: 'FRANCE',
  // Germany
  ber: 'GERMANY', kie: 'GERMANY', mun: 'GERMANY',
  pru: 'GERMANY', ruh: 'GERMANY', sil: 'GERMANY',
  // Italy
  nap: 'ITALY', rom: 'ITALY', ven: 'ITALY',
  apu: 'ITALY', pie: 'ITALY', tus: 'ITALY',
  // Russia
  mos: 'RUSSIA', sev: 'RUSSIA', stp: 'RUSSIA', war: 'RUSSIA',
  fin: 'RUSSIA', lvn: 'RUSSIA', ukr: 'RUSSIA',
  // Turkey
  ank: 'TURKEY', con: 'TURKEY', smy: 'TURKEY',
  arm: 'TURKEY', syr: 'TURKEY',
};

const FLAGS = Object.fromEntries(
  ['AUSTRIA','ENGLAND','FRANCE','GERMANY','ITALY','RUSSIA','TURKEY'].map(p =>
    [p, `${import.meta.env.BASE_URL}flags/${p.toLowerCase()}.svg`]
  )
);

function App({ gameData = null, role = null, gameCode = null, playerToken = null }) {
  // role: null (local/observer), 'ADMIN', or a power name like 'ENGLAND'
  // isMultiplayer: true when loaded via a game link
  const isMultiplayer = !!gameCode;
  const isAdmin = role === 'ADMIN';
  // myPowers: all powers this player controls (empty for admin/observer)
  const myPowers = role && role !== 'ADMIN' ? (Array.isArray(role) ? role : [role]) : [];
  // Primary power for press/treaties/retreat context
  const myPower = myPowers[0] ?? null;
  const passivePowers = gameData?.settings?.passivePowers ?? [];
  const lockedPowers = gameData?.settings?.lockedPowers ?? [];
  const activePowers = POWERS.filter(p => !passivePowers.includes(p));
  // setUnits will be used when resolver updates unit positions
  const [units, setUnits] = useState(STARTING_UNITS);
  const [owners, setOwners] = useState(() => ownersFromUnits(INITIAL_OWNERS, STARTING_UNITS));
  const [lastOccupied, setLastOccupied] = useState(() => ownersFromUnits({}, STARTING_UNITS));
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [orders, setOrders] = useState({}); // { unitId: { type: 'move'|'support'|'convoy', dest?, target?, army? } }
  const [mode, setMode] = useState(null); // null | 'move' | 'support' | 'convoy'
  const [supportTarget, setSupportTarget] = useState(null); // unit being supported (step 2 of support)
  const [convoyArmy, setConvoyArmy] = useState(null); // army unit selected in convoy step 2
  const [coastChoice, setCoastChoice] = useState(null); // { unitId, coasts: [id, ...] } — pending coast selection
  // retreatPhase: null | { dislodged: [{unit, retreatOptions}], retreatOrders: {unitId: destId|'disband'} }
  const [retreatPhase, setRetreatPhase] = useState(null);
  // Whether this player has submitted orders — all controlled powers must have submitted
  const submitted = isMultiplayer && myPowers.length > 0 ? myPowers.every(p => !!gameData?.orders?.[p]) : false;
  const [submitting, setSubmitting] = useState(false);
  // savedOrders: snapshot of orders when player last clicked "Save" — null means unsaved
  const [savedOrders, setSavedOrders] = useState(null);
  const isSaved = savedOrders !== null && JSON.stringify(orders) === JSON.stringify(savedOrders);
  // winterPhase: null | { adjustments: {POWER: number}, orders: {POWER: {builds, disbands}} }
  const [winterPhase, setWinterPhase] = useState(null);
  // Local staging area for winter adjustment orders before submission — keyed by power
  const [winterOrders, setWinterOrders] = useState({}); // { [power]: { builds: [], disbands: [] } }
  // Last phase resolution log (synced from Firestore)
  const [lastPhaseLog, setLastPhaseLog] = useState(null);
  // Full order-history dialog visibility
  const [showHistory, setShowHistory] = useState(false);

  // Sidebar tab: 'orders' | 'press' | 'treaties'
  const [sidebarTab, setSidebarTab] = useState('orders');
  const [pressUnread, setPressUnread] = useState(0);
  const [showLinks, setShowLinks] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(null);
  // All treaties — subscribed here (not in Treaties tab) so map borders are always current
  const [allTreaties, setAllTreaties] = useState([]);
  useEffect(() => {
    if (!gameCode) return;
    return onTreatiesSnapshot(gameCode, setAllTreaties);
  }, [gameCode]);
  const visibleTreaties = allTreaties.filter(t => isAdmin || myPowers.some(p => t.parties.includes(p)));
  const activeTreaties = visibleTreaties.filter(t => t.status === 'active');
  const pendingTreaties = visibleTreaties.filter(t => t.status === 'pending');
  const treatiesPendingCount = pendingTreaties.filter(t => myPower && !t.signatures.includes(myPower)).length;

  // Responsive layout: column on narrow screens
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync units, owners, and retreatPhase from Firestore whenever the server state changes
  useEffect(() => {
    if (!gameData) return;
    if (gameData.units) setUnits(gameData.units);
    // owners = official supply-center ownership, which only transfers at the end of Fall.
    // Live occupation (units currently standing on a territory) is colored separately in
    // DipMap, so the darker "owned" shade never appears until ownership actually transfers.
    if (gameData.owners) setOwners(gameData.owners);
    if (gameData.lastOccupied) setLastOccupied(gameData.lastOccupied);
    if ('lastPhaseLog' in gameData) setLastPhaseLog(gameData.lastPhaseLog ?? null);
    // Sync retreat phase from Firestore (null clears local retreat phase too)
    if (gameData.retreatPhase !== undefined) {
      setRetreatPhase(gameData.retreatPhase
        ? { dislodged: gameData.retreatPhase.dislodged, retreatOrders: gameData.retreatPhase.retreatOrders ?? {} }
        : null);
    }
    // Sync winter phase from Firestore
    if (gameData.winterPhase !== undefined) {
      setWinterPhase(gameData.winterPhase ?? null);
      if (!gameData.winterPhase) setWinterOrders({});
    }
    // Sync local orders from Firestore: restore submitted/draft orders on refresh, clear on new turn
    if (isMultiplayer && gameData.orders && myPowers.length > 0) {
      const merged = {};
      myPowers.forEach(p => { if (gameData.orders[p]) Object.assign(merged, gameData.orders[p]); });
      if (Object.keys(merged).length > 0) {
        // Player has submitted orders — restore them
        setOrders(merged);
      } else {
        // Not submitted — try draft orders first
        const draft = {};
        myPowers.forEach(p => { if (gameData.draftOrders?.[p]) Object.assign(draft, gameData.draftOrders[p]); });
        if (Object.keys(draft).length > 0) {
          setOrders(draft);
          setSavedOrders(JSON.parse(JSON.stringify(draft)));
        } else if (Object.keys(gameData.orders).every(k => !gameData.orders[k])) {
          // All orders null + no draft = genuinely new turn, reset
          setOrders({});
          setSavedOrders(null);
        }
      }
    }
  }, [gameData]);

  // Auto-resolve when all orders are in (admin only, requires settings.autoResolve)
  const autoResolvingRef = useRef(false);
  useEffect(() => {
    if (!isAdmin || !gameData?.settings?.autoResolve || autoResolvingRef.current) return;
    const phase = gameData.phase;
    if (phase === 'spring-move' || phase === 'fall-move') {
      const allIn = activePowers.every(p => gameData.orders?.[p] != null);
      if (allIn) {
        autoResolvingRef.current = true;
        resolveOrdersMultiplayer().finally(() => { autoResolvingRef.current = false; });
      }
    } else if (phase === 'spring-retreat' || phase === 'fall-retreat') {
      const dislodged = gameData.retreatPhase?.dislodged ?? [];
      const retreatOrders = gameData.retreatPhase?.retreatOrders ?? {};
      const allIn = dislodged.every(({ unit }) => retreatOrders[unit.id] != null);
      if (allIn && dislodged.length > 0) {
        autoResolvingRef.current = true;
        resolveRetreatsMultiplayer().finally(() => { autoResolvingRef.current = false; });
      }
    } else if (phase === 'winter') {
      const adj = gameData.winterPhase?.adjustments ?? {};
      const submittedOrders = gameData.winterPhase?.orders ?? {};
      const allIn = activePowers.every(p => (adj[p] ?? 0) === 0 || submittedOrders[p] != null);
      if (allIn) {
        autoResolvingRef.current = true;
        resolveWinterMultiplayer().finally(() => { autoResolvingRef.current = false; });
      }
    }
  }, [gameData]);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'm' || e.key === 'M') { setMode(m => m === 'move' ? null : 'move'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }
      if (e.key === 's' || e.key === 'S') { setMode(m => m === 'support' ? null : 'support'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }
      if (e.key === 'c' || e.key === 'C') { setMode(m => m === 'convoy' ? null : 'convoy'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function findUnit(id) {
    return units.find(u => u.id === id || u.id.startsWith(id + '-')) || null;
  }

  function resetMode() {
    setMode(null);
    setSelectedUnit(null);
    setSupportTarget(null);
    setConvoyArmy(null);
    setCoastChoice(null);
  }

  function handleTerritoryClick(id) {
    // In multiplayer, only allow interacting with own power's units; lock when submitted
    if (submitted) return;
    if (mode === 'support') {
      if (!selectedUnit) {
        const unit = findUnit(id);
        if (myPowers.length > 0 && !myPowers.includes(unit?.power)) return;
        setSelectedUnit(unit);
      } else if (!supportTarget) {
        // Step 2: pick the unit to support
        const isSelected = selectedUnit.id === id || selectedUnit.id.startsWith(id + '-');
        if (isSelected) { setSelectedUnit(null); return; }
        const targetUnit = findUnit(id);
        if (targetUnit) setSupportTarget(targetUnit);
      } else {
        // Step 3: destination must be in the supporter's valid moves
        const validDests = getDisplayMoves(selectedUnit);
        if (!validDests.has(id)) return; // not a legal support destination
        const targetBase = supportTarget.id.includes('-') ? supportTarget.id.split('-')[0] : supportTarget.id;
        const isHold = id === targetBase;
        const dest = isHold ? null : id;
        setOrders(prev => ({ ...prev, [selectedUnit.id]: { type: 'support', target: supportTarget.id, dest } }));
        resetMode();
      }
      return;
    }

    if (mode === 'convoy') {
      if (!selectedUnit) {
        // Step 1: pick a fleet in a water territory (must be own power's unit)
        const unit = findUnit(id);
        if (unit && unit.type === 'F' && territories[unit.id] && territories[unit.id].type === 'water') {
          if (myPowers.length > 0 && !myPowers.includes(unit.power)) return;
          setSelectedUnit(unit);
        }
      } else if (!convoyArmy) {
        // Step 2: pick an army
        const isSelected = selectedUnit.id === id || selectedUnit.id.startsWith(id + '-');
        if (isSelected) { setSelectedUnit(null); return; }
        const unit = findUnit(id);
        if (unit && unit.type === 'A') setConvoyArmy(unit);
      } else {
        // Step 3: pick a destination (army type restriction applies)
        if (canOrderTo('A', id)) {
          setOrders(prev => ({ ...prev, [selectedUnit.id]: { type: 'convoy', army: convoyArmy.id, dest: id } }));
          resetMode();
        }
      }
      return;
    }

    // mode === 'move'
    if (mode !== 'move') return;
    if (selectedUnit) {
      const isSelected = selectedUnit.id === id || selectedUnit.id.startsWith(id + '-');
      if (isSelected) { setSelectedUnit(null); return; }
      if (canOrderTo(selectedUnit.type, id)) {
        // For fleets, additionally enforce coast-aware adjacency from the fleet's move list
        if (selectedUnit.type === 'F') {
          const fleetMoves = territories[selectedUnit.id]?.moves.fleet || [];
          const baseDestId = id.includes('-') ? id.split('-')[0] : id;
          const canReach = fleetMoves.some(m => m === id || (m.includes('-') ? m.split('-')[0] : m) === baseDestId);
          if (!canReach) { setSelectedUnit(null); return; }
          // Check if ambiguous (multiple coasts reachable)
          const reachableCoasts = fleetMoves.filter(m => m.startsWith(baseDestId + '-'));
          if (reachableCoasts.length > 1) {
            setCoastChoice({ unitId: selectedUnit.id, coasts: reachableCoasts });
            setSelectedUnit(null);
            return;
          }
        }
        const dest = selectedUnit.type === 'F' ? resolveFleetDest(selectedUnit.id, id) : id;
        setOrders(prev => ({ ...prev, [selectedUnit.id]: { type: 'move', dest } }));
        resetMode();
      } else {
        setSelectedUnit(findUnit(id));
      }
    } else {
      const unit = findUnit(id);
      if (myPowers.length > 0 && !myPowers.includes(unit?.power)) return;
      setSelectedUnit(unit);
    }
  }

  async function handleSaveOrders() {
    if (!gameCode || myPowers.length === 0) return;
    for (const power of myPowers) {
      const powerOrders = {};
      units.filter(u => u.power === power).forEach(u => {
        if (orders[u.id]) powerOrders[u.id] = orders[u.id];
      });
      await saveDraftOrders(gameCode, power, powerOrders);
    }
    setSavedOrders(JSON.parse(JSON.stringify(orders)));
  }

  async function handleSubmitOrders() {
    if (!gameCode || myPowers.length === 0) return;
    setSubmitting(true);
    try {
      for (const power of myPowers) {
        const powerOrders = {};
        units.filter(u => u.power === power).forEach(u => {
          if (orders[u.id]) powerOrders[u.id] = orders[u.id];
        });
        await submitOrders(gameCode, power, powerOrders);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Return submitted orders to the editable draft stage without discarding them.
  async function handleEditOrders() {
    if (!gameCode || myPowers.length === 0) return;
    for (const power of myPowers) {
      const powerOrders = {};
      units.filter(u => u.power === power).forEach(u => {
        if (orders[u.id]) powerOrders[u.id] = orders[u.id];
      });
      await unsubmitOrders(gameCode, power, powerOrders);
    }
    // Keep the current orders and mark them saved so the UI returns to the
    // "Submit Orders" (draft) stage instead of wiping everything.
    setSavedOrders(JSON.parse(JSON.stringify(orders)));
  }

  function cancelOrder(unitId) {
    setOrders(prev => { const next = { ...prev }; delete next[unitId]; return next; });
  }

  // ── Phase log helpers ────────────────────────────────────────────────────

  function buildMoveLog(unitList, flatOrders, result, phase, year, oldOwners, newOwners) {
    const base = id => id.includes('-') ? id.split('-')[0] : id;
    const { succeeded, moves, origDest, dislodgedIds, attackerOf, convoyed, originalConvoyed, cutBy, moveSupports = {}, holdSupports = {}, attackStrength = {}, holdStrength = {} } = result;
    const unitById = Object.fromEntries(unitList.map(u => [u.id, u]));
    const entries = [];
    // Describe supporter units (power/type/source) for the phase log
    const supDesc = uid => { const s = unitById[uid]; return s ? { power: s.power, unitType: s.type, from: base(uid) } : null; };
    const movers = uid => (moveSupports[uid] ?? []).map(supDesc).filter(Boolean);
    const holders = uid => (holdSupports[uid] ?? []).map(supDesc).filter(Boolean);

    // Successful moves (regular and convoyed)
    succeeded.forEach(uid => {
      if (!moves[uid]) return;
      const u = unitById[uid];
      if (!u) return;
      entries.push({ ev: convoyed.has(uid) ? 'convoy' : 'move', power: u.power, unitType: u.type, from: base(uid), to: origDest[uid], strength: attackStrength[uid] ?? 1, supports: movers(uid) });
    });

    // Disrupted convoys
    originalConvoyed.forEach(uid => {
      if (convoyed.has(uid)) return;
      const u = unitById[uid];
      if (!u) return;
      entries.push({ ev: 'convoy_disrupted', power: u.power, unitType: u.type, from: base(uid), intended_to: origDest[uid] });
    });

    // Bounced moves
    Object.keys(moves).forEach(uid => {
      if (succeeded.has(uid) || dislodgedIds.has(uid)) return;
      const u = unitById[uid];
      if (!u) return;
      const dest = moves[uid];
      const rivals = Object.keys(moves)
        .filter(vid => vid !== uid && moves[vid] === dest && !succeeded.has(vid))
        .map(vid => { const v = unitById[vid]; return v ? { power: v.power, unitType: v.type, from: base(vid) } : null; })
        .filter(Boolean);
      entries.push({ ev: 'bounce', power: u.power, unitType: u.type, from: base(uid), intended_to: origDest[uid], rivals, strength: attackStrength[uid] ?? 1, supports: movers(uid) });
    });

    // Dislodged
    dislodgedIds.forEach(uid => {
      const u = unitById[uid];
      if (!u) return;
      const attackerUid = attackerOf[base(uid)];
      const attacker = attackerUid ? unitById[attackerUid] : null;
      entries.push({ ev: 'dislodge', power: u.power, unitType: u.type, at: base(uid), by: attacker ? { power: attacker.power, unitType: attacker.type, from: base(attackerUid) } : null, byStrength: attackerUid ? (attackStrength[attackerUid] ?? 1) : null, bySupports: attackerUid ? movers(attackerUid) : [] });
    });

    // Support cuts
    Object.entries(cutBy).forEach(([supporterId, attackerId]) => {
      const supporter = unitById[supporterId];
      const attacker = unitById[attackerId];
      if (!supporter) return;
      const o = flatOrders[supporterId];
      const tgt = o?.target ? unitById[o.target] : null;
      entries.push({
        ev: 'support_cut', power: supporter.power, unitType: supporter.type, at: base(supporterId),
        by: attacker ? { power: attacker.power, unitType: attacker.type, from: base(attackerId) } : null,
        wasSupporting: tgt ? { power: tgt.power, unitType: tgt.type, at: base(o.target), dest: o.dest ?? null } : null,
      });
    });

    // Units that held against attack
    const heldAgainst = {};
    Object.keys(moves).forEach(uid => {
      if (succeeded.has(uid)) return;
      const dest = moves[uid];
      const defUid = unitList.find(u => base(u.id) === dest)?.id;
      if (!defUid || dislodgedIds.has(defUid)) return;
      if (!heldAgainst[defUid]) heldAgainst[defUid] = [];
      const a = unitById[uid];
      if (a) heldAgainst[defUid].push({ power: a.power, unitType: a.type, from: base(uid) });
    });
    Object.entries(heldAgainst).forEach(([defUid, attackers]) => {
      const def = unitById[defUid];
      if (!def) return;
      entries.push({ ev: 'held', power: def.power, unitType: def.type, at: base(defUid), attackers, defense: holdStrength[defUid] ?? 1, holdSupports: holders(defUid) });
    });

    // SC captures (fall only)
    const scChanges = [];
    if ((phase === 'fall-move') && newOwners && oldOwners) {
      Object.keys(newOwners).forEach(tid => {
        if (!territories[tid]?.supplyCenter) return;
        if (newOwners[tid] !== (oldOwners[tid] ?? null))
          scChanges.push({ power: newOwners[tid], territory: tid, from_power: oldOwners[tid] ?? null });
      });
    }

    return { phase, year, entries, scChanges, retreatEntries: null };
  }

  function buildRetreatLog(dislodgedList, fullRetreats, conflictSet) {
    const base = id => id.includes('-') ? id.split('-')[0] : id;
    return dislodgedList.map(({ unit }) => {
      const dest = fullRetreats[unit.id];
      if (!dest || dest === 'disband') return { ev: 'disband', power: unit.power, unitType: unit.type, at: base(unit.id) };
      if (conflictSet.has(dest)) return { ev: 'retreat_clash', power: unit.power, unitType: unit.type, at: base(unit.id), intended_to: dest };
      return { ev: 'retreat', power: unit.power, unitType: unit.type, from: base(unit.id), to: dest };
    });
  }

  function runResolver(unitList, orderMap) {
    const result = resolve(unitList, orderMap);
    const pending = result.dislodged.filter(d => d.retreatOptions.length > 1);
    const autoOrders = {};
    result.dislodged.forEach(d => {
      if (d.retreatOptions.length === 1) autoOrders[d.unit.id] = d.retreatOptions[0];
      else if (d.retreatOptions.length === 0) autoOrders[d.unit.id] = 'disband';
    });
    return { result, pending, autoOrders };
  }

  function resolveOrders() {
    // Local (non-multiplayer) resolution
    const { result, pending, autoOrders } = runResolver(units, orders);
    if (pending.length > 0) {
      setUnits(result.units);
      setOwners(prev => ownersFromUnits(prev, result.units));
      setLastOccupied(prev => ownersFromUnits(prev, result.units));
      setRetreatPhase({ dislodged: pending, retreatOrders: autoOrders });
    } else {
      applyRetreats(result.units, result.dislodged, autoOrders);
    }
    setOrders({});
    resetMode();
  }

  async function resolveOrdersMultiplayer() {
    if (!gameData || !gameCode) return;
    const flatOrders = {};
    Object.values(gameData.orders ?? {}).forEach(powerOrders => {
      if (powerOrders) Object.assign(flatOrders, powerOrders);
    });
    const { result, pending, autoOrders } = runResolver(gameData.units ?? units, flatOrders);
    const isFall = gameData.phase === 'fall-move';
    // SC ownership only updates at end of Fall
    const movedOwners = isFall ? ownersFromUnits(owners, result.units) : owners;
    // lastOccupied tracks last-standing power for every territory, updated every resolution
    const movedLastOccupied = ownersFromUnits(lastOccupied, result.units);
    const log = buildMoveLog(gameData.units ?? units, flatOrders, result, gameData.phase, gameData.year, owners, movedOwners);
    const moveEntry = { phase: gameData.phase, year: gameData.year, ordersByPower: historyMoveOrders(gameData.units ?? units, flatOrders) };
    if (pending.length > 0) {
      const retreatData = { dislodged: pending, retreatOrders: autoOrders };
      await writeResolution(gameCode, result.units, movedOwners, retreatData, gameData.phase, gameData.year, null, null, log, [moveEntry], movedLastOccupied);
    } else {
      const { newUnits, conflicts } = applyRetreatsCalc(result.units, result.dislodged, autoOrders);
      const finalOwners = isFall ? ownersFromUnits(movedOwners, newUnits) : owners;
      const finalLastOccupied = ownersFromUnits(movedLastOccupied, newUnits);
      const winner = isFall ? checkWinner(finalOwners) : null;
      const winterData = isFall && !winner ? buildWinterData(finalOwners, newUnits) : null;
      const retreatEntries = buildRetreatLog(result.dislodged, autoOrders, conflicts);
      const fullLog = { ...log, retreatEntries: retreatEntries.length > 0 ? retreatEntries : null };
      const histEntries = [moveEntry];
      if (result.dislodged.length > 0) {
        const retreatPhaseName = gameData.phase === 'spring-move' ? 'spring-retreat' : 'fall-retreat';
        histEntries.push({ phase: retreatPhaseName, year: gameData.year, ordersByPower: historyRetreatOrders(result.dislodged, autoOrders) });
      }
      await writeResolution(gameCode, newUnits, finalOwners, null, gameData.phase, gameData.year, winterData, winner, fullLog, histEntries, finalLastOccupied);
    }
    resetMode();
  }

  // Pure calculation — returns newUnits and conflict set without touching state
  function applyRetreatsCalc(currentUnits, dislodged, retreatOrders) {
    const destinations = Object.entries(retreatOrders)
      .filter(([, d]) => d !== 'disband')
      .map(([, d]) => d);
    const conflicts = new Set(
      destinations.filter((d, i) => destinations.indexOf(d) !== i)
    );
    const newUnits = [...currentUnits];
    dislodged.forEach(({ unit }) => {
      const dest = retreatOrders[unit.id];
      if (!dest || dest === 'disband' || conflicts.has(dest)) return;
      const t = territories[dest] ?? territories[dest.split('-')[0]];
      if (!t?.unitCoord) return;
      newUnits.push({ ...unit, id: dest, x: t.unitCoord.x, y: t.unitCoord.y });
    });
    return { newUnits, conflicts };
  }

  function applyRetreats(currentUnits, dislodged, retreatOrders) {
    const { newUnits } = applyRetreatsCalc(currentUnits, dislodged, retreatOrders);
    setUnits(newUnits);
    setOwners(prev => ownersFromUnits(prev, newUnits));
    setLastOccupied(prev => ownersFromUnits(prev, newUnits));
    setRetreatPhase(null);
  }

  async function resolveRetreatsMultiplayer() {
    if (!gameData || !gameCode) return;
    const { dislodged, retreatOrders } = gameData.retreatPhase;
    const fullOrders = { ...retreatOrders };
    dislodged.forEach(({ unit }) => {
      if (!fullOrders[unit.id]) fullOrders[unit.id] = 'disband';
    });
    const { newUnits, conflicts } = applyRetreatsCalc(gameData.units ?? units, dislodged, fullOrders);
    const isFallRetreat = gameData.phase === 'fall-retreat';
    const finalOwners = isFallRetreat ? ownersFromUnits(owners, newUnits) : owners;
    const finalLastOccupied = ownersFromUnits(lastOccupied, newUnits);
    const winner = isFallRetreat ? checkWinner(finalOwners) : null;
    const winterData = isFallRetreat && !winner ? buildWinterData(finalOwners, newUnits) : null;
    const retreatEntries = buildRetreatLog(dislodged, fullOrders, conflicts);
    // Merge retreat entries into the existing move log (null if game predates this feature)
    const updatedLog = gameData.lastPhaseLog
      ? { ...gameData.lastPhaseLog, retreatEntries }
      : null;
    const retreatEntry = { phase: gameData.phase, year: gameData.year, ordersByPower: historyRetreatOrders(dislodged, fullOrders) };
    await writeResolution(gameCode, newUnits, finalOwners, null, gameData.phase, gameData.year, winterData, winner, updatedLog, [retreatEntry], finalLastOccupied);
    resetMode();
  }

  async function handleSubmitRetreatsMultiplayer() {
    if (!gameCode || myPowers.length === 0 || !retreatPhase) return;
    const myDislodged = retreatPhase.dislodged.filter(d => myPowers.includes(d.unit.power));
    const myOrders = {};
    myDislodged.forEach(({ unit }) => {
      myOrders[unit.id] = retreatPhase.retreatOrders[unit.id] ?? 'disband';
    });
    await submitRetreatOrders(gameCode, myOrders);
  }

  async function handleSubmitWinterOrders() {
    if (!gameCode || myPowers.length === 0 || !winterPhase) return;
    for (const power of myPowers) {
      const adj = winterPhase.adjustments?.[power] ?? 0;
      if (adj !== 0 && !winterPhase.orders?.[power]) {
        const pOrders = winterOrders[power] ?? { builds: [], disbands: [] };
        await submitWinterOrders(gameCode, power, pOrders.builds, pOrders.disbands);
      }
    }
  }

  async function resolveWinterMultiplayer() {
    if (!gameData?.winterPhase || !gameCode) return;
    const { adjustments, orders: wOrders } = gameData.winterPhase;
    let newUnits = [...(gameData.units ?? units)];
    const preUnitById = Object.fromEntries((gameData.units ?? units).map(u => [u.id, u]));
    const winterByPower = {};
    POWERS.forEach(power => {
      const adj = adjustments[power] ?? 0;
      const powerOrders = wOrders?.[power];
      if (adj < 0) {
        const needed = Math.abs(adj);
        const submitted = powerOrders?.disbands ?? [];
        let toDisband = submitted.slice(0, needed);
        if (toDisband.length < needed) {
          // Player didn't specify enough disbands (passive powers never submit):
          // remove random units to cover the shortfall.
          const extra = newUnits.filter(u => u.power === power && !toDisband.includes(u.id));
          for (let i = extra.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [extra[i], extra[j]] = [extra[j], extra[i]];
          }
          toDisband = [...toDisband, ...extra.slice(0, needed - toDisband.length).map(u => u.id)];
        }
        toDisband.forEach(id => {
          const du = preUnitById[id];
          (winterByPower[power] ??= []).push(`Disband ${du ? du.type + ' ' : ''}${displayId(id)}`);
        });
        newUnits = newUnits.filter(u => !(u.power === power && toDisband.includes(u.id)));
      } else if (adj > 0 && powerOrders?.builds?.length > 0) {
        const currentOwners = gameData.owners ?? owners;
        const builds = powerOrders.builds.slice(0, adj);
        builds.forEach(({ territory, type }) => {
          const t = territories[territory];
          if (!t?.unitCoord) return;
          const occupied = newUnits.some(u => (u.id.includes('-') ? u.id.split('-')[0] : u.id) === territory);
          if (!occupied && currentOwners[territory] === power) {
            newUnits.push({ id: territory, type, power, x: t.unitCoord.x, y: t.unitCoord.y });
            (winterByPower[power] ??= []).push(`Build ${type} ${displayId(territory)}`);
          }
        });
      }
    });
    const historyEntry = { phase: 'winter', year: gameData.year ?? 1901, ordersByPower: winterByPower };
    const finalLastOccupied = ownersFromUnits(lastOccupied, newUnits);
    await writeWinterResolution(gameCode, newUnits, gameData.year ?? 1901, historyEntry, finalLastOccupied);
    resetMode();
  }

  function submitRetreats() {
    if (!retreatPhase) return;
    const { dislodged, retreatOrders } = retreatPhase;
    applyRetreats(units, dislodged, retreatOrders);
  }

  function unitPositions(filterFn) {
    return new Set(units.filter(filterFn).map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
  }

  function getValidMovesForMode() {
    if (mode === 'support') {
      if (!selectedUnit) return unitPositions(() => true);
      if (!supportTarget) return unitPositions(u => u.id !== selectedUnit.id);
      // Step 3: destination must be somewhere the supporter can legally move to
      return getDisplayMoves(selectedUnit);
    }
    if (mode === 'convoy') {
      if (!selectedUnit) return unitPositions(u => u.type === 'F' && territories[u.id] && territories[u.id].type === 'water');
      if (!convoyArmy) return unitPositions(u => u.type === 'A');
      // Step 3: any non-water territory
      return new Set(Object.keys(territories).filter(id => {
        const t = territories[id];
        return !id.includes('-') && t.type !== 'water' && t.type !== 'impassable';
      }));
    }
    // move mode
    if (!selectedUnit) return mode === 'move' ? unitPositions(() => true) : new Set();
    return getDisplayMoves(selectedUnit);
  }

  function hintText() {
    if (mode === 'support') {
      if (!selectedUnit) return 'SUPPORT: click the unit giving support';
      if (!supportTarget) return `SUPPORT: ${selectedUnit.type} ${displayId(selectedUnit.id)} — click the unit to support`;
      return `SUPPORT: ${selectedUnit.type} ${displayId(selectedUnit.id)} S ${supportTarget.type} ${displayId(supportTarget.id)} — click a reachable destination, or click ${displayId(supportTarget.id.includes('-') ? supportTarget.id.split('-')[0] : supportTarget.id)} again to support hold`;
    }
    if (mode === 'convoy') {
      if (!selectedUnit) return 'CONVOY: click a fleet to do the convoying';
      if (!convoyArmy) return `CONVOY: F ${displayId(selectedUnit.id)} — click the army to convoy`;
      return `CONVOY: F ${displayId(selectedUnit.id)} C A ${displayId(convoyArmy.id)} — click the destination`;
    }
    if (selectedUnit) return `${selectedUnit.power} ${selectedUnit.type} ${displayId(selectedUnit.id)} — click a territory to move`;
    if (mode === 'move') return 'MOVE: click a unit to select it';
    return 'Observer mode — select an order type to begin';
  }

  const phaseLabel = gameData
    ? `${gameData.phase?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} ${gameData.year}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
      <div style={{ textAlign: 'center', margin: '0.5rem 0 0', flexShrink: 0, userSelect: 'none', lineHeight: 1.1 }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontFamily: '"Cinzel Decorative", serif', fontWeight: 700, letterSpacing: '0.04em' }}>Dickplomacy</h1>
        {phaseLabel && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{phaseLabel}</div>}
        {myPowers.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
            {myPowers.map((p, i) => (
              <div key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: POWER_COLOR[p], color: '#fff', padding: '3px 12px 3px 6px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', ...(i > 0 ? { marginLeft: -6, border: '2px solid #fff' } : {}) }}>
                <img src={FLAGS[p]} alt={p} style={{ height: 18, width: 27, objectFit: 'cover', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.25)', flexShrink: 0 }} />
                {p}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : '0.75rem', padding: '0.5rem 0.75rem', position: 'relative' }}>

        {/* Winner overlay */}
        {gameData?.winner && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: POWER_COLOR[gameData.winner], color: '#fff', padding: '2.5rem 3.5rem', borderRadius: 14, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', userSelect: 'none' }}>
              <div style={{ fontSize: 13, letterSpacing: '0.15em', opacity: 0.85, marginBottom: 6 }}>VICTORY</div>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '0.04em' }}>{gameData.winner}</div>
              <div style={{ fontSize: 14, marginTop: 10, opacity: 0.9 }}>has conquered 18 supply centres</div>
            </div>
          </div>
        )}

        {/* Orders panel */}
        <div style={{ width: isMobile ? '100%' : 210, flexShrink: 0, order: isMobile ? 2 : 0, flex: isMobile ? '0 0 auto' : undefined, maxHeight: isMobile ? '42vh' : undefined, overflowY: isMobile ? 'auto' : undefined, borderTop: isMobile ? '1px solid #e0e0e0' : undefined, paddingTop: isMobile ? 6 : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isMultiplayer && (
            <div style={{ display: 'flex', flexShrink: 0, marginBottom: 4 }}>
              <button
                onClick={() => setSidebarTab('orders')}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: sidebarTab === 'orders' ? '#1a1a2e' : '#eee', color: sidebarTab === 'orders' ? '#fff' : '#555', border: 'none', borderRight: '1px solid #ddd', borderRadius: '3px 0 0 3px' }}
              >Orders</button>
              <button
                onClick={() => setSidebarTab('press')}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: sidebarTab === 'press' ? '#1a1a2e' : '#eee', color: sidebarTab === 'press' ? '#fff' : '#555', border: 'none', borderRight: '1px solid #ddd', borderRadius: 0 }}
              >Press{pressUnread > 0 && <span style={{ marginLeft: 3, background: '#b22', color: '#fff', borderRadius: 7, padding: '0 4px', fontSize: 9 }}>{pressUnread}</span>}</button>
              <button
                onClick={() => setSidebarTab('treaties')}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: sidebarTab === 'treaties' ? '#1a1a2e' : '#eee', color: sidebarTab === 'treaties' ? '#fff' : '#555', border: 'none', borderRight: '1px solid #ddd', borderRadius: 0 }}
              >Treaty{treatiesPendingCount > 0 && <span style={{ marginLeft: 3, background: '#b22', color: '#fff', borderRadius: 7, padding: '0 4px', fontSize: 9 }}>{treatiesPendingCount}</span>}</button>
              <button
                onClick={() => setSidebarTab('log')}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: sidebarTab === 'log' ? '#1a1a2e' : '#eee', color: sidebarTab === 'log' ? '#fff' : '#555', border: 'none', borderRadius: '0 3px 3px 0' }}
              >Log</button>
            </div>
          )}
          {sidebarTab === 'orders' && (retreatPhase ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#b22', letterSpacing: '0.03em', padding: '4px 0' }}>⚠ RETREAT PHASE</div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {retreatPhase.dislodged.map(({ unit, retreatOptions }) => {
                  const chosenDest = retreatPhase.retreatOrders[unit.id];
                  const canEdit = !isMultiplayer || myPowers.includes(unit.power);
                  const lockedInFirestore = isMultiplayer && !!gameData?.retreatPhase?.retreatOrders?.[unit.id];
                  const interactive = canEdit && !lockedInFirestore;
                  // Filter out any territory currently occupied by a surviving unit
                  const survivingOccupied = new Set(units.map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
                  const validOptions = retreatOptions.filter(tid => !survivingOccupied.has(tid.includes('-') ? tid.split('-')[0] : tid));
                  return (
                    <div key={unit.id} style={{ borderLeft: `3px solid ${POWER_COLOR[unit.power]}`, paddingLeft: 7, marginBottom: 8, opacity: (!canEdit) ? 0.5 : 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: POWER_COLOR[unit.power], marginBottom: 3 }}>
                        {unit.power}: {unit.type} {displayId(unit.id)} (dislodged)
                        {lockedInFirestore && <span style={{ fontWeight: 400, color: '#2a6e2a', marginLeft: 4 }}>✓</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {validOptions.map(tid => (
                          <button key={tid} onClick={() => { if (!interactive) return; setRetreatPhase(prev => ({ ...prev, retreatOrders: { ...prev.retreatOrders, [unit.id]: tid } })); }} style={{ padding: '4px 6px', cursor: interactive ? 'pointer' : 'default', fontSize: 11, textAlign: 'left', background: chosenDest === tid ? '#1a1a2e' : '#eee', color: chosenDest === tid ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 3, fontWeight: chosenDest === tid ? 700 : 400 }}>→ {displayId(tid)}</button>
                        ))}
                        {interactive && (<button onClick={() => setRetreatPhase(prev => ({ ...prev, retreatOrders: { ...prev.retreatOrders, [unit.id]: 'disband' } }))} style={{ padding: '4px 6px', cursor: 'pointer', fontSize: 11, textAlign: 'left', background: chosenDest === 'disband' ? '#b22' : '#eee', color: chosenDest === 'disband' ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 3 }}>✕ Disband</button>)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {isMultiplayer ? (
                isAdmin ? (
                  <button onClick={resolveRetreatsMultiplayer} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: 'pointer', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em' }}>▶ Resolve Retreats</button>
                ) : (() => {
                  const myDislodged = retreatPhase.dislodged.filter(d => myPowers.includes(d.unit.power));
                  if (myDislodged.length === 0) return <div style={{ fontSize: 11, color: '#888', textAlign: 'center', padding: '6px 0' }}>Waiting for retreat resolution…</div>;
                  const retreatSubmitted = myDislodged.every(d => gameData?.retreatPhase?.retreatOrders?.[d.unit.id]);
                  if (retreatSubmitted) return <div style={{ padding: '7px 6px', fontWeight: 'bold', background: '#2a6e2a', color: '#fff', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>✓ Retreat Submitted</div>;
                  const allChosen = myDislodged.every(d => retreatPhase.retreatOrders[d.unit.id]);
                  return <button onClick={handleSubmitRetreatsMultiplayer} disabled={!allChosen} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: allChosen ? 'pointer' : 'default', background: '#8a0000', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: allChosen ? 1 : 0.5 }}>▶ Submit Retreat</button>;
                })()
              ) : (
                <button onClick={submitRetreats} disabled={retreatPhase.dislodged.some(d => !retreatPhase.retreatOrders[d.unit.id])} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: 'pointer', background: '#8a0000', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: retreatPhase.dislodged.some(d => !retreatPhase.retreatOrders[d.unit.id]) ? 0.5 : 1 }}>▶ Submit Retreats</button>
              )}
            </>
          ) : winterPhase && isMultiplayer ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#4a0080', letterSpacing: '0.03em', padding: '4px 0' }}>❄ WINTER ADJUSTMENTS</div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {POWERS.map(power => {
                  const adj = winterPhase.adjustments?.[power] ?? 0;
                  const submitted = !!winterPhase.orders?.[power];
                  const isMe = myPowers.includes(power);
                  const availSCs = getAvailableBuildSCs(power, owners, units);
                  return (
                    <div key={power} style={{ borderLeft: `3px solid ${POWER_COLOR[power]}`, paddingLeft: 7, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[power], marginBottom: 3, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <img src={FLAGS[power]} alt={power} style={{ height: 11, width: 17, objectFit: 'cover', borderRadius: 1, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                        <span>{power}</span>
                        <span style={{ fontWeight: 400, color: adj > 0 ? '#2a6e2a' : adj < 0 ? '#b22' : '#888' }}>{adj > 0 ? `+${adj}` : adj < 0 ? String(adj) : '±0'}</span>
                        {submitted && <span style={{ color: '#2a6e2a', marginLeft: 'auto', fontWeight: 700 }}>✓</span>}
                      </div>
                      {isMe && !submitted && adj > 0 && (
                        <div>
                          {availSCs.length === 0 && <div style={{ fontSize: 10, color: '#888' }}>No available home SCs</div>}
                          {availSCs.map(sc => {
                            const pWO = winterOrders[power] ?? { builds: [], disbands: [] };
                            const existing = pWO.builds.find(b => b.territory === sc);
                            const canFleet = territories[sc]?.type !== 'land';
                            const atLimit = !existing && pWO.builds.length >= adj;
                            return (
                              <div key={sc} style={{ display: 'flex', gap: 3, alignItems: 'center', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, width: 28 }}>{displayId(sc)}</span>
                                {['A', canFleet ? 'F' : null].filter(Boolean).map(t => (
                                  <button key={t} onClick={() => { if (atLimit && existing?.type !== t) return; setWinterOrders(prev => { const cur = prev[power] ?? { builds: [], disbands: [] }; const without = cur.builds.filter(b => b.territory !== sc); return { ...prev, [power]: { ...cur, builds: existing?.type === t ? without : [...without, { territory: sc, type: t }] } }; }); }} style={{ padding: '2px 5px', fontSize: 10, background: existing?.type === t ? '#1a1a2e' : '#eee', color: existing?.type === t ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 2, cursor: (atLimit && existing?.type !== t) ? 'default' : 'pointer', opacity: (atLimit && existing?.type !== t) ? 0.4 : 1 }}>{t}</button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isMe && !submitted && adj < 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: '#b22', marginBottom: 2 }}>Disband {Math.abs(adj)}</div>
                          {units.filter(u => u.power === power).map(u => {
                            const pWO = winterOrders[power] ?? { builds: [], disbands: [] };
                            const sel = pWO.disbands.includes(u.id);
                            const atLimit = !sel && pWO.disbands.length >= Math.abs(adj);
                            return <button key={u.id} onClick={() => { if (atLimit) return; setWinterOrders(prev => { const cur = prev[power] ?? { builds: [], disbands: [] }; return { ...prev, [power]: { ...cur, disbands: sel ? cur.disbands.filter(id => id !== u.id) : [...cur.disbands, u.id] } }; }); }} style={{ display: 'block', width: '100%', padding: '2px 5px', fontSize: 10, textAlign: 'left', background: sel ? '#b22' : '#eee', color: sel ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 2, marginBottom: 2, cursor: atLimit ? 'default' : 'pointer', opacity: atLimit ? 0.4 : 1 }}>{u.type} {displayId(u.id)}</button>;
                          })}
                        </div>
                      )}
                      {isMe && !submitted && adj === 0 && <div style={{ fontSize: 10, color: '#888' }}>No adjustment</div>}
                    </div>
                  );
                })}
              </div>
              {isAdmin ? (
                <button onClick={resolveWinterMultiplayer} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: 'pointer', background: '#4a0080', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em' }}>▶ Resolve Winter</button>
              ) : myPowers.length > 0 && (() => {
                const allWinterSubmitted = myPowers.every(p => (winterPhase.adjustments?.[p] ?? 0) === 0 || !!winterPhase.orders?.[p]);
                if (allWinterSubmitted) return <div style={{ padding: '7px 6px', fontWeight: 'bold', background: '#2a6e2a', color: '#fff', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>✓ Adjustments Submitted</div>;
                const anyAdj = myPowers.some(p => (winterPhase.adjustments?.[p] ?? 0) !== 0 && !winterPhase.orders?.[p]);
                if (!anyAdj) return <div style={{ fontSize: 11, color: '#888', textAlign: 'center', padding: '6px 0' }}>Waiting for winter resolution…</div>;
                const canSubmit = myPowers.every(p => {
                  const adj = winterPhase.adjustments?.[p] ?? 0;
                  if (adj === 0 || winterPhase.orders?.[p]) return true;
                  if (adj < 0) return (winterOrders[p]?.disbands?.length ?? 0) === Math.abs(adj);
                  return true;
                });
                return <button onClick={handleSubmitWinterOrders} disabled={!canSubmit} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: canSubmit ? 'pointer' : 'default', background: '#4a0080', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: canSubmit ? 1 : 0.5 }}>▶ Submit Adjustments</button>;
              })()}
            </>
          ) : (
            <>
              {/* Admin: player invite links */}
              {isAdmin && isMultiplayer && (
                <div style={{ marginBottom: 5, flexShrink: 0 }}>
                  <button onClick={() => setShowLinks(l => !l)} style={{ width: '100%', padding: '3px 6px', fontSize: 10, cursor: 'pointer', background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: 3, textAlign: 'left', fontWeight: 700 }}>
                    {showLinks ? '▾' : '▸'} Player Links
                  </button>
                  {showLinks && (
                    <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 3, padding: '5px', marginTop: 3 }}>
                      {(() => {
                        const tokenSlotMap = {};
                        activePowers.forEach(p => {
                          const token = gameData.players[p];
                          if (!tokenSlotMap[token]) tokenSlotMap[token] = [];
                          tokenSlotMap[token].push(p);
                        });
                        return Object.entries(tokenSlotMap).map(([token, powers]) => (
                          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: POWER_COLOR[powers[0]], minWidth: 54, flexShrink: 0 }}>{powers.join('+')}</span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(`https://dickplomacy.github.io/game/#/${gameCode}/${token}`); setCopiedAdminLink(token); setTimeout(() => setCopiedAdminLink(null), 1500); }}
                              style={{ flex: 1, padding: '2px 5px', fontSize: 9, cursor: 'pointer', background: copiedAdminLink === token ? '#2a6e2a' : '#444', color: '#fff', border: 'none', borderRadius: 2, fontWeight: 700 }}
                            >{copiedAdminLink === token ? '✓' : 'Copy'}</button>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
              {/* Resolve button: local mode always shows it; multiplayer only for admin */}
              {(!isMultiplayer || isAdmin) && (
                <button
                  onClick={isMultiplayer ? resolveOrdersMultiplayer : resolveOrders}
                  style={{ padding: '7px 6px', fontWeight: 'bold', cursor: 'pointer', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em' }}
                >
                  ▶ Resolve Orders
                </button>
              )}
              {/* Submit Orders button for non-admin multiplayer players */}
              {isMultiplayer && myPowers.length > 0 && (
                submitted ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <div style={{ flex: 1, padding: '7px 6px', fontWeight: 'bold', background: '#2a6e2a', color: '#fff', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>
                      ✓ Orders Submitted
                    </div>
                    <button
                      onClick={handleEditOrders}
                      style={{ padding: '7px 8px', fontWeight: 'bold', cursor: 'pointer', background: '#666', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11 }}
                      title="Edit orders"
                    >✎</button>
                  </div>
                ) : isSaved ? (
                  <button
                    onClick={handleSubmitOrders}
                    disabled={submitting}
                    style={{ padding: '7px 6px', fontWeight: 'bold', cursor: submitting ? 'default' : 'pointer', background: '#1a5c8a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? 'Submitting…' : '▶ Submit Orders'}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveOrders}
                    style={{ padding: '7px 6px', fontWeight: 'bold', cursor: 'pointer', background: '#5a7a2a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em' }}
                  >
                    💾 Save Orders
                  </button>
                )
              )}
              {/* Player lock checkbox — only show for single-power players; multi-power use per-row buttons */}
              {isMultiplayer && myPower && myPowers.length === 1 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer', userSelect: 'none', color: '#555', padding: '2px 0', flexShrink: 0 }}>
                  <input type="checkbox" checked={lockedPowers.includes(myPower)} onChange={e => setCountryLock(gameCode, myPower, e.target.checked)} style={{ margin: 0, cursor: 'pointer' }} />
                  {lockedPowers.includes(myPower) ? '🔒' : '🔓'} Lock my country from join picker
                </label>
              )}
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={() => { if (submitted) return; setMode(m => m === 'move' ? null : 'move'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }}
                  style={{ flex: 1, padding: '6px 4px', fontWeight: 'bold', cursor: submitted ? 'default' : 'pointer', background: mode === 'move' ? '#2a6e2a' : '#444', color: '#fff', border: mode === 'move' ? '2px solid #7fef7f' : '2px solid transparent', borderRadius: 4, fontSize: 11, opacity: submitted ? 0.4 : 1 }}
                >
                  M Move
                </button>
                <button
                  onClick={() => { if (submitted) return; setMode(m => m === 'support' ? null : 'support'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }}
                  style={{ flex: 1, padding: '6px 4px', fontWeight: 'bold', cursor: submitted ? 'default' : 'pointer', background: mode === 'support' ? '#b8860b' : '#444', color: '#fff', border: mode === 'support' ? '2px solid #ffd700' : '2px solid transparent', borderRadius: 4, fontSize: 11, opacity: submitted ? 0.4 : 1 }}
                >
                  S Support
                </button>
                <button
                  onClick={() => { if (submitted) return; setMode(m => m === 'convoy' ? null : 'convoy'); setSelectedUnit(null); setSupportTarget(null); setConvoyArmy(null); }}
                  style={{ flex: 1, padding: '6px 4px', fontWeight: 'bold', cursor: submitted ? 'default' : 'pointer', background: mode === 'convoy' ? '#1a5c8a' : '#444', color: '#fff', border: mode === 'convoy' ? '2px solid #5bc8ff' : '2px solid transparent', borderRadius: 4, fontSize: 11, opacity: submitted ? 0.4 : 1 }}
                >
                  C Convoy
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {POWERS.map(power => {
                  const powerUnits = units.filter(u => u.power === power);
                  const scCount = Object.entries(owners).filter(([tid, p]) => p === power && SC_IDS.has(tid)).length;
                  // In multiplayer, show whether this power has submitted orders
                  const hasSubmitted = isMultiplayer && !!gameData?.orders?.[power];
                  const isMyPower = myPowers.length === 0 || myPowers.includes(power);
                  const isPassive = passivePowers.includes(power);
                  const isLocked = lockedPowers.includes(power);
                  return (
                    <div key={power} style={{ borderLeft: `3px solid ${POWER_COLOR[power]}`, paddingLeft: 7, marginBottom: 6, opacity: isMyPower ? 1 : 0.3 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[power], textTransform: 'uppercase', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <img src={FLAGS[power]} alt={power} style={{ height: 11, width: 17, objectFit: 'cover', borderRadius: 1, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                        <span>{power}</span>
                        <span style={{ fontWeight: 400, color: '#555' }}>({scCount} SC)</span>
                        {isPassive && <span style={{ fontSize: 8, color: '#888', fontWeight: 400, fontStyle: 'italic' }}>passive</span>}
                        {isMultiplayer && !isPassive && (isAdmin || myPowers.includes(power)) && (
                          <button
                            onClick={() => setCountryLock(gameCode, power, !isLocked)}
                            title={isLocked ? 'Unlock join picker' : 'Lock join picker'}
                            style={{ padding: '0 3px', fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                          >{isLocked ? '🔒' : '🔓'}</button>
                        )}
                        {isMultiplayer && <span style={{ marginLeft: 'auto', fontSize: 9, color: hasSubmitted ? '#2a6e2a' : '#aaa', fontWeight: 700 }}>{hasSubmitted ? '✓' : '…'}</span>}
                      </div>
                      {powerUnits.map(u => {
                        const order = orders[u.id];
                        return (
                          <div key={u.id} style={{ display: 'flex', alignItems: 'center', fontSize: 11, marginBottom: 2, color: order ? '#111' : '#bbb' }}>
                            <span style={{ fontFamily: 'monospace', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {renderOrderText(u, orders, units)}
                            </span>
                            {order && !submitted && isMyPower && (
                              <button
                                onClick={() => cancelOrder(u.id)}
                                style={{ marginLeft: 3, flexShrink: 0, fontSize: 9, padding: '1px 4px', cursor: 'pointer', border: '1px solid #ccc', background: 'none', borderRadius: 2, lineHeight: 1.6, color: '#888' }}
                              >✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ))}
          {sidebarTab === 'press' && isMultiplayer && (
            <Press
              gameCode={gameCode}
              myPower={myPower}
              isAdmin={isAdmin}
              year={gameData?.year}
              phase={gameData?.phase}
              passivePowers={passivePowers}
              onUnreadChange={setPressUnread}
            />
          )}
          {sidebarTab === 'treaties' && isMultiplayer && (
            <Treaties
              gameCode={gameCode}
              myPower={myPower}
              isAdmin={isAdmin}
              year={gameData?.year}
              phase={gameData?.phase}
              passivePowers={passivePowers}
              allTreaties={allTreaties}
            />
          )}
          {sidebarTab === 'log' && isMultiplayer && (() => {
            const historyBtn = (gameData?.history?.length ?? 0) > 0 ? (
              <button onClick={() => setShowHistory(true)} style={{ margin: '6px 0 0', padding: '6px', fontWeight: 700, cursor: 'pointer', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, letterSpacing: '0.03em' }}>📜 Show full order history</button>
            ) : null;
            if (!lastPhaseLog) return (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div style={{ fontSize: 11, color: '#888', padding: '8px 0', textAlign: 'center', flex: 1 }}>No log yet — available after first resolution.</div>
                {historyBtn}
              </div>
            );
            const { phase: logPhase, year: logYear, entries = [], scChanges = [], retreatEntries } = lastPhaseLog;
            const label = `${(logPhase ?? '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} ${logYear ?? ''}`;
            const evOrder = ['dislodge', 'move', 'convoy', 'bounce', 'convoy_disrupted', 'support_cut', 'held', 'retreat', 'retreat_clash', 'disband'];
            const allEntries = [...entries, ...(retreatEntries ?? [])];
            const sorted = [...allEntries].sort((a, b) => evOrder.indexOf(a.ev) - evOrder.indexOf(b.ev));
            const evIcon = { move: '→', convoy: '⛵', bounce: '✗', convoy_disrupted: '⚓✗', dislodge: '💥', support_cut: '✂', held: '🛡', retreat: '↩', disband: '✕', retreat_clash: '↩✗' };
            const evLabel = { move: 'Moved', convoy: 'Convoyed', bounce: 'Bounced', convoy_disrupted: 'Convoy disrupted', dislodge: 'Dislodged', support_cut: 'Support cut', held: 'Held', retreat: 'Retreated', disband: 'Disbanded', retreat_clash: 'Retreat clash' };
            const evColor = { move: '#2a6e2a', convoy: '#1a5c8a', bounce: '#8a4a00', convoy_disrupted: '#8a4a00', dislodge: '#b22', support_cut: '#7a4a8a', held: '#2a4a8a', retreat: '#5a7a2a', disband: '#888', retreat_clash: '#b22' };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ overflowY: 'auto', flex: 1, fontSize: 11 }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#555', padding: '2px 0 6px', letterSpacing: '0.04em' }}>{label}</div>
                {sorted.map((e, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${POWER_COLOR[e.power] ?? '#999'}`, paddingLeft: 6, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: POWER_COLOR[e.power] ?? '#999' }}>{e.power}</span>
                    {' '}<span style={{ color: '#444' }}>{e.unitType} {displayId(e.from ?? e.at ?? '?')}</span>
                    {' '}<span style={{ color: evColor[e.ev], fontWeight: 600 }}>{evIcon[e.ev]} {evLabel[e.ev]}</span>
                    {e.to && <span style={{ color: '#444' }}> → {displayId(e.to)}</span>}
                    {e.intended_to && <span style={{ color: '#888' }}> (→ {displayId(e.intended_to)})</span>}
                    {e.by && <span style={{ color: '#666' }}> by <span style={{ color: POWER_COLOR[e.by.power] ?? '#999', fontWeight: 600 }}>{e.by.power}</span> {e.by.unitType} from {displayId(e.by.from)}</span>}
                    {e.wasSupporting && <span style={{ color: '#888' }}> (S {e.wasSupporting.power} {e.wasSupporting.unitType}{e.wasSupporting.dest ? ` → ${displayId(e.wasSupporting.dest)}` : ' H'})</span>}
                    {e.rivals?.length > 0 && <span style={{ color: '#888' }}> vs {e.rivals.map(r => `${r.power} ${r.unitType}`).join(', ')}</span>}
                    {e.attackers?.length > 0 && <span style={{ color: '#888' }}> vs {e.attackers.map(a => `${a.power} ${a.unitType} from ${displayId(a.from)}`).join(', ')}</span>}
                    {/* Attack strength + supporting units (movers) */}
                    {e.supports?.length > 0 && (
                      <span style={{ color: '#2a6e2a' }}> ⚔{e.strength} (S: {e.supports.map(s => `${s.unitType} ${displayId(s.from)}`).join(', ')})</span>
                    )}
                    {/* Attacker strength + supporters for a dislodge */}
                    {e.bySupports?.length > 0 && (
                      <span style={{ color: '#2a6e2a' }}> ⚔{e.byStrength} (S: {e.bySupports.map(s => `${s.unitType} ${displayId(s.from)}`).join(', ')})</span>
                    )}
                    {/* Defense strength + hold supporters (shown for units that held) */}
                    {e.ev === 'held' && (
                      <span style={{ color: '#2a4a8a' }}> 🛡{e.defense}{e.holdSupports?.length > 0 ? ` (S: ${e.holdSupports.map(s => `${s.unitType} ${displayId(s.from)}`).join(', ')})` : ''}</span>
                    )}
                  </div>
                ))}
                {scChanges.length > 0 && (
                  <div style={{ marginTop: 6, borderTop: '1px solid #eee', paddingTop: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 10, color: '#888', marginBottom: 4, letterSpacing: '0.04em' }}>SC CHANGES</div>
                    {scChanges.map((s, i) => (
                      <div key={i} style={{ borderLeft: `3px solid ${POWER_COLOR[s.power] ?? '#999'}`, paddingLeft: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: POWER_COLOR[s.power] ?? '#999' }}>{s.power}</span>
                        <span style={{ color: '#444' }}> captured {displayId(s.territory)}</span>
                        {s.from_power && <span style={{ color: '#888' }}> from <span style={{ color: POWER_COLOR[s.from_power] ?? '#999' }}>{s.from_power}</span></span>}
                      </div>
                    ))}
                  </div>
                )}
                {sorted.length === 0 && scChanges.length === 0 && <div style={{ color: '#888', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>Nothing to show.</div>}
              </div>
              {historyBtn}
              </div>
            );
          })()}
        </div>

        {/* Map */}
        <div style={{ flex: isMobile ? 'none' : 1, order: isMobile ? 1 : 0, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: mode === 'support' ? '#b8860b' : mode === 'convoy' ? '#1a5c8a' : mode === 'move' ? '#2a6e2a' : '#999', marginBottom: 4, minHeight: '1.4em', fontWeight: mode && mode !== 'move' ? 600 : 400 }}>
            {hintText()}
          </div>
          <div style={{ flex: isMobile ? 'none' : 1, minHeight: 0, position: 'relative', aspectRatio: isMobile ? '1835/1360' : undefined }}>
            <DipMap
              units={units}
              orders={orders}
              territoryOwners={owners}
              lastOccupied={lastOccupied}
              selectedUnit={selectedUnit}
              validMoves={getValidMovesForMode()}
              onTerritoryClick={handleTerritoryClick}
              onTerritoryHover={() => {}}
              demilTerritories={new Set(
                activeTreaties
                  .filter(t => t.type === 'demilitarization' && (isAdmin || (myPower && t.parties.includes(myPower))))
                  .flatMap(t => t.territories)
              )}
              alliedPowers={(() => {
                const allies = new Set();
                const enemies = new Set();
                activeTreaties
                  .filter(t => t.type === 'alliance' && myPower && t.parties.includes(myPower))
                  .forEach(t => {
                    t.parties.filter(p => p !== myPower).forEach(p => allies.add(p));
                    (t.adversaries || []).forEach(p => enemies.add(p));
                  });
                // Remove powers that appear in both (they become orange via conflictPowers)
                enemies.forEach(p => allies.delete(p));
                return allies;
              })()}
              enemyPowers={(() => {
                const allies = new Set();
                const enemies = new Set();
                activeTreaties
                  .filter(t => t.type === 'alliance' && myPower && t.parties.includes(myPower))
                  .forEach(t => {
                    t.parties.filter(p => p !== myPower).forEach(p => allies.add(p));
                    (t.adversaries || []).forEach(p => enemies.add(p));
                  });
                enemies.forEach(p => { if (allies.has(p)) allies.delete(p); });
                return enemies;
              })()}
              conflictPowers={(() => {
                const allies = new Set();
                const enemies = new Set();
                activeTreaties
                  .filter(t => t.type === 'alliance' && myPower && t.parties.includes(myPower))
                  .forEach(t => {
                    t.parties.filter(p => p !== myPower).forEach(p => allies.add(p));
                    (t.adversaries || []).forEach(p => enemies.add(p));
                  });
                return new Set([...allies].filter(p => enemies.has(p)));
              })()}
              claimBorders={(() => {
                const counts = {};
                const m = {};
                activeTreaties
                  .filter(t => t.type === 'claims' && (isAdmin || (myPower && t.parties.includes(myPower))))
                  .forEach(t => Object.entries(t.claims || {}).forEach(([p, ids]) => ids.forEach(id => {
                    counts[id] = (counts[id] || 0) + 1;
                    m[id] = counts[id] > 1 ? 'CONFLICT' : p;
                  })));
                return m;
              })()}
            />
            {coastChoice && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', border: '2px solid #333', borderRadius: 6, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 10, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Choose coast</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {coastChoice.coasts.map(coast => (
                    <button
                      key={coast}
                      onClick={() => {
                        setOrders(prev => ({ ...prev, [coastChoice.unitId]: { type: 'move', dest: coast } }));
                        setCoastChoice(null);
                        resetMode();
                      }}
                      style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 600, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12 }}
                    >
                      {displayId(coast)}
                    </button>
                  ))}
                  <button
                    onClick={() => setCoastChoice(null)}
                    style={{ padding: '6px 10px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc', borderRadius: 4, fontSize: 12, color: '#555' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      {showHistory && (
        <FullOrderHistory history={gameData?.history ?? []} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

export default App;
