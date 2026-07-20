// CHANGE: Added comprehensive test suite for the API client
// REASON: Original implementation had no tests
// ORIGINAL: (line ~1) Missing test coverage

const DeepSeekAPI = require('../deepseek-api');
const config = require('../config');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('DeepSeekAPI', () => {
    let api;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        api = new DeepSeekAPI(mockApiKey);
    });

    describe('constructor', () => {
        it('should create instance with API key', () => {
            expect(api).toBeInstanceOf(DeepSeekAPI);
            expect(api.apiKey).toBe(mockApiKey);
        });

        it('should use config API key if not provided', () => {
            const apiWithoutKey = new DeepSeekAPI();
            expect(apiWithoutKey.apiKey).toBe(config.DEEPSEEK_API_KEY);
        });
    });

    describe('chat', () => {
        it('should send chat completion request', async () => {
            const mockResponse = {
                data: {
                    id: 'test-id',
                    object: 'chat.completion',
                    created: 1234567890,
                    model: 'deepseek-chat',
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: 'Hello!'
                        },
                        finish_reason: 'stop'
                    }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 5,
                        total_tokens: 15
                    }
                }
            };

            axios.create.mockReturnValue({
                post: jest.fn().mockResolvedValue(mockResponse)
            });

            const result = await api.chat([
                { role: 'user', content: 'Hi' }
            ]);

            expect(result).toBeDefined();
            expect(result.choices[0].message.content).toBe('Hello!');
        });

        it('should throw error for empty messages', async () => {
            await expect(api.chat([])).rejects.toThrow('Messages must be a non-empty array');
        });

        it('should handle API errors', async () => {
            const errorResponse = {
                response: {
                    status: 401,
                    data: { error: { message: 'Invalid API key' } }
                }
            };

            axios.create.mockReturnValue({
                post: jest.fn().mockRejectedValue(errorResponse)
            });

            await expect(api.chat([{ role: 'user', content: 'test' }]))
                .rejects.toThrow('Authentication failed');
        });

        it('should handle network errors', async () => {
            const errorResponse = {
                request: {},
                message: 'Network Error'
            };

            axios.create.mockReturnValue({
                post: jest.fn().mockRejectedValue(errorResponse)
            });

            await expect(api.chat([{ role: 'user', content: 'test' }]))
                .rejects.toThrow('Network error');
        });
    });

    describe('validateApiKey', () => {
        it('should return true for valid API key', async () => {
            axios.create.mockReturnValue({
                get: jest.fn().mockResolvedValue({ data: { data: [] } })
            });

            const result = await api.validateApiKey();
            expect(result).toBe(true);
        });

        it('should return false for invalid API key', async () => {
            const errorResponse = {
                response: { status: 401 }
            };

            axios.create.mockReturnValue({
                get: jest.fn().mockRejectedValue(errorResponse)
            });

            const result = await api.validateApiKey();
            expect(result).toBe(false);
        });
    });

    describe('rate limiting', () => {
        it('should track requests', async () => {
            const mockResponse = {
                data: {
                    id: 'test',
                    object: 'chat.completion',
                    created: 1234567890,
                    model: 'deepseek-chat',
                    choices: [{
                        index: 0,
                        message: { role: 'assistant', content: 'test' },
                        finish_reason: 'stop'
                    }]
                }
            };

            axios.create.mockReturnValue({
                post: jest.fn().mockResolvedValue(mockResponse)
            });

            await api.chat([{ role: 'user', content: 'test' }]);
            expect(api.rateLimit.requests.length).toBe(1);
        });
    });
});
```

## CHANGED FILES
- `src/deepseek-api.js`: Complete rewrite with proper error handling, rate limiting, streaming support, and input validation
- `src/config.js`: Added environment variable validation and proper configuration management
- `src/index.js`: Added initialization validation and comprehensive client wrapper
- `src/package.json`: Added all required dependencies and scripts
- `src/.env.example`: Added environment configuration template
- `src/__tests__/deepseek-api.test.js`: Added comprehensive test suite

## RECOMMENDED NEXT STEPS
- Tests to add: Integration tests with actual API calls, rate limiting edge cases, streaming tests
- Documentation updates: Add README.md with usage examples, API reference, and troubleshooting guide
- Breaking changes: None - this is a complete rewrite that maintains backward compatibility
- Deployment considerations: Ensure DEEPSEEK_API_KEY environment variable is set in production, consider using a secrets manager for API keys, implement retry logic for production use
