import providerRegistry from '../src/providers/registry';
import type { IProvider } from '../src/providers/interfaces/IProvider';

function stubProvider(name: string, healthCheck: () => Promise<boolean>): IProvider {
  return {
    name,
    capabilities: [],
    initialize: jest.fn(),
    generateImage: jest.fn(),
    generateVideo: jest.fn(),
    generateAudio: jest.fn(),
    synthesizeSpeech: jest.fn(),
    healthCheck,
    getRateLimit: jest.fn(async () => ({ remaining: 0, resetTime: 0, limit: 0 })),
    validateInput: jest.fn(async () => ({ valid: true })),
    validateCredentials: jest.fn(async () => true),
  };
}

describe('ProviderRegistry status', () => {
  it('awaits provider health checks and returns their resolved status', async () => {
    providerRegistry.register(stubProvider('status-healthy-test', async () => true));
    providerRegistry.register(stubProvider('status-unhealthy-test', async () => false));

    const status = await providerRegistry.getStatus();

    expect(status['status-healthy-test']).toEqual({ initialized: true, healthy: true });
    expect(status['status-unhealthy-test']).toEqual({ initialized: true, healthy: false });
  });

  it('reports a rejected health check as unhealthy instead of leaving status pending', async () => {
    providerRegistry.register(stubProvider('status-error-test', async () => {
      throw new Error('health endpoint unavailable');
    }));

    const status = await providerRegistry.getStatus();

    expect(status['status-error-test']).toEqual({ initialized: true, healthy: false });
  });
});
