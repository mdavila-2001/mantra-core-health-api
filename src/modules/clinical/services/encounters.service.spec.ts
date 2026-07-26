import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { EncountersService } from './encounters.service';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const encountersRepo = {
    findById: mockFn(),
    create: mockFn(),
    createParticipant: mockFn(),
    createLocation: mockFn(),
    findActiveParticipants: mockFn().mockResolvedValue([]),
    findActiveLocations: mockFn().mockResolvedValue([]),
  };
  const episodesRepo = { findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EncountersService(
    em as any,
    encountersRepo as any,
    episodesRepo as any,
    logger as any,
  );
  return { service, tx, encountersRepo, episodesRepo };
}

const encounter = () => ({
  id: 'enc1',
  patientProfileId: 'p1',
  episodeId: undefined,
  statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
  startAt: new Date(),
  endAt: undefined,
  createdAt: new Date(),
  rowVersion: 1,
});

describe('EncountersService', () => {
  describe('checkIn (UC-08-02)', () => {
    it('opens an encounter without participants', async () => {
      const d = build();
      d.encountersRepo.create.mockReturnValue(encounter());
      const res = await d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1' } as any,
        actor,
      );
      expect(res.id).toBe('enc1');
      expect(res.status).toBe(CLIN.ENCOUNTER_IN_PROGRESS);
      expect(d.encountersRepo.createParticipant).not.toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('creates participants and a location when provided', async () => {
      const d = build();
      d.encountersRepo.create.mockReturnValue(encounter());
      d.encountersRepo.createParticipant.mockReturnValue({ id: 'part1' });
      d.encountersRepo.createLocation.mockReturnValue({ id: 'loc1' });
      const res = await d.service.checkIn(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          participants: [{ practitionerProfileId: 'hp1' }],
          location: { practiceSiteId: 'site1' },
        } as any,
        actor,
      );
      expect(res.participantIds).toEqual(['part1']);
      expect(res.locationIds).toEqual(['loc1']);
    });

    it('rejects when the referenced episode does not exist', async () => {
      const d = build();
      d.episodesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.checkIn(
          { patientProfileId: 'p1', tenantId: 't1', episodeId: 'missing' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('close (UC-08-14)', () => {
    it('closes an in-progress encounter and its active periods', async () => {
      const d = build();
      const enc = encounter();
      d.encountersRepo.findById.mockResolvedValue(enc);
      const part = { id: 'part1', updatedAt: new Date() };
      const loc = { id: 'loc1', updatedAt: new Date() };
      d.encountersRepo.findActiveParticipants.mockResolvedValue([part]);
      d.encountersRepo.findActiveLocations.mockResolvedValue([loc]);

      const res = await d.service.close('enc1', {}, actor);

      expect(enc.statusConceptId).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(enc.endAt).toBeInstanceOf(Date);
      expect((part as any).statusConceptId).toBe(CLIN.PARTICIPANT_COMPLETED);
      expect((loc as any).locationStatusConceptId).toBe(CLIN.LOCATION_COMPLETED);
      expect(res.status).toBe(CLIN.ENCOUNTER_FINISHED);
    });

    it('throws when the encounter does not exist', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expect(d.service.close('missing', {}, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects closing an encounter that is not in progress', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        ...encounter(),
        statusConceptId: CLIN.ENCOUNTER_FINISHED,
      });
      await expect(d.service.close('enc1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('rejects on optimistic version mismatch', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({ ...encounter(), rowVersion: 3 });
      await expect(
        d.service.close('enc1', { expectedRowVersion: 1 }, actor),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });
});
