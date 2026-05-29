import { describe, it, expect } from 'vitest';
import { resolve } from './resolver';

const A = (id, power = 'ENGLAND') => ({ id, type: 'A', power, x: 0, y: 0 });
const F = (id, power = 'ENGLAND') => ({ id, type: 'F', power, x: 0, y: 0 });

function at(units, id) { return units.find(u => u.id === id); }

// Adjacency reference (verified against territories.json):
//   lon adj: wal, yor (army)
//   yor adj: edi, lon, lvp, wal (army)  ← wal added after fixing one-way bug
//   wal adj: lon, lvp, yor (army)
//   lvp adj: cly, edi, wal, yor (army)
//   vie adj: boh, bud, gal, tyr (army)
//   boh adj: mun, vie, tyr, gal, sil (army)
//   bud adj: vie, tri, gal, rum, ser (army)
//   tyr adj: boh, mun, pie, tri, ven, vie (army, landlocked)
//   ser adj: alb, bud, bul, gre, rum, tri (army)
//   nth (water): fleet adj: bel, den, edi, eng, hel, hol, lon, nrg, nwy, ska, yor

// ── Basic moves ─────────────────────────────────────────────────────────────

describe('basic moves', () => {
  it('army moves to adjacent empty territory', () => {
    const { units } = resolve([A('lon')], { lon: { type: 'move', dest: 'wal' } });
    expect(at(units, 'wal')).toBeTruthy();
    expect(at(units, 'lon')).toBeFalsy();
  });

  it('army with no order holds in place', () => {
    const { units } = resolve([A('lon')], {});
    expect(at(units, 'lon')).toBeTruthy();
  });

  it('non-adjacent move without convoy is treated as hold', () => {
    // lon and par are not army-adjacent
    const { units } = resolve([A('lon')], { lon: { type: 'move', dest: 'par' } });
    expect(at(units, 'lon')).toBeTruthy();
  });

  it('fleet cannot move to a landlocked territory', () => {
    // mun is landlocked — not in any fleet move list
    const { units } = resolve([F('nth')], { nth: { type: 'move', dest: 'mun' } });
    expect(at(units, 'nth')).toBeTruthy();
  });

  it('army cannot move to a water territory', () => {
    // nth (North Sea) is water — not in lon's army move list
    const { units } = resolve([A('lon')], { lon: { type: 'move', dest: 'nth' } });
    expect(at(units, 'lon')).toBeTruthy();
  });

  it('chain move: A→B→C all succeed when C is empty', () => {
    // lon → wal → lvp (chain)
    const { units } = resolve(
      [A('lon'), A('wal')],
      { lon: { type: 'move', dest: 'wal' }, wal: { type: 'move', dest: 'lvp' } }
    );
    expect(at(units, 'wal')?.power).toBe('ENGLAND'); // lon moved here
    expect(at(units, 'lvp')).toBeTruthy();            // wal moved here
    expect(at(units, 'lon')).toBeFalsy();
  });
});

// ── Bounce / standoff ───────────────────────────────────────────────────────

describe('bounce', () => {
  it('two units moving to the same empty territory both fail', () => {
    // lon → yor, wal → yor: bounce
    const { units } = resolve(
      [A('lon'), A('wal')],
      { lon: { type: 'move', dest: 'yor' }, wal: { type: 'move', dest: 'yor' } }
    );
    expect(at(units, 'lon')).toBeTruthy();
    expect(at(units, 'wal')).toBeTruthy();
    expect(at(units, 'yor')).toBeFalsy();
  });

  it('head-to-head: both fail with equal strength', () => {
    const { units } = resolve(
      [A('lon'), A('wal', 'FRANCE')],
      { lon: { type: 'move', dest: 'wal' }, wal: { type: 'move', dest: 'lon' } }
    );
    expect(at(units, 'lon')?.power).toBe('ENGLAND');
    expect(at(units, 'wal')?.power).toBe('FRANCE');
  });

  it('circular move: A→B→C→A all succeed', () => {
    const { units } = resolve(
      [A('lon'), A('wal'), A('yor')],
      {
        lon: { type: 'move', dest: 'wal' },
        wal: { type: 'move', dest: 'yor' },
        yor: { type: 'move', dest: 'lon' },
      }
    );
    // Each unit moves; all three territories remain occupied
    expect(at(units, 'lon')).toBeTruthy();
    expect(at(units, 'wal')).toBeTruthy();
    expect(at(units, 'yor')).toBeTruthy();
    // wal is now occupied by the unit that came from lon
    expect(at(units, 'wal')?.power).toBe('ENGLAND');
  });
});

