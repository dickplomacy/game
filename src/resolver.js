/**
 * Diplomacy Order Resolver
 *
 * Rules implemented:
 *   - Units with no order hold in place
 *   - Move into occupied territory: fails (attacker strength 1 not > holder strength 1)
 *   - Head-to-head (A→B and B→A): both fail
 *   - Bounce: 2+ units moving to the same territory with equal strength: all fail
 *   - Chain (A→B→C where C is empty): both succeed
 *   - Circular move (A→B, B→C, C→A with no opposition): all succeed
 *   - Adjacency enforcement: non-adjacent moves are treated as holds
 *   - Convoy: army may move to non-adjacent coast if a chain of sea fleets with
 *     matching convoy orders connects source to destination
 *   - Convoyed swap: A→X (via convoy) and F X→A is NOT a head-to-head
 *
 * Not yet implemented:
 *   - Support (modifies strength)
 *   - Convoy chain broken by fleet dislodgement (requires support first)
 *   - Retreat phase
 *   - Winter adjustments
 */

import territories from './territories.json';

// Strip coast variant suffix: 'stp-sc' → 'stp'
function baseId(id) {
  return id.includes('-') ? id.split('-')[0] : id;
}

/**
 * Check whether a unit can reach destOrigId by direct adjacency.
 * For armies: looks up moves.army on the source base territory.
 * For fleets: looks up moves.fleet on the unit's territory (coast variant if present).
 */
function isAdjacent(unit, destOrigId) {
  const srcEntry = territories[unit.id] ?? territories[baseId(unit.id)];
  if (!srcEntry) return false;
  const dest = baseId(destOrigId);
  if (unit.type === 'A') {
    return srcEntry.moves.army.some(m => baseId(m) === dest);
  } else {
    // Fleet: dest may be a coast variant; check both exact and base match
    return srcEntry.moves.fleet.some(m => m === destOrigId || baseId(m) === dest);
  }
}

/**
 * BFS convoy-chain check.
 *
 * A valid chain is a sequence of sea territories, each occupied by a fleet
 * with a matching convoy order {type:'convoy', army:armyId, dest:destTerritoryId},
 * that connects the army's source coast to the destination coast.
 *
 * Fleet dislodgement breaking convoys is not yet implemented (requires support).
 *
 * @param {string}   armyId      Army's unit id (= its current territory id)
 * @param {string}   armySrcBase Base id of army's source territory
 * @param {string}   destOrigId  Destination territory id (may include coast variant)
 * @param {object[]} units       All units
 * @param {object}   orders      All orders
 * @returns {boolean}
 */
