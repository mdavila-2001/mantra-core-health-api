import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackedSubjectsService } from './geo-tracked-subjects.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { GEO } from '../geo.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forkEm),
  };
  const subjectsRepo = { findById: mockFn(), findActiveBySubject: mockFn(), create: mockFn() };
  const sessionsRepo = { findOpenBySubject: mockFn(), findAllOpenBySubject: mockFn().mockResolvedValue([]) };
  const pingsRepo = { record: mockFn(), findLastBySubject: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new GeoTrackedSubjectsService(
    em as any,
    subjectsRepo as any,
    sessionsRepo as any,
    pingsRepo as any,
    logger as any,
  );
  return { service, tx, em, forkEm, subjectsRepo, sessionsRepo, pingsRepo };
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

      const res = await d.service.enroll({ subjectId: 'subj-1' } as any, actor);

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
      await expect(d.service.enroll({ subjectId: 'subj-1' } as any, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(d.subjectsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('ingestPings (UC-13-03)', () => {
    it('records each ping when subject active and session open', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_ACTIVE, deviceId: 'dev-1' });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue({ id: 'sess-1' });

      const res = await d.service.ingestPings(
        's1',
        { pings: [{ latitude: -12, longitude: -77 }, { latitude: -12.1, longitude: -77.1 }] } as any,
        actor,
      );

      expect(res).toEqual({ recorded: 2 });
      expect(d.pingsRepo.record).toHaveBeenCalledTimes(2);
    });

    it('rejects when the subject is suspended (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_SUSPENDED });
      await expect(
        d.service.ingestPings('s1', { pings: [{ latitude: 0, longitude: 0 }] } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when there is no open session (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_ACTIVE });
      d.sessionsRepo.findOpenBySubject.mockResolvedValue(null);
      await expect(
        d.service.ingestPings('s1', { pings: [{ latitude: 0, longitude: 0 }] } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.ingestPings('missing', { pings: [{ latitude: 0, longitude: 0 }] } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('lastPosition (UC-13-09)', () => {
    it('returns the latest ping', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
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
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1' });
      d.pingsRepo.findLastBySubject.mockResolvedValue(null);
      await expect(d.service.lastPosition('s1')).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('revokeConsent (UC-13-10)', () => {
    it('suspends the subject and closes its open sessions', async () => {
      const d = build();
      const subject = { id: 's1', stateConceptId: GEO.SUBJECT_ACTIVE, updatedAt: new Date() };
      d.subjectsRepo.findById.mockResolvedValue(subject);
      const session = { id: 'sess-1', statusConceptId: GEO.SESSION_OPEN, updatedAt: new Date() };
      d.sessionsRepo.findAllOpenBySubject.mockResolvedValue([session]);

      const res = await d.service.revokeConsent('s1', actor);

      expect(res).toEqual({ ok: true });
      expect(subject.stateConceptId).toBe(GEO.SUBJECT_SUSPENDED);
      expect(session.statusConceptId).toBe(GEO.SESSION_CLOSED);
    });

    it('rejects when already suspended (precondition)', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue({ id: 's1', stateConceptId: GEO.SUBJECT_SUSPENDED });
      await expect(d.service.revokeConsent('s1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the subject does not exist', async () => {
      const d = build();
      d.subjectsRepo.findById.mockResolvedValue(null);
      await expect(d.service.revokeConsent('missing', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