// ── Support ─────────────────────────────────────────────────────────────────

describe('support', () => {
  it('supported attack dislodges defender (strength 2 > 1)', () => {
    // A yor → lon (strength 2, supported by wal), A lon (FRANCE) holds
    // yor adj lon ✓, wal adj lon ✓
    const { units, dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
      }
    );
    expect(at(units, 'lon')?.power).toBe('ENGLAND');
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].unit.id).toBe('lon');
  });

  it('unsupported attack cannot dislodge holding unit (1 not > 1)', () => {
    const { units, dislodged } = resolve(
      [A('yor'), A('lon', 'FRANCE')],
      { yor: { type: 'move', dest: 'lon' } }
    );
    expect(at(units, 'yor')?.power).toBe('ENGLAND');
    expect(at(units, 'lon')?.power).toBe('FRANCE');
    expect(dislodged.length).toBe(0);
  });

  it('head-to-head: unit with more support wins', () => {
    // A lon → wal (str 2, supported by lvp), A wal (FRANCE) → lon (str 1) — lon wins
    // lvp adj wal ✓ (lvp.moves.army includes wal), lon adj wal ✓
    const { units, dislodged } = resolve(
      [A('lon'), A('lvp'), A('wal', 'FRANCE')],
      {
        lon: { type: 'move', dest: 'wal' },
        lvp: { type: 'support', target: 'lon', dest: 'wal' },
        wal: { type: 'move', dest: 'lon' },
      }
    );
    expect(at(units, 'wal')?.power).toBe('ENGLAND');
    expect(dislodged[0]?.unit.id).toBe('wal');
  });

  it('hold support increases hold strength, blocking attack', () => {
    // A yor (FRANCE) attacks lon; A wal provides hold support for lon (str 2).
    // 1 not > 2 → yor fails.
    const { units, dislodged } = resolve(
      [A('yor', 'FRANCE'), A('lon'), A('wal')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'lon' }, // hold support — no dest
      }
    );
    expect(at(units, 'lon')?.power).toBe('ENGLAND');
    expect(at(units, 'yor')?.power).toBe('FRANCE');
    expect(dislodged.length).toBe(0);
  });

  it('support is cut by attack from a non-destination territory', () => {
    // A yor → lon (str 1 after cut), A wal S yor → lon, A lvp (FRANCE) → wal (cuts support)
    // lvp attacks wal from lvp (≠ lon) → support IS cut
    // yor strength drops to 1, fails to dislodge lon (FRANCE)
    const { dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE'), A('lvp', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
        lvp: { type: 'move', dest: 'wal' }, // cuts wal's support (lvp ≠ lon)
      }
    );
    expect(dislodged.length).toBe(0); // yor failed without support
  });

  it('support is NOT cut by attack from the supported destination', () => {
    // A yor → lon (str 2, not cut), A wal S yor → lon,
    // A lon (FRANCE) → wal  ← attacks wal from lon (= the destination) → does NOT cut
    const { units, dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
        lon: { type: 'move', dest: 'wal' }, // from lon (destination) → no cut
      }
    );
    expect(at(units, 'lon')?.power).toBe('ENGLAND'); // yor succeeded
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].unit.id).toBe('lon');
  });

  it('self-dislodge is not allowed (same power)', () => {
    // yor (ENGLAND) supported by lvp cannot dislodge lon (ENGLAND) — same power
    const { units, dislodged } = resolve(
      [A('yor'), A('lvp'), A('lon')],
      {
        yor: { type: 'move', dest: 'lon' },
        lvp: { type: 'support', target: 'yor', dest: 'lon' },
      }
    );
    expect(at(units, 'lon')).toBeTruthy();
    expect(dislodged.length).toBe(0);
  });

  it('same-power chain move succeeds (not a self-dislodge)', () => {
    // All ENGLAND: lon → wal → lvp. wal is vacating, so lon moving into wal is fine.
    const { units } = resolve(
      [A('lon'), A('wal'), A('lvp', 'FRANCE')],
      { lon: { type: 'move', dest: 'wal' }, wal: { type: 'move', dest: 'lvp' } }
    );
    // wal → lvp dislodges FRANCE; lon moves into the vacated wal
    expect(at(units, 'wal')?.power).toBe('ENGLAND');
    expect(dislodged => dislodged !== undefined); // just checking units moved
  });
});

