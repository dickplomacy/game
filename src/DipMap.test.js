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

  it('shows lighter color from lastOccupied when a non-SC territory is vacant', () => {
    const fill = territoryFill(plain, {}, {}, { ruh: 'FRANCE' });
    expect(fill).toMatch(/rgba\(.*0\.25\)/);
  });

  it('lastOccupied is ignored for vacant SCs (owner map takes priority)', () => {
    // An unowned SC that has a lastOccupied entry should not show the lighter color
    // since SC display is driven only by the owners map (darker shade)
    const fill = territoryFill(sc, {}, {}, { mun: 'FRANCE' });
    expect(fill).toBeNull();
  });

  it('current occupier takes priority over lastOccupied for non-SC territories', () => {
    // Italy now has a unit there; France was the last occupier — Italy's color shows
    const fill = territoryFill(plain, { ruh: { power: 'ITALY' } }, {}, { ruh: 'FRANCE' });
    expect(fill).toContain('34');   // Italy green rgb[0]=34
  });

  it('falls back to owners map for non-SC territory when lastOccupied is empty (backward compat)', () => {
    const fill = territoryFill(plain, {}, { ruh: 'AUSTRIA' }, {});
    expect(fill).toMatch(/rgba\(.*0\.25\)/);
  });
});
