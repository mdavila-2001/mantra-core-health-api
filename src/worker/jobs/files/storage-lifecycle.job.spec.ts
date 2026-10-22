import { jest } from '@jest/globals';
import { StorageLifecycleJob } from './storage-lifecycle.job';
import { EvidenceLifecycleJob } from '../identity_assurance/evidence-lifecycle.job';
import { resetTickStateForTests } from '../../run-tick.util';

function build() {
  const post =
    jest.fn<
      (path: string, body: unknown, options?: unknown) => Promise<unknown>
    >();
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    post,
    logger,
    storage: new StorageLifecycleJob({ post } as never, logger as never),
    evidence: new EvidenceLifecycleJob({ post } as never, logger as never),
  };
}
beforeEach(() => resetTickStateForTests());
describe('lifecycle workers use runTick with controlled API only', () => {
  it('repeats only recovery and guarded review; never issues a delete command', async () => {
    const test = build();
    test.post.mockResolvedValue({
      inspected: 0,
      quarantined: 0,
      denied: 0,
      boundary: 0,
    });
    await test.storage.tick();
    await test.storage.tick();
    expect(test.post.mock.calls.map((call) => call[0])).toEqual([
      '/internal/storage-lifecycle/recover',
      '/internal/identity/evidence/storage-purge-review',
      '/internal/storage-lifecycle/recover',
      '/internal/identity/evidence/storage-purge-review',
    ]);
    expect(
      test.post.mock.calls.every(
        (call) => (call[2] as { idempotent: boolean }).idempotent,
      ),
    ).toBe(true);
  });
  it('recovery uncertainty prevents even a purge review in that tick', async () => {
    const test = build();
    test.post.mockRejectedValue(new Error('synthetic timeout'));
    await test.storage.tick();
    expect(test.post).toHaveBeenCalledTimes(1);
    expect(test.logger.error).toHaveBeenCalledTimes(1);
  });
  it('retains cursor after an ambiguous response and retries the same evidence window', async () => {
    const test = build();
    test.post
      .mockResolvedValueOnce({
        nextCursor: 'synthetic-cursor',
        scanned: 100,
        denied: 100,
        boundary: 0,
      })
      .mockRejectedValueOnce(new Error('synthetic timeout'))
      .mockResolvedValueOnce({ scanned: 0, denied: 0, boundary: 0 });
    await test.evidence.tick();
    await test.evidence.tick();
    await test.evidence.tick();
    expect(test.post.mock.calls.map((call) => call[1])).toEqual([
      {},
      { cursor: 'synthetic-cursor' },
      { cursor: 'synthetic-cursor' },
    ]);
    expect(test.logger.error).toHaveBeenCalledTimes(1);
  });
  it('suppresses overlapping local ticks; cross-instance exclusion belongs to PostgreSQL', async () => {
    const test = build();
    let release!: () => void;
    test.post.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return { scanned: 0 };
    });
    const first = test.evidence.tick();
    while (!release) await Promise.resolve();
    await test.evidence.tick();
    release();
    await first;
    expect(test.post).toHaveBeenCalledTimes(1);
    expect(test.logger.warn).toHaveBeenCalled();
  });
});
