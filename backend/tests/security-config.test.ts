/**
 * Regression tests for production security configuration.
 */

describe('production security configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  const setValidProductionEnv = () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-32';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/security-test';
    process.env.STORAGE_TYPE = 'local';
    process.env.CORS_ORIGIN = 'https://studio.example.com';
  };

  it('fails closed when JWT_SECRET is missing in production', () => {
    setValidProductionEnv();
    delete process.env.JWT_SECRET;

    expect(() => require('../src/config')).toThrow(/JWT_SECRET/);
  });

  it('rejects weak or placeholder JWT secrets in production', () => {
    setValidProductionEnv();
    process.env.JWT_SECRET = 'replace-with-unique-local-development-secret';

    expect(() => require('../src/config')).toThrow(/JWT_SECRET/);

    setValidProductionEnv();
    process.env.JWT_SECRET = 'too-short';

    expect(() => require('../src/config')).toThrow(/JWT_SECRET/);
  });

  it('rejects wildcard CORS origins in production', () => {
    setValidProductionEnv();
    process.env.CORS_ORIGIN = '*';

    expect(() => require('../src/config')).toThrow(/CORS_ORIGIN/);
  });

  it('keeps development fallback behavior outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    const config = require('../src/config').default;
    expect(config.jwt.secret).toBe('dev-secret-key');
  });
});