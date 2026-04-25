import * as CircuitBreaker from 'opossum';
import { WithCircuitBreaker } from './circuit-breaker.decorator';

describe('CircuitBreaker Decorator', () => {
  class TestService {
    callCount = 0;

    @WithCircuitBreaker({ timeout: 500, errorThresholdPercentage: 50, resetTimeout: 300, rollingCountTimeout: 1000, rollingCountBuckets: 1 })
    async riskyCall(shouldFail: boolean): Promise<string> {
      this.callCount++;
      if (shouldFail) throw new Error('Provider down');
      return 'success';
    }
  }

  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  it('should pass through in CLOSED state', async () => {
    const result = await service.riskyCall(false);
    expect(result).toBe('success');
    expect(service.callCount).toBe(1);
  });

  it('should throw on failure in CLOSED state', async () => {
    await expect(service.riskyCall(true)).rejects.toThrow('Provider down');
  });

  it('should open circuit after exceeding error threshold', async () => {
    // Fire enough failures to trip the breaker (>50% error rate)
    for (let i = 0; i < 5; i++) {
      try { await service.riskyCall(true); } catch {}
    }

    // Next call should get circuit-open fallback error
    await expect(service.riskyCall(false)).rejects.toThrow(/Circuit open/);
  });

  it('should transition to HALF-OPEN after resetTimeout', async () => {
    // Trip the breaker
    for (let i = 0; i < 5; i++) {
      try { await service.riskyCall(true); } catch {}
    }

    // Wait for resetTimeout (300ms)
    await new Promise(r => setTimeout(r, 400));

    // Half-open: next call should go through
    const result = await service.riskyCall(false);
    expect(result).toBe('success');
  });

  it('should close circuit after successful call in HALF-OPEN', async () => {
    // Trip the breaker
    for (let i = 0; i < 5; i++) {
      try { await service.riskyCall(true); } catch {}
    }

    // Wait for half-open
    await new Promise(r => setTimeout(r, 400));

    // Successful call closes circuit
    await service.riskyCall(false);

    // Should work normally now
    const result = await service.riskyCall(false);
    expect(result).toBe('success');
  });
});
