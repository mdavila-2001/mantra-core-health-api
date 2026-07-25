import { jest } from '@jest/globals';

// Loose-typed mock factory: mantiene el 'jest' de runtime evitando los tipos estrictos de @jest/globals.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditEventsService } from './audit-events.service';
import { CONCEPTS } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const auditLogRepo = {
    append: mockFn().mockResolvedValue({
      id: 'a1',
      previousHash: null,
      recordHash: 'h1',
      recordedAt: new Date('2026-01-01'),
    }),
    findChain: mockFn().mockResolvedValue([]),
  };
  const dataAccessRepo = {
    record: mockFn().mockReturnValue({ id: 'd1', recordedAt: new Date('2026-01-01') }),
    recordPatientContent: mockFn(),
    countByUserSince: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuditEventsService(
    em as any,
    auditLogRepo as any,
    dataAccessRepo as any,
    logger as any,
  );
  return { service, tx, em, auditLogRepo, dataAccessRepo };
}

describe('AuditEventsService', () => {
  describe('recordDataAccess (UC-10-01)', () => {
    it('registra accounting + provenance sin detalle de paciente', async () => {
      const d = build();
      const res = await d.service.recordDataAccess({ resourceType: 'clinical' } as any, actor);
      expect(res).toMatchObject({ id: 'd1', auditLogId: 'a1', patientContentLogged: false });
      expect(d.dataAccessRepo.record).toHaveBeenCalled();
      expect(d.dataAccessRepo.recordPatientContent).not.toHaveBeenCalled();
      expect(d.auditLogRepo.append).toHaveBeenCalled();
    });

    it('añade detalle de contenido cuando hay perfil de paciente y recurso', async () => {
      const d = build();
      const res = await d.service.recordDataAccess(
        { patientProfileId: 'p1', resourceId: 'r1', purposeOfUse: 'TREATMENT' } as any,
        actor,
      );
      expect(res.patientContentLogged).toBe(true);
      expect(d.dataAccessRepo.recordPatientContent).toHaveBeenCalled();
    });
  });

  describe('recordEvent (UC-10-04/03)', () => {
    it('sella el evento en la cadena y devuelve el hash', async () => {
      const d = build();
      const res = await d.service.recordEvent(
        { action: 'UPDATE', entity: 'users', outcome: 'SUCCESS' } as any,
        actor,
      );
      expect(res).toMatchObject({ id: 'a1', recordHash: 'h1', previousHash: null });
      expect(d.auditLogRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ action: 'UPDATE', outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS }),
      );
    });
  });

  describe('verifyIntegrity (UC-10-06)', () => {
    it('cadena vacía => verificada y registra atestación', async () => {
      const d = build();
      const res = await d.service.verifyIntegrity({} as any, actor);
      expect(res).toMatchObject({ verified: true, checkedCount: 0, brokenAt: null, attestationId: 'a1' });
    });

    it('detecta un eslabón roto', async () => {
      const d = build();
      d.auditLogRepo.findChain.mockResolvedValue([
        { id: 'x1', previousHash: undefined, recordHash: 'WRONG', recordedAt: new Date('2026-01-01') },
      ]);
      const res = await d.service.verifyIntegrity({} as any, actor);
      expect(res.verified).toBe(false);
      expect(res.brokenAt).toBe('x1');
    });
  });

  describe('applyRetention (UC-10-09)', () => {
    it('registra el evento de retención', async () => {
      const d = build();
      const res = await d.service.applyRetention({ scope: 'audit_log' } as any, actor);
      expect(res).toMatchObject({ auditLogId: 'a1', applied: true });
    });
  });

  describe('scanAnomaly (UC-10-10)', () => {
    it('marca anómalo cuando el volumen supera el umbral', async () => {
      const d = build();
      d.dataAccessRepo.countByUserSince.mockResolvedValue(500);
      const res = await d.service.scanAnomaly({} as any, actor);
      expect(res).toMatchObject({ accessCount: 500, anomalous: true, auditLogId: 'a1' });
    });

    it('no marca anómalo con volumen bajo', async () => {
      const d = build();
      const res = await d.service.scanAnomaly({ userId: 'u2' } as any, actor);
      expect(res.anomalous).toBe(false);
    });
  });
});
