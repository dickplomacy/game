# Diplomacy Rules & Adjudication Reference

Source: Official rulebook (Avalon Hill / Wizards of the Coast), DATC v3.0, and standard adjudication practice.

---

## Overview

- 7 powers: Austria, England, France, Germany, Italy, Russia, Turkey
- 56 land territories, 19 sea territories
- 34 supply centers (22 home, 12 neutral at start)
- Win condition: control 18 of 34 supply centers at end of a Fall turn
- No randomness — no dice

---

## Turn Structure

Each game year has two main seasons, each with a movement phase and potentially a retreat phase:

1. **Spring Movement** → Spring Retreats (if any)
2. **Fall Movement** → Fall Retreats (if any)
3. **Winter Adjustments** (builds/disbands, after Fall only)

---

## Unit Types

| Unit | Can occupy | Cannot enter |
|------|-----------|-------------|
| Army (A) | Land (coast or inland) | Sea territories |
| Fleet (F) | Sea territories, coastal land | Landlocked land territories |

Only one unit may occupy a territory at a time.

---

## Orders

Each unit must receive exactly one order per season. Unordered units hold.

### Move (→)
`A BUD → GAL`

- Unit attempts to move to an adjacent territory
- Armies move between adjacent land territories
- Fleets move between adjacent sea/coast territories (following coast adjacency)
- A unit that fails to move remains where it is (holds)

### Hold
`A BUD H`

- Unit stays in place
- Implicit if no order is given

### Support (S)
`A VIE S A BUD → GAL`  (support a move)
`A VIE S A BUD H`       (support a hold)

- Unit must be adjacent to the territory being supported **into** (for move support)
- Unit must be adjacent to the territory of the unit being supported (for hold support)
- Supporting unit does not move
- Support can be cut (see below)

### Convoy (C)
`F NTH C A YOR → NWY`

- **Only fleets in sea territories** can convoy
- Convoyed army moves from its coast territory to a non-adjacent coast territory
- A chain of fleets can convoy an army across multiple sea territories
- The army must have a matching move order: `A YOR → NWY`

---

## Adjudication — Core Rules

### Strength
- A unit's **attack strength** = 1 + number of valid support orders for that move
- A unit's **hold strength** = 1 + number of valid hold support orders
- A unit with no orders or a failed move has hold strength of 1

### Moving into an empty territory
- Succeeds if no other unit is also moving there with equal or higher strength
- If two or more units move to the same territory with equal strength → **standoff** (no one moves)

### Moving into an occupied territory
- Succeeds if attack strength > defender's hold strength
- **Dislodgement**: the defending unit must retreat or disband

### Bouncing
- Two units attempting to move into the same territory simultaneously with equal strength → both fail, both remain in place
- A standoff in a territory **does not** prevent other moves *through* that territory (it just leaves it empty)

---

## Support Rules in Detail

