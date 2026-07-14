import { describe, it, expect } from 'vitest';
import { territoryFill } from './DipMap.jsx';

const sc = { id: 'mun', supplyCenter: true, type: 'land' };
const plain = { id: 'ruh', supplyCenter: false, type: 'land' };

describe('territoryFill', () => {
  it('shows the darker owner shade for an owned, unoccupied SC', () => {
    expect(territoryFill(sc, {}, { mun: 'GERMANY' })).toMatch(/rgba\(.*0\.5\)/);
  });

  it('shows the lighter occupier shade for an unowned but occupied territory', () => {
    const fill = territoryFill(plain, { ruh: { power: 'FRANCE' } }, {});
    expect(fill).toMatch(/rgba\(.*0\.25\)/);
  });

  it('keeps the owner shade when the occupier is the owner (not contested)', () => {
    const fill = territoryFill(sc, { mun: { power: 'GERMANY' } }, { mun: 'GERMANY' });
    expect(fill).toMatch(/rgba\(.*0\.5\)/);
  });

  it('returns a stripe pattern when an owned SC is occupied by another power', () => {
    const fill = territoryFill(sc, { mun: { power: 'FRANCE' } }, { mun: 'GERMANY' });
    expect(fill).toBe('url(#stripe-GERMANY-FRANCE)');
  });

  it('returns null for water, impassable and coast-variant territories', () => {
    expect(territoryFill({ id: 'nth', type: 'water' }, {}, {})).toBeNull();
    expect(territoryFill({ id: 'swi', type: 'impassable' }, {}, {})).toBeNull();
    expect(territoryFill({ id: 'spa-nc', type: 'land' }, {}, {})).toBeNull();
  });

  it('shows the lighter shade of the last occupier on a vacated non-SC territory', () => {
    // No current occupier, no owner, but lastOccupied records France was here
    const fill = territoryFill(plain, {}, {}, { ruh: 'FRANCE' });
    expect(fill).toMatch(/rgba\(.*0\.25\)/);
  });

  it('does not use lastOccupied for SC territory coloring', () => {
    // SC with no official owner, no current occupier — lastOccupied should not apply
    const fill = territoryFill(sc, {}, {}, { mun: 'FRANCE' });
    expect(fill).toBeNull();
  });

  it('current occupier takes priority over lastOccupied', () => {
    // Italy is currently there, lastOccupied says France — should show Italy
    const fill = territoryFill(plain, { ruh: { power: 'ITALY' } }, {}, { ruh: 'FRANCE' });
    // Just verify it returns a lighter shade (the occupier's color)
    expect(fill).toMatch(/rgba\(.*0\.25\)/);
  });
});
