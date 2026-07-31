import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPatientsService } from './profiles-patients.service';
import { PROF } from '../profiles.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const personsRepo = { findById: mockFn(), create: mockFn() };
  const personProfilesRepo = {
    findById: mockFn(),
    findByPersonAndType: mockFn(),
    create: mockFn(),
  };
  const patientProfilesRepo = {
    findById: mockFn(),
    findByPatientCode: mockFn(),
    create: mockFn(),
  };
  const accountLinksRepo = {
    create: mockFn(),
    findActiveByUser: mockFn().mockResolvedValue(null),
    supersedeActiveForUser: mockFn().mockResolvedValue(0),
    revokeActiveForPerson: mockFn().mockResolvedValue(0),
  };
  const identityLinksRepo = {
    findBySource: mockFn(),
    create: mockFn(),
    reassignPatientProfile: mockFn().mockResolvedValue(0),
  };
  const mergeEventsRepo = {
    findById: mockFn(),
    findByReversalOf: mockFn(),
    create: mockFn(),
  };
  const relatedPersonsRepo = {
    findById: mockFn(),
    create: mockFn(),
    findActiveGuardian: mockFn(),
    reassignPatientProfile: mockFn().mockResolvedValue(0),
  };
  const portalProxiesRepo = {
    create: mockFn(),
    revokeActiveForProxyUser: mockFn().mockResolvedValue(0),
    revokeActiveForPatient: mockFn().mockResolvedValue(0),
    reassignPatientProfile: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ProfilesPatientsService(
    em as any,
    personsRepo,
    personProfilesRepo,
    patientProfilesRepo,
    accountLinksRepo,
    identityLinksRepo,
    mergeEventsRepo,
    relatedPersonsRepo,
    portalProxiesRepo,
    logger as any,
  );
  return {
    service,
    tx,
    personsRepo,
    personProfilesRepo,
    patientProfilesRepo,
    accountLinksRepo,
    identityLinksRepo,
    mergeEventsRepo,
    relatedPersonsRepo,
    portalProxiesRepo,
  };
}

