/**
 * Model validation tests.
 *
 * Regression coverage for the job _id bug: the Orchestrator creates jobs with
 * a UUID string _id, which Mongoose rejected ("Cast to ObjectId failed")
 * because the schema did not declare _id as a String.
 */

import Job from '../src/database/models/Job';
import User from '../src/database/models/User';
import Project from '../src/database/models/Project';

describe('Job model', () => {
  const uuid = '7f3a1c2e-1111-2222-3333-444455556666';

  it('accepts a UUID string _id without a cast error', () => {
    const doc = new Job({
      _id: uuid,
      userId: 'user-1',
      type: 'image_generation',
      status: 'queued',
      priority: 'normal',
      input: { prompt: 'a sunset' },
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc._id).toBe(uuid);
    expect(doc.id).toBe(uuid);
  });

  it('requires userId, type and input', () => {
    const doc = new Job({ _id: uuid });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.userId).toBeDefined();
    expect(error?.errors.type).toBeDefined();
    expect(error?.errors.input).toBeDefined();
  });

  it('rejects an unknown job type', () => {
    const doc = new Job({
      _id: uuid,
      userId: 'user-1',
      type: 'not_a_real_type',
      input: { prompt: 'x' },
    });
    expect(doc.validateSync()?.errors.type).toBeDefined();
  });
});

describe('User model', () => {
  it('rejects an invalid email address', () => {
    const doc = new User({ email: 'not-an-email', username: 'tester', passwordHash: 'x' });
    expect(doc.validateSync()?.errors.email).toBeDefined();
  });

  it('accepts a valid user', () => {
    const doc = new User({ email: 'user@example.com', username: 'tester', passwordHash: 'x' });
    expect(doc.validateSync()).toBeUndefined();
  });
});

describe('Project model', () => {
  it('accepts a valid project', () => {
    const doc = new Project({
      userId: 'user-1',
      name: 'My project',
      type: 'mixed_media',
      settings: { isPublic: false, allowComments: true, allowSharing: true },
      assets: [],
      jobs: [],
    });
    expect(doc.validateSync()).toBeUndefined();
  });
});
