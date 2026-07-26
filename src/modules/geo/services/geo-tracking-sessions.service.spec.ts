import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackingSessionsService } from './geo-tracking-sessions.service';
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
  const sessionsRepo = { findById: mockFn(), findOpenBySubject: mockFn(), create: mockFn() };
  const subjectsRepo = { findById: mockFn() };
  const tripsRepo = { countBySessionAndStatus: mockFn().mockResolvedValue(0) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTrackingSessionsService(
    em as any,
    sessionsRepo as any,
    subjectsRepo as any,
    tripsRepo as any,
    logger as any,
  );
  return { service, tx, sessionsRepo, subjectsRepo, tripsRepo };
}

describe('GeoTrackingSessionsService', () => {
  describe('start (UC-13-02)', () => {
    it('starts a session, flushes and marks the subject', async () => {
      const d = build();
      const subject = { id: 's1', stateConceptId: GEO.SUBJECT_ACTIVE, updatedAt: new Date() };
      d.subjectsRepo.findById.mockResolvedValue(subject);
      d.sessionsRepo.findOpenBySubject.mockResolvedValue(null);
      const created = { id: 'sess-1', trackedSubjectId: 's1', statusConceptId: GEO.SESSION_OPEN };
      d.sessionsRepo.create.mockReturnValue(created);

      const res = await d.service.start({ trackedSubjectId: 's1' } as any, actor);

      expect(res).toMatchObject({ id: 'sess-1', status: GEO.SESSION_OPEN });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects when a session is already open (conflict)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_ACTIVE });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue({ id: 'existing' });
      await expect(d.service.start({ trackedSubjectId: 's1' } as any, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects when the subject is not active (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_SUSPENDED });
      await expect(d.service.start({ trackedSubjectId: 's1' } as any, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(d.service.start({ trackedSubjectId: 'x' } as any, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('close (UC-13-08)', () => {
    it('closes an open session without in-progress trips', async () => {
      const d = build();
      const session = { id: 'sess-1', trackedSubjectId: 's1', statusConceptId: GEO.SESSION_OPEN, updatedAt: new Date() };
      d.sessionsRepo.findById.mockResolvedValue(session);
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', updatedAt: new Date() });

      const res = await d.service.close('sess-1', actor);

      expect(res.status).toBe(GEO.SESSION_CLOSED);
      expect(session.statusConceptId).toBe(GEO.SESSION_CLOSED);
    });

    it('rejects closing when there is an in-progress trip (precondition)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({ id: 'sess-1', statusConceptId: GEO.SESSION_OPEN });
      d.tripsRepo.countBySessionAndStatus.mockResolvedValue(1);
      await expect(d.service.close('sess-1', actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects closing a session that is not open (precondition)', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue({ id: 'sess-1', statusConceptId: GEO.SESSION_CLOSED });
      await expect(d.service.close('sess-1', actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the session does not exist', async () => {
      const d = build();
      d.sessionsRepo.findById.mockResolvedValue(null);
      await expect(d.service.close('missing', actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
