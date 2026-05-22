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
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
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
export async function createGame() {
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

  // Generate one token per role
  const roles = ['ADMIN', 'AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];
  const players = {};
  roles.forEach(role => { players[role] = randomCode(4); });

  // Build initial owners from starting unit positions on top of the static map
  const owners = { ...INITIAL_OWNERS };
  STARTING_UNITS.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    owners[base] = u.power;
  });

  const gameData = {
    code,
    phase: 'spring-move',
    year: 1901,
    players,
    units: STARTING_UNITS,
    owners,
    orders: {},
    retreatPhase: null,
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

/**
 * Clear submitted orders for one power (e.g. to re-submit).
 */
export async function clearOrders(gameCode, power) {
  await updateDoc(doc(db, 'games', gameCode.toUpperCase()), {
    [`orders.${power}`]: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Given a game document and a player token, return which role that token belongs to.
 * Returns the role string (e.g. 'ENGLAND', 'ADMIN') or null if not found.
 */
export function getRoleForToken(game, token) {
  if (!game?.players) return null;
  const entry = Object.entries(game.players).find(([, t]) => t === token);
  return entry ? entry[0] : null;
}
