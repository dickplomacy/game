// CHANGE: Added proper configuration with environment variable validation
// REASON: Original config lacked validation and had hardcoded values
// ORIGINAL: (line ~1) Missing environment variable validation and defaults

require('dotenv').config();

const config = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || null,
    
    // Validate required configuration
    validate() {
        const missing = [];
        
        if (!this.DEEPSEEK_API_KEY) {
            missing.push('DEEPSEEK_API_KEY');
        }
        
        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}\n` +
                'Please set them in your .env file or environment variables.'
            );
        }
        
        return true;
    }
};

// Auto-validate on import
config.validate();

module.exports = config;
```

