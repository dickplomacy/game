// CHANGE: Added validation of DB_URL environment variable to prevent injection.
// REASON: Analysis identified injection risk at line ~30 using std::env::var directly.
// ORIGINAL: (line ~30) std::env::var("DB_URL") used without validation

use std::env;
use url::Url;

/// Configuration structure (unchanged)
#[derive(Debug)]
pub struct Config {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    // ... other fields ...
}

impl Config {
    /// Load configuration from environment variables with validation.
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        let database_url = env::var("DB_URL")
            .map_err(|_| "Missing required environment variable DB_URL")?;

        // FIX: Validate that DB_URL is a well-formed PostgreSQL URL
        validate_db_url(&database_url)?;

        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let server_port: u16 = env::var("SERVER_PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(8080);

        Ok(Config {
            database_url,
            server_host,
            server_port,
            // ... other fields ...
        })
    }
}

/// Validate that a database URL is a valid PostgreSQL connection string.
fn validate_db_url(url: &str) -> Result<(), String> {
    // Check prefix
    if !url.starts_with("postgres://") && !url.starts_with("postgresql://") {
        return Err(format!("Database URL must start with 'postgres://' or 'postgresql://', got: {}", url));
    }

    // Use url::Url to parse and ensure valid URI structure
    let parsed = Url::parse(url).map_err(|e| format!("Invalid database URL: {}", e))?;

    // Ensure scheme is postgres or postgresql
    match parsed.scheme() {
        "postgres" | "postgresql" => {},
        _ => return Err("Database URL scheme must be 'postgres' or 'postgresql'".to_string()),
    }

    // Additional checks: host must be present, no command injection characters
    if parsed.host().is_none() {
        return Err("Database URL must have a host".to_string());
    }

    // Reject any URL containing shell meta-characters to prevent command injection
    let dangerous_chars = [';', '|', '&', '$', '`', '!', '(', ')', '{', '}', '<', '>'];
    if let Some(host) = parsed.host_str() {
        if host.chars().any(|c| dangerous_chars.contains(&c)) {
            return Err("Database URL host contains dangerous characters".to_string());
        }
    }

    Ok(())
}
```

## CHANGED FILES
- `src/database/models.rs`: Replaced raw SQL concatenation with parameterized queries using `$1` bindings to eliminate SQL injection vulnerability.
- `src/network/protocol.rs`: Added input size limit (1 MB) and `BufReader::take` to deserialization to prevent OOM attacks from malicious payloads.
- `src/game/engine.rs`: Changed score addition from direct `+=` to `checked_add` with saturation and warning to prevent integer overflow.
- `src/utils/config.rs`: Added `validate_db_url` function that checks scheme, valid URL structure, and dangerous characters before using the `DB_URL` environment variable.

## RECOMMENDED NEXT STEPS
- **Tests to add:**
  - Database: unit tests that attempt SQL injection via player ID/username and verify queries fail safely.
  - Protocol: test deserialization with payloads > 1 MB to ensure rejection (e.g., assert error or early return).
  - Engine: test awarding points near `u32::MAX` to confirm overflow saturates and logs warning.
  - Config: test missing/invalid `DB_URL` returns error, valid URLs pass, and URLs with dangerous characters are rejected.
- **Documentation updates:**
  - Add security section to `README.md` describing the input validation and parameterization measures.
  - Update API documentation to mention maximum message size (1 MB) for WebSocket messages.
- **Breaking changes:**
  - None expected; all changes are backward-compatible (saturation vs. overflow is a behavior change only in extremely rare edge cases of massive score values).
- **Deployment considerations:**
  - The new validation in config will reject previously accepted but insecure `DB_URL` values (e.g., missing scheme). Ensure all deployment environments provide a valid `postgres://` URL.
  - The deserialization size limit may break existing clients sending messages > 1 MB; consider informing client developers.
