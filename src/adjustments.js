import { POWERS, SC_IDS } from './winCondition.js';

export const HOME_SCS = {
  AUSTRIA: ['bud', 'tri', 'vie'],
  ENGLAND: ['edi', 'lon', 'lvp'],
  FRANCE:  ['bre', 'mar', 'par'],
  GERMANY: ['ber', 'kie', 'mun'],
  ITALY:   ['nap', 'rom', 'ven'],
  RUSSIA:  ['mos', 'sev', 'stp', 'war'],
  TURKEY:  ['ank', 'con', 'smy'],
};

/**
 * Compute the adjustment delta for each power.
 * Positive: power may build that many units. Negative: must disband.
 * @param {Object} ownerMap  territory id → power name
 * @param {Array}  unitList  [{id, power, ...}, ...]
 * @returns {Object} { POWER: delta }
 */
export function computeAdjustments(ownerMap, unitList) {
  const result = {};
  POWERS.forEach(p => {
    const scCount   = Object.entries(ownerMap).filter(([tid, owner]) => owner === p && SC_IDS.has(tid)).length;
    const unitCount = unitList.filter(u => u.power === p).length;
    result[p] = scCount - unitCount;
  });
  return result;
}

/**
 * Build winter phase data, or null if every power's delta is 0 (skip winter).
 * Auto-submits empty orders for powers that have no adjustment.
 * @param {Object} ownerMap
 * @param {Array}  unitList
 * @returns {{ adjustments: Object, orders: Object } | null}
 */
export function buildWinterData(ownerMap, unitList) {
  const adjustments = computeAdjustments(ownerMap, unitList);
  if (Object.values(adjustments).every(v => v === 0)) return null;
  const orders = {};
  POWERS.forEach(p => { if (adjustments[p] === 0) orders[p] = { builds: [], disbands: [] }; });
  return { adjustments, orders };
}

/**
 * Return home supply centres that a power owns and that are currently unoccupied.
 * @param {string} power
 * @param {Object} ownerMap
 * @param {Array}  unitList
 * @returns {string[]} territory ids
 */
export function getAvailableBuildSCs(power, ownerMap, unitList) {
  const occupied = new Set(unitList.map(u => u.id.includes('-') ? u.id.split('-')[0] : u.id));
  return (HOME_SCS[power] ?? []).filter(sc => ownerMap[sc] === power && !occupied.has(sc));
}

/**
 * Derive updated supply-centre ownership from new unit positions.
 * Only updates territories that are now occupied; other ownership is preserved.
 * @param {Object} prevOwners existing ownerMap
 * @param {Array}  newUnits   units after resolution
 * @returns {Object} updated ownerMap
 */
export function ownersFromUnits(prevOwners, newUnits) {
  const next = { ...prevOwners };
  newUnits.forEach(u => {
    const base = u.id.includes('-') ? u.id.split('-')[0] : u.id;
    next[base] = u.power;
  });
  return next;
}
