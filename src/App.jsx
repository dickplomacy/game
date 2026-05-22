import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import DipMap from "./DipMap";
import territories from "./territories.json";
import { resolve } from "./resolver";
import { submitOrders, clearOrders, writeResolution, submitRetreatOrders, submitWinterOrders, writeWinterResolution } from "./gameService";

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

const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];

const SC_IDS = new Set(Object.values(territories).filter(t => t.supplyCenter && !t.id.includes('-')).map(t => t.id));

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

const HOME_SCS = {
  AUSTRIA: ['bud', 'tri', 'vie'],
  ENGLAND: ['edi', 'lon', 'lvp'],
  FRANCE:  ['bre', 'mar', 'par'],
  GERMANY: ['ber', 'kie', 'mun'],
  ITALY:   ['nap', 'rom', 'ven'],
  RUSSIA:  ['mos', 'sev', 'stp', 'war'],
  TURKEY:  ['ank', 'con', 'smy'],
};

function computeAdjustments(ownerMap, unitList) {
  const result = {};
  POWERS.forEach(p => {
    const scCount = Object.entries(ownerMap).filter(([tid, owner]) => owner === p && SC_IDS.has(tid)).length;
    const unitCount = unitList.filter(u => u.power === p).length;
    result[p] = scCount - unitCount;
  });
  return result;
}

function getAvailableBuildSCs(power, ownerMap, unitList) {
  const occupied = new Set(unitList.map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
  return (HOME_SCS[power] ?? []).filter(sc => ownerMap[sc] === power && !occupied.has(sc));
}

function checkWinner(ownerMap) {
  return POWERS.find(p =>
    Object.entries(ownerMap).filter(([tid, owner]) => owner === p && SC_IDS.has(tid)).length >= 18
  ) ?? null;
}

function buildWinterData(ownerMap, unitList) {
  const adjustments = computeAdjustments(ownerMap, unitList);
  // Auto-submit empty orders for powers with no adjustment needed
  const orders = {};
  POWERS.forEach(p => { if (adjustments[p] === 0) orders[p] = { builds: [], disbands: [] }; });
  return { adjustments, orders };
}

// Derive updated ownership from new unit positions (only updates occupied territories)
function ownersFromUnits(prevOwners, newUnits) {
  const next = { ...prevOwners };
  newUnits.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    next[base] = u.power;
  });
  return next;
}

