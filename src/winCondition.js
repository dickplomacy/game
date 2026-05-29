import territories from './territories.json';

export const POWERS = ['AUSTRIA', 'ENGLAND', 'FRANCE', 'GERMANY', 'ITALY', 'RUSSIA', 'TURKEY'];

export const SC_IDS = new Set(
  Object.values(territories)
    .filter(t => t.supplyCenter && !t.id.includes('-'))
    .map(t => t.id)
);

/**
 * Returns the winning power if any power controls >= 18 supply centres, else null.
 * Only called after fall resolution (spring wins are not possible in standard Diplomacy).
 * @param {Object} ownerMap - map of territory ID → power name
 * @returns {string|null}
 */
export function checkWinner(ownerMap) {
  return POWERS.find(p =>
    Object.entries(ownerMap).filter(([tid, owner]) => owner === p && SC_IDS.has(tid)).length >= 18
  ) ?? null;
}