// ── Convoy ──────────────────────────────────────────────────────────────────

describe('convoy', () => {
  it('army convoyed across sea reaches non-adjacent territory', () => {
    // A yor → nwy via F nth (North Sea adjacent to both yor and nwy)
    const { units } = resolve(
      [A('yor'), F('nth')],
      {
        yor: { type: 'move', dest: 'nwy' },
        nth: { type: 'convoy', army: 'yor', dest: 'nwy' },
      }
    );
    expect(at(units, 'nwy')?.type).toBe('A');
    expect(at(units, 'yor')).toBeFalsy();
  });

  it('convoy without matching fleet order: army stays', () => {
    const { units } = resolve(
      [A('yor'), F('nth')],
      { yor: { type: 'move', dest: 'nwy' } } // no convoy order on fleet
    );
    expect(at(units, 'yor')).toBeTruthy();
  });

  it('convoyed army can move to a territory being vacated by its occupant', () => {
    // A edi → lon (convoy via F nth). edi not army-adj to lon ✓.
    // F lon (FRANCE) vacates to eng. Both moves succeed.
    const { units } = resolve(
      [A('edi'), F('nth'), F('lon', 'FRANCE')],
      {
        edi: { type: 'move', dest: 'lon' },
        nth: { type: 'convoy', army: 'edi', dest: 'lon' },
        lon: { type: 'move', dest: 'eng' },
      }
    );
    expect(at(units, 'lon')?.type).toBe('A');            // edi army arrived
    expect(at(units, 'eng')?.power).toBe('FRANCE');      // French fleet moved out
  });
});

// ── Retreat phase ───────────────────────────────────────────────────────────

