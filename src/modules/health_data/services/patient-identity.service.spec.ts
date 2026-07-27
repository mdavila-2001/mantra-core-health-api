import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PatientIdentityService } from './patient-identity.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['MPI_STEWARD'] };
const CANDIDATE = '11111111-1111-1111-1111-111111111111';
const LEFT = '22222222-2222-2222-2222-222222222222';
const RIGHT = '33333333-3333-3333-3333-333333333333';
const CLUSTER = '44444444-4444-4444-4444-444444444444';
const TYPE = '55555555-5555-5555-5555-555555555555';
const SOURCE_ENTITY = '66666666-6666-6666-6666-666666666666';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  let memberSeq = 0;
  const identityRepo = {
    findCandidateForUpdate: mockFn(),
    createDecision: mockFn(() => ({ id: 'decision-1' })),
    findDecisionByCandidate: mockFn(() => Promise.resolve(null)),
    createCluster: mockFn(() => ({ id: CLUSTER })),
    findClusterForUpdate: mockFn(),
    findClusterByMemberForUpdate: mockFn(() => Promise.resolve(null)),
    createMember: mockFn(() => ({ id: `member-${++memberSeq}` })),
    findMemberForUpdate: mockFn(() => Promise.resolve(null)),
    findLiveMembers: mockFn(() => Promise.resolve([])),
    findLiveMembershipByProfile: mockFn(),
    createTimelineEntry: mockFn(() => ({ id: 'timeline-1' })),
    findTimelineEntryBySource: mockFn(() => Promise.resolve(null)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PatientIdentityService(
    em as any,
    identityRepo as any,
    logger as any,
  );
  return { service, tx, identityRepo, logger };
}

function pendingCandidate(overrides: Record<string, unknown> = {}): any {
  return {
    id: CANDIDATE,
    leftPatientProfileId: LEFT,
    rightPatientProfileId: RIGHT,
    matchScore: '0.94',
    statusConceptId: CONCEPTS.MATCH_PENDING,
    ...overrides,
  };
}

describe('PatientIdentityService', () => {
  describe('resolveCandidate (UC-52-09)', () => {
    const dto: any = {
      decision: 'MATCH',
      reasonText: 'coinciden RUN y fecha de nacimiento',
    };

    it('creates a cluster and adds both profiles', async () => {
      const d = build();
      const candidate = pendingCandidate();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(candidate);

      const res = await d.service.resolveCandidate(CANDIDATE, dto, actor);

      expect(res).toEqual({
        id: 'decision-1',
        candidateStatusConceptId: CONCEPTS.MATCH_RESOLVED,
        clusterId: CLUSTER,
        clusterCreated: true,
        addedMemberIds: ['member-1', 'member-2'],
      });
      expect(candidate.statusConceptId).toBe(CONCEPTS.MATCH_RESOLVED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('joins the cluster one of the profiles already belongs to', async () => {
      const d = build();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(
        pendingCandidate(),
      );
      const cluster: any = { id: 'cluster-prev' };
      d.identityRepo.findClusterByMemberForUpdate.mockResolvedValueOnce(
        cluster,
      );

      const res = await d.service.resolveCandidate(CANDIDATE, dto, actor);

      expect(res.clusterId).toBe('cluster-prev');
      expect(res.clusterCreated).toBe(false);
      expect(d.identityRepo.createCluster).not.toHaveBeenCalled();
      expect(cluster.lastResolvedAt).toBeInstanceOf(Date);
    });

    it('does not add a profile that is already a member', async () => {
      const d = build();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(
        pendingCandidate(),
      );
      d.identityRepo.findMemberForUpdate.mockResolvedValueOnce({
        id: 'member-prev',
      });

      const res = await d.service.resolveCandidate(CANDIDATE, dto, actor);

      expect(res.addedMemberIds).toEqual(['member-1']);
    });

    it('records a no-match without touching any cluster', async () => {
      const d = build();
      const candidate = pendingCandidate();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(candidate);

      const res = await d.service.resolveCandidate(
        CANDIDATE,
        { ...dto, decision: 'NO_MATCH' },
        actor,
      );

      expect(res).toEqual({
        id: 'decision-1',
        candidateStatusConceptId: CONCEPTS.MATCH_RESOLVED,
        clusterCreated: false,
        addedMemberIds: [],
      });
      expect(candidate.statusConceptId).toBe(CONCEPTS.MATCH_RESOLVED);
      expect(d.identityRepo.createCluster).not.toHaveBeenCalled();
      expect(d.identityRepo.createMember).not.toHaveBeenCalled();
    });

    it('refuses deciding a candidate that is already resolved', async () => {
      const d = build();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(
        pendingCandidate({ statusConceptId: CONCEPTS.MATCH_RESOLVED }),
      );

      await expect(
        d.service.resolveCandidate(CANDIDATE, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a second decision on the same candidate', async () => {
      const d = build();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(
        pendingCandidate(),
      );
      d.identityRepo.findDecisionByCandidate.mockResolvedValue({
        id: 'decision-prev',
      });

      await expect(
        d.service.resolveCandidate(CANDIDATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the candidate does not exist', async () => {
      const d = build();
      d.identityRepo.findCandidateForUpdate.mockResolvedValue(null);

      await expect(
        d.service.resolveCandidate(CANDIDATE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('projectTimelineEntry (UC-52-10)', () => {
    const dto: any = {
      patientProfileId: LEFT,
      eventTime: '2026-07-20T10:00:00.000Z',
      eventTypeConceptId: TYPE,
      sourceEntityTypeConceptId: TYPE,
      sourceEntityId: SOURCE_ENTITY,
      summaryRedacted: 'Consulta ambulatoria',
    };

    it('projects the entry', async () => {
      const d = build();

      const res = await d.service.projectTimelineEntry(dto);

      expect(res).toEqual({ id: 'timeline-1', duplicate: false });
    });

    it('does not project the same source entity and event twice', async () => {
      const d = build();
      d.identityRepo.findTimelineEntryBySource.mockResolvedValue({
        id: 'timeline-prev',
      });

      const res = await d.service.projectTimelineEntry(dto);

      expect(res).toEqual({ id: 'timeline-prev', duplicate: true });
      expect(d.identityRepo.createTimelineEntry).not.toHaveBeenCalled();
    });
  });
});
