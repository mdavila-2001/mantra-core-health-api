import { jest } from '@jest/globals';

// Loose-typed mock factory: mantiene el 'jest' de runtime evitando los tipos estrictos de @jest/globals.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuditEventsService } from './audit-events.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditErrorReason } from '../audit.error-reasons';
import { CONCEPTS } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
    record: mockFn().mockReturnValue({
      id: 'd1',
      recordedAt: new Date('2026-01-01'),
    }),
    recordPatientContent: mockFn(),
    countByUserSince: mockFn().mockResolvedValue(0),
    purgeOlderThan: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuditEventsService(
    em as any,
    auditLogRepo as any,
    dataAccessRepo,
    logger as any,
  );
  return { service, tx, em, auditLogRepo, dataAccessRepo };
}

describe('AuditEventsService', () => {
  describe('recordDataAccess (UC-10-01)', () => {
    it('registra accounting + provenance sin detalle de paciente', async () => {
      const d = build();
      const res = await d.service.recordDataAccess(
        { resourceType: 'clinical' },
        actor,
      );
      expect(res).toMatchObject({
        id: 'd1',
        auditLogId: 'a1',
        patientContentLogged: false,
      });
      expect(d.dataAccessRepo.record).toHaveBeenCalled();
      expect(d.dataAccessRepo.recordPatientContent).not.toHaveBeenCalled();
      expect(d.auditLogRepo.append).toHaveBeenCalled();
    });

    it('añade detalle de contenido cuando hay perfil de paciente y recurso', async () => {
      const d = build();
      const res = await d.service.recordDataAccess(
        {
          patientProfileId: 'p1',
          resourceId: 'r1',
          purposeOfUse: 'TREATMENT',
        },
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
        { action: 'UPDATE', entity: 'users', outcome: 'SUCCESS' },
        actor,
      );
      expect(res).toMatchObject({
        id: 'a1',
        recordHash: 'h1',
        previousHash: null,
      });
      expect(d.auditLogRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          action: 'UPDATE',
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        }),
      );
    });
  });

  describe('verifyIntegrity (UC-10-06)', () => {
    it('cadena vacía => verificada y registra atestación', async () => {
      const d = build();
      const res = await d.service.verifyIntegrity({}, actor);
      expect(res).toMatchObject({
        verified: true,
        checkedCount: 0,
        brokenAt: null,
        attestationId: 'a1',
      });
    });

    it('detecta un eslabón roto', async () => {
      const d = build();
      d.auditLogRepo.findChain.mockResolvedValue([
        {
          id: 'x1',
          previousHash: undefined,
          recordHash: 'WRONG',
          recordedAt: new Date('2026-01-01'),
        },
      ]);
      const res = await d.service.verifyIntegrity({}, actor);
      expect(res.verified).toBe(false);
      expect(res.brokenAt).toBe('x1');
    });
  });

  describe('verifyIntegrity: cadena larga y verificación parcial (AUD-01)', () => {
    /** Cadena sellada de `n` eslabones (más que una página de 5000). */
    function sealedChain(n: number, tamperAt?: number) {
      const chain: any[] = [];
      let prev: string | undefined;
      for (let i = 0; i < n; i += 1) {
        const link: any = {
          id: `l${String(i).padStart(6, '0')}`,
          userId: 'u',
          action: 'A',
          entity: 'e',
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          previousHash: prev,
          recordedAt: new Date(Date.UTC(2026, 0, 1) + i * 1000),
        };
        link.recordHash = AuditLogRepository.hash(
          prev,
          AuditLogRepository.content(link),
          link.recordedAt,
        );
        prev = link.recordHash;
        chain.push(link);
      }
      if (tamperAt !== undefined) chain[tamperAt].action = 'ALTERADA';
      return chain;
    }

    /** Simula `findChain` paginado por cursor sobre la cadena en memoria. */
    function paged(d: ReturnType<typeof build>, chain: any[]) {
      d.auditLogRepo.findChain.mockImplementation(
        async (_tx: any, _tenant: any, limit: number, after?: any) => {
          const start = after
            ? chain.findIndex((l) => l.id === after.id) + 1
            : 0;
          return chain.slice(start, start + limit);
        },
      );
    }

    it('correcto: cadena íntegra de más de 5000 eslabones => verified, complete y conteo real', async () => {
      const d = build();
      paged(d, sealedChain(5003));
      const res = await d.service.verifyIntegrity({}, actor);
      expect(res).toMatchObject({
        verified: true,
        complete: true,
        checkedCount: 5003,
        brokenAt: null,
        attestationId: 'a1',
      });
      expect(d.auditLogRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          action: 'INTEGRITY_ATTESTATION',
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        }),
      );
    });

    it('error: una alteración posterior al primer corte se detecta y se atesta como falla', async () => {
      const d = build();
      paged(d, sealedChain(5003, 5001));
      const res = await d.service.verifyIntegrity({}, actor);
      expect(res).toMatchObject({
        verified: false,
        complete: true,
        brokenAt: 'l005001',
        checkedCount: 5001,
        attestationId: 'a1',
      });
      expect(d.auditLogRepo.append).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
          entityId: 'l005001',
        }),
      );
    });

    it('límite: diagnóstico menor al total => parcial, sin atestación positiva', async () => {
      const d = build();
      paged(d, sealedChain(20));
      const res = await d.service.verifyIntegrity({ limit: 10 }, actor);
      expect(res).toEqual({
        verified: false,
        complete: false,
        checkedCount: 10,
        brokenAt: null,
        attestationId: null,
      });
      expect(d.auditLogRepo.append).not.toHaveBeenCalled();
    });

    it('límite: diagnóstico igual al total => completo y verificado', async () => {
      const d = build();
      paged(d, sealedChain(10));
      const res = await d.service.verifyIntegrity({ limit: 10 }, actor);
      expect(res).toMatchObject({
        verified: true,
        complete: true,
        checkedCount: 10,
      });
      expect(d.auditLogRepo.append).toHaveBeenCalledTimes(1);
    });

    it('un diagnóstico parcial que encuentra un eslabón roto atesta la falla', async () => {
      const d = build();
      paged(d, sealedChain(20, 3));
      const res = await d.service.verifyIntegrity({ limit: 10 }, actor);
      expect(res).toMatchObject({
        verified: false,
        brokenAt: 'l000003',
        attestationId: 'a1',
      });
    });

    it.each([0, -1, 1.5, 100001])(
      'falla catalogada: límite %p => 400 AUDIT_INTEGRITY_RANGE_INVALID sin fila WORM',
      async (limit) => {
        const d = build();
        await expect(
          d.service.verifyIntegrity({ limit }, actor),
        ).rejects.toMatchObject({
          status: 400,
          code: 'VALIDATION_FAILED',
          reason: AuditErrorReason.INTEGRITY_RANGE_INVALID,
        });
        expect(d.em.transactional).not.toHaveBeenCalled();
        expect(d.auditLogRepo.append).not.toHaveBeenCalled();
      },
    );
  });

  describe('applyRetention (UC-10-09)', () => {
    it('purga el log de accesos fuera de la ventana y reporta el conteo real', async () => {
      const d = build();
      d.dataAccessRepo.purgeOlderThan.mockResolvedValue(7);
      const res = await d.service.applyRetention(
        { scope: 'data_access_log', olderThan: '2025-01-01', tenantId: 't1' },
        actor,
      );
      expect(d.dataAccessRepo.purgeOlderThan).toHaveBeenCalledWith(
        d.tx,
        new Date('2025-01-01'),
        't1',
      );
      expect(res).toMatchObject({
        auditLogId: 'a1',
        applied: true,
        purgedCount: 7,
      });
    });

    it('fail-closed: sin ventana explícita no borra nada', async () => {
      const d = build();
      const res = await d.service.applyRetention(
        { scope: 'data_access_log' },
        actor,
      );
      expect(d.dataAccessRepo.purgeOlderThan).not.toHaveBeenCalled();
      expect(res.purgedCount).toBe(0);
      expect(res.applied).toBe(true);
    });

    it('nunca borra la cadena WORM audit_log, sólo deja constancia', async () => {
      const d = build();
      const res = await d.service.applyRetention(
        { scope: 'audit_log', olderThan: '2025-01-01' },
        actor,
      );
      expect(d.dataAccessRepo.purgeOlderThan).not.toHaveBeenCalled();
      expect(res).toMatchObject({
        auditLogId: 'a1',
        applied: true,
        purgedCount: 0,
      });
    });
  });

  describe('scanAnomaly (UC-10-10)', () => {
    it('marca anómalo cuando el volumen supera el umbral', async () => {
      const d = build();
      d.dataAccessRepo.countByUserSince.mockResolvedValue(500);
      const res = await d.service.scanAnomaly({}, actor);
      expect(res).toMatchObject({
        accessCount: 500,
        anomalous: true,
        auditLogId: 'a1',
      });
    });

    it('no marca anómalo con volumen bajo', async () => {
      const d = build();
      const res = await d.service.scanAnomaly({ userId: 'u2' }, actor);
      expect(res.anomalous).toBe(false);
    });
  });
});
