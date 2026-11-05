import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTripsService } from './geo-trips.service';
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
  const tripsRepo = {
    findById: mockFn(),
    findInProgressBySession: mockFn(),
    create: mockFn(),
  };
  const sessionsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'sess-1',
      trackedSubjectId: 's1',
    }),
  };
  const subjectsRepo = {
    findById: mockFn().mockResolvedValue({ id: 's1', tenantId: T1 }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTripsService(
    em as any,
    tripsRepo as any,
    sessionsRepo as any,
    subjectsRepo as any,
    logger as any,
  );
  return {
    service: scoped(service),
    tx,
    tripsRepo,
    sessionsRepo,
    subjectsRepo,
  };
}

describe('GeoTripsService', () => {
  describe('start (UC-13-06)', () => {
    it('starts a trip on an open session', async () => {
      const d = build();
      const session = {
        id: 'sess-1',
        trackedSubjectId: 's1',
        statusConceptId: GEO.SESSION_OPEN,
        updatedAt: new Date(),
      };
      d.sessionsRepo.findById.mockResolvedValue(session);
      d.tripsRepo.findInProgressBySession.mockResolvedValue(null);
      const created = {
        id: 't1',
        trackingSessionId: 'sess-1',
        statusConceptId: GEO.TRIP_IN_PROGRESS,
      };
      d.tripsRepo.create.mockReturnValue(created);

      const res = await d.service.start({ trackingSessionId: 'sess-1' }, actor);
      expect(res).toMatchObject({ id: 't1', status: GEO.TRIP_IN_PROGRESS });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects when a trip is already in progress (conflict)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({
        trackedSubjectId: 's1',
        id: 'sess-1',
        statusConceptId: GEO.SESSION_OPEN,
      });
      d.tripsRepo.findInProgressBySession.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.start({ trackingSessionId: 'sess-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when the session is not open (precondition)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({
        trackedSubjectId: 's1',
        id: 'sess-1',
        statusConceptId: GEO.SESSION_CLOSED,
      });
      await expect(
        d.service.start({ trackingSessionId: 'sess-1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the session does not exist', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.start({ trackingSessionId: 'x' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('close (UC-13-07)', () => {
    it('closes an in-progress trip and computes duration', async () => {
      const d = build();
      const started = new Date('2026-01-01T00:00:00Z');
      const trip = {
        id: 't1',
        trackingSessionId: 'sess-1',
        statusConceptId: GEO.TRIP_IN_PROGRESS,
        startedAt: started,
        updatedAt: new Date(),
      };
      d.tripsRepo.findById.mockResolvedValue(trip);

      const res = await d.service.close('t1', { distanceM: 1200 }, actor);
      expect(res.status).toBe(GEO.TRIP_COMPLETED);
      expect(trip.statusConceptId).toBe(GEO.TRIP_COMPLETED);
      expect(res.distanceM).toBe('1200');
    });

    it('rejects closing a trip not in progress (precondition)', async () => {
      const d = build();
      d.tripsRepo.findById.mockResolvedValue({
        trackingSessionId: 'sess-1',
        id: 't1',
        statusConceptId: GEO.TRIP_COMPLETED,
      });
      await expect(
        d.service.close('t1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the trip does not exist', async () => {
      const d = build();
      d.tripsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.close('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance por tenant (GEO-01)', () => {
    it('start on a session whose subject belongs to another tenant creates nothing', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({
        id: 'sess-2',
        trackedSubjectId: 's2',
        statusConceptId: GEO.SESSION_OPEN,
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's2', tenantId: T2 });
      await expectNotAvailable(
        d.service.start({ trackingSessionId: 'sess-2' } as any, actor),
        GeoErrorReason.TRACKING_SESSION_NOT_AVAILABLE,
      );
      expect(d.tripsRepo.create).not.toHaveBeenCalled();
    });

    it('close of a trip whose subject belongs to another tenant leaves it in progress', async () => {
      const d = build();
      const trip = {
        id: 't2',
        trackingSessionId: 'sess-2',
        statusConceptId: GEO.TRIP_IN_PROGRESS,
      };
      d.tripsRepo.findById.mockResolvedValue(trip);
      d.sessionsRepo.findById.mockResolvedValue({
        id: 'sess-2',
        trackedSubjectId: 's2',
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's2', tenantId: T2 });
      await expectNotAvailable(
        d.service.close('t2', {} as any, actor),
        GeoErrorReason.TRIP_NOT_AVAILABLE,
      );
      expect(trip.statusConceptId).toBe(GEO.TRIP_IN_PROGRESS);
    });
  });
});
