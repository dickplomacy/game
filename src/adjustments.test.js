import { describe, it, expect } from 'vitest';
import {
  HOME_SCS,
  computeAdjustments,
  buildWinterData,
  getAvailableBuildSCs,
  ownersFromUnits,
} from './adjustments';
import { POWERS } from './winCondition';

// Helper: build an ownerMap that gives `power` exactly `n` supply centres.
// Uses the first n entries from SC_IDS (resolved at import time via winCondition).
import { SC_IDS } from './winCondition';
const ALL_SCS = [...SC_IDS];

function ownerMapWith(power, scCount) {
  const map = {};
  ALL_SCS.slice(0, scCount).forEach(id => { map[id] = power; });
  return map;
}

// ── computeAdjustments ───────────────────────────────────────────────────────

describe('computeAdjustments', () => {
  it('returns 0 for every power when SCs equal units', () => {
    // England has 3 SCs and 3 units → delta = 0
    const owners = { lon: 'ENGLAND', edi: 'ENGLAND', lvp: 'ENGLAND' };
    const units  = [
      { id: 'lon', power: 'ENGLAND' },
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    const result = computeAdjustments(owners, units);
    POWERS.forEach(p => expect(result[p]).toBe(0));
  });

  it('returns positive delta when a power owns more SCs than units', () => {
    // England owns 4 SCs, has 3 units → delta = +1
    const owners = { lon: 'ENGLAND', edi: 'ENGLAND', lvp: 'ENGLAND', yor: 'ENGLAND' };
    // yor is not a SC, but we test the raw filter; use a real SC
    const engScs = HOME_SCS.ENGLAND; // ['edi','lon','lvp']
    const extraSC = ALL_SCS.find(sc => !engScs.includes(sc) && sc !== 'yor'); // e.g. bel
    const owners4 = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND', [extraSC]: 'ENGLAND' };
    const units3  = [
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lon', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    const result = computeAdjustments(owners4, units3);
    expect(result.ENGLAND).toBe(1);
    POWERS.filter(p => p !== 'ENGLAND').forEach(p => expect(result[p]).toBe(0));
  });

  it('returns negative delta when a power has more units than SCs', () => {
    // France owns 2 SCs, has 3 units → delta = -1
    const owners = { bre: 'FRANCE', par: 'FRANCE' };
    const units  = [
      { id: 'bre', power: 'FRANCE' },
      { id: 'par', power: 'FRANCE' },
      { id: 'mar', power: 'FRANCE' },
    ];
    const result = computeAdjustments(owners, units);
    expect(result.FRANCE).toBe(-1);
    POWERS.filter(p => p !== 'FRANCE').forEach(p => expect(result[p]).toBe(0));
  });

  it('returns all negatives for empty ownerMap with units present', () => {
    const units = [{ id: 'lon', power: 'ENGLAND' }];
    const result = computeAdjustments({}, units);
    expect(result.ENGLAND).toBe(-1); // 0 SCs, 1 unit
  });
});

// ── buildWinterData ──────────────────────────────────────────────────────────

describe('buildWinterData', () => {
  it('returns null when all deltas are 0 (skip winter)', () => {
    const owners = { lon: 'ENGLAND', edi: 'ENGLAND', lvp: 'ENGLAND' };
    const units  = [
      { id: 'lon', power: 'ENGLAND' },
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    expect(buildWinterData(owners, units)).toBeNull();
  });

  it('returns {adjustments, orders} when some delta is non-zero', () => {
    // England: 4 SCs, 3 units → delta +1 → winter proceeds
    const extraSC = ALL_SCS.find(sc => !HOME_SCS.ENGLAND.includes(sc));
    const owners = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND', [extraSC]: 'ENGLAND' };
    const units  = [
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lon', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    const result = buildWinterData(owners, units);
    expect(result).not.toBeNull();
    expect(result.adjustments.ENGLAND).toBe(1);
    expect(result.orders).toBeDefined();
  });

  it('pre-fills orders with empty builds/disbands for zero-delta powers', () => {
    // England +1, all others 0 → others get auto-filled orders
    const extraSC = ALL_SCS.find(sc => !HOME_SCS.ENGLAND.includes(sc));
    const owners = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND', [extraSC]: 'ENGLAND' };
    const units  = [
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lon', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    const result = buildWinterData(owners, units);
    POWERS.filter(p => p !== 'ENGLAND').forEach(p => {
      expect(result.orders[p]).toEqual({ builds: [], disbands: [] });
    });
    // England (delta +1) should NOT be pre-filled
    expect(result.orders.ENGLAND).toBeUndefined();
  });
});

// ── getAvailableBuildSCs ─────────────────────────────────────────────────────

describe('getAvailableBuildSCs', () => {
  it('returns all home SCs when all are owned and unoccupied', () => {
    const owners = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND' };
    const available = getAvailableBuildSCs('ENGLAND', owners, []);
    expect(available.sort()).toEqual(['edi', 'lon', 'lvp'].sort());
  });

  it('excludes an occupied home SC', () => {
    const owners = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND' };
    const units  = [{ id: 'lon', power: 'ENGLAND' }];
    const available = getAvailableBuildSCs('ENGLAND', owners, units);
    expect(available).not.toContain('lon');
    expect(available).toContain('edi');
    expect(available).toContain('lvp');
  });

  it('excludes a home SC not owned by this power', () => {
    // lon captured by France
    const owners = { edi: 'ENGLAND', lon: 'FRANCE', lvp: 'ENGLAND' };
    const available = getAvailableBuildSCs('ENGLAND', owners, []);
    expect(available).not.toContain('lon');
    expect(available).toContain('edi');
    expect(available).toContain('lvp');
  });

  it('returns empty array when all home SCs are occupied', () => {
    const owners = { edi: 'ENGLAND', lon: 'ENGLAND', lvp: 'ENGLAND' };
    const units  = [
      { id: 'edi', power: 'ENGLAND' },
      { id: 'lon', power: 'ENGLAND' },
      { id: 'lvp', power: 'ENGLAND' },
    ];
    const available = getAvailableBuildSCs('ENGLAND', owners, units);
    expect(available).toEqual([]);
  });

  it('treats coast-variant unit ids as occupying the base territory', () => {
    // stp-sc (fleet) occupies stp
    const owners = { mos: 'RUSSIA', sev: 'RUSSIA', stp: 'RUSSIA', war: 'RUSSIA' };
    const units  = [{ id: 'stp-sc', power: 'RUSSIA' }];
    const available = getAvailableBuildSCs('RUSSIA', owners, units);
    expect(available).not.toContain('stp');
    expect(available).toContain('mos');
    expect(available).toContain('sev');
    expect(available).toContain('war');
  });
});

// ── ownersFromUnits ──────────────────────────────────────────────────────────

describe('ownersFromUnits', () => {
  it('updates ownership for territories now occupied by units', () => {
    const prev = { lon: 'FRANCE', par: 'FRANCE' };
    const newUnits = [{ id: 'lon', power: 'ENGLAND' }];
    const result = ownersFromUnits(prev, newUnits);
    expect(result.lon).toBe('ENGLAND');
    expect(result.par).toBe('FRANCE'); // unchanged
  });

  it('preserves ownership of territories with no unit present', () => {
    const prev = { lon: 'ENGLAND', bre: 'FRANCE', par: 'FRANCE' };
    const result = ownersFromUnits(prev, []);
    expect(result).toEqual(prev);
  });

  it('handles coast-variant unit ids by updating the base territory', () => {
    // F stp-sc should update stp ownership, not stp-sc
    const prev = { stp: 'ENGLAND' };
    const newUnits = [{ id: 'stp-sc', power: 'RUSSIA' }];
    const result = ownersFromUnits(prev, newUnits);
    expect(result.stp).toBe('RUSSIA');
    expect(result['stp-sc']).toBeUndefined();
  });

  it('does not mutate the previous owners object', () => {
    const prev = { lon: 'FRANCE' };
    const prevCopy = { ...prev };
    ownersFromUnits(prev, [{ id: 'lon', power: 'ENGLAND' }]);
    expect(prev).toEqual(prevCopy);
  });
});
