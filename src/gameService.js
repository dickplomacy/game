/**
 * gameService.js — Firestore game state helpers
 *
 * Game document lives at: games/{gameCode}
 *
 * Schema:
 * {
 *   code:     string,          // 4-letter game code e.g. 'GHST'
 *   phase:    string,          // 'spring-move' | 'spring-retreat' | 'fall-move' | 'fall-retreat' | 'winter'
 *   year:     number,          // e.g. 1901
 *   players: {                 // power → playerToken (7 entries: 6 powers + admin)
 *     ADMIN:   string,
 *     AUSTRIA: string,
 *     ENGLAND: string,
 *     FRANCE:  string,
 *     GERMANY: string,
 *     ITALY:   string,
 *     RUSSIA:  string,
 *     TURKEY:  string,
 *   },
 *   units: [                   // current unit positions
 *     { id, type, power, x, y }
 *   ],
 *   owners: {                  // territory id → power that last occupied it
 *     [territoryId]: string
 *   },
 *   orders: {                  // submitted orders, keyed by power; cleared after resolution
 *     [power]: { [unitId]: { type, dest?, target?, army? } }
 *   },
 *   retreatPhase: null | {     // set during retreat phase, null otherwise
 *     dislodged: [{ unit, retreatOptions }],
 *     retreatOrders: { [unitId]: destId | 'disband' }
 *   },
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 * }
 */

import { db } from './firebase';
import { POWERS } from './winCondition';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

import territories from './territories.json';

// ── Starting state ───────────────────────────────────────────────────────────

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

const INITIAL_OWNERS = {
  bud: 'AUSTRIA', tri: 'AUSTRIA', vie: 'AUSTRIA',
  boh: 'AUSTRIA', gal: 'AUSTRIA', tyr: 'AUSTRIA',
  edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND',
  cly: 'ENGLAND', wal: 'ENGLAND', yor: 'ENGLAND',
  bre: 'FRANCE',  mar: 'FRANCE',  par: 'FRANCE',
  bur: 'FRANCE',  gas: 'FRANCE',  pic: 'FRANCE',
  ber: 'GERMANY', kie: 'GERMANY', mun: 'GERMANY',
  pru: 'GERMANY', ruh: 'GERMANY', sil: 'GERMANY',
  nap: 'ITALY',   rom: 'ITALY',   ven: 'ITALY',
  apu: 'ITALY',   pie: 'ITALY',   tus: 'ITALY',
  mos: 'RUSSIA',  sev: 'RUSSIA',  stp: 'RUSSIA',  war: 'RUSSIA',
  fin: 'RUSSIA',  lvn: 'RUSSIA',  ukr: 'RUSSIA',
  ank: 'TURKEY',  con: 'TURKEY',  smy: 'TURKEY',
  arm: 'TURKEY',  syr: 'TURKEY',
};

// ── Token generation ─────────────────────────────────────────────────────────

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O to avoid confusion

function randomCode(length = 4) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new game in Firestore.
 * Generates a unique 4-letter game code, retrying on collision.
 * Returns the full game document data including the generated code and player tokens.
 */
export async function createGame(settings = {}) {
  let code;
  let attempts = 0;

  // Find a unique code
  while (attempts < 10) {
    code = randomCode(4);
    const ref = doc(db, 'games', code);
    const snap = await getDoc(ref);
    if (!snap.exists()) break;
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error('Could not generate a unique game code. Try again.');
  }

  // Generate tokens: each player slot gets one shared token; passive powers get individual tokens
  // powerSlots: { [power]: slotKey } — active powers with same slotKey share a token
  const pSlots = settings.powerSlots ?? {};
  const activePowersForGame = POWERS.filter(p => !settings.passivePowers?.includes(p));
  const slotKeys = [...new Set(activePowersForGame.map(p => pSlots[p] ?? p))];
  const slotTokens = {};
  slotKeys.forEach(key => { slotTokens[key] = randomCode(4); });
  const players = { ADMIN: randomCode(4) };
  POWERS.forEach(power => {
    if (settings.passivePowers?.includes(power)) {
      players[power] = randomCode(4);
    } else {
      players[power] = slotTokens[pSlots[power] ?? power];
    }
  });

  // Build initial owners from starting unit positions on top of the static map
  const owners = { ...INITIAL_OWNERS };
  STARTING_UNITS.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    owners[base] = u.power;
  });

  // lastOccupied tracks who last stood on every territory — initialized from starting positions
  const lastOccupied = {};
  STARTING_UNITS.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    lastOccupied[base] = u.power;
  });

  const gameData = {
    code,
    phase: 'spring-move',
    year: 1901,
    players,
    units: STARTING_UNITS,
    owners,
    lastOccupied,
    orders: {},
    draftOrders: {},
    retreatPhase: null,
    settings: {
      autoResolve: settings.autoResolve ?? false,
      passivePowers: settings.passivePowers ?? [],
      lockedPowers: [],
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'games', code), gameData);
  return gameData;
}

/**
 * Fetch a game document by its 4-letter code.
 * Returns the game data object, or null if not found.
 */
