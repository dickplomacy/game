// CHANGE: Used checked_add to prevent integer overflow in score calculation.
// REASON: Analysis identified overflow risk at line ~890 when adding user-controlled points.
// ORIGINAL: (line ~890) score += points;

use std::collections::HashMap;
use crate::network::protocol::Message;

// ... (presumed existing imports and structs) ...

// Score type – could be u32 or i32; using u32 as per analysis
type Score = u32;

#[derive(Debug)]
pub struct GameState {
    pub board: [[Option<Player>; 8]; 8],
    pub current_player: Player,
    pub scores: HashMap<Player, Score>,
    pub turn_number: u32,
    // ... other fields ...
}

impl GameState {
    // Other methods ...

    /// Award points to a player for a move. Uses checked addition to avoid overflow.
    /// If overflow would occur, score saturates at u32::MAX and a warning is logged.
    pub fn award_points(&mut self, player: &Player, points: Score) {
        let entry = self.scores.entry(*player).or_insert(0);
        // FIX: Use checked_add instead of simple addition
        *entry = entry.checked_add(points).unwrap_or_else(|| {
            log::warn!(
                "Score overflow for player {:?}: current {}, adding {}. Saturating to MAX.",
                player,
                *entry,
                points
            );
            Score::MAX
        });
    }

    // ... rest of the implementation ...
}
```

