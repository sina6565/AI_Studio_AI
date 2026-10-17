/**
 * Jest global test setup.
 *
 * Keeps the test suite hermetic: no real MongoDB, Redis or AI provider
 * connections are made. Individual test files mock those boundaries.
 */

jest.setTimeout(30000);

// Route tests exercise many authenticated requests from one address. Raise the
// auth limiter here so those tests measure behaviour rather than throttling;
// ratelimit.test.ts lowers it again to verify the limiter itself.
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '1000';
