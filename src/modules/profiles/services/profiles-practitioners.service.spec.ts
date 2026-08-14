import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPractitionersService } from './profiles-practitioners.service';
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
  const fork = { id: 'fork' };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => fork),
  };
  const personsRepo = {
    findById: mockFn(),
    findByIds: mockFn().mockResolvedValue(new Map()),
    create: mockFn(),
  };
  const personProfilesRepo = { findById: mockFn(), create: mockFn() };
  const practitionersRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const authorizationsRepo = {
    create: mockFn(),
    findById: mockFn(),
    findByPractitioner: mockFn().mockResolvedValue([]),
  };
  const credentialsRepo = {
    findById: mockFn(),
    create: mockFn(),
    countInStateExcept: mockFn().mockResolvedValue(0),
    hasCurrentCredential: mockFn().mockResolvedValue(false),
  };
  const specialtiesRepo = {
    create: mockFn(),
    findActive: mockFn(),
    demotePrimary: mockFn().mockResolvedValue(0),
  };
  const languagesRepo = { create: mockFn() };
  const affiliationsRepo = {
    findByPractitioner: mockFn().mockResolvedValue([]),
    findSame: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  // La propiedad del perfil se prueba en `profile-ownership.service.spec.ts`; aquí el
  // doble deja pasar para no mezclar el permiso con la lógica del servicio.
  const ownership = {
    assertOwnsPractitionerProfile: mockFn().mockResolvedValue(undefined),
    requireOwnPractitionerProfileId: mockFn().mockResolvedValue('pp1'),
  };
  // El titular del perfil y la concesión de su rol asistencial: por defecto no
  // hay cuenta vinculada, que es el caso de un perfil cargado por un tercero.
  const accountLinksRepo = {
    findActiveByPerson: mockFn().mockResolvedValue(null),
  };
  const effectiveRoles = { ensureRoleByCode: mockFn().mockResolvedValue(true) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ProfilesPractitionersService(
    em as any,
    personsRepo,
    personProfilesRepo as any,
    practitionersRepo,
    authorizationsRepo,
    credentialsRepo,
    specialtiesRepo,
    languagesRepo,
    affiliationsRepo as any,
    ownership as never,
    accountLinksRepo as any,
    effectiveRoles as any,
    logger as any,
  );
  return {
    service,
    accountLinksRepo,
    effectiveRoles,
    affiliationsRepo,
    ownership,
    fork,
    tx,
    personsRepo,
    personProfilesRepo,
    practitionersRepo,
    authorizationsRepo,
    credentialsRepo,
    specialtiesRepo,
    languagesRepo,
  };
}

describe('ProfilesPractitionersService', () => {
  describe('onboardPractitioner (UC-05-03)', () => {
    it('creates person, profile, practitioner, license, credential and language', async () => {
      const d = build();
      d.practitionersRepo.findByCode.mockResolvedValue(null);
      d.personsRepo.create.mockReturnValue({ id: 'per-1' });
      d.personProfilesRepo.create.mockReturnValue({ id: 'pp1' });
      d.practitionersRepo.create.mockReturnValue({
        profileId: 'pp1',
        practitionerCode: 'HP-1',
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
      d.authorizationsRepo.create.mockReturnValue({ id: 'lic-1' });
      d.credentialsRepo.create.mockReturnValue({ id: 'cred-1' });

      const res = await d.service.onboardPractitioner(
        {
          practitionerCode: 'HP-1',
          licenseNumber: 'L1',
          credentialNumber: 'C1',
        },
        actor,
      );

      expect(res).toMatchObject({
        profileId: 'pp1',
        personId: 'per-1',
        licenseId: 'lic-1',
        credentialId: 'cred-1',
      });
      expect(d.languagesRepo.create).toHaveBeenCalled();
    });

    it('rejects a duplicate practitioner_code (conflict)', async () => {
      const d = build();
      d.practitionersRepo.findByCode.mockResolvedValue({ profileId: 'x' });
      await expect(
        d.service.onboardPractitioner(
          {
            practitionerCode: 'HP-1',
            licenseNumber: 'L1',
            credentialNumber: 'C1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addJurisdictionAuthorization (UC-05-04)', () => {
    it('throws when the practitioner does not exist', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.addJurisdictionAuthorization(
          'missing',
          { licenseNumber: 'L2' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('verifyCredential (UC-05-05)', () => {
    it('rejects verifying a credential that is not pending (precondition)', async () => {
      const d = build();
      d.credentialsRepo.findById.mockResolvedValue({
        id: 'c1',
        stateConceptId: PROF.CRED_VERIFIED,
      });
      await expect(
        d.service.verifyCredential(
          'c1',
          {
            decision: 'VERIFIED',
            verificationSourceUri:
              'https://colegiomedico.example/registro/LIC-12345',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects verifying without declaring the source consulted', async () => {
      const d = build();

      await expect(
        d.service.verifyCredential(
          'c1',
          { decision: 'VERIFIED' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Falla ANTES de tocar la base: no es una precondición de estado, es que
      // la petición en sí no es una verificación.
      expect(d.credentialsRepo.findById).not.toHaveBeenCalled();
    });

    it('rejects a blank source as if it were absent', async () => {
      const d = build();

      await expect(
        d.service.verifyCredential(
          'c1',
          { decision: 'VERIFIED', verificationSourceUri: '   ' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('allows rejecting without a source: se rechaza por defectos de forma', async () => {
      const d = build();
      const credential = {
        id: 'c1',
        stateConceptId: PROF.CRED_PENDING,
        practitionerProfileId: 'pp1',
        updatedAt: new Date(),
      };
      d.credentialsRepo.findById.mockResolvedValue(credential);

      const res = await d.service.verifyCredential(
        'c1',
        { decision: 'REJECTED' } as any,
        actor,
      );

      expect(credential.stateConceptId).toBe(PROF.CRED_REJECTED);
      expect(res).toMatchObject({ id: 'c1', practitionerVerified: false });
    });

    it('verifies the credential and activates the practitioner when none remain pending', async () => {
      const d = build();
      const credential = {
        id: 'c1',
        stateConceptId: PROF.CRED_PENDING,
        practitionerProfileId: 'pp1',
        updatedAt: new Date(),
      };
      d.credentialsRepo.findById.mockResolvedValue(credential);
      d.credentialsRepo.countInStateExcept.mockResolvedValue(0);
      const practitioner = { profileId: 'pp1', updatedAt: new Date() } as any;
      d.practitionersRepo.findById.mockResolvedValue(practitioner);

      const res = await d.service.verifyCredential(
        'c1',
        {
          decision: 'VERIFIED',
          verificationSourceUri:
            'https://colegiomedico.example/registro/LIC-12345',
        } as any,
        actor,
      );

      expect(credential.stateConceptId).toBe(PROF.CRED_VERIFIED);
      // La fuente queda persistida: es el rastro que permite auditar después
      // si la habilitación era legítima.
      expect(credential).toMatchObject({
        verificationSourceUri:
          'https://colegiomedico.example/registro/LIC-12345',
        verifiedByUserId: actor.id,
      });
      expect(practitioner.verificationStatusConceptId).toBe(
        PROF.PRACT_VERIF_VERIFIED,
      );
      expect(res).toMatchObject({ id: 'c1', practitionerVerified: true });
    });
  });

  describe('addSpecialty (UC-05-06)', () => {
    it('rejects when the supporting credential is not verified (precondition)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.credentialsRepo.findById.mockResolvedValue({
        id: 'c1',
        practitionerProfileId: 'pp1',
        stateConceptId: PROF.CRED_PENDING,
      });
      await expect(
        d.service.addSpecialty(
          'pp1',
          { supportingCredentialId: 'c1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate active specialty (conflict)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtiesRepo.findActive.mockResolvedValue({ id: 's1' });
      await expect(
        d.service.addSpecialty('pp1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('demotes the previous primary when a new primary is added', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtiesRepo.findActive.mockResolvedValue(null);
      d.specialtiesRepo.create.mockReturnValue({
        id: 's2',
        specialtyConceptId: PROF.SPECIALTY_GENERAL,
        isPrimary: true,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        createdAt: new Date(),
      });
      const res = await d.service.addSpecialty(
        'pp1',
        { isPrimary: true },
        actor,
      );
      expect(d.specialtiesRepo.demotePrimary).toHaveBeenCalledWith(
        d.tx,
        'pp1',
        expect.any(Date),
      );
      expect(res).toMatchObject({ id: 's2', isPrimary: true });
    });
  });

  describe('historial laboral (UC-05-16)', () => {
    /** Una fila de afiliación con lo mínimo que el proyector necesita. */
    const fila = (over: Partial<Record<string, unknown>> = {}): any => ({
      id: 'af-1',
      practitionerProfileId: 'pp1',
      organizationName: 'Hospital Obrero N.º 1',
      roleTitle: 'Médico de planta',
      startDate: new Date('2020-03-01'),
      statusConceptId: PROF.AFFILIATION_ACTIVE,
      createdAt: new Date('2026-08-14T00:00:00Z'),
      ...over,
    });

    it('reads the caller own history and never a profileId from the request', async () => {
      const d = build();
      d.affiliationsRepo.findByPractitioner.mockResolvedValue([fila()]);

      const res = await d.service.listOwnAffiliations(actor);

      expect(d.ownership.requireOwnPractitionerProfileId).toHaveBeenCalledWith(
        d.fork,
        actor,
      );
      expect(d.affiliationsRepo.findByPractitioner).toHaveBeenCalledWith(
        d.fork,
        'pp1',
      );
      expect(res.count).toBe(1);
      expect(res.items[0]).toMatchObject({
        organizationName: 'Hospital Obrero N.º 1',
      });
    });

    it('derives `current` from the missing end date', async () => {
      const d = build();
      d.affiliationsRepo.findByPractitioner.mockResolvedValue([
        fila(),
        fila({ id: 'af-2', endDate: new Date('2023-12-31') }),
      ]);

      const res = await d.service.listOwnAffiliations(actor);

      expect(res.items[0]).toMatchObject({ current: true, endDate: null });
      expect(res.items[1]).toMatchObject({ current: false });
    });

    it('rejects a period that ends before it starts', async () => {
      const d = build();
      await expect(
        d.service.addOwnAffiliation(
          {
            organizationName: 'Clínica del Sur',
            roleTitle: 'Jefe de guardia',
            startDate: '2024-01-01',
            endDate: '2023-01-01',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.affiliationsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects the same institution, role and start date as a duplicate', async () => {
      const d = build();
      d.affiliationsRepo.findSame.mockResolvedValue(fila());
      await expect(
        d.service.addOwnAffiliation(
          {
            organizationName: 'Hospital Obrero N.º 1',
            roleTitle: 'Médico de planta',
            startDate: '2020-03-01',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('trims the free text and defaults the affiliation type', async () => {
      const d = build();
      d.affiliationsRepo.create.mockReturnValue(fila({ id: 'af-9' }));

      const res = await d.service.addOwnAffiliation(
        {
          organizationName: '  Hospital Obrero N.º 1  ',
          roleTitle: '  Médico de planta ',
          departmentText: '   ',
          startDate: '2020-03-01',
        } as any,
        actor,
      );

      expect(d.affiliationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practitionerProfileId: 'pp1',
          organizationName: 'Hospital Obrero N.º 1',
          roleTitle: 'Médico de planta',
          departmentText: undefined,
          affiliationTypeConceptId: PROF.AFFILIATION_TYPE_EMPLOYMENT,
          statusConceptId: PROF.AFFILIATION_ACTIVE,
        }),
      );
      expect(res).toMatchObject({ id: 'af-9', current: true });
    });
  });
});