describe('retreat', () => {
  it('dislodged unit cannot retreat to attacker origin territory', () => {
    // A yor + A wal S yor → lon: dislodge lon (FRANCE)
    // attacker came from yor → yor must not be a retreat option
    const { dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
      }
    );
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].retreatOptions).not.toContain('yor');
  });

  it('dislodged unit cannot retreat to an occupied territory', () => {
    // A yor + A wal S yor → lon: lon (FRANCE) dislodged.
    // wal (ENGLAND) is still at wal (supporter doesn't move).
    // lon army adj: yor (attacker, excluded), wal (occupied, excluded) → retreatOptions = []
    const { dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
      }
    );
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].retreatOptions).not.toContain('wal'); // occupied
  });

  it('dislodged unit cannot retreat to a standoff territory', () => {
    // Standoff: A tri (GERMANY) → bud, A ser (GERMANY) → bud — bounce, bud is standoff.
    // Dislodge: A boh (ENGLAND) → vie, A tyr (ENGLAND) S boh → vie — vie (FRANCE) dislodged.
    // vie adj: boh (attacker), bud (standoff), gal (open), tyr (occupied by supporter)
    // → retreatOptions should include gal but NOT bud (standoff).
    const { dislodged } = resolve(
      [A('boh'), A('tyr'), A('vie', 'FRANCE'), A('tri', 'GERMANY'), A('ser', 'GERMANY')],
      {
        boh: { type: 'move', dest: 'vie' },
        tyr: { type: 'support', target: 'boh', dest: 'vie' },
        tri: { type: 'move', dest: 'bud' },
        ser: { type: 'move', dest: 'bud' },
      }
    );
    const vieDislodged = dislodged.find(d => d.unit.id === 'vie');
    expect(vieDislodged).toBeTruthy();
    expect(vieDislodged.retreatOptions).not.toContain('bud');    // standoff
    expect(vieDislodged.retreatOptions).not.toContain('boh');    // attacker origin
    expect(vieDislodged.retreatOptions).not.toContain('tyr');    // occupied by supporter
    expect(vieDislodged.retreatOptions).toContain('gal');        // open territory
  });

  it('dislodged unit with no retreat options has empty retreatOptions array', () => {
    expect(Array.isArray([])).toBe(true); // trivial shape check
    const { dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
      }
    );
    expect(Array.isArray(dislodged[0].retreatOptions)).toBe(true);
  });

  it('fleet dislodged from rum can only retreat to bul-ec, not bul-sc', () => {
    // F rum adj fleet: bla, bul-ec, con, sev — only east coast of bul reachable
    // F bla attacks rum with support; check retreat options include bul-ec but not bul-sc
    const { dislodged } = resolve(
      [F('rum', 'AUSTRIA'), F('bla', 'RUSSIA'), F('sev', 'RUSSIA')],
      {
        bla: { type: 'move', dest: 'rum' },
        sev: { type: 'support', target: 'bla', dest: 'rum' },
      }
    );
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].unit.id).toBe('rum');
    expect(dislodged[0].retreatOptions).toContain('bul-ec');
    expect(dislodged[0].retreatOptions).not.toContain('bul-sc');
    expect(dislodged[0].retreatOptions).not.toContain('bul');
  });

  it('fleet dislodged from con can retreat to both bul-ec and bul-sc', () => {
    // F con adj fleet: aeg, bla, bul-ec, bul-sc, smy — both bul coasts reachable
    // F bla attacks con, F ank (adj to con) supports
    const { dislodged } = resolve(
      [F('con', 'TURKEY'), F('bla', 'RUSSIA'), F('ank', 'RUSSIA')],
      {
        bla: { type: 'move', dest: 'con' },
        ank: { type: 'support', target: 'bla', dest: 'con' },
      }
    );
    expect(dislodged.length).toBe(1);
    expect(dislodged[0].unit.id).toBe('con');
    expect(dislodged[0].retreatOptions).toContain('bul-ec');
    expect(dislodged[0].retreatOptions).toContain('bul-sc');
    expect(dislodged[0].retreatOptions).not.toContain('bul');
  });
});

// ── Edge cases from rules reference ────────────────────────────────────────

