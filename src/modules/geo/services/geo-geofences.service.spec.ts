import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoGeofencesService } from './geo-geofences.service';
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
  const geofencesRepo = {
    findById: mockFn(),
    findByTenantAndName: mockFn(),
    create: mockFn(),
  };
  const eventsRepo = { record: mockFn(), findLast: mockFn() };
  const subjectsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoGeofencesService(
    em as any,
    geofencesRepo,
    eventsRepo,
    subjectsRepo as any,
    logger as any,
  );
  return {
    service: scoped(service),
    tx,
    geofencesRepo,
    eventsRepo,
    subjectsRepo,
  };
}

const circleDto = {
  name: 'Zona',
  shapeType: 'CIRCLE',
  radiusM: 500,
  centerLat: -12,
  centerLng: -77,
};

describe('GeoGeofencesService', () => {
  describe('define (UC-13-04)', () => {
    it('creates a circular geofence', async () => {
      const d = build();
      d.geofencesRepo.findByTenantAndName.mockResolvedValue(null);
      const created = {
        id: 'g1',
        tenantId: T1,
        name: 'Zona',
        shapeTypeConceptId: GEO.SHAPE_CIRCLE,
        stateConceptId: GEO.GEOFENCE_ACTIVE,
        createdAt: new Date('2026-01-01'),
      };
      d.geofencesRepo.create.mockReturnValue(created);

      const res = await d.service.define(circleDto as any, actor);
      expect(res).toMatchObject({
        id: 'g1',
        shapeType: GEO.SHAPE_CIRCLE,
        state: GEO.GEOFENCE_ACTIVE,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a circle without center/radius (precondition, 422)', async () => {
      const d = build();
      await expect(
        d.service.define({ name: 'Z', shapeType: 'CIRCLE' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a polygon without geometryJson (precondition, 422)', async () => {
      const d = build();
      await expect(
        d.service.define({ name: 'Z', shapeType: 'POLYGON' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated name (conflict)', async () => {
      const d = build();
      d.geofencesRepo.findByTenantAndName.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.define(circleDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('recordEvent (UC-13-05)', () => {
    it('records an enter event and flushes', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 'g1',
        stateConceptId: GEO.GEOFENCE_ACTIVE,
      });
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
      });
      d.eventsRepo.findLast.mockResolvedValue(null);
      const created = {
        id: 'e1',
        geofenceId: 'g1',
        trackedSubjectId: 's1',
        eventTypeConceptId: GEO.EVENT_ENTER,
        recordedAt: new Date('2026-01-01'),
      };
      d.eventsRepo.record.mockReturnValue(created);

      const res = await d.service.recordEvent(
        { geofenceId: 'g1', trackedSubjectId: 's1', eventType: 'ENTER' } as any,
        actor,
      );
      expect(res).toMatchObject({ id: 'e1', eventType: GEO.EVENT_ENTER });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicated consecutive transition (conflict)', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 'g1',
        stateConceptId: GEO.GEOFENCE_ACTIVE,
      });
      d.subjectsRepo.findById.mockResolvedValue({
        tenantId: T1,
        id: 's1',
      });
      d.eventsRepo.findLast.mockResolvedValue({
        eventTypeConceptId: GEO.EVENT_ENTER,
      });
      await expect(
        d.service.recordEvent(
          {
            geofenceId: 'g1',
            trackedSubjectId: 's1',
            eventType: 'ENTER',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws when the geofence does not exist', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordEvent(
          {
            geofenceId: 'x',
            trackedSubjectId: 's1',
            eventType: 'ENTER',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance por tenant (GEO-01 / GEO-02)', () => {
    const eventDto = {
      geofenceId: 'g1',
      trackedSubjectId: 's1',
      eventType: 'ENTER',
    } as any;
    const activeGeofence = (tenantId: string | undefined) => ({
      id: 'g1',
      tenantId,
      stateConceptId: GEO.GEOFENCE_ACTIVE,
    });

    it('define derives the tenant from the context and ignores the body tenantId', async () => {
      const d = build();
      d.geofencesRepo.findByTenantAndName.mockResolvedValue(null);
      d.geofencesRepo.create.mockReturnValue({
        id: 'g1',
        tenantId: T1,
        name: 'Zona',
        shapeTypeConceptId: GEO.SHAPE_CIRCLE,
        stateConceptId: GEO.GEOFENCE_ACTIVE,
        createdAt: new Date('2026-01-01'),
      });

      await d.service.define({ ...circleDto, tenantId: T2 } as any, actor);

      expect(d.geofencesRepo.findByTenantAndName).toHaveBeenCalledWith(
        d.tx,
        T1,
        'Zona',
      );
      expect(d.geofencesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('records ENTER and then EXIT for geofence and subject of the same tenant', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue(activeGeofence(T1));
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', tenantId: T1 });
      d.eventsRepo.findLast
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ eventTypeConceptId: GEO.EVENT_ENTER });
      d.eventsRepo.record
        .mockReturnValueOnce({
          id: 'e1',
          eventTypeConceptId: GEO.EVENT_ENTER,
        })
        .mockReturnValueOnce({
          id: 'e2',
          eventTypeConceptId: GEO.EVENT_EXIT,
        });

      const enter = await d.service.recordEvent(eventDto, actor);
      const exit = await d.service.recordEvent(
        { ...eventDto, eventType: 'EXIT' },
        actor,
      );
      expect(enter.eventType).toBe(GEO.EVENT_ENTER);
      expect(exit.eventType).toBe(GEO.EVENT_EXIT);
    });

    it('a geofence of another tenant answers as not found and inserts nothing', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue(activeGeofence(T2));
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', tenantId: T1 });
      await expectNotAvailable(
        d.service.recordEvent(eventDto, actor),
        GeoErrorReason.GEOFENCE_NOT_AVAILABLE,
      );
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('a subject of another tenant answers as not found and inserts nothing (T1 geofence x T2 subject)', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue(activeGeofence(T1));
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', tenantId: T2 });
      await expectNotAvailable(
        d.service.recordEvent(eventDto, actor),
        GeoErrorReason.TRACKED_SUBJECT_NOT_AVAILABLE,
      );
      expect(d.eventsRepo.findLast).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('a geofence without tenant counts as foreign (deny by default)', async () => {
      const d = build();
      d.geofencesRepo.findById.mockResolvedValue(activeGeofence(undefined));
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', tenantId: T1 });
      await expectNotAvailable(
        d.service.recordEvent(eventDto, actor),
        GeoErrorReason.GEOFENCE_NOT_AVAILABLE,
      );
    });
  });
});
