import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { ProfilesPractitionersService } from './profiles-practitioners.service';
import { PROF } from '../profiles.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AttachableFileService } from '../../common/services';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined), remove: mockFn() };
  // `fork` devuelve el mismo doble: las lecturas usan un contexto propio y las
  // escrituras una transacción, pero para la prueba es el mismo objeto. `count`
  // responde 0 salvo que una prueba lo cambie — es lo que consume el conteo de
  // actividad del perfil profesional.
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    count: mockFn().mockResolvedValue(0),
    // Lectura directa de entidades de otro módulo: hoy la usa el avance del
    // alta para saber si el profesional tiene recursos agendables. Sin recursos
    // por defecto, que es el estado de quien recién se registra.
    find: mockFn().mockResolvedValue([]),
  };
  em.fork = mockFn(() => em);
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
    listPage: mockFn().mockResolvedValue([]),
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
    findByPractitioner: mockFn().mockResolvedValue([]),
  };
  const specialtiesRepo = {
    create: mockFn(),
    findActive: mockFn(),
    findAllByPractitioner: mockFn().mockResolvedValue([]),
    findByPractitioners: mockFn().mockResolvedValue([]),
    findProfileIdsBySpecialty: mockFn().mockResolvedValue([]),
    demotePrimary: mockFn().mockResolvedValue(0),
  };
  const languagesRepo = {
    create: mockFn(),
    findByPractitioner: mockFn().mockResolvedValue([]),
  };
  const affiliationsRepo = {
    findByPractitioner: mockFn().mockResolvedValue([]),
    findSame: mockFn().mockResolvedValue(null),
    // TP-2: por defecto no hay una solicitud previa a la misma sede.
    findByPractitionerAndSite: mockFn().mockResolvedValue(null),
    findByPractitionerInStatus: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(null),
    findBySites: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const afiliaciones = {
    estadoInicial: mockFn().mockResolvedValue(PROF.AFFILIATION_ACTIVE),
    visiblesDeTerceros: mockFn().mockResolvedValue([]),
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
    // El camino inverso: de la cuenta a la persona. Es por donde el perfil
    // profesional propio resuelve a su sujeto.
    findActiveByUser: mockFn().mockResolvedValue(null),
  };
  const effectiveRoles = { ensureRoleByCode: mockFn().mockResolvedValue(true) };
  // Por defecto el bypass está apagado: listPractitioners filtra por
  // verificado, igual que se comportaría un arranque sin
  // DEV_VERIFICATION_BYPASS. Los tests que necesitan el bypass activo lo
  // pisan explícitamente.
  const verificationBypass = { isActive: mockFn().mockReturnValue(false) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Por defecto el archivo de la foto existe, es del actor, está vivo y es una
  // imagen: así las pruebas que no hablan de la foto no tienen que montarlo.
  const filesRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'file-1',
        createdByUserId: actor.id,
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      }),
    ),
  };
  const fileVersionsRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'v1',
        mimeType: 'image/png',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      }),
    ),
  };
  // El servicio compartido va de verdad: la foto tiene que apoyarse en la misma
  // regla que corre en producción, no en un doble que diga que sí.
  const attachableFiles = new AttachableFileService(
    filesRepo as any,
    fileVersionsRepo as any,
    logger as any,
  );

  // El catálogo de especialidades va como doble porque la regla que se prueba
  // acá es la del alta —qué pasa cuando el catálogo dice que sí o que no—, no
  // la lectura del value set, que tiene sus propias pruebas.
  const specialtyCatalog = {
    assertIsMedicalSpecialty: mockFn(() => Promise.resolve()),
  };

  // El contacto del profesional (`common.contact_points`). Vacío por defecto.
  const contactPointsRepo = {
    findVigentesByOwner: mockFn(() => Promise.resolve([])),
    findVigenteByOwnerAndSystem: mockFn(() => Promise.resolve(null)),
    closeVigente: mockFn(),
    create: mockFn(),
  };

  // El domicilio del profesional. Sin dirección por defecto: es el caso de casi
  // todo perfil sembrado, y quien la afirme la declara en su prueba.
  const addressesRepo = {
    findVigenteByOwnerAndUse: mockFn(() => Promise.resolve(null)),
    closeVigente: mockFn(),
    create: mockFn(),
  };

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
    // TP-2: con qué estado nace un vínculo y cuáles ve un tercero. Por defecto
    // nace aprobado —el caso del historial laboral sin sede— para que las
    // pruebas que no hablan del vínculo no tengan que montarlo.
    afiliaciones as never,
    attachableFiles,
    // Sin contactos por defecto: es el caso de casi todo perfil sembrado, y
    // las pruebas que hablan del correo lo declaran ellas.
    contactPointsRepo as any,
    addressesRepo as any,
    accountLinksRepo as any,
    effectiveRoles as any,
    verificationBypass as any,
    specialtyCatalog as any,
    logger as any,
  );
  return {
    service,
    specialtyCatalog,
    contactPointsRepo,
    em,
    accountLinksRepo,
    effectiveRoles,
    affiliationsRepo,
    afiliaciones,
    verificationBypass,
    ownership,
    tx,
    personsRepo,
    personProfilesRepo,
    practitionersRepo,
    authorizationsRepo,
    credentialsRepo,
    specialtiesRepo,
    languagesRepo,
    filesRepo,
    fileVersionsRepo,
  };
}

/**
 * Cardiología del catálogo `VS_MEDICAL_SPECIALTY` (patch v4.0.11).
 *
 * Se usa un uuid real y no un `'esp-1'` cualquiera porque estas pruebas hablan
 * de la regla «esto es una especialidad»: un identificador de fantasía leído
 * dentro de un año no dejaría claro de qué catálogo salía.
 */