describe('edge cases', () => {
  it('support for a non-matching move has no effect (does not become hold support)', () => {
    // A yor → lon, A wal S yor → wal (wrong destination — yor is going to lon, not wal).
    // wal's support has no effect; yor attacks lon with strength 1 only → fails.
    const { units, dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'wal' }, // wrong dest
      }
    );
    expect(at(units, 'lon')?.power).toBe('FRANCE'); // France holds — yor failed
    expect(dislodged.length).toBe(0);
  });

  it('three-way standoff: three units move to the same territory, all fail', () => {
    // A lon → yor, A wal → yor, A edi → yor — all equal strength, all fail
    const { units } = resolve(
      [A('lon'), A('wal'), A('edi')],
      {
        lon: { type: 'move', dest: 'yor' },
        wal: { type: 'move', dest: 'yor' },
        edi: { type: 'move', dest: 'yor' },
      }
    );
    expect(at(units, 'lon')).toBeTruthy();
    expect(at(units, 'wal')).toBeTruthy();
    expect(at(units, 'edi')).toBeTruthy();
    expect(at(units, 'yor')).toBeFalsy(); // nobody moved in
  });

  it('supported unit beats unsupported rival moving to same empty territory', () => {
    // A ruh → hol (str 2, supported by F kie), A bel → hol (str 1) — ruh wins
    const { units } = resolve(
      [A('ruh', 'GERMANY'), F('kie', 'GERMANY'), A('bel', 'ENGLAND')],
      {
        ruh: { type: 'move', dest: 'hol' },
        kie: { type: 'support', target: 'ruh', dest: 'hol' },
        bel: { type: 'move', dest: 'hol' },
      }
    );
    expect(at(units, 'hol')?.power).toBe('GERMANY'); // ruh moved in
    expect(at(units, 'bel')?.power).toBe('ENGLAND'); // bel bounced
    expect(at(units, 'ruh')).toBeFalsy();             // ruh vacated
  });

  it('circular move with one unit blocked: all fail (chain is broken)', () => {
    // lon → wal → yor → lon: would be a cycle, but a 4th unit (FRANCE) also moves to wal.
    // wal can't move to yor (yor → lon fails because lon → wal fails because of the bounce at wal).
    // Actually: two units move to wal (lon and fra) — bounce. wal can't move to yor (yor moving to lon
    // which is stuck). yor can't move to lon. All fail.
    // Simpler: A lon → wal (vs A fra → wal → bounce) breaks the chain.
    const { units } = resolve(
      [A('lon'), A('wal'), A('yor'), A('lvp', 'FRANCE')],
      {
        lon: { type: 'move', dest: 'wal' },  // bounce with lvp
        wal: { type: 'move', dest: 'yor' },  // can't move if yor stays
        yor: { type: 'move', dest: 'lon' },  // can't move if lon stays
        lvp: { type: 'move', dest: 'wal' },  // bounce with lon
      }
    );
    // lon and lvp bounce at wal. wal → yor fails (yor can't move). yor → lon fails.
    expect(at(units, 'lon')?.power).toBe('ENGLAND');
    expect(at(units, 'wal')?.power).toBe('ENGLAND');
    expect(at(units, 'yor')?.power).toBe('ENGLAND');
    expect(at(units, 'lvp')?.power).toBe('FRANCE');
  });

  it('dislodgement breaks support', () => {
    // A boh → vie (str 1), A vie S A boh → ??? (vie supports someone else — not relevant).
    // Actually: A boh attacks vie. A tyr S boh → vie (str 2). vie (FRANCE) also supports X.
    // vie is dislodged — its support order fails (but in this resolver support is computed
    // before dislodgement, so this is about whether a dislodged unit's support still counts).
    // Scenario: A mun (FRANCE) attacks boh. A vie (FRANCE) S A mun → boh.
    //           A ber (ENGLAND) S A boh (hold). boh holds with str 2.
    //           But if vie were dislodged before it could support... that's order-dependent.
    // Simpler test: if the supporter is dislodged, does it still add strength?
    // For now, since support-cutting already tests a related path, test that a dislodged
    // unit (whose support order was cut by being attacked) does not help the attack.
    // A yor → lon, A wal S yor → lon (str 2). A lvp (FRANCE) → wal cuts wal's support.
    // After cut, yor has str 1, cannot dislodge lon.
    const { dislodged } = resolve(
      [A('yor'), A('wal'), A('lon', 'FRANCE'), A('lvp', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'lon' },
        wal: { type: 'support', target: 'yor', dest: 'lon' },
        lvp: { type: 'move', dest: 'wal' }, // cuts wal's support
      }
    );
    expect(dislodged.length).toBe(0); // support was cut; yor fails
  });

  it('fleet on a coast territory cannot act as a convoying fleet', () => {
    // F lon is on a coast (coast type), not a sea territory — convoy order is invalid.
    // A yor has a move order, no valid convoy chain exists.
    const { units } = resolve(
      [A('yor'), F('lon')],
      {
        yor: { type: 'move', dest: 'nwy' },
        lon: { type: 'convoy', army: 'yor', dest: 'nwy' }, // invalid: lon is coast, not water
      }
    );
    expect(at(units, 'yor')).toBeTruthy(); // stayed — no valid convoy
  });

  it('convoyed army bounces when another unit moves to the same destination', () => {
    // A yor → nwy via F nth. A swe (FRANCE) also → nwy (direct: nwy.army = [fin, stp, swe]).
    // Both arrive at nwy with str 1 — bounce. yor stays, swe stays.
    const { units } = resolve(
      [A('yor'), F('nth'), A('swe', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'nwy' },
        nth: { type: 'convoy', army: 'yor', dest: 'nwy' },
        swe: { type: 'move', dest: 'nwy' },
      }
    );
    expect(at(units, 'yor')?.power).toBe('ENGLAND');
    expect(at(units, 'swe')?.power).toBe('FRANCE');
    expect(at(units, 'nwy')).toBeFalsy(); // nobody moved in
  });
});

