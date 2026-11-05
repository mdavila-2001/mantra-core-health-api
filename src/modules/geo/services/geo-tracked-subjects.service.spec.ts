import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackedSubjectsService } from './geo-tracked-subjects.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { GEO } from '../geo.concepts';
import { GeoErrorReason } from '../geo.error-reasons';

/** Tenant del actor en las pruebas; `T2` representa a otra organización. */
const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string = T1): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}

/**
 * Afirma que la promesa falla como "no existe": 404, mismo `reason` y sin `details`.
 *
 * @param promise - Operación bajo prueba.
 * @param reason - Sub-código esperado del catálogo de geo.
 */
async function expectNotAvailable(
  promise: Promise<unknown>,
  reason: string,
): Promise<void> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.code).toBe('NOT_FOUND');
  expect(error.reason).toBe(reason);
  expect(error.details).toBeUndefined();
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forkEm),
  };
  const subjectsRepo = {
    findById: mockFn(),
    findActiveBySubject: mockFn(),
    create: mockFn(),
  };
  const sessionsRepo = {
    findOpenBySubject: mockFn(),
    findAllOpenBySubject: mockFn().mockResolvedValue([]),
  };
  const pingsRepo = { record: mockFn(), findLastBySubject: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTrackedSubjectsService(
    em as any,
    subjectsRepo,
    sessionsRepo as any,
    pingsRepo,
    logger as any,
  );
  return {
    service: scoped(service),
    rawService: service,
    tx,
    em,
    forkEm,
    subjectsRepo,
    sessionsRepo,
    pingsRepo,
  };
}