### Support is cut if:
- The supporting unit is attacked from any territory **except** the territory being attacked into
  - Example: `A VIE S A BUD → GAL`. If someone attacks VIE from GAL, support is NOT cut (you can't cut support aimed at your own territory)
  - If someone attacks VIE from anywhere else, support IS cut

### Support is not cut if:
- The attacker is repelled (does not have enough strength to dislodge the supporter)
  - Exception: the support is still cut even if the attack fails, unless the attacker is bounced/repelled by the *supported unit's own move*

### Dislodgement breaks support
- If a supporting unit is dislodged, its support order fails

---

## Convoy Rules in Detail

- The convoying fleet must be in a **sea** territory
- If a convoying fleet is dislodged, the convoy is broken and the army does not move (it stays)
- A chain of fleets all need to survive for the convoy to succeed
- An army can only be convoyed if its move order uses a route that requires crossing sea (i.e. not directly adjacent by land)
- **Paradox / circular convoy**: if a fleet being attacked is the only route for a convoy, and the convoy would cause the fleet not to be dislodged — this is resolved by the rule that the convoy succeeds (standard ruling)

---

## Special Situations

### Head-to-head battles
`A BUD → VIE` and `A VIE → BUD` simultaneously:

- Treated as a head-to-head: each unit needs more support than the other to advance
- Neither can use the other's territory as a "pass-through"
- A unit supporting one side from a third territory counts normally

### Swapping without convoy
Two units cannot swap positions without a convoy. If A→B and B→A with no fleet convoying, both fail (head-to-head standoff).

### Swapping with convoy
If one of the units is convoyed (e.g. A is convoyed across sea while B moves into A's territory), the swap succeeds because the convoyed army is not physically "in the way".

### Self-dislodgement
A power **cannot** dislodge its own unit. If a power's unit would dislodge a friendly unit, the move fails.

### Supporting your own unit into a territory you occupy
If unit X is in GAL and you order `A BUD → GAL` supported by `A VIE S A BUD → GAL`, this is a valid support but X must move out of GAL for the move to succeed. If X holds or fails to move, BUD is bounced.

### Three-way standoff
If three units all try to move to the same territory with equal strength, all three fail. None of the three original territories become vacant (they all hold).

### Cutting support aimed at yourself
If A BUD → VIE is supported by A TRI S BUD → VIE, and VIE attacks TRI (to cut the support), VIE's attack does NOT cut the support because TRI's support is aimed at the territory VIE is moving FROM.

---

## Retreat Phase

After each movement phase, dislodged units must either:
- **Retreat** to an adjacent territory that is: (a) vacant, (b) not the territory the attacker came from, (c) not a standoff territory this turn
- **Disband** (if no valid retreat exists, or player chooses)

If two units need to retreat to the same territory → both are disbanded.

---

## Winter Adjustments (after Fall only)

1. Count supply centers controlled at end of Fall
2. Count units on board
3. If units > supply centers → must **disband** excess units (player chooses which)
4. If supply centers > units → may **build** units in unoccupied HOME supply centers
   - A player who has lost all home supply centers cannot build
5. A player controlling 0 supply centers is **eliminated**

---

## Coast Variants

Three territories have two separately named coasts:

| Territory | Coasts | Notes |
|-----------|--------|-------|
| Spain (spa) | spa-nc (north coast), spa-sc (south coast) | |
| Bulgaria (bul) | bul-ec (east coast), bul-sc (south coast) | |
| St Petersburg (stp) | stp-nc (north coast), stp-sc (south coast) | |

- When a fleet enters one of these territories, the player must specify which coast
- The fleet's future moves depend on which coast it occupies
- Armies treat these as a single territory

---

## Common Edge Cases for the Resolver

| Situation | Rule |
|-----------|------|
| Unit ordered to move to its own territory | Treated as Hold |
| Move to non-adjacent territory (no convoy) | Illegal → treated as Hold |
| Support for a move the target unit isn't making | Support has **no effect** — the supporter holds in place but contributes no strength to any unit. It does NOT automatically become hold support. |
| Fleet tries to convoy but is on a coast | Illegal convoy — fleet is treated as holding |
| Circular movement (A→B, B→C, C→A) with no opposition | All moves succeed |
| Circular movement with one unit bounced | All fail — none move |
| Army convoyed to same destination another unit is moving to | Treated as a normal bounce |
| Dislodged unit tries to retreat to attacker's original territory | Not allowed |
| Two units retreat to same territory | Both disbanded |
| Build in occupied home center | Not allowed — must be vacant |

---

## Key Adjudication Algorithm Outline

```
1. Parse all orders; invalid orders become Hold
2. Resolve convoy routes (determine which convoys survive dislodgement)
3. Calculate support counts for each order, cutting supports as appropriate
4. Resolve moves:
   a. Check head-to-head battles first
   b. Resolve bounces (equal-strength conflicts)
   c. Resolve dislodgements (attacker > defender)
   d. Repeat until stable (circular dependencies may need iterative resolution)
5. Move successful units; leave failed units in place
6. Determine dislodged units → retreat phase
7. (Fall only) Update supply center ownership
8. (Winter) Calculate builds/disbands
```

---

## Notes for Implementation

- The DATC (Diplomacy Adjudicator Test Cases) v3.0 is the canonical test suite — 175+ test cases covering edge cases
- The Kruijswijk algorithm (2009) is widely used for correct iterative resolution
- Key tricky cases: circular convoys, self-standoffs, cutting support from the attacked territory