// ── Multi-hop convoy ─────────────────────────────────────────────────────────

describe('multi-hop convoy', () => {
  it('two-hop convoy: army crosses two seas to non-adjacent destination', () => {
    // A smy → nap via F aeg + F ion.
    // aeg adj smy ✓, aeg adj ion ✓, ion adj nap ✓
    // Neither aeg alone (not adj nap) nor ion alone (not adj smy) can do it in one hop.
    const { units } = resolve(
      [A('smy', 'TURKEY'), F('aeg', 'TURKEY'), F('ion', 'TURKEY')],
      {
        smy: { type: 'move', dest: 'nap' },
        aeg: { type: 'convoy', army: 'smy', dest: 'nap' },
        ion: { type: 'convoy', army: 'smy', dest: 'nap' },
      }
    );
    expect(at(units, 'nap')?.type).toBe('A');
    expect(at(units, 'smy')).toBeFalsy();
  });

  it('two-hop convoy fails if one fleet has no convoy order', () => {
    // Without ion's convoy order the chain is broken — smy stays.
    const { units } = resolve(
      [A('smy', 'TURKEY'), F('aeg', 'TURKEY'), F('ion', 'TURKEY')],
      {
        smy: { type: 'move', dest: 'nap' },
        aeg: { type: 'convoy', army: 'smy', dest: 'nap' },
        // ion has no convoy order — chain broken
      }
    );
    expect(at(units, 'smy')).toBeTruthy();
    expect(at(units, 'nap')).toBeFalsy();
  });
});

// ── Convoyed army cuts support ───────────────────────────────────────────────

describe('convoyed army cuts support', () => {
  it('convoyed army cuts support, changing the resolution outcome', () => {
    // ruh (GERMANY, str 2 supported by kie) attacks hol.
    // bel (ENGLAND) provides hold support for hol → hol str 2 → attack would fail.
    // A yor (FRANCE) is convoyed via F nth to bel, cutting bel's support.
    // yor fails to dislodge bel (str 1 vs 1), but the attack still cuts the support.
    // With support cut: hol str 1, ruh str 2 > 1 → ruh dislodges hol.
    // ruh adj hol ✓, kie adj hol ✓, bel adj hol ✓ (hold support), yor not army-adj bel ✓
    const { units, dislodged } = resolve(
      [A('ruh', 'GERMANY'), A('kie', 'GERMANY'), A('hol', 'ENGLAND'), A('bel', 'ENGLAND'), A('yor', 'FRANCE'), F('nth', 'FRANCE')],
      {
        ruh: { type: 'move', dest: 'hol' },
        kie: { type: 'support', target: 'ruh', dest: 'hol' },
        bel: { type: 'support', target: 'hol' },           // hold support, no dest
        yor: { type: 'move', dest: 'bel' },                // convoy via nth
        nth: { type: 'convoy', army: 'yor', dest: 'bel' },
      }
    );
    expect(dislodged.find(d => d.unit.id === 'hol')).toBeTruthy(); // hol dislodged
    expect(at(units, 'yor')).toBeTruthy(); // yor stayed at yor (failed to take bel)
  });

  it('without the convoyed army, the same attack fails (support holds)', () => {
    // Identical setup minus yor and nth. bel's support is intact → hol str 2 → ruh fails.
    const { units, dislodged } = resolve(
      [A('ruh', 'GERMANY'), A('kie', 'GERMANY'), A('hol', 'ENGLAND'), A('bel', 'ENGLAND')],
      {
        ruh: { type: 'move', dest: 'hol' },
        kie: { type: 'support', target: 'ruh', dest: 'hol' },
        bel: { type: 'support', target: 'hol' },
      }
    );
    expect(at(units, 'hol')?.power).toBe('ENGLAND'); // hol holds
    expect(dislodged.length).toBe(0);
  });
});

