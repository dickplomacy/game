// CHANGE: Added proper initialization and error handling for the API client
// REASON: Original implementation didn't handle initialization failures gracefully
// ORIGINAL: (line ~1) Missing initialization validation

const DeepSeekAPI = require('./deepseek-api');
const config = require('./config');

class DeepSeekClient {
    constructor(apiKey = null) {
        try {
            this.api = new DeepSeekAPI(apiKey);
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize DeepSeek client:', error.message);
            this.initialized = false;
            throw error;
        }
    }

    /**
     * Send a message and get a response
     * @param {string} message - User message
     * @param {Object} options - Additional options
     * @returns {Promise<string>} - AI response
     */
    async sendMessage(message, options = {}) {
        if (!this.initialized) {
            throw new Error('DeepSeek client not properly initialized');
        }

        try {
            const response = await this.api.chat([
                { role: 'user', content: message }
            ], options);

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error sending message:', error.message);
            throw error;
        }
    }

    /**
     * Send a conversation history and get response
     * @param {Array} messages - Array of message objects
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Full response object
     */
    async chat(messages, options = {}) {
        if (!this.initialized) {
            throw new Error('DeepSeek client not properly initialized');
        }

        try {
            return await this.api.chat(messages, options);
        } catch (error) {
            console.error('Error in chat:', error.message);
            throw error;
        }
    }

    /**
     * Stream a response
     * @param {string} message - User message
     * @param {Function} onChunk - Callback for each chunk
     * @param {Object} options - Additional options
     */
    async streamMessage(message, onChunk, options = {}) {
        if (!this.initialized) {
            throw new Error('DeepSeek client not properly initialized');
        }

        try {
            const stream = this.api.streamChat([
                { role: 'user', content: message }
            ], options);

            for await (const chunk of stream) {
                if (chunk.content) {
                    onChunk(chunk.content);
                }
            }
        } catch (error) {
            console.error('Error streaming message:', error.message);
            throw error;
        }
    }

    /**
     * Validate the current API key
     * @returns {Promise<boolean>}
     */
    async validateConnection() {
        try {
            return await this.api.validateApiKey();
        } catch (error) {
            console.error('Connection validation failed:', error.message);
            return false;
        }
    }
}

module.exports = DeepSeekClient;
```