export async function getGame(gameCode) {
  const snap = await getDoc(doc(db, 'games', gameCode.toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Submit orders for one power to Firestore.
 * orders: { [unitId]: { type, dest?, target?, army? } }
 */
export async function submitOrders(gameCode, power, orders) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`orders.${power}`]: orders,
    updatedAt: serverTimestamp(),
  });
}

export async function saveDraftOrders(gameCode, power, orders) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`draftOrders.${power}`]: orders,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Clear submitted orders for one power (e.g. to re-submit).
 */
export async function clearOrders(gameCode, power) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`orders.${power}`]: null,
    [`draftOrders.${power}`]: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Un-submit orders for one power, returning them to the editable draft stage.
 * Clears the submitted orders (so the turn is no longer locked in) while preserving
 * the current orders as a draft so nothing the player entered is lost.
 */
export async function unsubmitOrders(gameCode, power, draftOrders) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`orders.${power}`]: null,
    [`draftOrders.${power}`]: draftOrders,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Given a game document and a player token, return which role that token belongs to.
 * Returns the role string (e.g. 'ENGLAND', 'ADMIN') or null if not found.
 */
export function getRoleForToken(game, token) {
  if (!game?.players) return null;
  if (game.players.ADMIN === token) return 'ADMIN';
  const powers = Object.entries(game.players)
    .filter(([role, t]) => role !== 'ADMIN' && t === token)
    .map(([role]) => role);
  if (powers.length === 0) return null;
  return powers.length === 1 ? powers[0] : powers;
}

/**
 * Submit retreat choices for own power's dislodged units.
 * retreatOrdersMap: { [unitId]: destId | 'disband' }
 */
export async function submitRetreatOrders(gameCode, retreatOrdersMap) {
  const updates = { updatedAt: serverTimestamp() };
  Object.entries(retreatOrdersMap).forEach(([unitId, dest]) => {
    updates[`retreatPhase.retreatOrders.${unitId}`] = dest;
  });
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), updates);
}

/**
 * Write the result of order resolution back to Firestore.
 * - retreatData: null | { dislodged, retreatOrders } — if set, enter retreat phase
 * - winterData: null | { adjustments, orders } — if set (fall only), enter winter phase
 * - lastOccupied: null | { [tid]: power } — last occupier of every territory (updated every season)
 */
export async function writeResolution(gameCode, newUnits, newOwners, retreatData, currentPhase, currentYear, winterData = null, winner = null, log = null, historyEntries = [], lastOccupied = null) {
  let nextPhase, nextYear;
  if (retreatData) {
    nextPhase = currentPhase === 'spring-move' ? 'spring-retreat' : 'fall-retreat';
    nextYear = currentYear;
  } else if (currentPhase === 'spring-move' || currentPhase === 'spring-retreat') {
    nextPhase = 'fall-move';
    nextYear = currentYear;
  } else if (winterData) {
    // fall-move or fall-retreat → winter
    nextPhase = 'winter';
    nextYear = currentYear;
  } else {
    // fall-move or fall-retreat → spring (skip winter)
    nextPhase = 'spring-move';
    nextYear = currentYear + 1;
  }

  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    units: newUnits,
    owners: newOwners,
    ...(lastOccupied !== null ? { lastOccupied } : {}),
    orders: {},
    draftOrders: {},
    phase: nextPhase,
    year: nextYear,
    retreatPhase: retreatData ?? null,
    winterPhase: nextPhase === 'winter' ? winterData : null,
    lastPhaseLog: log ?? null,
    ...(historyEntries && historyEntries.length ? { history: arrayUnion(...historyEntries) } : {}),
    ...(winner ? { winner } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Append retreat results to the existing lastPhaseLog for the current phase.
 */
export async function appendRetreatLog(gameCode, retreatEntries) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    'lastPhaseLog.retreatEntries': retreatEntries,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Submit winter adjustment orders for one power.
 * builds: [{ territory, type }]
 * disbands: [unitId]
 */
export async function submitWinterOrders(gameCode, power, builds, disbands) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`winterPhase.orders.${power}`]: { builds, disbands },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Finalise winter: write new unit array and advance to next spring.
 */
export async function writeWinterResolution(gameCode, newUnits, currentYear, historyEntry = null, lastOccupied = null) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    units: newUnits,
    ...(lastOccupied !== null ? { lastOccupied } : {}),
    orders: {},
    phase: 'spring-move',
    year: currentYear + 1,
    winterPhase: null,
    ...(historyEntry ? { history: arrayUnion(historyEntry) } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Lock or unlock a country in the join picker.
 * locked=true adds the power to lockedPowers; false removes it.
 */
export async function setCountryLock(gameCode, power, locked) {
  const ref = doc(db, 'games', gameCode.toUpperCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current = snap.data().settings?.lockedPowers ?? [];
  const updated = locked
    ? [...new Set([...current, power])]
    : current.filter(p => p !== power);
  await updateDoc(ref, { 'settings.lockedPowers': updated, updatedAt: serverTimestamp() });
}

/**
 * Subscribe to the treaties subcollection. Returns an unsubscribe function.
 * callback receives an array of treaty objects (with id field).
 */
export function onTreatiesSnapshot(gameCode, callback) {
  const q = query(
    collection(db, 'games', gameCode.toUpperCase(), 'treaties'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}
