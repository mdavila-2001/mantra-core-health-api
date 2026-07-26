import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditHistoryService } from './audit-history.service';
import { ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const historyRepo = {
    isSupported: mockFn().mockReturnValue(true),
    timeline: mockFn().mockResolvedValue([
      { operationConceptId: 'op', recordedAt: new Date('2026-01-01'), dataSnapshot: {} },
    ]),
  };
  const dataAccessRepo = { record: mockFn() };
  const auditLogRepo = { append: mockFn().mockResolvedValue({ id: 'a1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuditHistoryService(
    em as any,
    historyRepo as any,
    dataAccessRepo as any,
    auditLogRepo as any,
    logger as any,
  );
  return { service, tx, historyRepo, dataAccessRepo, auditLogRepo };
}

describe('AuditHistoryService (UC-10-05)', () => {
  it('devuelve la línea de tiempo y audita la propia lectura', async () => {
    const d = build();
    const res = await d.service.getTimeline('users', 'u1', {} as any, actor);
    expect(res).toMatchObject({ entity: 'users', entityId: 'u1', count: 1 });
    expect(d.dataAccessRepo.record).toHaveBeenCalled();
    expect(d.auditLogRepo.append).toHaveBeenCalled();
  });

  it('rechaza una entidad no soportada con 404', async () => {
    const d = build();
    d.historyRepo.isSupported.mockReturnValue(false);
    await expect(
      d.service.getTimeline('nope', 'u1', {} as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.dataAccessRepo.record).not.toHaveBeenCalled();
  });
});
