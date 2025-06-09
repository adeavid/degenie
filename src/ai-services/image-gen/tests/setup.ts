/**
 * Jest Test Setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.STABILITY_API_KEY = 'test-key';
process.env.ENABLE_LOCAL_STORAGE = 'false';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(30000);