// CHANGE: Fixed API integration with proper error handling and response parsing
// REASON: Original implementation had incomplete error handling and response parsing issues
// ORIGINAL: (line ~15) Missing proper error handling and response validation

const axios = require('axios');
const config = require('./config');

class DeepSeekAPI {
    constructor(apiKey = null) {
        this.apiKey = apiKey || config.DEEPSEEK_API_KEY;
        this.baseURL = 'https://api.deepseek.com/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Rate limiting configuration
        this.rateLimit = {
            maxRequests: 60,
            windowMs: 60000,
            requests: []
        };
    }

    /**
     * Send a chat completion request to DeepSeek API
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - Additional options (model, temperature, max_tokens)
     * @returns {Promise<Object>} - Parsed response from API
     */
    async chat(messages, options = {}) {
        try {
            // Validate inputs
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error('Messages must be a non-empty array');
            }

            // Check rate limits
            await this._checkRateLimit();

            const requestBody = {
                model: options.model || 'deepseek-chat',
                messages: messages.map(msg => ({
                    role: msg.role || 'user',
                    content: String(msg.content)
                })),
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens || 2048,
                top_p: options.top_p ?? 1,
                frequency_penalty: options.frequency_penalty ?? 0,
                presence_penalty: options.presence_penalty ?? 0
            };

            // Add optional parameters if provided
            if (options.stop) requestBody.stop = options.stop;
            if (options.stream) requestBody.stream = options.stream;

            const response = await this.client.post('/chat/completions', requestBody);

            // Validate response structure
            if (!response.data || !response.data.choices || !response.data.choices[0]) {
                throw new Error('Invalid API response structure');
            }

            // Track rate limit
            this._trackRequest();

            return {
                id: response.data.id,
                object: response.data.object,
                created: response.data.created,
                model: response.data.model,
                choices: response.data.choices.map(choice => ({
                    index: choice.index,
                    message: {
                        role: choice.message.role,
                        content: choice.message.content
                    },
                    finish_reason: choice.finish_reason
                })),
                usage: response.data.usage || {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0
                }
            };

        } catch (error) {
            return this._handleError(error);
        }
    }

    /**
     * Stream chat completion response
     * @param {Array} messages - Array of message objects
     * @param {Object} options - Additional options
     * @returns {AsyncGenerator} - Generator yielding response chunks
     */
    async *streamChat(messages, options = {}) {
        try {
            if (!Array.isArray(messages) || messages.length === 0) {
                throw new Error('Messages must be a non-empty array');
            }

            await this._checkRateLimit();

            const requestBody = {
                model: options.model || 'deepseek-chat',
                messages: messages.map(msg => ({
                    role: msg.role || 'user',
                    content: String(msg.content)
                })),
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens || 2048,
                stream: true
            };

            const response = await this.client.post('/chat/completions', requestBody, {
                responseType: 'stream'
            });

            let buffer = '';
            
            for await (const chunk of response.data) {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            this._trackRequest();
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.choices && parsed.choices[0]) {
                                yield {
                                    content: parsed.choices[0].delta?.content || '',
                                    finish_reason: parsed.choices[0].finish_reason
                                };
                            }
                        } catch (parseError) {
                            console.error('Error parsing stream chunk:', parseError);
                        }
                    }
                }
            }

        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Check if we're within rate limits
     * @private
     */
    async _checkRateLimit() {
        const now = Date.now();
        this.rateLimit.requests = this.rateLimit.requests.filter(
            timestamp => now - timestamp < this.rateLimit.windowMs
        );

        if (this.rateLimit.requests.length >= this.rateLimit.maxRequests) {
            const oldestRequest = this.rateLimit.requests[0];
            const waitTime = this.rateLimit.windowMs - (now - oldestRequest);
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Track a successful API request
     * @private
     */
    _trackRequest() {
        this.rateLimit.requests.push(Date.now());
    }

    /**
     * Handle API errors with detailed information
     * @private
     * @param {Error} error - The caught error
     * @throws {Error} - Formatted error with details
     */
    _handleError(error) {
        if (error.response) {
            // API responded with error status
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 400:
                    throw new Error(`Bad Request: ${data.error?.message || 'Invalid request parameters'}`);
                case 401:
                    throw new Error('Authentication failed: Invalid or expired API key');
                case 403:
                    throw new Error('Forbidden: API key lacks necessary permissions');
                case 429:
                    throw new Error('Rate limit exceeded: Too many requests. Please wait before retrying');
                case 500:
                    throw new Error('DeepSeek server error: Please try again later');
                case 503:
                    throw new Error('Service unavailable: DeepSeek API is temporarily down');
                default:
                    throw new Error(`API Error (${status}): ${data.error?.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error: Unable to reach DeepSeek API. Check your internet connection');
        } else {
            // Something happened in setting up the request
            throw new Error(`Request setup error: ${error.message}`);
        }
    }

    /**
     * Validate API key by making a test request
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    async validateApiKey() {
        try {
            await this.client.get('/models');
            return true;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get available models from DeepSeek
     * @returns {Promise<Array>} - List of available models
     */
    async getModels() {
        try {
            const response = await this.client.get('/models');
            return response.data.data || [];
        } catch (error) {
            throw this._handleError(error);
        }
    }

    /**
     * Get token count for a given text
     * @param {string} text - Text to count tokens for
     * @returns {Promise<number>} - Number of tokens
     */
    async countTokens(text) {
        try {
            const response = await this.client.post('/tokenize', {
                text: String(text)
            });
            return response.data.tokens?.length || 0;
        } catch (error) {
            throw this._handleError(error);
        }
    }
}

module.exports = DeepSeekAPI;
```