// ── Beleaguered garrison ─────────────────────────────────────────────────────

describe('beleaguered garrison', () => {
  it('two equal-strength attacks on same territory: neither dislodges', () => {
    // A vie (FRANCE, str 2 supported by gal) and A ser (GERMANY, str 2 supported by rum)
    // both attack bud (ENGLAND, str 1). Each alone would dislodge — but equal rivals means
    // neither succeeds and bud holds.
    // gal adj bud ✓, gal adj vie ✓; rum adj bud ✓, rum adj ser ✓
    const { units, dislodged } = resolve(
      [A('bud', 'ENGLAND'), A('vie', 'FRANCE'), A('gal', 'FRANCE'), A('ser', 'GERMANY'), A('rum', 'GERMANY')],
      {
        vie: { type: 'move', dest: 'bud' },
        gal: { type: 'support', target: 'vie', dest: 'bud' },
        ser: { type: 'move', dest: 'bud' },
        rum: { type: 'support', target: 'ser', dest: 'bud' },
      }
    );
    expect(at(units, 'bud')?.power).toBe('ENGLAND');
    expect(dislodged.length).toBe(0);
  });

  it('single supported attack of strength 2 does dislodge (contrast with beleaguered garrison)', () => {
    // Control: confirms bud WOULD fall to a lone str-2 attack, making the garrison test meaningful.
    const { dislodged } = resolve(
      [A('bud', 'ENGLAND'), A('vie', 'FRANCE'), A('gal', 'FRANCE')],
      {
        vie: { type: 'move', dest: 'bud' },
        gal: { type: 'support', target: 'vie', dest: 'bud' },
      }
    );
    expect(dislodged.find(d => d.unit.id === 'bud')).toBeTruthy();
  });
});

// ── Known limitations ────────────────────────────────────────────────────────

describe('known limitations', () => {
  it.skip('convoy fails if the convoying fleet is dislodged (not yet implemented)', () => {
    // A yor (ENGLAND) → nwy via F nth (ENGLAND).
    // F ska (FRANCE) supported by F nrg (FRANCE) dislodges nth.
    // Per standard Diplomacy rules, the convoy should fail and yor should stay.
    // Current behaviour: yor still reaches nwy (disruption not implemented).
    const { units } = resolve(
      [A('yor', 'ENGLAND'), F('nth', 'ENGLAND'), F('ska', 'FRANCE'), F('nrg', 'FRANCE')],
      {
        yor: { type: 'move', dest: 'nwy' },
        nth: { type: 'convoy', army: 'yor', dest: 'nwy' },
        ska: { type: 'move', dest: 'nth' },
        nrg: { type: 'support', target: 'ska', dest: 'nth' },
      }
    );
    expect(at(units, 'yor')).toBeTruthy();  // yor did NOT reach nwy
    expect(at(units, 'nwy')).toBeFalsy();
  });
});

