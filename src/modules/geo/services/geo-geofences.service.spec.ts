import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoGeofencesService } from './geo-geofences.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { GEO } from '../geo.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

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
  return { service, tx, geofencesRepo, eventsRepo, subjectsRepo };
}

const circleDto = {
  tenantId: 't1',
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
        tenantId: 't1',
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
        d.service.define(
          { tenantId: 't1', name: 'Z', shapeType: 'CIRCLE' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a polygon without geometryJson (precondition, 422)', async () => {
      const d = build();
      await expect(
        d.service.define(
          { tenantId: 't1', name: 'Z', shapeType: 'POLYGON' } as any,
          actor,
        ),
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
        id: 'g1',
        stateConceptId: GEO.GEOFENCE_ACTIVE,
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
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
        id: 'g1',
        stateConceptId: GEO.GEOFENCE_ACTIVE,
      });
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
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
});
