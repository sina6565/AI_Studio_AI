/**
 * Validation schema tests.
 */

import { schemas, validateWithSchema } from '../src/utils/validation';

describe('validation schemas', () => {
  it('createProject defaults the project type', () => {
    const parsed = validateWithSchema<{ name: string; type: string }>(
      { name: 'My project' },
      schemas.createProject,
    );
    expect(parsed.name).toBe('My project');
    expect(parsed.type).toBe('mixed_media');
  });

  it('createProject rejects an empty name', () => {
    expect(() => validateWithSchema({ name: '' }, schemas.createProject)).toThrow();
  });

  it('updateProject rejects unknown fields (mass-assignment protection)', () => {
    expect(() => validateWithSchema({ userId: 'attacker' }, schemas.updateProject)).toThrow();
    expect(() => validateWithSchema({ assets: ['x'] }, schemas.updateProject)).toThrow();
  });

  it('updateProject accepts whitelisted fields', () => {
    const parsed = validateWithSchema<{ name: string }>({ name: 'renamed' }, schemas.updateProject);
    expect(parsed.name).toBe('renamed');
  });

  it('userPreferences rejects unknown fields', () => {
    expect(() => validateWithSchema({ isAdmin: true }, schemas.userPreferences)).toThrow();
  });

  it('userPreferences accepts a partial valid update', () => {
    const parsed = validateWithSchema<{ language: string }>({ language: 'fa' }, schemas.userPreferences);
    expect(parsed.language).toBe('fa');
  });

  it('userRegister requires a valid email and password length', () => {
    expect(() =>
      validateWithSchema({ email: 'bad', username: 'tester', password: 'longenough' }, schemas.userRegister),
    ).toThrow();
    expect(() =>
      validateWithSchema({ email: 'a@b.com', username: 'tester', password: 'short' }, schemas.userRegister),
    ).toThrow();
  });
});
