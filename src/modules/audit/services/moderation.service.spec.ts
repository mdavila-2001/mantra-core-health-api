import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ModerationService } from './moderation.service';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const moderationRepo = {
    record: mockFn().mockReturnValue({ id: 'm1', recordedAt: new Date('2026-01-01') }),
    recordHistory: mockFn(),
  };
  const governanceRepo = { record: mockFn() };
  const auditLogRepo = { append: mockFn().mockResolvedValue({ id: 'a1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ModerationService(
    em as any,
    moderationRepo as any,
    governanceRepo as any,
    auditLogRepo as any,
    logger as any,
  );
  return { service, moderationRepo, governanceRepo, auditLogRepo };
}

describe('ModerationService (UC-10-11)', () => {
  it('registra el evento WORM + provenance, sin historial ni gobernanza por defecto', async () => {
    const d = build();
    const res = await d.service.recordDecision(
      { targetType: 'CONTENT', targetId: 't1', action: 'REMOVE' } as any,
      actor,
    );
    expect(res).toMatchObject({ id: 'm1', auditLogId: 'a1', historyRecorded: false });
    expect(d.governanceRepo.record).not.toHaveBeenCalled();
    expect(d.moderationRepo.recordHistory).not.toHaveBeenCalled();
  });

  it('añade gobernanza e historial cuando se pide', async () => {
    const d = build();
    const res = await d.service.recordDecision(
      {
        targetType: 'USER',
        targetId: 't1',
        action: 'RESTRICT',
        reason: 'ABUSE',
        governance: true,
        moderationDecisionId: 'md1',
      } as any,
      actor,
    );
    expect(res.historyRecorded).toBe(true);
    expect(d.governanceRepo.record).toHaveBeenCalled();
    expect(d.moderationRepo.recordHistory).toHaveBeenCalled();
  });
});
