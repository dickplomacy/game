// CHANGE: Added input size limit during deserialization to prevent OOM attacks.
// REASON: Analysis identified lack of validation in protocol deserialization (line ~120).
// ORIGINAL: (line ~120) serde_json::from_str(data) without size limit

use serde::{Deserialize, Serialize};
use serde_json::Deserializer;
use std::io::{BufReader, Read, Take};

// Message types (unchanged)
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    Login { username: String, password: String },
    Move { from: (i32, i32), to: (i32, i32) },
    Chat { content: String },
    Disconnect,
}

/// Deserialize a Message from a string, limiting input to 1 MB to prevent resource exhaustion.
/// Uses `BufReader` with `take()` to cap bytes read.
pub fn deserialize_message(data: &str) -> Result<Message, serde_json::Error> {
    const MAX_BYTES: u64 = 1_048_576; // 1 MB

    let reader = BufReader::new(data.as_bytes());
    // take ensures we never read more than MAX_BYTES from the underlying reader
    let limited_reader = reader.take(MAX_BYTES);

    let de = Deserializer::from_reader(limited_reader);
    let value = Message::deserialize(de)?;
    Ok(value)
}

/// Serialize a Message into a String (unchanged)
pub fn serialize_message(msg: &Message) -> Result<String, serde_json::Error> {
    serde_json::to_string(msg)
}

// Additional utility: validate message size before processing
pub fn is_message_size_valid(data: &str) -> bool {
    data.len() <= 1_048_576
}
```

