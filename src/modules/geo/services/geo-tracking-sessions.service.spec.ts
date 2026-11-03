import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackingSessionsService } from './geo-tracking-sessions.service';
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
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const sessionsRepo = {
    findById: mockFn(),
    findOpenBySubject: mockFn(),
    create: mockFn(),
  };
  const subjectsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 's1',
      tenantId: T1,
      updatedAt: new Date(),
    }),
  };
  const tripsRepo = { countBySessionAndStatus: mockFn().mockResolvedValue(0) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTrackingSessionsService(
    em as any,
    sessionsRepo as any,
    subjectsRepo as any,
    tripsRepo as any,
    logger as any,
  );
  return {
    service: scoped(service),
    tx,
    sessionsRepo,
    subjectsRepo,
    tripsRepo,
  };
}

describe('GeoTrackingSessionsService', () => {
  describe('start (UC-13-02)', () => {
    it('starts a session, flushes and marks the subject', async () => {
      const d = build();
      const subject = {
        id: 's1',
        tenantId: T1,
        stateConceptId: GEO.SUBJECT_ACTIVE,
        updatedAt: new Date(),
      };
      d.subjectsRepo.findById.mockResolvedValue(subject);
      d.sessionsRepo.findOpenBySubject.mockResolvedValue(null);
      const created = {
        id: 'sess-1',
        trackedSubjectId: 's1',
        statusConceptId: GEO.SESSION_OPEN,
      };
      d.sessionsRepo.create.mockReturnValue(created);

      const res = await d.service.start({ trackedSubjectId: 's1' }, actor);

      expect(res).toMatchObject({ id: 'sess-1', status: GEO.SESSION_OPEN });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects when a session is already open (conflict)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_ACTIVE,
      });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.start({ trackedSubjectId: 's1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the subject is not active (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
        stateConceptId: GEO.SUBJECT_SUSPENDED,
      });
      await expect(
        d.service.start({ trackedSubjectId: 's1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.start({ trackedSubjectId: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('close (UC-13-08)', () => {
    it('closes an open session without in-progress trips', async () => {
      const d = build();
      const session = {
        id: 'sess-1',
        trackedSubjectId: 's1',
        statusConceptId: GEO.SESSION_OPEN,
        updatedAt: new Date(),
      };
      d.sessionsRepo.findById.mockResolvedValue(session);

      const res = await d.service.close('sess-1', actor);

      expect(res.status).toBe(GEO.SESSION_CLOSED);
      expect(session.statusConceptId).toBe(GEO.SESSION_CLOSED);
    });

    it('rejects closing when there is an in-progress trip (precondition)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({
        trackedSubjectId: 's1',
        id: 'sess-1',
        statusConceptId: GEO.SESSION_OPEN,
      });
      d.tripsRepo.countBySessionAndStatus.mockResolvedValue(1);
      await expect(d.service.close('sess-1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('rejects closing a session that is not open (precondition)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({
        trackedSubjectId: 's1',
        id: 'sess-1',
        statusConceptId: GEO.SESSION_CLOSED,
      });
      await expect(d.service.close('sess-1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the session does not exist', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue(null);
      await expect(d.service.close('missing', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('alcance por tenant (GEO-01)', () => {
    it('start with a subject of another tenant answers as not found and creates nothing', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({
        id: 's2',
        tenantId: T2,
        stateConceptId: GEO.SUBJECT_ACTIVE,
      });
      await expectNotAvailable(
        d.service.start({ trackedSubjectId: 's2' } as any, actor),
        GeoErrorReason.TRACKED_SUBJECT_NOT_AVAILABLE,
      );
      expect(d.sessionsRepo.create).not.toHaveBeenCalled();
    });

    it('close of a session whose subject belongs to another tenant leaves it open', async () => {
      const d = build();
      const session = {
        id: 'sess-2',
        trackedSubjectId: 's2',
        statusConceptId: GEO.SESSION_OPEN,
      };
      d.sessionsRepo.findById.mockResolvedValue(session);
      d.subjectsRepo.findById.mockResolvedValue({ id: 's2', tenantId: T2 });
      await expectNotAvailable(
        d.service.close('sess-2', actor),
        GeoErrorReason.TRACKING_SESSION_NOT_AVAILABLE,
      );
      expect(session.statusConceptId).toBe(GEO.SESSION_OPEN);
      expect(d.tripsRepo.countBySessionAndStatus).not.toHaveBeenCalled();
    });
  });
});
