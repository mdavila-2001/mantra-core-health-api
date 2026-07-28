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
} from '../../../common';
import { GEO } from '../geo.concepts';

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
  const sessionsRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTripsService(
    em as any,
    tripsRepo as any,
    sessionsRepo as any,
    logger as any,
  );
  return { service, tx, tripsRepo, sessionsRepo };
}

describe('GeoTripsService', () => {
  describe('start (UC-13-06)', () => {
    it('starts a trip on an open session', async () => {
      const d = build();
      const session = {
        id: 'sess-1',
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
});