function App({ gameData = null, role = null, gameCode = null, playerToken = null }) {
  // role: null (local/observer), 'ADMIN', or a power name like 'ENGLAND'
  // isMultiplayer: true when loaded via a game link
  const isMultiplayer = !!gameCode;
  const isAdmin = role === 'ADMIN';
  // The power this player controls (null for admin/observer)
  const myPower = (role && role !== 'ADMIN') ? role : null;
  const [title, setTitle] = useState("loading...");
  // setUnits will be used when resolver updates unit positions
  const [units, setUnits] = useState(STARTING_UNITS);
  const [owners, setOwners] = useState(() => ownersFromUnits(INITIAL_OWNERS, STARTING_UNITS));
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [orders, setOrders] = useState({}); // { unitId: { type: 'move'|'support'|'convoy', dest?, target?, army? } }
  const [mode, setMode] = useState(null); // null | 'move' | 'support' | 'convoy'
  const [supportTarget, setSupportTarget] = useState(null); // unit being supported (step 2 of support)
  const [convoyArmy, setConvoyArmy] = useState(null); // army unit selected in convoy step 2
  const [coastChoice, setCoastChoice] = useState(null); // { unitId, coasts: [id, ...] } — pending coast selection
  // retreatPhase: null | { dislodged: [{unit, retreatOptions}], retreatOrders: {unitId: destId|'disband'} }
  const [retreatPhase, setRetreatPhase] = useState(null);
  // Whether this player has submitted orders to Firestore this turn
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // winterPhase: null | { adjustments: {POWER: number}, orders: {POWER: {builds, disbands}} }
  const [winterPhase, setWinterPhase] = useState(null);
  // Local staging area for winter adjustment orders before submission
  const [winterOrders, setWinterOrders] = useState({ builds: [], disbands: [] });

  useEffect(() => {
    getDoc(doc(db, "config", "ui")).then((snap) => {
      if (snap.exists()) setTitle(snap.data().title);
      else setTitle("dickplomacy");
    });
  }, []);

  // Sync units, owners, and retreatPhase from Firestore whenever the server state changes
  useEffect(() => {
    if (!gameData) return;
    if (gameData.units) setUnits(gameData.units);
    if (gameData.owners) setOwners(gameData.owners);
    // Reset submitted flag when orders for our power are cleared (new turn)
    if (myPower && !gameData.orders?.[myPower]) setSubmitted(false);
    // Sync retreat phase from Firestore (null clears local retreat phase too)
    if (gameData.retreatPhase !== undefined) {
      setRetreatPhase(gameData.retreatPhase
        ? { dislodged: gameData.retreatPhase.dislodged, retreatOrders: gameData.retreatPhase.retreatOrders ?? {} }
        : null);
    }
    // Sync winter phase from Firestore
    if (gameData.winterPhase !== undefined) {
      setWinterPhase(gameData.winterPhase ?? null);
      if (!gameData.winterPhase) setWinterOrders({ builds: [], disbands: [] });
    }
    // Reset local orders when a new turn starts (orders cleared server-side)
    if (isMultiplayer && gameData.orders && Object.keys(gameData.orders).every(k => !gameData.orders[k])) {
      setOrders({});
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
        if (myPower && unit?.power !== myPower) return;
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
          if (myPower && unit.power !== myPower) return;
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
      if (myPower && unit?.power !== myPower) return;
      setSelectedUnit(unit);
    }
  }

  async function handleSubmitOrders() {
    if (!gameCode || !myPower) return;
    setSubmitting(true);
    try {
      await submitOrders(gameCode, myPower, orders);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClearOrders() {
    if (!gameCode || !myPower) return;
    await clearOrders(gameCode, myPower);
    setOrders({});
    setSubmitted(false);
  }

  function cancelOrder(unitId) {
    setOrders(prev => { const next = { ...prev }; delete next[unitId]; return next; });
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
    if (pending.length > 0) {
      const retreatData = { dislodged: pending, retreatOrders: autoOrders };
      await writeResolution(gameCode, result.units, movedOwners, retreatData, gameData.phase, gameData.year);
    } else {
      const { newUnits } = applyRetreatsCalc(result.units, result.dislodged, autoOrders);
      const finalOwners = isFall ? ownersFromUnits(movedOwners, newUnits) : owners;
      const winner = isFall ? checkWinner(finalOwners) : null;
      const winterData = isFall && !winner ? buildWinterData(finalOwners, newUnits) : null;
      await writeResolution(gameCode, newUnits, finalOwners, null, gameData.phase, gameData.year, winterData, winner);
    }
    resetMode();
  }

  // Pure calculation — returns newUnits without touching state (used by both local and multiplayer paths)
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
    return { newUnits };
  }

  function applyRetreats(currentUnits, dislodged, retreatOrders) {
    const { newUnits } = applyRetreatsCalc(currentUnits, dislodged, retreatOrders);
    setUnits(newUnits);
    setOwners(prev => ownersFromUnits(prev, newUnits));
    setRetreatPhase(null);
  }

  async function resolveRetreatsMultiplayer() {
    if (!gameData || !gameCode) return;
    const { dislodged, retreatOrders } = gameData.retreatPhase;
    const fullOrders = { ...retreatOrders };
    dislodged.forEach(({ unit }) => {
      if (!fullOrders[unit.id]) fullOrders[unit.id] = 'disband';
    });
    const { newUnits } = applyRetreatsCalc(gameData.units ?? units, dislodged, fullOrders);
    const isFallRetreat = gameData.phase === 'fall-retreat';
    const finalOwners = isFallRetreat ? ownersFromUnits(owners, newUnits) : owners;
    const winner = isFallRetreat ? checkWinner(finalOwners) : null;
    const winterData = isFallRetreat && !winner ? buildWinterData(finalOwners, newUnits) : null;
    await writeResolution(gameCode, newUnits, finalOwners, null, gameData.phase, gameData.year, winterData, winner);
    resetMode();
  }

  async function handleSubmitRetreatsMultiplayer() {
    if (!gameCode || !myPower || !retreatPhase) return;
    const myDislodged = retreatPhase.dislodged.filter(d => d.unit.power === myPower);
    const myOrders = {};
    myDislodged.forEach(({ unit }) => {
      myOrders[unit.id] = retreatPhase.retreatOrders[unit.id] ?? 'disband';
    });
    await submitRetreatOrders(gameCode, myOrders);
  }

  async function handleSubmitWinterOrders() {
    if (!gameCode || !myPower || !winterPhase) return;
    await submitWinterOrders(gameCode, myPower, winterOrders.builds, winterOrders.disbands);
  }

  async function resolveWinterMultiplayer() {
    if (!gameData?.winterPhase || !gameCode) return;
    const { adjustments, orders: wOrders } = gameData.winterPhase;
    let newUnits = [...(gameData.units ?? units)];
    POWERS.forEach(power => {
      const adj = adjustments[power] ?? 0;
      const powerOrders = wOrders?.[power];
      if (adj < 0) {
        const needed = Math.abs(adj);
        const submitted = powerOrders?.disbands ?? [];
        let toDisband = submitted.slice(0, needed);
        if (toDisband.length < needed) {
          const extra = newUnits.filter(u => u.power === power && !toDisband.includes(u.id));
          toDisband = [...toDisband, ...extra.slice(0, needed - toDisband.length).map(u => u.id)];
        }
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
          }
        });
      }
    });
    await writeWinterResolution(gameCode, newUnits, gameData.year ?? 1901);
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
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{title}</h1>
        {phaseLabel && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{phaseLabel}</div>}
        {myPower && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 5, background: POWER_COLOR[myPower], color: '#fff', padding: '3px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', display: 'inline-block' }} />
            {myPower}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '0.75rem', padding: '0.5rem 0.75rem', position: 'relative' }}>

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
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {retreatPhase ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#b22', letterSpacing: '0.03em', padding: '4px 0' }}>⚠ RETREAT PHASE</div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {retreatPhase.dislodged.map(({ unit, retreatOptions }) => {
                  const chosenDest = retreatPhase.retreatOrders[unit.id];
                  const canEdit = !isMultiplayer || (unit.power === myPower);
                  const lockedInFirestore = isMultiplayer && !!gameData?.retreatPhase?.retreatOrders?.[unit.id];
                  const interactive = canEdit && !lockedInFirestore;
                  return (
                    <div key={unit.id} style={{ borderLeft: `3px solid ${POWER_COLOR[unit.power]}`, paddingLeft: 7, marginBottom: 8, opacity: (!canEdit) ? 0.5 : 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: POWER_COLOR[unit.power], marginBottom: 3 }}>
                        {unit.power}: {unit.type} {displayId(unit.id)} (dislodged)
                        {lockedInFirestore && <span style={{ fontWeight: 400, color: '#2a6e2a', marginLeft: 4 }}>✓</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {retreatOptions.map(tid => (
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
                  const myDislodged = retreatPhase.dislodged.filter(d => d.unit.power === myPower);
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
                  const isMe = power === myPower;
                  const availSCs = getAvailableBuildSCs(power, owners, units);
                  return (
                    <div key={power} style={{ borderLeft: `3px solid ${POWER_COLOR[power]}`, paddingLeft: 7, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[power], marginBottom: 3, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span>{power}</span>
                        <span style={{ fontWeight: 400, color: adj > 0 ? '#2a6e2a' : adj < 0 ? '#b22' : '#888' }}>{adj > 0 ? `+${adj}` : adj < 0 ? String(adj) : '±0'}</span>
                        {submitted && <span style={{ color: '#2a6e2a', marginLeft: 'auto', fontWeight: 700 }}>✓</span>}
                      </div>
                      {isMe && !submitted && adj > 0 && (
                        <div>
                          {availSCs.length === 0 && <div style={{ fontSize: 10, color: '#888' }}>No available home SCs</div>}
                          {availSCs.map(sc => {
                            const existing = winterOrders.builds.find(b => b.territory === sc);
                            const canFleet = territories[sc]?.type !== 'land';
                            const atLimit = !existing && winterOrders.builds.length >= adj;
                            return (
                              <div key={sc} style={{ display: 'flex', gap: 3, alignItems: 'center', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, width: 28 }}>{displayId(sc)}</span>
                                {['A', canFleet ? 'F' : null].filter(Boolean).map(t => (
                                  <button key={t} onClick={() => { if (atLimit && existing?.type !== t) return; setWinterOrders(prev => { const without = prev.builds.filter(b => b.territory !== sc); return existing?.type === t ? { ...prev, builds: without } : { ...prev, builds: [...without, { territory: sc, type: t }] }; }); }} style={{ padding: '2px 5px', fontSize: 10, background: existing?.type === t ? '#1a1a2e' : '#eee', color: existing?.type === t ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 2, cursor: (atLimit && existing?.type !== t) ? 'default' : 'pointer', opacity: (atLimit && existing?.type !== t) ? 0.4 : 1 }}>{t}</button>
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
                            const sel = winterOrders.disbands.includes(u.id);
                            const atLimit = !sel && winterOrders.disbands.length >= Math.abs(adj);
                            return <button key={u.id} onClick={() => { if (atLimit) return; setWinterOrders(prev => ({ ...prev, disbands: sel ? prev.disbands.filter(id => id !== u.id) : [...prev.disbands, u.id] })); }} style={{ display: 'block', width: '100%', padding: '2px 5px', fontSize: 10, textAlign: 'left', background: sel ? '#b22' : '#eee', color: sel ? '#fff' : '#111', border: '1px solid #ccc', borderRadius: 2, marginBottom: 2, cursor: atLimit ? 'default' : 'pointer', opacity: atLimit ? 0.4 : 1 }}>{u.type} {displayId(u.id)}</button>;
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
              ) : myPower && (() => {
                const adj = winterPhase.adjustments?.[myPower] ?? 0;
                const submitted = !!winterPhase.orders?.[myPower];
                if (submitted) return <div style={{ padding: '7px 6px', fontWeight: 'bold', background: '#2a6e2a', color: '#fff', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>✓ Adjustment Submitted</div>;
                if (adj === 0) return <div style={{ fontSize: 11, color: '#888', textAlign: 'center', padding: '6px 0' }}>Waiting for winter resolution…</div>;
                const canSubmit = adj < 0 ? winterOrders.disbands.length === Math.abs(adj) : true;
                return <button onClick={handleSubmitWinterOrders} disabled={!canSubmit} style={{ padding: '7px 6px', fontWeight: 'bold', cursor: canSubmit ? 'pointer' : 'default', background: '#4a0080', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: canSubmit ? 1 : 0.5 }}>▶ Submit Adjustments</button>;
              })()}
            </>
          ) : (
            <>
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
              {isMultiplayer && myPower && (
                submitted ? (
                  <div style={{ display: 'flex', gap: 5 }}>
                    <div style={{ flex: 1, padding: '7px 6px', fontWeight: 'bold', background: '#2a6e2a', color: '#fff', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>
                      ✓ Orders Submitted
                    </div>
                    <button
                      onClick={handleClearOrders}
                      style={{ padding: '7px 8px', fontWeight: 'bold', cursor: 'pointer', background: '#666', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11 }}
                      title="Edit orders"
                    >✎</button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmitOrders}
                    disabled={submitting}
                    style={{ padding: '7px 6px', fontWeight: 'bold', cursor: submitting ? 'default' : 'pointer', background: '#1a5c8a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, letterSpacing: '0.03em', opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? 'Submitting…' : '▶ Submit Orders'}
                  </button>
                )
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
                  const isMyPower = !myPower || power === myPower;
                  return (
                    <div key={power} style={{ borderLeft: `3px solid ${POWER_COLOR[power]}`, paddingLeft: 7, marginBottom: 6, opacity: isMyPower ? 1 : 0.3 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: POWER_COLOR[power], textTransform: 'uppercase', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{power}</span>
                        <span style={{ fontWeight: 400, color: '#555' }}>({scCount} SC)</span>
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
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: mode === 'support' ? '#b8860b' : mode === 'convoy' ? '#1a5c8a' : mode === 'move' ? '#2a6e2a' : '#999', marginBottom: 4, minHeight: '1.4em', fontWeight: mode && mode !== 'move' ? 600 : 400 }}>
            {hintText()}
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <DipMap
              units={units}
              orders={orders}
              territoryOwners={owners}
              selectedUnit={selectedUnit}
              validMoves={getValidMovesForMode()}
              onTerritoryClick={handleTerritoryClick}
              onTerritoryHover={() => {}}
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
    </div>
  );
}

export default App;
