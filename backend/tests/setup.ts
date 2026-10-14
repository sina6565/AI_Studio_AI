/**
 * Jest global test setup.
 *
 * Keeps the test suite hermetic: no real MongoDB, Redis or AI provider
 * connections are made. Individual test files mock those boundaries.
 */

jest.setTimeout(30000);