function hasConvoyChain(armyId, armySrcBase, destOrigId, units, orders) {
  const destBase = baseId(destOrigId);

  // Collect sea territories whose fleet has a valid convoy order for this army→dest
  const convoyingSea = new Set();
  units.forEach(u => {
    if (u.type !== 'F') return;
    const o = orders[u.id];
    if (o?.type !== 'convoy') return;
    if (o.army !== armyId) return;
    if (baseId(o.dest) !== destBase) return;
    const t = territories[baseId(u.id)];
    if (t?.type === 'water') convoyingSea.add(baseId(u.id));
  });

  if (convoyingSea.size === 0) return false;

  const srcEntry = territories[armySrcBase];
  if (!srcEntry) return false;

  // BFS starting from sea territories adjacent to the army's source coast
  const visited = new Set();
  const queue = [];
  for (const adj of (srcEntry.moves.fleet ?? [])) {
    const adjBase = baseId(adj);
    if (convoyingSea.has(adjBase) && !visited.has(adjBase)) {
      visited.add(adjBase);
      queue.push(adjBase);
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift();
    const curEntry = territories[cur];
    if (!curEntry) continue;

    // Can the army disembark from this sea territory to reach dest?
    if (curEntry.moves.fleet.some(m => baseId(m) === destBase)) {
      return true;
    }

    // Expand to adjacent convoying sea territories
    for (const adj of (curEntry.moves.fleet ?? [])) {
      const adjBase = baseId(adj);
      if (convoyingSea.has(adjBase) && !visited.has(adjBase)) {
        visited.add(adjBase);
        queue.push(adjBase);
      }
    }
  }

  return false;
}

/**
 * Resolve orders and return updated state.
 *
 * @param {object[]} units   [{id, type, power, x, y}, ...]
 * @param {object}   orders  {unitId: {type, dest?, target?, army?, dest?}}
 * @returns {{ units: object[], dislodged: object[] }}
 *   units     — new positions after successful moves (dislodged units removed)
 *   dislodged — array of { unit, retreatOptions: string[] } for the retreat phase
 *               retreatOptions is the set of base territory ids the unit may retreat to
 *               (empty means the unit must disband)
 */
export function resolve(units, orders) {
  // Map base territory id → unit id
  const occupied = new Map();
  units.forEach(u => occupied.set(baseId(u.id), u.id));

  // unitId → unit object (quick lookup)
  const unitById = Object.fromEntries(units.map(u => [u.id, u]));

  // ── Collect move orders ──────────────────────────────────────────────────
  const moves    = {};        // unitId → base dest id
  const origDest = {};        // unitId → original dest id (may have coast variant)
  const convoyed = new Set(); // unitIds whose move is via convoy

  units.forEach(u => {
    const o = orders[u.id];
    if (o?.type === 'move' && o.dest) {
      if (isAdjacent(u, o.dest)) {
        moves[u.id]    = baseId(o.dest);
        origDest[u.id] = o.dest;
      } else if (u.type === 'A') {
        const srcBase = baseId(u.id);
        if (hasConvoyChain(u.id, srcBase, o.dest, units, orders)) {
          moves[u.id]    = baseId(o.dest);
          origDest[u.id] = o.dest;
          convoyed.add(u.id);
        }
      }
    }
  });

  // ── Compute attack strength for each moving unit ─────────────────────────
  // strength[uid] = 1 + number of valid move-supports for that unit's move order
  // A support order {type:'support', target:tgtId, dest:destId} is valid when:
  //   - The supporter is adjacent to the destination being supported into
  //   - The target unit actually has a move order to that destination
  //   - The supporter is not the same power as the defending unit (self-dislodge rule)
  //     NOTE: self-dislodge prevention: if attacker and defender are same power, move fails.
  //           We handle self-dislodge as a post-resolution check.
  const attackStrength = {};
  units.forEach(u => {
    if (moves[u.id]) attackStrength[u.id] = 1;
  });

  units.forEach(supporter => {
    const o = orders[supporter.id];
    if (o?.type !== 'support' || !o.dest) return; // only move-support (not hold-support) boosts attack

    const target = unitById[o.target];
    if (!target) return;

    const targetDest = moves[target.id];
    if (!targetDest) return; // target isn't moving (or move is invalid)
    if (targetDest !== baseId(o.dest)) return; // support is for a different destination

    // Supporter must be adjacent to the destination
    const suppAdj = isAdjacentById(supporter.id, supporter.type, o.dest);
    if (!suppAdj) return;

    attackStrength[target.id] = (attackStrength[target.id] ?? 1) + 1;
  });

  // ── Compute hold strength for each non-moving unit ───────────────────────
  // hold strength = 1 + valid hold-support orders
  const holdStrength = {};
  units.forEach(u => { holdStrength[u.id] = 1; });

  units.forEach(supporter => {
    const o = orders[supporter.id];
    if (o?.type !== 'support' || o.dest) return; // only hold-support (dest is null)

    const target = unitById[o.target];
    if (!target) return;
    if (moves[target.id]) return; // target is moving, can't hold-support a mover

    holdStrength[target.id] = (holdStrength[target.id] ?? 1) + 1;
  });

  // ── Support-cutting ───────────────────────────────────────────────────────
  // A support order is cut if the supporter is attacked from any territory
  // EXCEPT the destination being supported into.
  // "Attacked" means: a unit has a move order to the supporter's territory.
  // Cut support is removed by zeroing its contribution.

  // Build set of supporters that are cut
  const cutSupporters = new Set();
  units.forEach(attacker => {
    const dest = moves[attacker.id];
    if (!dest) return;
    const defenderUnitId = occupied.get(dest);
    if (!defenderUnitId) return;
    const defenderOrder = orders[defenderUnitId];
    if (defenderOrder?.type !== 'support') return;

    // defenderUnitId is a supporter — check if attacker came from a different direction
    const supportedDest = defenderOrder.dest ? baseId(defenderOrder.dest) : null;
    if (supportedDest && baseId(attacker.id) === supportedDest) return; // attacker came from the dest being supported into — no cut

    cutSupporters.add(defenderUnitId);
  });

  // Re-compute attack strengths removing cut supporters
  // Reset and recount
  units.forEach(u => { if (moves[u.id]) attackStrength[u.id] = 1; });
  units.forEach(supporter => {
    if (cutSupporters.has(supporter.id)) return;
    const o = orders[supporter.id];
    if (o?.type !== 'support' || !o.dest) return;
    const target = unitById[o.target];
    if (!target) return;
    const targetDest = moves[target.id];
    if (!targetDest || targetDest !== baseId(o.dest)) return;
    if (!isAdjacentById(supporter.id, supporter.type, o.dest)) return;
    attackStrength[target.id] = (attackStrength[target.id] ?? 1) + 1;
  });

  // Re-compute hold strengths removing cut supporters
  units.forEach(u => { holdStrength[u.id] = 1; });
  units.forEach(supporter => {
    if (cutSupporters.has(supporter.id)) return;
    const o = orders[supporter.id];
    if (o?.type !== 'support' || o.dest) return;
    const target = unitById[o.target];
    if (!target || moves[target.id]) return;
    holdStrength[target.id] = (holdStrength[target.id] ?? 1) + 1;
  });

  // ── Resolution ────────────────────────────────────────────────────────────
  const { succeeded, standoffTerritories, attackerOf } =
    resolveWithStrength(moves, occupied, convoyed, attackStrength, holdStrength, unitById, orders);

  // ── Self-dislodge prevention ──────────────────────────────────────────────
  // A power cannot dislodge its own unit. Only applies when the defender is
  // staying (not vacating); if defender is also in succeeded, they are moving
  // away and there is no dislodgement.
  succeeded.forEach(uid => {
    const dest = moves[uid];
    const defId = occupied.get(dest);
    if (!defId) return;
    if (succeeded.has(defId)) return; // defender is vacating — no dislodgement
    if (unitById[uid]?.power === unitById[defId]?.power) {
      succeeded.delete(uid);
    }
  });

  // ── Build result ─────────────────────────────────────────────────────────
  // Determine which units are dislodged:
  // a unit is dislodged if a successful mover is entering its territory
  const dislodgedIds = new Set();
  succeeded.forEach(uid => {
    const dest = moves[uid];
    const occupantId = occupied.get(dest);
    if (occupantId && !succeeded.has(occupantId)) {
      dislodgedIds.add(occupantId);
    }
  });

  // Compute retreat options for each dislodged unit
  const dislodged = [];
  dislodgedIds.forEach(uid => {
    const u = unitById[uid];
    const srcBase = baseId(u.id);
    const attackerSrcBase = attackerOf[srcBase] ? baseId(attackerOf[srcBase]) : null;

    const entry = territories[u.id] ?? territories[srcBase];
    const adjList = u.type === 'A' ? (entry?.moves.army ?? []) : (entry?.moves.fleet ?? []);

    const retreatOptions = adjList
      .map(m => baseId(m))
      .filter((tid, i, arr) => arr.indexOf(tid) === i) // dedupe
      .filter(tid => {
        // Occupied and staying → not a valid retreat
        const occ = occupied.get(tid);
        if (occ && !succeeded.has(occ)) return false;
        // If the occupant is vacating (succeeded), the territory is becoming free,
        // but we must still apply the attacker-origin and standoff checks.

        if (standoffTerritories.has(tid)) return false;
        if (tid === attackerSrcBase) return false;

        return true;
      });

    dislodged.push({ unit: u, retreatOptions });
  });

  // Build new unit list: move succeeded units, remove dislodged
  const newUnits = units
    .filter(u => !dislodgedIds.has(u.id))
    .map(u => {
      if (!succeeded.has(u.id)) return u;
      const dest = origDest[u.id];
      const t = territories[dest] ?? territories[baseId(dest)];
      if (!t?.unitCoord) return u;
      return { ...u, id: dest, x: t.unitCoord.x, y: t.unitCoord.y };
    });

  return { units: newUnits, dislodged };
}

/**
 * Adjacency check by territory id + unit type (for supporter adjacency check).
 */
function isAdjacentById(srcId, unitType, destOrigId) {
  const srcEntry = territories[srcId] ?? territories[baseId(srcId)];
  if (!srcEntry) return false;
  const dest = baseId(destOrigId);
  if (unitType === 'A') {
    return srcEntry.moves.army.some(m => baseId(m) === dest);
  } else {
    return srcEntry.moves.fleet.some(m => m === destOrigId || baseId(m) === dest);
  }
}

/**
 * Core resolution with strength.
 * Returns { succeeded: Set<unitId>, standoffTerritories: Set<baseId>, attackerOf: {baseDest: unitId} }
 */
function resolveWithStrength(moves, occupied, convoyed, attackStrength, holdStrength, unitById, orders) {
  const status = {};
  for (const uid of Object.keys(moves)) status[uid] = 'pending';

  function unitAt(tid) {
    return occupied.get(baseId(tid)) ?? null;
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const uid of Object.keys(status)) {
      if (status[uid] !== 'pending') continue;

      const dest = moves[uid];
      const occupantId = unitAt(dest);
      const atkStr = attackStrength[uid] ?? 1;

      // ── Head-to-head ────────────────────────────────────────────────────
      // A convoyed move passes through sea — skip HtH if EITHER unit is convoyed.
      if (
        occupantId &&
        moves[occupantId] === baseId(uid) &&
        status[occupantId] !== 'failed' &&
        !convoyed.has(uid) &&
        !convoyed.has(occupantId)
      ) {
        const oppAtk = attackStrength[occupantId] ?? 1;
        // Both need strictly more strength than the other to advance
        if (atkStr > oppAtk) {
          // uid wins head-to-head
          if (status[occupantId] !== 'failed') { status[occupantId] = 'failed'; changed = true; }
        } else if (oppAtk > atkStr) {
          if (status[uid] !== 'failed') { status[uid] = 'failed'; changed = true; }
        } else {
          // Equal strength — both fail
          if (status[uid] !== 'failed')        { status[uid] = 'failed';        changed = true; }
          if (status[occupantId] !== 'failed') { status[occupantId] = 'failed'; changed = true; }
        }
        continue;
      }

      // ── Occupant holds or fails to move ─────────────────────────────────
      if (occupantId) {
        const occupantHasMove = moves[occupantId] !== undefined;
        const occupantStatus  = occupantHasMove ? status[occupantId] : null;

        if (!occupantHasMove || occupantStatus === 'failed') {
          const defStr = holdStrength[occupantId] ?? 1;
          if (atkStr > defStr) {
            // Attacker is strong enough to dislodge — fall through to rivalry check
          } else {
            if (status[uid] !== 'failed') { status[uid] = 'failed'; changed = true; }
            continue;
          }
        } else if (occupantStatus === 'pending') {
          continue;
        }
        // occupantStatus === 'succeeded': will vacate
      }

      // ── Rivals check ────────────────────────────────────────────────────
      const activeRivals = Object.keys(status).filter(
        vid => vid !== uid && moves[vid] === dest && status[vid] !== 'failed'
      );

      if (activeRivals.length === 0) {
        if (status[uid] !== 'succeeded') { status[uid] = 'succeeded'; changed = true; }
      } else {
        // Check if uid has strictly more strength than all rivals
        const maxRivalStr = Math.max(...activeRivals.map(v => attackStrength[v] ?? 1));
        if (atkStr > maxRivalStr) {
          // uid beats all rivals — but only mark succeeded once rivals are resolved/failed
          const rivalsPending = activeRivals.some(v => status[v] === 'pending');
          if (!rivalsPending) {
            if (status[uid] !== 'succeeded') { status[uid] = 'succeeded'; changed = true; }
          }
        }
        // Equal or less → wait; cycle detection handles bounces
      }
    }
  }

  // ── Cycle detection ────────────────────────────────────────────────────────
  for (const startId of Object.keys(status)) {
    if (status[startId] !== 'pending') continue;
    const chain = [];
    let cur = startId;
    while (cur && status[cur] === 'pending' && !chain.includes(cur)) {
      chain.push(cur);
      cur = unitAt(moves[cur]) ?? null;
    }
    if (cur === startId) {
      chain.forEach(uid => { status[uid] = 'succeeded'; });
    } else {
      chain.forEach(uid => { if (status[uid] === 'pending') status[uid] = 'failed'; });
    }
  }

  // ── Standoff territories: any territory where 2+ units tried to move and none succeeded ──
  const standoffTerritories = new Set();
  const destAttempts = {};
  for (const uid of Object.keys(moves)) {
    const d = moves[uid];
    destAttempts[d] = (destAttempts[d] ?? 0) + 1;
  }
  for (const [dest, count] of Object.entries(destAttempts)) {
    if (count >= 2) {
      const anySucceeded = Object.keys(moves).some(uid => moves[uid] === dest && status[uid] === 'succeeded');
      if (!anySucceeded) standoffTerritories.add(dest);
    }
  }

  // ── attackerOf: for each base dest, which unit attacked it (succeeded) ───
  const attackerOf = {};
  for (const uid of Object.keys(status)) {
    if (status[uid] === 'succeeded') {
      attackerOf[moves[uid]] = uid;
    }
  }

  return {
    succeeded: new Set(Object.keys(status).filter(uid => status[uid] === 'succeeded')),
    standoffTerritories,
    attackerOf,
  };
}
