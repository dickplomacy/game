import { describe, it, expect } from 'vitest';
import { checkWinner, POWERS, SC_IDS } from './winCondition';

// All 34 supply centre IDs
const ALL_SCS = ['ank','bel','ber','bre','bud','bul','con','den','edi','gre','hol','kie',
  'lon','lvp','mar','mos','mun','nap','nwy','par','por','rom','rum','ser','sev','smy',
  'spa','stp','swe','tri','tun','ven','vie','war'];

/** Build an ownerMap assigning the first `n` SCs to `power` and the rest to a different power. */
function ownerMapWith(power, n) {
  const other = POWERS.find(p => p !== power);
  const map = {};
  ALL_SCS.forEach((sc, i) => { map[sc] = i < n ? power : other; });
  return map;
}

describe('checkWinner', () => {
  it('returns null when no power has 18 SCs', () => {
    const map = ownerMapWith('FRANCE', 17);
    expect(checkWinner(map)).toBeNull();
  });

  it('returns null with an empty ownerMap', () => {
    expect(checkWinner({})).toBeNull();
  });

  it('returns the power with exactly 18 SCs', () => {
    const map = ownerMapWith('ENGLAND', 18);
    expect(checkWinner(map)).toBe('ENGLAND');
  });

  it('returns the power with more than 18 SCs', () => {
    const map = ownerMapWith('RUSSIA', 20);
    expect(checkWinner(map)).toBe('RUSSIA');
  });

  it('returns null when all SCs split evenly across powers (none reach 18)', () => {
    // 34 SCs / 7 powers = at most 5 each in even distribution
    const map = {};
    ALL_SCS.forEach((sc, i) => { map[sc] = POWERS[i % POWERS.length]; });
    expect(checkWinner(map)).toBeNull();
  });

  it('ignores non-SC territories', () => {
    // Give FRANCE 17 real SCs, plus 10 non-SC territories — should still be null
    const map = {};
    ALL_SCS.slice(0, 17).forEach(sc => { map[sc] = 'FRANCE'; });
    ALL_SCS.slice(17).forEach(sc => { map[sc] = 'ENGLAND'; });
    // Add non-SC territories to FRANCE — these should not count
    ['mid', 'nth', 'yor', 'gas', 'pic', 'bur', 'ruh', 'sil', 'tyr', 'boh'].forEach(t => {
      map[t] = 'FRANCE';
    });
    expect(checkWinner(map)).toBeNull();
  });

  it('SC_IDS contains all 34 supply centres', () => {
    expect(SC_IDS.size).toBe(34);
    ALL_SCS.forEach(sc => expect(SC_IDS.has(sc)).toBe(true));
  });

  it('non-SC territory IDs are not in SC_IDS', () => {
    // 'mid', 'nth', 'yor' are water/land non-SC territories
    expect(SC_IDS.has('mid')).toBe(false);
    expect(SC_IDS.has('nth')).toBe(false);
    expect(SC_IDS.has('yor')).toBe(false);
  });

  it('coast variants are not in SC_IDS', () => {
    // stp-nc and stp-sc should not be in SC_IDS — only base 'stp'
    expect(SC_IDS.has('stp-nc')).toBe(false);
    expect(SC_IDS.has('stp-sc')).toBe(false);
    expect(SC_IDS.has('stp')).toBe(true);
  });
});