describe('GeoTrackedSubjectsService', () => {
  describe('enroll (UC-13-01)', () => {
    it('creates the subject, flushes parent before returning', async () => {
      const d = build();
      d.subjectsRepo.findActiveBySubject.mockResolvedValue(null);
      const created = {
        id: 's1',
        subjectId: 'subj-1',
        subjectTypeConceptId: GEO.SUBJECT_TYPE_PERSON,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        createdAt: new Date('2026-01-01'),
      };
      d.subjectsRepo.create.mockReturnValue(created);

      const res = await d.service.enroll({ subjectId: 'subj-1' }, actor);

      expect(res).toEqual({
        id: 's1',
        subjectId: 'subj-1',
        subjectType: GEO.SUBJECT_TYPE_PERSON,
        state: GEO.SUBJECT_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects when the subject is already tracked (conflict)', async () => {
      const d = build();
      d.subjectsRepo.findActiveBySubject.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.enroll({ subjectId: 'subj-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.subjectsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('ingestPings (UC-13-03)', () => {
    it('records each ping when subject active and session open', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_ACTIVE,
        deviceId: 'dev-1',
      });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue({ id: 'sess-1' });

      const res = await d.service.ingestPings(
        's1',
        {
          pings: [
            { latitude: -12, longitude: -77 },
            { latitude: -12.1, longitude: -77.1 },
          ],
        },
        actor,
      );

      expect(res).toEqual({ recorded: 2 });
      expect(d.pingsRepo.record).toHaveBeenCalledTimes(2);
    });

    it('rejects when the subject is suspended (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_SUSPENDED,
      });
      await expect(
        d.service.ingestPings(
          's1',
          { pings: [{ latitude: 0, longitude: 0 }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when there is no open session (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_ACTIVE,
      });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue(null);
      await expect(
        d.service.ingestPings(
          's1',
          { pings: [{ latitude: 0, longitude: 0 }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.ingestPings(
          'missing',
          { pings: [{ latitude: 0, longitude: 0 }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('lastPosition (UC-13-09)', () => {
    it('returns the latest ping', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
      });
      const ping = {
        id: 'p1',
        latitude: '-12',
        longitude: '-77',
        accuracyM: '5',
        capturedAt: new Date('2026-01-01'),
        recordedAt: new Date('2026-01-02'),
      };
      d.pingsRepo.findLastBySubject.mockResolvedValue(ping);

      const res = await d.service.lastPosition('s1');
      expect(res).toEqual({
        pingId: 'p1',
        trackedSubjectId: 's1',
        latitude: '-12',
        longitude: '-77',
        accuracyM: '5',
        capturedAt: ping.capturedAt,
        recordedAt: ping.recordedAt,
      });
      expect(d.em.fork).toHaveBeenCalled();
    });

    it('throws when the subject has no pings', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
      });
      d.pingsRepo.findLastBySubject.mockResolvedValue(null);
      await expect(d.service.lastPosition('s1')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('revokeConsent (UC-13-10)', () => {
    it('suspends the subject and closes its open sessions', async () => {
      const d = build();
      const subject = {
        id: 's1',
        tenantId: T1,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        updatedAt: new Date(),
      };
      d.subjectsRepo.findById.mockResolvedValue(subject);
      const session = {
        id: 'sess-1',
        statusConceptId: GEO.SESSION_OPEN,
        updatedAt: new Date(),
      };
      d.sessionsRepo.findAllOpenBySubject.mockResolvedValue([session]);

      const res = await d.service.revokeConsent('s1', actor);

      expect(res).toEqual({ ok: true });
      expect(subject.stateConceptId).toBe(GEO.SUBJECT_SUSPENDED);
      expect(session.statusConceptId).toBe(GEO.SESSION_CLOSED);
    });

    it('rejects when already suspended (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_SUSPENDED,
      });
      await expect(d.service.revokeConsent('s1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revokeConsent('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance por tenant (GEO-01)', () => {
    const NOT_AVAILABLE = GeoErrorReason.TRACKED_SUBJECT_NOT_AVAILABLE;
    const pings = { pings: [{ latitude: 0, longitude: 0 }] } as any;

    it('enroll takes the tenant from the context and ignores the body tenantId', async () => {
      const d = build();
      d.subjectsRepo.findActiveBySubject.mockResolvedValue(null);
      d.subjectsRepo.create.mockReturnValue({
        id: 's1',
        subjectId: 'subj-1',
        subjectTypeConceptId: GEO.SUBJECT_TYPE_PERSON,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        createdAt: new Date('2026-01-01'),
      });

      await d.service.enroll({ subjectId: 'subj-1', tenantId: T2 }, actor);

      expect(d.subjectsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
      expect(d.subjectsRepo.findActiveBySubject).toHaveBeenCalledWith(
        d.tx,
        GEO.SUBJECT_TYPE_PERSON,
        'subj-1',
        GEO.SUBJECT_ACTIVE,
        T1,
      );
    });

    it('enroll without a tenant in the context is rejected (precondition) and persists nothing', async () => {
      const d = build();
      await expect(
        d.rawService.enroll({ subjectId: 'subj-1' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.subjectsRepo.create).not.toHaveBeenCalled();
    });

    it('ingestPings on a subject of another tenant answers as not found and records nothing', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        id: 's2',
        tenantId: T2,
        stateConceptId: GEO.SUBJECT_ACTIVE,
      });
      await expectNotAvailable(
        d.service.ingestPings('s2', pings, actor),
        NOT_AVAILABLE,
      );
      expect(d.sessionsRepo.findOpenBySubject).not.toHaveBeenCalled();
      expect(d.pingsRepo.record).not.toHaveBeenCalled();
    });

    it('lastPosition on a subject of another tenant answers as not found and reads no ping', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's2', tenantId: T2 });
      await expectNotAvailable(d.service.lastPosition('s2'), NOT_AVAILABLE);
      expect(d.pingsRepo.findLastBySubject).not.toHaveBeenCalled();
    });

    it('revokeConsent on a subject of another tenant leaves state and sessions untouched', async () => {
      const d = build();
      const foreign = {
        id: 's2',
        tenantId: T2,
        stateConceptId: GEO.SUBJECT_ACTIVE,
      };
      d.subjectsRepo.findById.mockResolvedValue(foreign);
      await expectNotAvailable(
        d.service.revokeConsent('s2', actor),
        NOT_AVAILABLE,
      );
      expect(foreign.stateConceptId).toBe(GEO.SUBJECT_ACTIVE);
      expect(d.sessionsRepo.findAllOpenBySubject).not.toHaveBeenCalled();
    });

    it('a subject without tenant counts as foreign (deny by default)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        id: 's3',
        tenantId: undefined,
        stateConceptId: GEO.SUBJECT_ACTIVE,
      });
      await expectNotAvailable(d.service.lastPosition('s3'), NOT_AVAILABLE);
    });

    it('a foreign UUID and a non-existent UUID respond identically', async () => {
      const foreign = build();
      foreign.subjectsRepo.findById.mockResolvedValue({
        id: 's2',
        tenantId: T2,
      });
      const missing = build();
      missing.subjectsRepo.findById.mockResolvedValue(null);

      const a: any = await foreign.service.lastPosition('s2').catch((e) => e);
      const b: any = await missing.service.lastPosition('s2').catch((e) => e);
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(a.getStatus()).toBe(b.getStatus());
    });

    it('revoking consent closes the open sessions and later pings are rejected', async () => {
      const d = build();
      const subject = {
        id: 's1',
        tenantId: T1,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        updatedAt: new Date(),
      };
      const session = {
        id: 'sess-1',
        statusConceptId: GEO.SESSION_OPEN,
        updatedAt: new Date(),
      };
      d.subjectsRepo.findById.mockResolvedValue(subject);
      d.sessionsRepo.findAllOpenBySubject.mockResolvedValue([session]);

      await d.service.revokeConsent('s1', actor);
      expect(session.statusConceptId).toBe(GEO.SESSION_CLOSED);

      await expect(
        d.service.ingestPings('s1', pings, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.pingsRepo.record).not.toHaveBeenCalled();
    });
  });
});