const CARDIO = '7218acbc-5098-56ae-980a-9345961ced89';

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
        d.service.addSpecialty(
          'pp1',
          { specialtyConceptId: CARDIO } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    /*
     * TJ-3 · la especialidad sale del catálogo, no de un uuid cualquiera.
     *
     * `specialty_concept_id` es una FK a TODO el catálogo de conceptos, así que
     * sin esta regla un error de tipeo escribía como especialidad un idioma o
     * un estado de credencial, y eso después aparece en la Guía.
     */
    it('rechaza un concepto que no es del catálogo de especialidades (422)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtyCatalog.assertIsMedicalSpecialty.mockRejectedValue(
        new PreconditionFailedException('no es especialidad'),
      );
      await expect(
        d.service.addSpecialty(
          'pp1',
          { specialtyConceptId: 'no-es-una-especialidad' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      // Se valida ANTES de escribir: si no, la fila quedaría creada y el
      // rechazo dependería de que la transacción revierta.
      expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
    });

    it('omitir la especialidad ya no cae en un concepto de otro catálogo (422)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      await expect(
        d.service.addSpecialty('pp1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.specialtyCatalog.assertIsMedicalSpecialty,
      ).not.toHaveBeenCalled();
      expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
    });

    it('no deja pasar de tres especialidades vigentes (422)', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtiesRepo.findAllByPractitioner.mockResolvedValue([
        { id: 's1', validTo: null },
        { id: 's2', validTo: null },
        { id: 's3', validTo: null },
      ]);
      await expect(
        d.service.addSpecialty(
          'pp1',
          { specialtyConceptId: CARDIO } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('una especialidad dada de baja no ocupa lugar en el tope', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtiesRepo.findAllByPractitioner.mockResolvedValue([
        { id: 's1', validTo: null },
        { id: 's2', validTo: null },
        { id: 's3', validTo: new Date() },
      ]);
      d.specialtiesRepo.findActive.mockResolvedValue(null);
      d.specialtiesRepo.create.mockReturnValue({
        id: 's4',
        specialtyConceptId: CARDIO,
        isPrimary: false,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        createdAt: new Date(),
      });
      await expect(
        d.service.addSpecialty(
          'pp1',
          { specialtyConceptId: CARDIO } as any,
          actor,
        ),
      ).resolves.toMatchObject({ id: 's4' });
    });

    it('demotes the previous primary when a new primary is added', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({ profileId: 'pp1' });
      d.specialtiesRepo.findActive.mockResolvedValue(null);
      d.specialtiesRepo.create.mockReturnValue({
        id: 's2',
        specialtyConceptId: CARDIO,
        isPrimary: true,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        createdAt: new Date(),
      });
      const res = await d.service.addSpecialty(
        'pp1',
        { isPrimary: true, specialtyConceptId: CARDIO } as any,
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

  describe('especialidades declaradas en el alta (TJ-3)', () => {
    /** El alta mínima que ya usa el resto del archivo, con especialidades. */
    function altaCon(specialtyConceptIds?: string[]) {
      return {
        practitionerCode: 'MP-1',
        licenseNumber: 'L-1',
        credentialNumber: 'C-1',
        specialtyConceptIds,
      } as any;
    }

    function alta() {
      const d = build();
      d.practitionersRepo.findByCode.mockResolvedValue(null);
      d.personsRepo.create.mockReturnValue({ id: 'per-1' });
      d.personProfilesRepo.create.mockReturnValue({ id: 'pp1' });
      d.practitionersRepo.create.mockReturnValue({
        profileId: 'pp1',
        practitionerCode: 'MP-1',
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
      d.authorizationsRepo.create.mockReturnValue({ id: 'lic-1' });
      d.credentialsRepo.create.mockReturnValue({ id: 'cred-1' });
      return d;
    }

    it('registra las especialidades EN LA MISMA transacción del alta', async () => {
      const d = alta();
      await d.service.onboardPractitioner(altaCon([CARDIO]), actor);
      // El `tx` es el de la transacción del alta: si esto se escribiera con
      // llamadas sueltas después, un fallo dejaría al profesional a medias.
      expect(d.specialtiesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ specialtyConceptId: CARDIO }),
      );
    });

    it('la primera de la lista queda como principal', async () => {
      const d = alta();
      const PEDIATRIA = 'bd0484b1-8959-5ba5-bb65-ca9305eedb30';
      await d.service.onboardPractitioner(altaCon([CARDIO, PEDIATRIA]), actor);
      const escritas = d.specialtiesRepo.create.mock.calls.map(
        (llamada: any) => llamada[1],
      );
      expect(escritas).toHaveLength(2);
      expect(escritas[0]).toMatchObject({
        specialtyConceptId: CARDIO,
        isPrimary: true,
      });
      expect(escritas[1]).toMatchObject({ isPrimary: false });
    });

    it('una especialidad fuera del catálogo rechaza el alta ENTERA', async () => {
      const d = alta();
      d.specialtyCatalog.assertIsMedicalSpecialty.mockRejectedValue(
        new PreconditionFailedException('no es especialidad'),
      );
      // Registrar a medias a un profesional con una especialidad inventada es
      // peor que pedirle que la corrija.
      await expect(
        d.service.onboardPractitioner(altaCon(['no-es']), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
    });

    it('sin especialidades el alta sigue funcionando como antes', async () => {
      const d = alta();
      await expect(
        d.service.onboardPractitioner(altaCon(), actor),
      ).resolves.toMatchObject({ profileId: 'pp1' });
      expect(d.specialtiesRepo.create).not.toHaveBeenCalled();
      expect(
        d.specialtyCatalog.assertIsMedicalSpecialty,
      ).not.toHaveBeenCalled();
    });

    it('las repetidas se colapsan y no cuentan dos veces para el tope', async () => {
      const d = alta();
      await d.service.onboardPractitioner(
        altaCon([CARDIO, CARDIO, CARDIO, CARDIO]),
        actor,
      );
      expect(d.specialtiesRepo.create).toHaveBeenCalledTimes(1);
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
        d.em,
        actor,
      );
      expect(d.affiliationsRepo.findByPractitioner).toHaveBeenCalledWith(
        d.em,
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

  /* ---- el perfil profesional propio ------------------------------------- */

  /**
   * El contacto del profesional: correo y teléfono.
   *
   * Es lo primero que un médico busca en su propio perfil y no estaba en
   * ningún lado —los datos existían en `common.contact_points` desde el
   * registro, pero ninguna lectura los devolvía—. Lo delicado es que el DTO lo
   * comparten la lectura propia y la ficha que abre la guía de profesionales:
   * el mismo campo que le sirve al dueño sería una filtración en la ficha.
   */
  describe('el contacto propio, y sólo el propio', () => {
    /** Deja el perfil mínimo en pie para que la lectura llegue al final. */
    const conPerfil = (d: ReturnType<typeof build>): void => {
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Dra. Lucía Salas',
      });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      });
    };

    const CONTACTOS = [
      {
        systemConceptId: CONCEPTS.CONTACT_EMAIL,
        value: 'lucia.salas@alovida.test',
      },
      { systemConceptId: CONCEPTS.CONTACT_PHONE, value: '+591 700 12345' },
    ];

    it('la lectura propia trae correo y teléfono', async () => {
      const d = build();
      conPerfil(d);
      d.contactPointsRepo.findVigentesByOwner.mockResolvedValue(CONTACTOS);

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
        roles: ['PRACTITIONER'],
      } as any);

      expect(perfil.email).toBe('lucia.salas@alovida.test');
      expect(perfil.phone).toBe('+591 700 12345');
      // Se pregunta por la PERSONA, que es el dueño con el que el registro
      // escribió la fila — no por el perfil ni por la cuenta.
      expect(d.contactPointsRepo.findVigentesByOwner).toHaveBeenCalledWith(
        expect.anything(),
        'per-1',
      );
    });

    it('la ficha ajena NO los trae, y ni siquiera los consulta', async () => {
      // Lo segundo importa tanto como lo primero: si la ficha los leyera y
      // después los quitara, bastaría con que alguien devolviera el objeto
      // entero para filtrarlos. No leerlos es lo que lo hace imposible.
      const d = build();
      conPerfil(d);
      d.contactPointsRepo.findVigentesByOwner.mockResolvedValue(CONTACTOS);

      const ficha = await d.service.getPractitionerSummary('per-1');

      expect(ficha.email).toBeUndefined();
      expect(ficha.phone).toBeUndefined();
      expect(d.contactPointsRepo.findVigentesByOwner).not.toHaveBeenCalled();
    });

    it('sin contactos cargados el perfil sale igual, sin correo', async () => {
      const d = build();
      conPerfil(d);
      d.contactPointsRepo.findVigentesByOwner.mockResolvedValue([]);

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
        roles: ['PRACTITIONER'],
      } as any);

      expect(perfil.email).toBeUndefined();
      expect(perfil.practitionerCode).toBe('MED-7');
    });

    it('si la lectura del contacto falla, el perfil no se cae', async () => {
      // Misma regla que las otras seis piezas (F-18): un perfil incompleto se
      // muestra incompleto, no con un 500 en la cara.
      const d = build();
      conPerfil(d);
      d.contactPointsRepo.findVigentesByOwner.mockRejectedValue(
        new Error('la tabla no responde'),
      );

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
        roles: ['PRACTITIONER'],
      } as any);

      expect(perfil.email).toBeUndefined();
      expect(perfil.practitionerCode).toBe('MED-7');
    });
  });

  describe('getOwnPractitionerProfile', () => {
    /**
     * El caso que dejaba la pantalla de perfil de un médico sin nada que
     * mostrar: no existía lectura y la única disponible era la de pacientes.
     */
    it('devuelve el perfil con trayectoria y actividad', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Dra. Lucía Salas',
      });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        professionalTitle: 'Cardióloga',
        professionalBio: 'Quince años en cardiología clínica.',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        acceptsNewPatients: true,
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      });
      d.specialtiesRepo.findAllByPractitioner.mockResolvedValue([
        {
          id: 'sp-1',
          specialtyConceptId: 'con-cardio',
          isPrimary: true,
          boardCertified: true,
          verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        },
      ]);
      d.credentialsRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'cr-1',
          credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DEGREE,
          number: 'TIT-1',
          issuingInstitutionText: 'UMSA',
          stateConceptId: PROF.CRED_PENDING,
        },
      ]);
      d.em.count
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
        roles: ['PRACTITIONER'],
      } as any);

      expect(perfil).toMatchObject({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        displayName: 'Dra. Lucía Salas',
        professionalTitle: 'Cardióloga',
        acceptsNewPatients: true,
      });
      expect(perfil.specialties).toHaveLength(1);
      expect(perfil.credentials[0]).toMatchObject({
        issuingInstitutionText: 'UMSA',
      });
      expect(perfil.activity).toEqual({
        encounters: 12,
        medicationRequests: 30,
        clinicalNotes: 4,
        documents: 2,
      });
    });

    /**
     * Historial laboral (UC-05-16): el resumen lo incluía para la escritura y
     * no para la lectura — sin esto, la pestaña Trayectoria del perfil no
     * tiene de dónde sacar la experiencia histórica ni la actividad actual.
     */
    it('incluye el historial laboral, con `current` derivado por fila', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1' });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
      d.affiliationsRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'aff-1',
          practitionerProfileId: 'per-1',
          organizationName: 'Hospital Obrero N.º 1',
          roleTitle: 'Médica de planta',
          departmentText: undefined,
          practiceSiteId: undefined,
          affiliationTypeConceptId: PROF.AFFILIATION_TYPE_EMPLOYMENT,
          startDate: new Date('2018-01-01'),
          endDate: new Date('2021-01-01'),
          statusConceptId: PROF.AFFILIATION_ACTIVE,
          createdAt: new Date('2018-01-02'),
        },
        {
          id: 'aff-2',
          practitionerProfileId: 'per-1',
          organizationName: 'Clínica del Sur',
          roleTitle: 'Cardióloga',
          departmentText: 'Cardiología',
          practiceSiteId: undefined,
          affiliationTypeConceptId: PROF.AFFILIATION_TYPE_EMPLOYMENT,
          startDate: new Date('2021-02-01'),
          endDate: undefined,
          statusConceptId: PROF.AFFILIATION_ACTIVE,
          createdAt: new Date('2021-02-02'),
        },
      ]);

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
      } as any);

      expect(perfil.affiliations).toHaveLength(2);
      expect(perfil.affiliations[0]).toMatchObject({
        organizationName: 'Hospital Obrero N.º 1',
        current: false,
      });
      expect(perfil.affiliations[1]).toMatchObject({
        organizationName: 'Clínica del Sur',
        current: true,
      });
    });

    /** Los booleanos opcionales de la base no pueden llegar como `undefined`. */
    it('normaliza los booleanos ausentes a false', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1' });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });

      const perfil = await d.service.getOwnPractitionerProfile({
        id: 'u-1',
      } as any);

      expect(perfil.acceptsNewPatients).toBe(false);
      expect(perfil.telehealthAvailable).toBe(false);
    });

    it('sin persona vinculada falla con precondición, no con 404', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.getOwnPractitionerProfile({ id: 'u-1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * La cuenta existe y la sesión es válida: lo que falta es el perfil. Un 403
     * mandaría a pedir permisos a quien necesita que lo den de alta.
     */
    it('sin perfil profesional responde no encontrado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1' });
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.getOwnPractitionerProfile({ id: 'u-1' } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('updateOwnPractitionerProfile', () => {
    /** El objeto mutable que representa la fila del practitioner en la base. */
    function practitionerBase() {
      return {
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        professionalTitle: 'Médico general',
        professionalBio: 'Bio vieja.',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        acceptsNewPatients: false,
        telehealthAvailable: false,
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      };
    }

    /** Deja el doble listo para editar y para la relectura posterior. */
    function prepararParaEditar(
      d: ReturnType<typeof build>,
      practitioner: any,
    ) {
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Dr. Uno',
      });
      d.practitionersRepo.findById.mockResolvedValue(practitioner);
    }

    /**
     * El caso que le faltaba al módulo: el alta escribía estos campos una vez y
     * no había forma de volver a tocarlos.
     */
    it('cambia el título, la biografía y la disponibilidad', async () => {
      const d = build();
      const practitioner = practitionerBase();
      prepararParaEditar(d, practitioner);

      const actualizado = await d.service.updateOwnPractitionerProfile(
        {
          professionalTitle: 'Médica cardióloga',
          professionalBio: 'Bio nueva.',
          acceptsNewPatients: true,
          telehealthAvailable: true,
        },
        { id: 'u-1' } as any,
      );

      expect(practitioner.professionalTitle).toBe('Médica cardióloga');
      expect(practitioner.professionalBio).toBe('Bio nueva.');
      expect(practitioner.acceptsNewPatients).toBe(true);
      expect(practitioner.telehealthAvailable).toBe(true);
      // Se relee entero: la respuesta es la misma forma que `getOwnPractitionerProfile`.
      expect(actualizado.professionalTitle).toBe('Médica cardióloga');
    });

    /**
     * `PATCH`: lo que no viene no se toca. Si el servicio usara `??` en vez de
     * comparar contra `undefined`, esta prueba fallaría — es la que fija que
     * omitir un campo no es lo mismo que mandarlo vacío.
     */
    it('lo que no viene en el cuerpo no se toca', async () => {
      const d = build();
      const practitioner = practitionerBase();
      prepararParaEditar(d, practitioner);

      await d.service.updateOwnPractitionerProfile(
        { professionalTitle: 'Sólo el título' },
        { id: 'u-1' } as any,
      );

      expect(practitioner.professionalTitle).toBe('Sólo el título');
      expect(practitioner.professionalBio).toBe('Bio vieja.');
      expect(practitioner.acceptsNewPatients).toBe(false);
    });

    /** Un `''` sí borra: es una decisión de quien edita, distinta de omitir. */
    it('una cadena vacía borra el campo en vez de ignorarse', async () => {
      const d = build();
      const practitioner = practitionerBase();
      prepararParaEditar(d, practitioner);

      await d.service.updateOwnPractitionerProfile({ professionalBio: '' }, {
        id: 'u-1',
      } as any);

      expect(practitioner.professionalBio).toBe('');
    });

    /**
     * Lo encontró una prueba de punta a punta contra la base: mandar
     * `birthDate: null` para borrar la fecha la guardaba como **1/1/1970**,
     * porque `new Date(null)` es la época Unix y no «sin fecha». El médico
     * quedaba nacido en 1970 sin haber escrito eso en ningún lado.
     */
    it('borrar la fecha de nacimiento la deja sin valor, no en 1970', async () => {
      const d = build();
      const practitioner = practitionerBase();
      prepararParaEditar(d, practitioner);
      const person = { id: 'per-1', displayName: 'Dr. Uno', birthDate: new Date(1979, 10, 5) };
      d.personsRepo.findById.mockResolvedValue(person);

      await d.service.updateOwnPractitionerProfile({ birthDate: null }, {
        id: 'u-1',
      } as any);

      expect(person.birthDate).toBeUndefined();
    });

    it('y una fecha de verdad sí se guarda', async () => {
      const d = build();
      const practitioner = practitionerBase();
      prepararParaEditar(d, practitioner);
      const person: any = { id: 'per-1', displayName: 'Dr. Uno' };
      d.personsRepo.findById.mockResolvedValue(person);

      await d.service.updateOwnPractitionerProfile({ birthDate: '1979-11-05' }, {
        id: 'u-1',
      } as any);

      expect(person.birthDate).toBeInstanceOf(Date);
      expect((person.birthDate as Date).getUTCFullYear()).toBe(1979);
    });

    /** Igual que la lectura: sin persona vinculada no hay nada que editar. */
    it('sin persona vinculada falla con precondición', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.updateOwnPractitionerProfile({ professionalTitle: 'X' }, {
          id: 'u-1',
        } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sin perfil profesional responde no encontrado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.updateOwnPractitionerProfile({ professionalTitle: 'X' }, {
          id: 'u-1',
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
  describe('listPractitioners (guía de profesionales, R2-1)', () => {
    const fila = {
      profileId: 'per-1',
      practitionerCode: 'MED-1',
      professionalTitle: 'Cardióloga',
      verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
      acceptsNewPatients: true,
      telehealthAvailable: false,
    };

    it('arma la fila de la guía con nombre y especialidades vigentes', async () => {
      const d = build();
      d.practitionersRepo.listPage.mockResolvedValue([fila]);
      d.personsRepo.findByIds.mockResolvedValue(
        new Map([['per-1', { id: 'per-1', displayName: 'Dra. Lucía Salas' }]]),
      );
      d.specialtiesRepo.findByPractitioners.mockResolvedValue([
        {
          practitionerProfileId: 'per-1',
          specialtyConceptId: 'con-cardio',
          isPrimary: true,
        },
        // Cerrada: es trayectoria del perfil, no un encabezado de la guía.
        {
          practitionerProfileId: 'per-1',
          specialtyConceptId: 'con-pediatria',
          isPrimary: false,
          validTo: new Date('2020-01-01'),
        },
      ]);

      const pagina = await d.service.listPractitioners({ limit: 50 });

      expect(pagina.items).toHaveLength(1);
      expect(pagina.items[0]).toMatchObject({
        profileId: 'per-1',
        displayName: 'Dra. Lucía Salas',
        specialties: [{ specialtyConceptId: 'con-cardio', isPrimary: true }],
      });
      expect(pagina.nextCursor).toBeNull();
    });

    /** La fila de más existe sólo para saber si hay página siguiente. */
    it('recorta la fila extra y devuelve cursor de continuación', async () => {
      const d = build();
      d.practitionersRepo.listPage.mockResolvedValue([
        fila,
        { ...fila, profileId: 'per-2', practitionerCode: 'MED-2' },
      ]);

      const pagina = await d.service.listPractitioners({ limit: 1 });

      expect(pagina.items).toHaveLength(1);
      expect(pagina.nextCursor).not.toBeNull();
      // El repo recibió el tope + 1: así se detecta la página siguiente sin
      // pagar un COUNT por página.
      expect(d.practitionersRepo.listPage.mock.calls[0][2]).toBe(2);
    });

    /**
     * Filtrar por una especialidad sin profesionales vigentes responde vacío
     * SIN consultar el listado: un `$in` vacío sería `in (null)`.
     */
    it('con la especialidad sin profesionales responde vacío sin listar', async () => {
      const d = build();
      d.specialtiesRepo.findProfileIdsBySpecialty.mockResolvedValue([]);

      const pagina = await d.service.listPractitioners({
        specialtyConceptId: 'con-cardio',
        limit: 50,
      });

      expect(pagina).toEqual({
        items: [],
        count: 0,
        limit: 50,
        nextCursor: null,
      });
      expect(d.practitionersRepo.listPage).not.toHaveBeenCalled();
    });

    /**
     * Corrección #12/#13: fuera del bypass, la guía solo lista verificados.
     */
    it('con el bypass apagado filtra por verificado', async () => {
      const d = build();
      d.practitionersRepo.listPage.mockResolvedValue([fila]);

      await d.service.listPractitioners({ limit: 50 });

      expect(d.practitionersRepo.listPage.mock.calls[0][1]).toMatchObject({
        verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
      });
    });

    it('con el bypass activo no filtra por verificación', async () => {
      const d = build();
      d.verificationBypass.isActive.mockReturnValue(true);
      d.practitionersRepo.listPage.mockResolvedValue([fila]);

      await d.service.listPractitioners({ limit: 50 });

      expect(
        d.practitionersRepo.listPage.mock.calls[0][1]
          .verificationStatusConceptId,
      ).toBeUndefined();
    });

    it('combina el bypass activo con el filtro de especialidad', async () => {
      const d = build();
      d.verificationBypass.isActive.mockReturnValue(true);
      d.specialtiesRepo.findProfileIdsBySpecialty.mockResolvedValue(['per-1']);
      d.practitionersRepo.listPage.mockResolvedValue([fila]);

      const pagina = await d.service.listPractitioners({
        specialtyConceptId: 'con-cardio',
        limit: 50,
      });

      expect(pagina.items).toHaveLength(1);
      expect(d.practitionersRepo.listPage.mock.calls[0][1]).toMatchObject({
        profileIds: ['per-1'],
        verificationStatusConceptId: undefined,
      });
    });
  });

  describe('foto del perfil profesional', () => {
    /** Perfil existente y legible, que es lo que la respuesta relee. */
    function conPerfil(d: ReturnType<typeof build>) {
      const practitioner: any = {
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      };
      d.practitionersRepo.findById.mockResolvedValue(practitioner);
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Dra. Lucía Salas',
      });
      return practitioner;
    }

    it('escribe photo_file_id y lo devuelve en la ficha releída', async () => {
      const d = build();
      const practitioner = conPerfil(d);

      const perfil = await d.service.setPractitionerPhoto(
        'per-1',
        { fileId: 'file-1' },
        actor,
      );

      expect(practitioner.photoFileId).toBe('file-1');
      expect(perfil.photoFileId).toBe('file-1');
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('exige ser el titular del perfil o plataforma', async () => {
      const d = build();
      conPerfil(d);
      d.ownership.assertOwnsPractitionerProfile.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'file-1' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('no acepta el archivo de otra persona', async () => {
      // La foto es la cara de quien ejerce: apuntarla al archivo de otro es
      // exactamente lo que la FK sola no impide.
      const d = build();
      conPerfil(d);
      d.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'otro-usuario',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'file-1' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('no acepta un archivo que no existe', async () => {
      const d = build();
      conPerfil(d);
      d.filesRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'fantasma' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no acepta un archivo que no es imagen', async () => {
      // Un PDF subido como DOCUMENT es del titular y está vivo: lo único que
      // lo descarta como foto es su tipo, el deducido de los bytes al subirlo.
      const d = build();
      conPerfil(d);
      d.fileVersionsRepo.findById.mockResolvedValue({
        id: 'v1',
        mimeType: 'application/pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      });

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'file-1' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no acepta un archivo marcado infectado', async () => {
      const d = build();
      conPerfil(d);
      d.fileVersionsRepo.findById.mockResolvedValue({
        id: 'v1',
        mimeType: 'image/png',
        malwareScanStatusConceptId: CONCEPTS.SCAN_INFECTED,
      });

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'file-1' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * F-18 (18/08/2026): abrir la ficha desde la Guía devolvía 500 con código
     * de soporte a la vista del paciente. Los perfiles del seeder técnico están
     * pelados —sin credenciales, sin especialidad, sin foto— y basta con que
     * una de las lecturas accesorias falle para tumbar la ficha entera.
     */
    it('un perfil pelado se muestra incompleto, nunca con un error', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue({
        userId: 'u-titular',
      });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1' });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
      // Las seis lecturas accesorias revientan a la vez: el peor caso.
      const revienta = new Error('columna inexistente');
      d.specialtiesRepo.findAllByPractitioner.mockRejectedValue(revienta);
      d.credentialsRepo.findByPractitioner.mockRejectedValue(revienta);
      d.authorizationsRepo.findByPractitioner.mockRejectedValue(revienta);
      d.languagesRepo.findByPractitioner.mockRejectedValue(revienta);
      d.affiliationsRepo.findByPractitioner.mockRejectedValue(revienta);
      d.em.count.mockRejectedValue(revienta);

      const perfil = await d.service.getPractitionerSummary('per-1');

      expect(perfil.profileId).toBe('per-1');
      expect(perfil.specialties).toEqual([]);
      expect(perfil.credentials).toEqual([]);
      expect(perfil.licenses).toEqual([]);
      expect(perfil.languages).toEqual([]);
      expect(perfil.activity).toEqual({
        encounters: 0,
        medicationRequests: 0,
        clinicalNotes: 0,
        documents: 0,
      });
    });

    it('un perfil inexistente responde no encontrado', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.setPractitionerPhoto('per-1', { fileId: 'file-1' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('reemplazar la foto cambia la referencia y no borra el archivo anterior', async () => {
      // El archivo anterior puede estar en uso en otro lado; borrarlo desde acá
      // dejaría colgada esa otra referencia.
      const d = build();
      const practitioner = conPerfil(d);
      practitioner.photoFileId = 'file-vieja';

      await d.service.setPractitionerPhoto(
        'per-1',
        { fileId: 'file-1' },
        actor,
      );

      expect(practitioner.photoFileId).toBe('file-1');
      expect(d.tx.remove).not.toHaveBeenCalled();
    });

    it('quitar la foto deja la referencia en nulo sin tocar el archivo', async () => {
      const d = build();
      const practitioner = conPerfil(d);
      practitioner.photoFileId = 'file-1';

      const perfil = await d.service.removePractitionerPhoto('per-1', actor);

      expect(practitioner.photoFileId).toBeUndefined();
      expect(perfil.photoFileId).toBeUndefined();
      expect(d.filesRepo.findById).not.toHaveBeenCalled();
    });

    it('quitar la foto de un perfil que no la tiene no falla', async () => {
      const d = build();
      conPerfil(d);

      await expect(
        d.service.removePractitionerPhoto('per-1', actor),
      ).resolves.toBeDefined();
    });

    it('quitar la foto exige ser el titular o plataforma', async () => {
      const d = build();
      conPerfil(d);
      d.ownership.assertOwnsPractitionerProfile.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(
        d.service.removePractitionerPhoto('per-1', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getPractitionerSummary (ficha de la guía, R2-1)', () => {
    it('devuelve el mismo contrato que el propio, con la actividad del titular', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue({
        userId: 'u-titular',
      });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Dra. Lucía Salas',
      });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_VERIFIED,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
      d.em.count.mockResolvedValue(3);

      const perfil = await d.service.getPractitionerSummary('per-1');

      expect(perfil.profileId).toBe('per-1');
      // La actividad es la del TITULAR del perfil consultado, no la de quien
      // mira: los cuatro conteos filtran por su cuenta.
      const filtros = d.em.count.mock.calls.map((c: any[]) => c[1]);
      for (const filtro of filtros) {
        expect(filtro).toEqual({ createdByUserId: 'u-titular' });
      }
    });

    /** Un perfil sin cuenta vinculada existe igual; su actividad es cero. */
    it('sin cuenta vinculada la actividad queda en cero, no en error', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1' });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'per-1',
        practitionerCode: 'MED-7',
        practitionerCategoryConceptId: PROF.PRACT_CATEGORY_GENERAL,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });

      const perfil = await d.service.getPractitionerSummary('per-1');

      expect(perfil.activity).toEqual({
        encounters: 0,
        medicationRequests: 0,
        clinicalNotes: 0,
        documents: 0,
      });
      expect(d.em.count).not.toHaveBeenCalled();
    });

    it('un perfil inexistente responde no encontrado', async () => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue(null);
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.getPractitionerSummary('per-x'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('getOwnOnboarding (TJ-1)', () => {
    /**
     * El estado en el que aterriza quien recién se registró: matrícula sin
     * cargar, sin especialidad, sin foto, sin dónde atender y sin horarios.
     */
    function recienRegistrado(d: ReturnType<typeof build>): void {
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        practitionerCode: 'MED-7',
      });
    }

    /** Todo cargado: el profesional que ya trabajaba antes del asistente. */
    function completo(d: ReturnType<typeof build>): void {
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        practitionerCode: 'MED-7',
        photoFileId: 'file-1',
      });
      d.authorizationsRepo.findByPractitioner.mockResolvedValue([
        { licenseNumber: 'MP-4821' },
      ]);
      d.specialtiesRepo.findAllByPractitioner.mockResolvedValue([
        { id: 'sp-1', specialtyConceptId: 'con-cardio' },
      ]);
      d.affiliationsRepo.findByPractitioner.mockResolvedValue([{ id: 'af-1' }]);
      d.em.find.mockResolvedValue([{ id: 'res-1' }]);
      d.em.count.mockResolvedValue(48);
    }

    it('una sesión sin persona vinculada no tiene alta que consultar', async () => {
      const d = build();

      await expect(d.service.getOwnOnboarding(actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    /**
     * 422 y no 404: que una cuenta administrativa o un paciente pregunten por
     * el alta de profesional es un caso normal, no un recurso perdido.
     */
    it('una cuenta sin perfil profesional responde 422, no 404', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(d.service.getOwnOnboarding(actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('quien recién se registra aterriza en sus datos profesionales', async () => {
      const d = build();
      recienRegistrado(d);

      const avance = await d.service.getOwnOnboarding(actor);

      expect(avance.practitionerProfileId).toBe('pp-1');
      expect(avance.steps).toHaveLength(5);
      expect(avance.firstIncomplete).toBe('professional-data');
      expect(avance.steps[0].missing).toEqual(['license-number', 'specialty']);
      expect(avance.steps.every((paso) => !paso.complete)).toBe(true);
    });

    /**
     * El criterio de aceptación del prompt: abandonar a mitad y volver mañana
     * retoma donde quedó, con lo anterior persistido — y sin que nadie haya
     * guardado en qué paso iba.
     */
    it('con matrícula, especialidad y foto retoma en «dónde atendés»', async () => {
      const d = build();
      recienRegistrado(d);
      d.practitionersRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        photoFileId: 'file-1',
      });
      d.authorizationsRepo.findByPractitioner.mockResolvedValue([
        { licenseNumber: 'MP-4821' },
      ]);
      d.specialtiesRepo.findAllByPractitioner.mockResolvedValue([
        { id: 'sp-1' },
      ]);

      const avance = await d.service.getOwnOnboarding(actor);

      expect(avance.firstIncomplete).toBe('organizations');
      expect(avance.steps[0].complete).toBe(true);
      expect(avance.steps[1].complete).toBe(true);
      expect(avance.steps[2].missing).toEqual(['affiliation']);
    });

    /**
     * Consultorio propio: no hay institución a la cual afiliarse, y el recurso
     * agendable que crea el asistente de agenda alcanza. Sin este «o», quien
     * atiende particular quedaría trabado para siempre en el paso 3.
     */
    it('un recurso propio cumple «dónde atendés» sin ninguna afiliación', async () => {
      const d = build();
      recienRegistrado(d);
      d.em.find.mockResolvedValue([{ id: 'res-1' }]);

      const avance = await d.service.getOwnOnboarding(actor);

      const donde = avance.steps.find((paso) => paso.key === 'organizations');
      expect(donde?.complete).toBe(true);
      expect(donde?.missing).toEqual([]);
    });

    /**
     * Tener el recurso no es tener agenda: mientras no haya cupos generados, lo
     * que falta es publicarlos, y el faltante lo dice con esa palabra.
     */
    it('con recurso y sin cupos, lo que falta son los cupos', async () => {
      const d = build();
      recienRegistrado(d);
      d.em.find.mockResolvedValue([{ id: 'res-1' }]);
      d.em.count.mockResolvedValue(0);

      const avance = await d.service.getOwnOnboarding(actor);

      const agenda = avance.steps.find((paso) => paso.key === 'schedule');
      expect(agenda?.missing).toEqual(['slots']);
    });

    it('sin ningún recurso, lo que falta es la agenda entera', async () => {
      const d = build();
      recienRegistrado(d);

      const avance = await d.service.getOwnOnboarding(actor);

      const agenda = avance.steps.find((paso) => paso.key === 'schedule');
      expect(agenda?.missing).toEqual(['published-schedule']);
    });

    /**
     * Los profesionales que ya estaban completos antes de que el asistente
     * existiera no ven nada: `done` es lo que apaga el aviso, y se llega sin
     * migrar una sola fila.
     */
    it('un profesional ya completo responde «done»', async () => {
      const d = build();
      completo(d);

      const avance = await d.service.getOwnOnboarding(actor);

      expect(avance.firstIncomplete).toBe('done');
      expect(avance.steps.every((paso) => paso.complete)).toBe(true);
      expect(avance.steps.at(-1)?.key).toBe('review');
    });

    /**
     * Los cupos se cuentan sólo sobre los recursos del profesional. Sin esta
     * acotación, la agenda de cualquier colega daría por publicada la propia.
     */
    it('los cupos se cuentan sólo sobre los recursos propios', async () => {
      const d = build();
      completo(d);

      await d.service.getOwnOnboarding(actor);

      const [, filtro] = d.em.count.mock.calls.at(-1) as [unknown, any];
      expect(filtro).toEqual({ resourceId: { $in: ['res-1'] } });
    });

    /** Sin recursos no se pregunta por cupos: la consulta ya se sabe vacía. */
    it('sin recursos no consulta cupos', async () => {
      const d = build();
      recienRegistrado(d);

      await d.service.getOwnOnboarding(actor);

      expect(d.em.count).not.toHaveBeenCalled();
    });
  });

  /**
   * **Los títulos propios, varios y con diploma adjunto.**
   *
   * El registro de procesos (MÓDULO MÉDICO §1.17 a §1.20) pide «espacio para
   * poder subir varios diplomados», y lo mismo para maestrías, doctorados y
   * especialidades. Hasta acá el alta creaba UNA credencial y no existía forma
   * de agregar la segunda.
   */
  /**
   * **La ficha de directorio: un profesional sin matrícula conocida.**
   *
   * El padrón de una aseguradora dice quién atiende, de qué y dónde, pero no
   * publica el número de matrícula de nadie. El alta exigía los dos números, y
   * el modelo nunca: `health_practitioner_profiles` no tiene columna ni FK que
   * pida una autorización. Esa obligatoriedad vivía sólo en el DTO, y forzaba a
   * inventar una credencial para 961 médicos reales.
   */
  describe('alta sin matrícula ni credencial', () => {
    function prepararAlta(d: ReturnType<typeof build>) {
      d.practitionersRepo.findByCode.mockResolvedValue(null);
      d.personsRepo.create.mockReturnValue({ id: 'per-9' });
      d.personProfilesRepo.create.mockReturnValue({ id: 'per-9' });
      d.practitionersRepo.create.mockReturnValue({
        profileId: 'per-9',
        practitionerCode: 'DIR-1',
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        createdAt: new Date(),
      });
    }

    const fichaDeDirectorio = {
      practitionerCode: 'DIR-1',
      displayName: 'ABASTO VEGA, ROSEMARY',
    } as any;

    it('da de alta la ficha sin crear matrícula ni credencial', async () => {
      const d = build();
      prepararAlta(d);

      const creada = await d.service.onboardPractitioner(fichaDeDirectorio, actor);

      expect(d.authorizationsRepo.create).not.toHaveBeenCalled();
      expect(d.credentialsRepo.create).not.toHaveBeenCalled();
      expect(creada.licenseId).toBeUndefined();
      expect(creada.credentialId).toBeUndefined();
    });

    /**
     * Lo contrario también importa: quien SÍ trae los números sigue teniendo sus
     * dos filas. Sin esta prueba, «hacerlo opcional» podría haber sido «dejar de
     * crearlo nunca».
     */
    it('y las crea igual cuando el alta sí trae los números', async () => {
      const d = build();
      prepararAlta(d);
      d.authorizationsRepo.create.mockReturnValue({ id: 'lic-1' });
      d.credentialsRepo.create.mockReturnValue({ id: 'cred-1' });

      const creada = await d.service.onboardPractitioner(
        { ...fichaDeDirectorio, licenseNumber: 'MP-77', credentialNumber: 'TIT-9' },
        actor,
      );

      expect(creada.licenseId).toBe('lic-1');
      expect(creada.credentialId).toBe('cred-1');
    });
  });

  describe('addOwnCredential', () => {
    const cuerpo = {
      credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DIPLOMA,
      number: 'DIP-2024-17',
      issuingInstitutionText: 'Universidad Gabriel René Moreno',
      issueDate: '2024-03-15',
    };

    it('agrega el título y lo deja PENDIENTE de verificación', async () => {
      const d = build();
      d.credentialsRepo.create.mockReturnValue({
        id: 'cred-9',
        credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DIPLOMA,
        number: 'DIP-2024-17',
        stateConceptId: PROF.CRED_PENDING,
        createdAt: new Date(),
      });

      const creada = await d.service.addOwnCredential(cuerpo as any, {
        id: 'u-1',
      } as any);

      expect(creada.stateConceptId).toBe(PROF.CRED_PENDING);
      const escrito = d.credentialsRepo.create.mock.calls[0][1];
      expect(escrito.practitionerProfileId).toBe('pp1');
      expect(escrito.credentialTypeConceptId).toBe(PROF.CREDENTIAL_TYPE_DIPLOMA);
    });

    /**
     * La trampa del repositorio: `em.create` sólo escribe lo que el objeto
     * NOMBRA, así que un campo que el repo no lista se descarta en silencio —
     * compila, pasa los tests de servicio, y la columna queda en NULL. Ya pasó
     * con el canal de teleconsulta. Esta prueba mira el borde.
     */
    it('el archivo del diploma llega hasta el repositorio, no se pierde', async () => {
      const d = build();
      // El archivo lo subió el mismo que declara el título. Decirlo explícito:
      // el doble por defecto lo pone a nombre de otro usuario.
      d.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'u-1',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      d.credentialsRepo.create.mockReturnValue({
        id: 'cred-9',
        stateConceptId: PROF.CRED_PENDING,
        fileId: 'file-1',
        createdAt: new Date(),
      });

      await d.service.addOwnCredential({ ...cuerpo, fileId: 'file-1' } as any, {
        id: 'u-1',
      } as any);

      expect(d.credentialsRepo.create.mock.calls[0][1].fileId).toBe('file-1');
    });

    /**
     * La FK acepta cualquier concepto del catálogo, así que sin la lista
     * cerrada un profesional podría declarar como «título» el concepto de un
     * idioma o de un estado de cita.
     */
    it('un concepto que no es tipo de credencial se rechaza', async () => {
      const d = build();

      await expect(
        d.service.addOwnCredential(
          { ...cuerpo, credentialTypeConceptId: PROF.LANGUAGE_SPANISH } as any,
          { id: 'u-1' } as any,
        ),
      ).rejects.toThrow(PreconditionFailedException);
      expect(d.credentialsRepo.create).not.toHaveBeenCalled();
    });

    /** Un diploma en PDF: el tipo va contra la lista de DOCUMENTO, no la de imagen. */
    it('acepta un PDF como diploma', async () => {
      const d = build();
      d.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'u-1',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      d.fileVersionsRepo.findById.mockResolvedValue({
        id: 'v1',
        mimeType: 'application/pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      });
      d.credentialsRepo.create.mockReturnValue({
        id: 'cred-9',
        stateConceptId: PROF.CRED_PENDING,
        createdAt: new Date(),
      });

      await expect(
        d.service.addOwnCredential({ ...cuerpo, fileId: 'file-1' } as any, {
          id: 'u-1',
        } as any),
      ).resolves.toBeDefined();
    });

    /**
     * Apareció al escribir las pruebas de arriba: el doble por defecto pone el
     * archivo a nombre de otro usuario y el alta se cortó sola. Vale fijarlo —
     * sin esto, cualquiera podría colgar su título del archivo de otro
     * conociendo el id.
     */
    it('no se puede colgar el título del archivo de otro', async () => {
      const d = build();
      d.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'OTRO-USUARIO',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });

      await expect(
        d.service.addOwnCredential({ ...cuerpo, fileId: 'file-1' } as any, {
          id: 'u-1',
        } as any),
      ).rejects.toThrow();
      expect(d.credentialsRepo.create).not.toHaveBeenCalled();
    });
  });


});
