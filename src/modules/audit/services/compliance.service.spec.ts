import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ComplianceService } from './compliance.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AUD } from '../audit.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const governanceRepo = {
    existsByQueryHash: mockFn().mockResolvedValue(0),
    record: mockFn().mockReturnValue({ id: 'g1', occurredAt: new Date('2026-01-01') }),
  };
  const dsarRepo = {
    create: mockFn().mockReturnValue({
      id: 'ds1',
      statusConceptId: AUD.DSAR_RECEIVED,
      typeConceptId: AUD.DSAR_TYPE_ACCESS,
      rowVersion: 1,
      requestedAt: new Date('2026-01-01'),
    }),
    findById: mockFn(),
  };
  const auditLogRepo = { append: mockFn().mockResolvedValue({ id: 'a1' }) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ComplianceService(
    em as any,
    governanceRepo as any,
    dsarRepo as any,
    auditLogRepo as any,
    logger as any,
  );
  return { service, tx, governanceRepo, dsarRepo, auditLogRepo };
}

describe('ComplianceService', () => {
  describe('exportEvidence (UC-10-07)', () => {
    it('registra gobernanza + provenance', async () => {
      const d = build();
      const res = await d.service.exportEvidence({ entity: 'audit_log' } as any, actor);
      expect(res).toMatchObject({ id: 'g1', auditLogId: 'a1' });
      expect(d.governanceRepo.record).toHaveBeenCalled();
    });

    it('rechaza queryHash duplicado con conflicto', async () => {
      const d = build();
      d.governanceRepo.existsByQueryHash.mockResolvedValue(1);
      await expect(
        d.service.exportEvidence({ queryHash: 'dup' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createDsar (UC-10-08)', () => {
    it('da de alta la solicitud en estado recibido', async () => {
      const d = build();
      const res = await d.service.createDsar({ type: 'ACCESS' } as any, actor);
      expect(res).toMatchObject({ id: 'ds1', status: AUD.DSAR_RECEIVED });
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.auditLogRepo.append).toHaveBeenCalled();
    });
  });

  describe('updateDsar (UC-10-08)', () => {
    it('lanza 404 cuando no existe', async () => {
      const d = build();
      d.dsarRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.updateDsar('x', { status: 'COMPLETED' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza transición desde estado terminal', async () => {
      const d = build();
      d.dsarRepo.findById.mockResolvedValue({
        id: 'ds1',
        statusConceptId: AUD.DSAR_COMPLETED,
        typeConceptId: AUD.DSAR_TYPE_ACCESS,
        rowVersion: 3,
        requestedAt: new Date(),
        userId: 'u1',
      });
      await expect(
        d.service.updateDsar('ds1', { status: 'REJECTED' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('completa una solicitud en progreso y fija completedAt', async () => {
      const d = build();
      const entity: any = {
        id: 'ds1',
        statusConceptId: AUD.DSAR_IN_PROGRESS,
        typeConceptId: AUD.DSAR_TYPE_ACCESS,
        rowVersion: 2,
        requestedAt: new Date(),
        userId: 'u1',
        updatedAt: new Date(),
      };
      d.dsarRepo.findById.mockResolvedValue(entity);
      const res = await d.service.updateDsar('ds1', { status: 'COMPLETED', resultFileId: 'f1' } as any, actor);
      expect(res.status).toBe(AUD.DSAR_COMPLETED);
      expect(entity.completedAt).toBeInstanceOf(Date);
      expect(entity.resultFileId).toBe('f1');
    });
  });
});
