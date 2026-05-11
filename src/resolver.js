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
 * Resolve orders and return updated unit array.
 *
 * @param {object[]} units   [{id, type, power, x, y}, ...]
 * @param {object}   orders  {unitId: {type, dest?, target?, army?}}
 * @returns {object[]} New unit array with positions updated for successful moves
 */
export function resolve(units, orders) {
  // Map base territory id → unit id (unit.id IS its territory)
  const occupied = new Map();
  units.forEach(u => {
    occupied.set(baseId(u.id), u.id);
  });

  // Collect move orders: unitId → destination base territory id
  // Keep original dest separately for applying (may include coast variant like 'spa-sc')
  // Non-adjacent moves are accepted only when a valid convoy chain exists.
  const moves = {};        // unitId → base dest id  (collision detection)
  const origDest = {};     // unitId → original dest id from order (for applying)
  const convoyed = new Set(); // unitIds whose move goes via convoy (not direct adjacency)
  units.forEach(u => {
    const o = orders[u.id];
    if (o?.type === 'move' && o.dest) {
      if (isAdjacent(u, o.dest)) {
        moves[u.id] = baseId(o.dest);
        origDest[u.id] = o.dest;
      } else if (u.type === 'A') {
        const srcBase = baseId(u.id);
        if (hasConvoyChain(u.id, srcBase, o.dest, units, orders)) {
          moves[u.id] = baseId(o.dest);
          origDest[u.id] = o.dest;
          convoyed.add(u.id);
        }
        // else: non-adjacent, no convoy chain → treated as hold
      }
    }
  });

  const succeeded = resolveSimpleMoves(moves, occupied, convoyed);

  return units.map(u => {
    if (!succeeded.has(u.id)) return u;
    const dest = origDest[u.id];
    // Look up by coast variant first, fall back to base
    const t = territories[dest] ?? territories[baseId(dest)];
    if (!t?.unitCoord) return u;
    return { ...u, id: dest, x: t.unitCoord.x, y: t.unitCoord.y };
  });
}

/**
 * Core resolution algorithm.
 * Returns a Set of unitIds whose move orders succeed.
 *
 * @param {object}   moves    { unitId: baseDestId }
 * @param {Map}      occupied Map<baseTerritoryId, unitId>
 * @param {Set}      convoyed Set of unitIds moving via convoy (exempt from head-to-head)
 * @returns {Set<string>}
 */
function resolveSimpleMoves(moves, occupied, convoyed = new Set()) {
  // status for each moving unit
  const status = {}; // unitId → 'pending' | 'succeeded' | 'failed'
  for (const uid of Object.keys(moves)) status[uid] = 'pending';

  // Get the unitId currently at a territory (null if vacant)
  function unitAt(tid) {
    return occupied.get(baseId(tid)) ?? null;
  }

  // --- Iterative resolution ---
  // Each pass marks units that can be definitively resolved.
  // Repeat until no more progress.
  let changed = true;
  while (changed) {
    changed = false;

    for (const uid of Object.keys(status)) {
      if (status[uid] !== 'pending') continue;

      const dest = moves[uid];          // base dest territory
      const occupantId = unitAt(dest);  // unit currently there (null if empty)

      // ── Head-to-head ──────────────────────────────────────────────────────
      // Occupant is moving back into uid's territory: A→B and B→A
      // Both have strength 1, so neither advances.
      // Exception: if uid is convoyed (passes via sea), there is no head-to-head —
      // the occupant may move into uid's vacated territory normally.
      if (
        occupantId &&
        moves[occupantId] === baseId(uid) &&
        status[occupantId] !== 'failed' &&
        !convoyed.has(uid)           // convoyed army doesn't create head-to-head
      ) {
        if (status[uid] !== 'failed')        { status[uid] = 'failed';        changed = true; }
        if (status[occupantId] !== 'failed') { status[occupantId] = 'failed'; changed = true; }
        continue;
      }

      // ── Occupant holds or fails to move ───────────────────────────────────
      // A unit can only be dislodged if attacker strength > holder strength.
      // With no support, that means 1 > 1 = false — always blocked.
      if (occupantId) {
        const occupantHasMove = moves[occupantId] !== undefined;
        const occupantStatus  = occupantHasMove ? status[occupantId] : null; // null → holds

        if (!occupantHasMove || occupantStatus === 'failed') {
          // Occupant stays → attacker is blocked
          if (status[uid] !== 'failed') { status[uid] = 'failed'; changed = true; }
          continue;
        }

        if (occupantStatus === 'pending') {
          // Can't decide yet — wait for occupant's move to resolve
          continue;
        }
        // occupantStatus === 'succeeded': dest will be vacated → fall through
      }

      // ── Destination is (or will be) clear — check for rivals ──────────────
      // Other non-failed units also moving to the same destination.
      const activeRivals = Object.keys(status).filter(
        vid => vid !== uid && moves[vid] === dest && status[vid] !== 'failed'
      );

      if (activeRivals.length === 0) {
        // Sole mover to a clear territory — succeeds
        if (status[uid] !== 'succeeded') { status[uid] = 'succeeded'; changed = true; }
      }
      // Rivals still active → wait; cycle detection will handle the bounce
    }
  }

  // ── Cycle detection ────────────────────────────────────────────────────────
  // Any unit still 'pending' here is either:
  //   (a) Part of a circular move chain (A→B→C→A) → all succeed
  //   (b) Part of a bounce against another pending unit → all fail
  //
  // Follow each pending unit's chain. If it loops back to the start → cycle.
  for (const startId of Object.keys(status)) {
    if (status[startId] !== 'pending') continue;

    const chain = [];
    let cur = startId;

    while (cur && status[cur] === 'pending' && !chain.includes(cur)) {
      chain.push(cur);
      const nextDest = moves[cur];
      cur = unitAt(nextDest) ?? null; // who is currently at that destination?
    }

    if (cur === startId) {
      // Perfect closed cycle → all moves in the cycle succeed
      chain.forEach(uid => { status[uid] = 'succeeded'; });
    } else {
      // Open chain (ends in empty space or a non-pending unit) → bounce, all fail
      chain.forEach(uid => { if (status[uid] === 'pending') status[uid] = 'failed'; });
    }
  }

  return new Set(Object.keys(status).filter(uid => status[uid] === 'succeeded'));
}
