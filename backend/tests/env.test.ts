/**
 * Startup environment validation tests.
 */

import { validateEnvironment } from '../src/config/validateEnv';

describe('validateEnvironment', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('reports a missing optional provider variable without marking it required', () => {
    delete process.env.AGNES_API_KEY;
    const result = validateEnvironment();
    const agnes = result.checks.find((c) => c.name === 'AGNES_API_KEY');
    expect(agnes).toBeDefined();
    expect(agnes?.present).toBe(false);
    expect(agnes?.required).toBe(false);
  });

  it('detects a present database url as satisfying the required check', () => {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
    const result = validateEnvironment();
    const db = result.checks.find((c) => c.name === 'MONGODB_URI/DATABASE_URL');
    expect(db?.present).toBe(true);
    expect(db?.required).toBe(true);
  });

  it('never exposes values, only presence', () => {
    process.env.AGNES_API_KEY = 'super-secret-value';
    const result = validateEnvironment();
    const agnes = result.checks.find((c) => c.name === 'AGNES_API_KEY');
    expect(agnes?.present).toBe(true);
    expect(JSON.stringify(result)).not.toContain('super-secret-value');
  });
});
