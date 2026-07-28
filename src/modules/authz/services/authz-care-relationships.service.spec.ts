import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzCareRelationshipsService } from './authz-care-relationships.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'sec-1', roles: ['SECURITY_ADMIN'] } as any;
const future = new Date(Date.now() + 3_600_000);

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forkEm),
  };
  const careRepo = {
    findActive: mockFn(),
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const legalRepo = {
    findActive: mockFn(),
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzCareRelationshipsService(
    em as any,
    careRepo as any,
    legalRepo as any,
    logger as any,
  );
  return { service, tx, careRepo, legalRepo };
}

describe('AuthzCareRelationshipsService', () => {
  describe('establishCareRelationship (C-06)', () => {
    it('establishes an active care relationship', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      const res = await d.service.establishCareRelationship(
        {
          tenantId: 't1',
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
          relationshipType: 'TREATING',
        } as any,
        actor,
      );
      expect(res.id).toBe('cr-1');
      expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    });

    it('rejects a duplicate active care relationship', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.establishCareRelationship(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            practitionerProfileId: 'prac-1',
            relationshipType: 'TREATING',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a non-positive validity window', async () => {
      const d = build();
      await expect(
        d.service.establishCareRelationship(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            practitionerProfileId: 'prac-1',
            relationshipType: 'TREATING',
            validTo: new Date(Date.now() - 1000),
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('revokeCareRelationship (C-06)', () => {
    it('revokes an active relationship without deleting it', async () => {
      const d = build();
      const rel = {
        id: 'cr-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: future,
        updatedAt: new Date(),
      };
      d.careRepo.findById.mockResolvedValue(rel);
      const res = await d.service.revokeCareRelationship('cr-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('throws when the relationship does not exist', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revokeCareRelationship('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects revoking a non-active relationship', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue({
        id: 'cr-2',
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });
      await expect(
        d.service.revokeCareRelationship('cr-2', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('legal representation (C-07/A-03)', () => {
    it('registers an active legal representation', async () => {
      const d = build();
      d.legalRepo.findActive.mockResolvedValue(null);
      d.legalRepo.create.mockReturnValue({ id: 'lr-1', createdAt: new Date() });
      const res = await d.service.establishLegalRepresentation(
        {
          tenantId: 't1',
          patientProfileId: 'pat-1',
          representativeUserId: 'u9',
          representationType: 'LEGAL_GUARDIAN',
        } as any,
        actor,
      );
      expect(res.id).toBe('lr-1');
      expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    });

    it('rejects a duplicate active representation', async () => {
      const d = build();
      d.legalRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.establishLegalRepresentation(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            representativeUserId: 'u9',
            representationType: 'PARENT',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('revokes an active representation without deleting it', async () => {
      const d = build();
      const rep = {
        id: 'lr-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      d.legalRepo.findById.mockResolvedValue(rep);
      const res = await d.service.revokeLegalRepresentation('lr-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rep.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });
  });
});