describe('ProfilesPatientsService', () => {
  describe('registerPatient (UC-05-01)', () => {
    it('creates person, profile and patient flushing parent before child', async () => {
      const d = build();
      d.patientProfilesRepo.findByPatientCode.mockResolvedValue(null);
      d.personsRepo.create.mockReturnValue({
        id: 'p1',
        createdAt: new Date('2026-01-01'),
      });
      d.personProfilesRepo.create.mockReturnValue({ id: 'pp1' });
      d.patientProfilesRepo.create.mockReturnValue({
        profileId: 'pp1',
        patientCode: 'PC-1',
        recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
        createdAt: new Date('2026-01-02'),
      });

      const res = await d.service.registerPatient(
        { patientCode: 'PC-1', displayName: 'Ada' },
        actor,
      );

      expect(res).toMatchObject({
        profileId: 'pp1',
        personId: 'p1',
        patientCode: 'PC-1',
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(3);
      expect(d.personProfilesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          profileTypeConceptId: PROF.PROFILE_TYPE_PATIENT,
        }),
      );
    });

    it('rejects a duplicate patient_code (conflict)', async () => {
      const d = build();
      d.patientProfilesRepo.findByPatientCode.mockResolvedValue({
        profileId: 'x',
      });
      await expect(
        d.service.registerPatient({ patientCode: 'PC-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.personsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('linkAccount (UC-05-02)', () => {
    it('throws when the person does not exist', async () => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.linkAccount('missing', { userId: 'u1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('supersedes the previous active link and creates a new one', async () => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue({
        id: 'p1',
        personStatusConceptId: PROF.PERSON_ACTIVE,
      });
      d.accountLinksRepo.create.mockReturnValue({
        id: 'l1',
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: new Date(),
      });
      const res = await d.service.linkAccount('p1', { userId: 'u1' }, actor);
      expect(res).toMatchObject({ id: 'l1', personId: 'p1', userId: 'u1' });
      expect(d.accountLinksRepo.supersedeActiveForUser).toHaveBeenCalledWith(
        d.tx,
        'u1',
        expect.any(Date),
      );
    });
  });

  describe('mergePatients (UC-05-08)', () => {
    it('rejects merging a patient with itself (precondition)', async () => {
      const d = build();
      await expect(
        d.service.mergePatients(
          {
            survivingPatientProfileId: 'a',
            mergedPatientProfileId: 'a',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when a profile is missing (not found)', async () => {
      const d = build();
      d.patientProfilesRepo.findById
        .mockResolvedValueOnce({ profileId: 'a' })
        .mockResolvedValueOnce(null);
      await expect(
        d.service.mergePatients(
          {
            survivingPatientProfileId: 'a',
            mergedPatientProfileId: 'b',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('records the merge, marks loser merged and reassigns references', async () => {
      const d = build();
      const merged = {
        profileId: 'b',
        recordLinkageStatusConceptId: PROF.LINKAGE_LINKED,
        updatedAt: new Date(),
      };
      d.patientProfilesRepo.findById
        .mockResolvedValueOnce({ profileId: 'a' })
        .mockResolvedValueOnce(merged);
      d.mergeEventsRepo.create.mockReturnValue({
        id: 'e1',
        survivingPatientProfileId: 'a',
        mergedPatientProfileId: 'b',
        decisionStatusConceptId: PROF.MERGE_APPROVED,
        recordedAt: new Date(),
      });
      d.personProfilesRepo.findById.mockResolvedValue({ personId: 'per-b' });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-b',
        updatedAt: new Date(),
      });

      const res = await d.service.mergePatients(
        { survivingPatientProfileId: 'a', mergedPatientProfileId: 'b' },
        actor,
      );

      expect(res).toMatchObject({
        id: 'e1',
        decisionStatus: PROF.MERGE_APPROVED,
      });
      expect(merged.recordLinkageStatusConceptId).toBe(PROF.LINKAGE_MERGED);
      expect(d.identityLinksRepo.reassignPatientProfile).toHaveBeenCalledWith(
        d.tx,
        'b',
        'a',
        expect.any(Date),
      );
    });

    it('rejects re-merging an already merged patient (conflict)', async () => {
      const d = build();
      d.patientProfilesRepo.findById
        .mockResolvedValueOnce({ profileId: 'a' })
        .mockResolvedValueOnce({
          profileId: 'b',
          recordLinkageStatusConceptId: PROF.LINKAGE_MERGED,
        });
      await expect(
        d.service.mergePatients(
          {
            survivingPatientProfileId: 'a',
            mergedPatientProfileId: 'b',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('reverseMerge (UC-05-09)', () => {
    it('rejects reversing a non-approved event (precondition)', async () => {
      const d = build();
      d.mergeEventsRepo.findById.mockResolvedValue({
        id: 'e1',
        decisionStatusConceptId: PROF.MERGE_REVERSED,
      });
      await expect(
        d.service.reverseMerge('e1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects reversing twice (conflict)', async () => {
      const d = build();
      d.mergeEventsRepo.findById.mockResolvedValue({
        id: 'e1',
        decisionStatusConceptId: PROF.MERGE_APPROVED,
        reasonConceptId: PROF.MERGE_REASON_DUPLICATE,
        survivingPatientProfileId: 'a',
        mergedPatientProfileId: 'b',
      });
      d.mergeEventsRepo.findByReversalOf.mockResolvedValue({ id: 'e2' });
      await expect(
        d.service.reverseMerge('e1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addRelatedPerson (UC-05-10)', () => {
    it('rejects a second active legal guardian (conflict)', async () => {
      const d = build();
      d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'a' });
      d.relatedPersonsRepo.findActiveGuardian.mockResolvedValue({ id: 'g1' });
      await expect(
        d.service.addRelatedPerson(
          'a',
          { isLegalGuardian: true } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a new related person when none is referenced', async () => {
      const d = build();
      d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'a' });
      d.personsRepo.create.mockReturnValue({ id: 'per-1' });
      d.relatedPersonsRepo.create.mockReturnValue({
        id: 'r1',
        statusConceptId: PROF.RELATED_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.addRelatedPerson(
        'a',
        { displayName: 'Mom' },
        actor,
      );
      expect(res).toMatchObject({
        id: 'r1',
        patientProfileId: 'a',
        personId: 'per-1',
      });
    });
  });

  describe('grantPortalProxy (UC-05-11)', () => {
    it('throws when the patient does not exist', async () => {
      const d = build();
      d.patientProfilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.grantPortalProxy(
          'missing',
          {
            proxyUserId: 'u1',
            scopeValueSetId: 's1',
            legalBasisRecordId: 'lb1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('decease (UC-05-12)', () => {
    it('rejects deceasing an already deceased person (conflict)', async () => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue({
        id: 'p1',
        vitalStatusConceptId: PROF.VITAL_DECEASED,
      });
      await expect(
        d.service.decease('p1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('marks deceased and revokes account links and proxies', async () => {
      const d = build();
      const person = {
        id: 'p1',
        vitalStatusConceptId: PROF.VITAL_ALIVE,
        updatedAt: new Date(),
      } as any;
      d.personsRepo.findById.mockResolvedValue(person);
      d.accountLinksRepo.revokeActiveForPerson.mockResolvedValue(2);
      d.personProfilesRepo.findByPersonAndType.mockResolvedValue({ id: 'pp1' });
      d.portalProxiesRepo.revokeActiveForPatient.mockResolvedValue(1);

      const res = await d.service.decease('p1', { anonymize: true }, actor);

      expect(person.vitalStatusConceptId).toBe(PROF.VITAL_DECEASED);
      expect(person.displayName).toBe('ANONYMIZED');
      expect(res).toMatchObject({ revokedAccountLinks: 2, revokedProxies: 1 });
    });
  });
});
