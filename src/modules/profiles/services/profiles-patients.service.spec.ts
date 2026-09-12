import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

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
import { CONCEPTS } from '../../../common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AttachableFileService } from '../../common/services';
import { boMunicipalityConceptId } from '../../../common/seed/bo-geography.catalog';
import { boOccupationConceptId } from '../../../common/seed/bo-occupations.catalog';
import { boEmployerConceptId } from '../../../common/seed/bo-employers.catalog';
import { INS } from '../../insurance/insurance.concepts';
import {
  BOLIVIA_PUBLIC_INSURERS,
  carrierPlanId,
} from '../../../common/seed/bolivia-insurance.catalog';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Un municipio real del catálogo (Sacaba, Cochabamba). El domicilio se valida
 * contra `VS_BO_MUNICIPALITY`, así que un uuid inventado sería rechazado antes
 * de llegar a la parte que estas pruebas ejercen.
 */
const BO_MUNICIPALITY_CONCEPT_ID = boMunicipalityConceptId('031001');

/**
 * Una ocupación real del catálogo (`VS_BO_OCCUPATION`). Mismo criterio que el
 * municipio: la columna es FK a los conceptos, así que un uuid inventado sería
 * rechazado por la base en el camino real.
 */
const BO_OCCUPATION_CONCEPT_ID = boOccupationConceptId('DOCENTE');

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // `findOne` además de `flush`: el resumen propio consulta la aserción de
  // identidad con el EM forkeado, sin repositorio de por medio (el predicado
  // vive en `identity_assurance`, que no se puede inyectar aquí sin ciclo).
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
    // El perfil propio lee además identificadores (documento y NIT) con `find`,
    // y coberturas y tutores por SQL: por defecto nada declarado, que es el
    // caso de quien se registró con lo mínimo.
    find: mockFn().mockResolvedValue([]),
    getConnection: mockFn(() => ({
      execute: mockFn().mockResolvedValue([]),
    })),
  };
  // `fork` además de `transactional`: las lecturas del servicio no abren
  // transacción —forkean un EM propio— y sin este doble ninguna se puede probar.
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const personsRepo = {
    findById: mockFn(),
    findByIds: mockFn().mockResolvedValue(new Map()),
    create: mockFn(),
  };
  const personProfilesRepo = {
    findById: mockFn(),
    findByPersonAndType: mockFn(),
    create: mockFn(),
  };
  const patientProfilesRepo = {
    findById: mockFn(),
    findByPatientCode: mockFn(),
    searchPage: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const accountLinksRepo = {
    create: mockFn(),
    findActiveByUser: mockFn().mockResolvedValue(null),
    findActiveByPerson: mockFn().mockResolvedValue(null),
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
    findEvents: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const relatedPersonsRepo = {
    findById: mockFn(),
    create: mockFn(),
    findActiveGuardian: mockFn(),
    findActiveDeclaredGuardian: mockFn().mockResolvedValue(null),
    findActiveByPatient: mockFn().mockResolvedValue([]),
    reassignPatientProfile: mockFn().mockResolvedValue(0),
  };
  const portalProxiesRepo = {
    create: mockFn(),
    revokeActiveForProxyUser: mockFn().mockResolvedValue(0),
    revokeActiveForPatient: mockFn().mockResolvedValue(0),
    reassignPatientProfile: mockFn().mockResolvedValue(0),
  };
  // El teléfono y el domicilio del paciente viven en `common`: el perfil propio
  // los lee y los reemplaza, y sin estos dobles no se puede probar ni que cierre
  // el vigente ni que evite crear una fila idéntica.
  const contactPointsRepo = {
    findById: mockFn(),
    findVigentesByOwner: mockFn().mockResolvedValue([]),
    findVigentesByOwners: mockFn().mockResolvedValue([]),
    findVigenteByOwnerAndSystem: mockFn().mockResolvedValue(null),
    findVigenteByOwnerSystemAndUse: mockFn().mockResolvedValue(null),
    closeVigente: mockFn(),
    create: mockFn(),
  };
  const addressesRepo = {
    findVigenteByOwnerAndUse: mockFn().mockResolvedValue(null),
    closeVigente: mockFn(),
    create: mockFn(),
  };
  // El NIT vive en `common.identifiers` como un tipo más, igual que el CI.
  const identifiersRepo = { create: mockFn() };
  // El municipio se valida contra la base, no contra el catálogo estático:
  // cualquier id que llegue acá se resuelve como sembrado, salvo que la
  // prueba lo pise explícitamente — las pruebas de `reemplazarDireccion` no
  // hablan de qué municipio es, sólo de que se conserva o cambia.
  const catalogConceptsRepo = {
    findById: mockFn(() =>
      Promise.resolve({ code: 'CB-SACABA', display: 'Sacaba' }),
    ),
  };
  // La propiedad del perfil se prueba en `profile-ownership.service.spec.ts`; aquí el
  // doble deja pasar para no mezclar el permiso con la lógica del servicio.
  const ownership = {
    assertOwnsPatientProfile: mockFn().mockResolvedValue(undefined),
  };
  // El catálogo de departamentos se prueba en
  // `administrative-area-catalog.service.spec.ts`; acá el doble deja pasar
  // para no mezclar la validación de dominio con la lógica del servicio.
  const administrativeAreas = {
    assertIsAdministrativeArea: mockFn().mockResolvedValue(undefined),
  };
  // Por defecto el archivo de la foto existe, es del actor, está vivo y es una
  // imagen: así las pruebas que no hablan de la foto no tienen que montarlo.
  // Mismo doble que `profiles-practitioners.service.spec.ts`.
  const filesRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'file-1',
        createdByUserId: 'user-1',
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
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
  );
  const insuranceCatalogRepo = {
    findPlan: mockFn().mockResolvedValue(null),
  };
  const coverageRepo = {
    findByMemberAndPlan: mockFn().mockResolvedValue(null),
    findActiveByPatientAndOrder: mockFn().mockResolvedValue(null),
    countActiveByPatient: mockFn().mockResolvedValue(0),
    createCoverage: mockFn(),
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
    contactPointsRepo,
    addressesRepo,
    catalogConceptsRepo as never,
    identifiersRepo as never,
    ownership as never,
    attachableFiles,
    administrativeAreas as never,
    insuranceCatalogRepo as never,
    coverageRepo as never,
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
    insuranceCatalogRepo,
    coverageRepo,
    contactPointsRepo,
    addressesRepo,
    catalogConceptsRepo,
    identifiersRepo,
    administrativeAreas,
    filesRepo,
    fileVersionsRepo,
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

  describe('listMergeEvents (UC-05-09·L)', () => {
    /**
     * La lectura que hace reversible una fusión más allá de la pantalla que la
     * hizo: `reverse` exige el `eventId`, y antes ese identificador sólo vivía
     * en la respuesta del `POST`.
     */
    it('devuelve los eventos con el id que exige `reverse`', async () => {
      const d = build();
      d.mergeEventsRepo.findEvents.mockResolvedValue([
        {
          id: 'e1',
          survivingPatientProfileId: 'a',
          mergedPatientProfileId: 'b',
          decisionStatusConceptId: 'st-aprobado',
          recordedAt: new Date('2026-08-01T10:00:00.000Z'),
        },
      ]);

      const res = await d.service.listMergeEvents({});

      expect(res.items[0]?.id).toBe('e1');
      expect(res.count).toBe(1);
      expect(res.limit).toBe(50);
    });

    /**
     * Quien revisa un registro sospechoso no sabe si el que mira sobrevivió o
     * fue el absorbido: el filtro tiene que buscar en los dos lados.
     */
    it('el filtro por paciente llega al repositorio tal cual', async () => {
      const d = build();

      await d.service.listMergeEvents({ patientProfileId: 'p-1', limit: 10 });

      expect(d.mergeEventsRepo.findEvents).toHaveBeenCalledWith(
        expect.anything(),
        { patientProfileId: 'p-1' },
        10,
      );
    });

    /** Sin filtro no se manda la clave: `undefined` no es «cualquier paciente». */
    it('sin filtro no manda la clave al repositorio', async () => {
      const d = build();

      await d.service.listMergeEvents({});

      expect(d.mergeEventsRepo.findEvents).toHaveBeenCalledWith(
        expect.anything(),
        {},
        50,
      );
    });

    /** Un evento sin reversión no declara la clave, en vez de traerla vacía. */
    it('omite `reversalOfEventId` cuando el evento no revierte nada', async () => {
      const d = build();
      d.mergeEventsRepo.findEvents.mockResolvedValue([
        {
          id: 'e1',
          survivingPatientProfileId: 'a',
          mergedPatientProfileId: 'b',
          decisionStatusConceptId: 'st-aprobado',
          recordedAt: new Date(),
        },
      ]);

      const res = await d.service.listMergeEvents({});

      expect(res.items[0]).not.toHaveProperty('reversalOfEventId');
    });
  });

  describe('searchPatients (UC-05-13)', () => {
    /**
     * P-07-10 (2026-09-02): el padrón ya no se acota por actividad — la
     * búsqueda también sirve para registrar a quien nunca se atendió, y
     * acotar por actividad se lo impedía. Los cuatro roles del `@Roles` del
     * controlador ven el mismo padrón sin acotar.
     */
    it.each(['SECURITY_ADMIN', 'SUPERADMIN', 'PRACTITIONER', 'CLINICIAN'])(
      '%s busca el padrón sin acotar (scope unrestricted)',
      async (rol) => {
        const d = build();

        await d.service.searchPatients({ query: 'ana', limit: 50 }, {
          id: 'u-1',
          roles: [rol],
        } as any);

        expect(d.patientProfilesRepo.searchPage).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            query: 'ana',
            scope: { kind: 'unrestricted' },
          }),
          51,
        );
      },
    );

    /**
     * Sin este freno, un rol clínico sin `q` ni `nationalId` recibiría la
     * primera página del padrón entero: es enumeración, no búsqueda.
     * `SECURITY_ADMIN`/`SUPERADMIN` administran el padrón y siguen listando
     * sin criterio.
     */
    it.each(['PRACTITIONER', 'CLINICIAN'])(
      '%s sin texto ni documento: 422, no enumera el padrón',
      async (rol) => {
        const d = build();
        const actor = { id: 'u-1', roles: [rol] } as any;

        await expect(
          d.service.searchPatients({ limit: 50 }, actor),
        ).rejects.toThrow(PreconditionFailedException);
        expect(d.patientProfilesRepo.searchPage).not.toHaveBeenCalled();
      },
    );

    it.each(['PRACTITIONER', 'CLINICIAN'])(
      '%s con sólo nationalId (sin texto) sí puede buscar',
      async (rol) => {
        const d = build();
        const actor = { id: 'u-1', roles: [rol] } as any;

        await d.service.searchPatients(
          { nationalId: '1234567', limit: 50 },
          actor,
        );

        expect(d.patientProfilesRepo.searchPage).toHaveBeenCalled();
      },
    );

    it.each(['SECURITY_ADMIN', 'SUPERADMIN'])(
      '%s sin texto ni documento igual puede listar: administra el padrón',
      async (rol) => {
        const d = build();
        const actor = { id: 'u-1', roles: [rol] } as any;

        await d.service.searchPatients({ limit: 50 }, actor);

        expect(d.patientProfilesRepo.searchPage).toHaveBeenCalled();
      },
    );

    /** El documento se valida por departamento ANTES de tocar la base. */
    it('valida el departamento contra el catálogo antes de buscar', async () => {
      const d = build();
      d.administrativeAreas.assertIsAdministrativeArea.mockRejectedValueOnce(
        new PreconditionFailedException('no es un departamento', {}),
      );
      const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

      await expect(
        d.service.searchPatients(
          {
            nationalId: '1234567',
            issuerAdministrativeAreaConceptId: 'no-departamento',
            limit: 50,
          },
          actor,
        ),
      ).rejects.toThrow(PreconditionFailedException);

      expect(d.patientProfilesRepo.searchPage).not.toHaveBeenCalled();
    });

    /** Sin departamento, no hay nada que validar: la búsqueda sigue de largo. */
    it('sin departamento no llama al catálogo de departamentos', async () => {
      const d = build();
      const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

      await d.service.searchPatients(
        { nationalId: '1234567', limit: 50 },
        actor,
      );

      expect(
        d.administrativeAreas.assertIsAdministrativeArea,
      ).not.toHaveBeenCalled();
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

  describe('getOwnSummary (F-34)', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    /**
     * Deja al titular con persona y perfil de paciente resueltos, que es lo
     * único que el resumen necesita antes de mirar la verificación.
     * @returns El sistema bajo prueba con sus dobles.
     */
    function conPaciente() {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        displayName: 'Ada Lovelace',
        birthDate: new Date('1990-05-05'),
        personStatusConceptId: PROF.PERSON_ACTIVE,
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return d;
    }

    it('sin identidad verificada devuelve la filiación y NO el código de paciente', async () => {
      const d = conPaciente();
      // Sin aserción vigente para la persona.
      d.tx.findOne.mockResolvedValue(null);

      const res = await d.service.getOwnSummary(titular);

      expect(res).toMatchObject({
        personId: 'per-1',
        patientProfileId: 'pp-1',
        displayName: 'Ada Lovelace',
        identityVerified: false,
      });
      // Ausente, no `null`: el cliente distingue por `identityVerified`, no por
      // un campo vacío que parezca un dato que la persona no tiene.
      expect(res).not.toHaveProperty('patientCode');
    });

    it('con identidad verificada suma el código de paciente', async () => {
      const d = conPaciente();
      d.tx.findOne.mockResolvedValue({ id: 'assertion-1' });

      const res = await d.service.getOwnSummary(titular);

      expect(res).toMatchObject({
        identityVerified: true,
        patientCode: 'PC-1',
      });
    });

    it('pregunta por la aserción de la persona del titular, no por otra', async () => {
      const d = conPaciente();

      await d.service.getOwnSummary(titular);

      const [, filtro] = d.tx.findOne.mock.calls[0];
      expect(filtro).toMatchObject({
        subjectEntityId: 'per-1',
        revokedAt: null,
      });
    });
  });

  describe('getOwnProfile', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    /**
     * Deja al titular con persona y perfil de paciente resueltos, con las partes
     * del nombre que el alta escribió.
     * @returns El sistema bajo prueba con sus dobles.
     */
    function conPaciente() {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        name: 'Ada',
        lastName: 'Lovelace',
        displayName: 'Ada Lovelace',
        birthDate: new Date('1990-05-05'),
        sexAtBirthConceptId: PROF.BIRTH_SEX_FEMALE,
        personStatusConceptId: PROF.PERSON_ACTIVE,
      });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return d;
    }

    it('devuelve las partes del nombre y el sexo al nacer como código', async () => {
      const d = conPaciente();

      const res = await d.service.getOwnProfile(titular);

      expect(res).toMatchObject({
        personId: 'per-1',
        patientProfileId: 'pp-1',
        name: 'Ada',
        lastName: 'Lovelace',
        displayName: 'Ada Lovelace',
        // El formulario habla en códigos, no en uuid del catálogo.
        sexAtBirth: 'FEMALE',
        identityVerified: false,
      });
    });

    it('trae el teléfono vigente y el municipio del domicilio vigente', async () => {
      const d = conPaciente();
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue({
        value: '+591 700 12345',
      });
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        municipalityConceptId: 'mun-1',
      });

      const res = await d.service.getOwnProfile(titular);

      expect(res).toMatchObject({
        phone: '+591 700 12345',
        residenceMunicipalityConceptId: 'mun-1',
      });
    });

    /**
     * El perfil devuelve TODO lo que el alta capturó.
     *
     * La pantalla mostraba tres campos de quince: el documento, el correo, las
     * direcciones, los seguros y el tutor ya estaban en la base —los escribe el
     * alta— y sencillamente no volvían. Estas pruebas fijan que vuelvan, y con
     * la forma que la pantalla necesita para pintarlos sin resolver catálogos.
     */
    it('devuelve documento, departamento emisor y NIT', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([
        {
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
          value: '7678614',
          issuerAdministrativeAreaConceptId: 'depto-sc',
        },
        { typeConceptId: CONCEPTS.ID_TYPE_TAX, value: '1234567890' },
      ]);

      const res = await d.service.getOwnProfile(titular);

      expect(res).toMatchObject({
        nationalId: '7678614',
        issuerAdministrativeAreaConceptId: 'depto-sc',
        taxId: '1234567890',
      });
    });

    it('devuelve las dos direcciones, y las coordenadas viajan juntas', async () => {
      // Media coordenada no ubica nada: si falta una, no viaja ninguna.
      const d = conPaciente();
      d.addressesRepo.findVigenteByOwnerAndUse
        .mockResolvedValueOnce({
          lines: 'Av. Banzer #1234',
          city: 'Santa Cruz',
          municipalityConceptId: 'mun-1',
          latitude: -17.7695,
          longitude: -63.1854,
        })
        .mockResolvedValueOnce({ lines: 'Calle Warnes #45', latitude: -17.78 });

      const res = await d.service.getOwnProfile(titular);

      expect(res.homeAddress).toMatchObject({
        lines: 'Av. Banzer #1234',
        latitude: -17.7695,
        longitude: -63.1854,
      });
      expect(res.workAddress).toMatchObject({ lines: 'Calle Warnes #45' });
      expect(res.workAddress?.latitude).toBeUndefined();
    });

    it('los seguros vuelven con la aseguradora y el plan EN PALABRAS', async () => {
      // Sin esto la pantalla tendría que resolver dos catálogos más para
      // pintar una línea de texto.
      const d = conPaciente();
      d.tx.getConnection.mockReturnValue({
        execute: mockFn().mockResolvedValue([
          {
            carrier_id: 'car-1',
            carrier_name: 'Alianza Vida Seguros',
            plan_name: 'AFI Gold',
            member_identifier: '7678614',
            verification_status_concept_id: null,
          },
        ]),
      });

      const res = await d.service.getOwnProfile(titular);

      expect(res.coverages).toHaveLength(1);
      expect(res.coverages[0]).toMatchObject({
        carrierName: 'Alianza Vida Seguros',
        planName: 'AFI Gold',
        // Lo declarado al registrarse nace SIN verificar.
        verified: false,
      });
    });

    it('sin nada declarado, las listas llegan vacías y no ausentes', async () => {
      // Quien las pinta distingue «no declaró ninguna» de «esta respuesta no
      // las trae»; por eso viajan siempre.
      const d = conPaciente();

      const res = await d.service.getOwnProfile(titular);

      expect(res.coverages).toEqual([]);
      expect(res.guardians).toEqual([]);
    });

    it('lo que la persona no declaró llega ausente, no null', async () => {
      const d = conPaciente();
      // El ORM hidrata una columna NULL como `null`, y el contrato promete que un
      // dato no declarado no viaja: `null` se leería como «campo vaciado».
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        name: 'Ada',
        middleName: null,
        motherLastName: null,
        occupationConceptId: null,
        occupationFreeText: null,
        sexAtBirthConceptId: null,
        personStatusConceptId: PROF.PERSON_ACTIVE,
      });

      const res = await d.service.getOwnProfile(titular);

      expect(res).not.toHaveProperty('middleName');
      expect(res).not.toHaveProperty('motherLastName');
      expect(res).not.toHaveProperty('occupationConceptId');
      expect(res).not.toHaveProperty('occupationFreeText');
      expect(res).not.toHaveProperty('sexAtBirth');
      expect(res).not.toHaveProperty('phone');
      expect(res).not.toHaveProperty('residenceMunicipalityConceptId');
    });

    it('devuelve la ocupación del catálogo de quien la eligió del desplegable', async () => {
      const d = conPaciente();
      d.personsRepo.findById.mockResolvedValue({
        id: 'per-1',
        name: 'Ada',
        personStatusConceptId: PROF.PERSON_ACTIVE,
        occupationConceptId: BO_OCCUPATION_CONCEPT_ID,
      });

      const res = await d.service.getOwnProfile(titular);

      // Sin esto, quien se registró eligiendo del catálogo abría el formulario de
      // edición con la ocupación vacía: el perfil sólo sabía leer el texto libre.
      expect(res.occupationConceptId).toBe(BO_OCCUPATION_CONCEPT_ID);
      expect(res).not.toHaveProperty('occupationFreeText');
    });

    it('sin identidad verificada no viaja el código de paciente', async () => {
      const d = conPaciente();
      d.tx.findOne.mockResolvedValue(null);

      const res = await d.service.getOwnProfile(titular);

      expect(res.identityVerified).toBe(false);
      expect(res).not.toHaveProperty('patientCode');
    });

    it('con identidad verificada suma el código de paciente', async () => {
      const d = conPaciente();
      d.tx.findOne.mockResolvedValue({ id: 'assertion-1' });

      const res = await d.service.getOwnProfile(titular);

      expect(res).toMatchObject({
        identityVerified: true,
        patientCode: 'PC-1',
      });
    });

    it('sin vínculo activo de cuenta falla con el error tipificado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(d.service.getOwnProfile(titular)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('setOwnPhoto / removeOwnPhoto (foto de perfil de la persona)', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    /**
     * Deja al titular con persona y perfil de paciente resueltos, igual que
     * `conPaciente()` de `getOwnProfile`.
     * @param d - El sistema bajo prueba.
     * @returns La persona resuelta, para que la prueba lea/asigne sobre ella.
     */
    function conPaciente(d: ReturnType<typeof build>) {
      const person: any = {
        id: 'per-1',
        name: 'Ada',
        lastName: 'Lovelace',
        displayName: 'Ada Lovelace',
      };
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue(person);
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return person;
    }

    it('escribe photo_file_id y lo devuelve en el perfil releído', async () => {
      const d = build();
      const person = conPaciente(d);

      const perfil = await d.service.setOwnPhoto({ fileId: 'file-1' }, titular);

      expect(person.photoFileId).toBe('file-1');
      expect(perfil.photoFileId).toBe('file-1');
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('sin vínculo activo de cuenta falla con el error tipificado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.setOwnPhoto({ fileId: 'file-1' }, titular),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no acepta el archivo de otra persona', async () => {
      const d = build();
      conPaciente(d);
      d.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'otro-usuario',
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });

      await expect(
        d.service.setOwnPhoto({ fileId: 'file-1' }, titular),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('no acepta un archivo que no existe', async () => {
      const d = build();
      conPaciente(d);
      d.filesRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.setOwnPhoto({ fileId: 'fantasma' }, titular),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no acepta un archivo que no es imagen', async () => {
      const d = build();
      conPaciente(d);
      d.fileVersionsRepo.findById.mockResolvedValue({
        id: 'v1',
        mimeType: 'application/pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      });

      await expect(
        d.service.setOwnPhoto({ fileId: 'file-1' }, titular),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('quitar la foto deja la referencia en nulo sin tocar el archivo', async () => {
      const d = build();
      const person = conPaciente(d);
      person.photoFileId = 'file-1';

      const perfil = await d.service.removeOwnPhoto(titular);

      expect(person.photoFileId).toBeUndefined();
      expect(perfil.photoFileId).toBeUndefined();
      expect(d.filesRepo.findById).not.toHaveBeenCalled();
    });

    it('quitar la foto de un perfil que no la tiene no falla', async () => {
      const d = build();
      conPaciente(d);

      await expect(d.service.removeOwnPhoto(titular)).resolves.toBeDefined();
    });

    it('quitar la foto sin vínculo activo falla con el error tipificado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(d.service.removeOwnPhoto(titular)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('updateOwnProfile', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    /**
     * Deja al titular resuelto y devuelve además la persona mutable, que es
     * sobre la que la edición escribe.
     * @returns El sistema bajo prueba, sus dobles y la persona.
     */
    function conPaciente() {
      const d = build();
      const person = {
        id: 'per-1',
        name: 'Ada',
        lastName: 'Lovelace',
        displayName: 'Ada Lovelace',
        occupationFreeText: 'Matemática',
        birthDate: new Date('1990-05-05'),
        sexAtBirthConceptId: PROF.BIRTH_SEX_FEMALE,
        personStatusConceptId: PROF.PERSON_ACTIVE,
        updatedAt: new Date('2026-01-01'),
      } as any;
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue(person);
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return { ...d, person };
    }

    it('sólo aplica los campos presentes: lo omitido no se toca', async () => {
      const d = conPaciente();

      await d.service.updateOwnProfile(
        { occupationFreeText: 'Programadora' },
        titular,
      );

      expect(d.person.occupationFreeText).toBe('Programadora');
      // Ni el nombre ni el nacimiento venían en el cuerpo.
      expect(d.person.name).toBe('Ada');
      expect(d.person.birthDate).toEqual(new Date('1990-05-05'));
      expect(d.person.updatedByUserId).toBe('user-1');
    });

    it('un cuerpo vacío no cambia nada y devuelve el perfil', async () => {
      const d = conPaciente();

      const res = await d.service.updateOwnProfile({}, titular);

      expect(res).toMatchObject({ personId: 'per-1', name: 'Ada' });
      expect(d.person.displayName).toBe('Ada Lovelace');
      expect(d.contactPointsRepo.create).not.toHaveBeenCalled();
      expect(d.addressesRepo.create).not.toHaveBeenCalled();
    });

    it('un cuerpo vacío no toca la auditoría de la persona', async () => {
      const d = conPaciente();
      const antes = d.person.updatedAt;

      const res = await d.service.updateOwnProfile({}, titular);

      // «Sin cambios» incluye la fila: mover `updated_at`, `updated_by_user_id` y
      // `row_version` sin haber escrito una sola columna convierte la auditoría
      // en ruido y hace fallar por conflicto de versión a quien la tuviera leída.
      expect(d.person.updatedAt).toBe(antes);
      expect(d.person.updatedByUserId).toBeUndefined();
      // Y sigue devolviendo el perfil, que es lo que el contrato promete.
      expect(res).toMatchObject({ personId: 'per-1', name: 'Ada' });
    });

    it('un PATCH que sólo trae el teléfono no toca la persona', async () => {
      const d = conPaciente();
      const antes = d.person.updatedAt;

      await d.service.updateOwnProfile({ phone: '+591 700 12345' }, titular);

      // El teléfono no vive en `profiles.persons`, y su propia fila ya nace con
      // su auditoría: marcar la persona diría que cambió algo suyo que no cambió.
      expect(d.person.updatedAt).toBe(antes);
      expect(d.person.updatedByUserId).toBeUndefined();
      expect(d.contactPointsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('al cambiar una parte del nombre recompone el nombre visible', async () => {
      const d = conPaciente();

      await d.service.updateOwnProfile(
        { lastName: 'Byron', motherLastName: 'King' },
        titular,
      );

      // La misma regla del alta: las partes presentes, en el orden en que se
      // dicen. `displayName` es derivado, no editable.
      expect(d.person.displayName).toBe('Ada Byron King');
    });

    it('vaciar el segundo nombre lo guarda en NULL, no como cadena vacía', async () => {
      const d = conPaciente();
      d.person.middleName = 'Augusta';

      await d.service.updateOwnProfile({ middleName: '' }, titular);

      // La columna es nullable: `''` sería un dato vacío indistinguible de uno
      // real, y la lectura lo devolvería como `""` en vez de omitirlo.
      expect(d.person.middleName).toBeUndefined();
      // Y el nombre visible se recompone sin el doble espacio que dejaría el hueco.
      expect(d.person.displayName).toBe('Ada Lovelace');
    });

    it('vaciar el apellido materno y la ocupación los deja en NULL', async () => {
      const d = conPaciente();
      d.person.motherLastName = 'Byron';

      await d.service.updateOwnProfile(
        // Sólo espacios es lo mismo que vacío: nadie declara un apellido de
        // espacios, y guardarlo dejaría un dato que no se ve pero ocupa.
        { motherLastName: '   ', occupationFreeText: '' },
        titular,
      );

      expect(d.person.motherLastName).toBeUndefined();
      expect(d.person.occupationFreeText).toBeUndefined();
    });

    it('vaciar el teléfono cierra el vigente y no crea ninguno', async () => {
      const d = conPaciente();
      const vigente = { id: 'cp-1', value: '+591 700 12345' };
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue(
        vigente,
      );

      await d.service.updateOwnProfile({ phone: '' }, titular);

      // Quedarse sin teléfono es un dato; una fila con el valor vacío lo
      // contaría como si todavía tuviera uno.
      expect(d.contactPointsRepo.closeVigente).toHaveBeenCalledWith(
        vigente,
        expect.any(Date),
        'user-1',
      );
      expect(d.contactPointsRepo.create).not.toHaveBeenCalled();
    });

    it('vaciar el teléfono sin tener ninguno no escribe nada', async () => {
      const d = conPaciente();
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue(null);

      await d.service.updateOwnProfile({ phone: '' }, titular);

      expect(d.contactPointsRepo.closeVigente).not.toHaveBeenCalled();
      expect(d.contactPointsRepo.create).not.toHaveBeenCalled();
    });

    it('traduce el sexo al nacer al concepto que persiste la columna', async () => {
      const d = conPaciente();

      await d.service.updateOwnProfile({ sexAtBirth: 'MALE' }, titular);

      expect(d.person.sexAtBirthConceptId).toBe(PROF.BIRTH_SEX_MALE);
    });

    it('al cambiar el teléfono cierra el vigente y crea el nuevo', async () => {
      const d = conPaciente();
      const vigente = { id: 'cp-1', value: '+591 700 00000' };
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue(
        vigente,
      );

      await d.service.updateOwnProfile({ phone: '+591 700 12345' }, titular);

      expect(d.contactPointsRepo.closeVigente).toHaveBeenCalledWith(
        vigente,
        expect.any(Date),
        'user-1',
      );
      expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ value: '+591 700 12345' }),
      );
    });

    it('el mismo teléfono no cierra nada ni crea una fila', async () => {
      const d = conPaciente();
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue({
        id: 'cp-1',
        value: '+591 700 12345',
      });

      await d.service.updateOwnProfile({ phone: '+591 700 12345' }, titular);

      expect(d.contactPointsRepo.closeVigente).not.toHaveBeenCalled();
      expect(d.contactPointsRepo.create).not.toHaveBeenCalled();
    });

    it('sin teléfono vigente crea el primero sin cerrar nada', async () => {
      const d = conPaciente();
      d.contactPointsRepo.findVigenteByOwnerAndSystem.mockResolvedValue(null);

      await d.service.updateOwnProfile({ phone: '+591 700 12345' }, titular);

      expect(d.contactPointsRepo.closeVigente).not.toHaveBeenCalled();
      expect(d.contactPointsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('al cambiar el municipio cierra el domicilio vigente y crea el nuevo', async () => {
      const d = conPaciente();
      const vigente = { id: 'ad-1', municipalityConceptId: 'mun-vieja' };
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue(vigente);

      await d.service.updateOwnProfile(
        { residenceMunicipalityConceptId: BO_MUNICIPALITY_CONCEPT_ID },
        titular,
      );

      expect(d.addressesRepo.closeVigente).toHaveBeenCalledWith(
        vigente,
        expect.any(Date),
        'user-1',
      );
      // La dirección la arma el ayudante compartido, que además deriva el
      // departamento del código del INE: acá se comprueba que se escribió una.
      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerId: 'per-1',
          municipalityConceptId: BO_MUNICIPALITY_CONCEPT_ID,
        }),
      );
    });

    it('el mismo municipio no cierra el domicilio ni crea otro', async () => {
      const d = conPaciente();
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        id: 'ad-1',
        municipalityConceptId: BO_MUNICIPALITY_CONCEPT_ID,
      });

      await d.service.updateOwnProfile(
        { residenceMunicipalityConceptId: BO_MUNICIPALITY_CONCEPT_ID },
        titular,
      );

      expect(d.addressesRepo.closeVigente).not.toHaveBeenCalled();
      expect(d.addressesRepo.create).not.toHaveBeenCalled();
    });

    /**
     * La ocupación se declara de dos formas —el concepto del catálogo y el texto
     * libre— que no pueden convivir: la persona tiene una sola. Estas seis
     * pruebas fijan los seis cuerpos posibles, porque la regla no se puede leer
     * de un campo aislado: cuál gana depende de qué más vino en el mismo `PATCH`.
     */
    describe('ocupación', () => {
      it('elegir una del catálogo borra el texto libre que hubiera', async () => {
        const d = conPaciente();

        await d.service.updateOwnProfile(
          { occupationConceptId: BO_OCCUPATION_CONCEPT_ID },
          titular,
        );

        expect(d.person.occupationConceptId).toBe(BO_OCCUPATION_CONCEPT_ID);
        // Escribir la ocupación a mano era la salida para lo que no está en la
        // lista: encontrada la suya, ese texto ya no describe nada.
        expect(d.person.occupationFreeText).toBeUndefined();
      });

      it('vaciar la del catálogo la deja en NULL y no toca el texto libre', async () => {
        const d = conPaciente();
        d.person.occupationConceptId = BO_OCCUPATION_CONCEPT_ID;

        await d.service.updateOwnProfile({ occupationConceptId: '' }, titular);

        expect(d.person.occupationConceptId).toBeUndefined();
        // Quitar una de las dos formas es dejar de declararla, no negar la otra.
        expect(d.person.occupationFreeText).toBe('Matemática');
      });

      it('declararla en texto libre borra la del catálogo', async () => {
        const d = conPaciente();
        d.person.occupationConceptId = BO_OCCUPATION_CONCEPT_ID;

        await d.service.updateOwnProfile(
          { occupationFreeText: 'Docente' },
          titular,
        );

        expect(d.person.occupationFreeText).toBe('Docente');
        // Escribirla a mano es decir que no está en la lista.
        expect(d.person.occupationConceptId).toBeUndefined();
      });

      it('vaciar el texto libre no borra la del catálogo', async () => {
        const d = conPaciente();
        d.person.occupationConceptId = BO_OCCUPATION_CONCEPT_ID;

        await d.service.updateOwnProfile({ occupationFreeText: '' }, titular);

        expect(d.person.occupationFreeText).toBeUndefined();
        // Un texto vacío no es una ocupación nueva: no hay nada que desplace al
        // concepto, y borrarlo dejaría a la persona sin ninguna de las dos.
        expect(d.person.occupationConceptId).toBe(BO_OCCUPATION_CONCEPT_ID);
      });

      it('con las dos en el mismo cuerpo gana el catálogo', async () => {
        const d = conPaciente();

        await d.service.updateOwnProfile(
          {
            occupationConceptId: BO_OCCUPATION_CONCEPT_ID,
            occupationFreeText: 'Docente',
          },
          titular,
        );

        // La misma regla del alta: guardar las dos diría que tiene dos
        // ocupaciones y obligaría a la lectura a elegir una por su cuenta.
        expect(d.person.occupationConceptId).toBe(BO_OCCUPATION_CONCEPT_ID);
        expect(d.person.occupationFreeText).toBeUndefined();
      });

      it('vaciar la del catálogo y declarar texto en el mismo cuerpo deja el texto', async () => {
        const d = conPaciente();
        d.person.occupationConceptId = BO_OCCUPATION_CONCEPT_ID;

        await d.service.updateOwnProfile(
          { occupationConceptId: '', occupationFreeText: 'Docente' },
          titular,
        );

        // Es el cuerpo de quien no encontró la suya en la lista y la escribe:
        // el catálogo sólo gana cuando trae un concepto, no cuando lo quita.
        expect(d.person.occupationConceptId).toBeUndefined();
        expect(d.person.occupationFreeText).toBe('Docente');
      });

      it('un PATCH que sólo trae la del catálogo marca la fila como modificada', async () => {
        const d = conPaciente();
        const antes = d.person.updatedAt;

        await d.service.updateOwnProfile(
          { occupationConceptId: BO_OCCUPATION_CONCEPT_ID },
          titular,
        );

        // La ocupación vive en `profiles.persons`: escribirla es cambiar la fila,
        // y la auditoría tiene que decirlo igual que con el resto de sus campos.
        expect(d.person.updatedByUserId).toBe('user-1');
        expect(d.person.updatedAt).not.toBe(antes);
      });
    });

    it('sin vínculo activo de cuenta falla con el error tipificado', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

      await expect(
        d.service.updateOwnProfile({ name: 'Ada' }, titular),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });
  /**
   * **Los tres datos que se veían y no se podían corregir.**
   *
   * El NIT, el domicilio y la dirección de trabajo se declaraban al registrarse
   * y después el editor no los ofrecía: la ficha mostraba el valor viejo y no
   * había forma de cambiarlo. Es la peor combinación de las dos.
   */
  describe('updateOwnProfile · NIT y direcciones', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    function conPaciente() {
      const d = build();
      const person = { id: 'per-1', name: 'Ada', lastName: 'Lovelace' } as any;
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue(person);
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return { ...d, person };
    }

    /**
     * El registro pide «Nombre o Razón social» Y «Número de NIT» (§1.15). Sólo
     * existía el número: la ficha mostraba un NIT sin decir de quién era.
     */
    it('la razón social se guarda junto al NIT', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([]);

      await d.service.updateOwnProfile(
        { taxId: '1234567', taxHolderName: 'Comercial Rojas S.R.L.' } as any,
        titular,
      );

      const [, data] = d.identifiersRepo.create.mock.calls[0];
      expect(data.value).toBe('1234567');
      expect(data.holderName).toBe('Comercial Rojas S.R.L.');
    });

    /**
     * Son el mismo hecho, y editar uno no puede borrar el otro: si sólo llega la
     * razón social, el número se conserva de la fila vigente.
     */
    it('cambiar sólo la razón social conserva el número', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([
        {
          typeConceptId: CONCEPTS.ID_TYPE_TAX,
          value: '999',
          holderName: 'Viejo',
          validTo: null,
        },
      ] as any);

      await d.service.updateOwnProfile(
        { taxHolderName: 'Nuevo Titular S.A.' } as any,
        titular,
      );

      const [, data] = d.identifiersRepo.create.mock.calls[0];
      expect(data.value).toBe('999');
      expect(data.holderName).toBe('Nuevo Titular S.A.');
    });

    /** Y al revés: cambiar el número no pierde a nombre de quién factura. */
    it('cambiar sólo el número conserva la razón social', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([
        {
          typeConceptId: CONCEPTS.ID_TYPE_TAX,
          value: '999',
          holderName: 'Comercial Rojas',
          validTo: null,
        },
      ] as any);

      await d.service.updateOwnProfile({ taxId: '888' } as any, titular);

      const [, data] = d.identifiersRepo.create.mock.calls[0];
      expect(data.value).toBe('888');
      expect(data.holderName).toBe('Comercial Rojas');
    });

    /** Una razón social sola no es un NIT: no se abre una fila fiscal sin valor. */
    it('sin número no se abre identificador, aunque venga la razón social', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([]);

      await d.service.updateOwnProfile(
        { taxHolderName: 'Comercial Sin NIT' } as any,
        titular,
      );

      expect(d.identifiersRepo.create).not.toHaveBeenCalled();
    });

    it('cargar el NIT abre un identificador fiscal', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([]);

      await d.service.updateOwnProfile({ taxId: '1234567' } as any, titular);

      const [, data] = d.identifiersRepo.create.mock.calls[0];
      expect(data.value).toBe('1234567');
      expect(data.typeConceptId).toBe(CONCEPTS.ID_TYPE_TAX);
    });

    /**
     * No se sobrescribe el valor: la tabla lleva `valid_to` y una factura
     * emitida con el NIT anterior tiene que seguir explicándose.
     */
    it('cambiarlo cierra el anterior en vez de pisarlo', async () => {
      const d = conPaciente();
      const anterior = {
        typeConceptId: CONCEPTS.ID_TYPE_TAX,
        value: '111',
        validTo: null,
      } as any;
      d.tx.find.mockResolvedValue([anterior]);

      await d.service.updateOwnProfile({ taxId: '222' } as any, titular);

      expect(anterior.validTo).toBeInstanceOf(Date);
    });

    it('vaciarlo cierra el anterior y no abre otro', async () => {
      const d = conPaciente();
      const anterior = {
        typeConceptId: CONCEPTS.ID_TYPE_TAX,
        value: '111',
        validTo: null,
      } as any;
      d.tx.find.mockResolvedValue([anterior]);
      await d.service.updateOwnProfile({ taxId: '' } as any, titular);

      expect(anterior.validTo).toBeInstanceOf(Date);
      expect(d.identifiersRepo.create).not.toHaveBeenCalled();
    });

    /**
     * Cambiar la calle no es cambiar de municipio ni perder las coordenadas: si
     * se perdieran, el «Ver en el mapa» de la ficha quedaría mudo.
     */
    it('mudarse conserva el municipio y las coordenadas', async () => {
      const d = conPaciente();
      const sacaba = boMunicipalityConceptId('031001');
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Calle vieja 1',
        municipalityConceptId: sacaba,
        latitude: '-17.78',
        longitude: '-63.18',
        countryConceptId: 'bo',
      });

      await d.service.updateOwnProfile(
        { homeAddressLines: 'Av. Nueva 200' } as any,
        titular,
      );

      const [, data] = d.addressesRepo.create.mock.calls[0];
      expect(data.lines).toBe('Av. Nueva 200');
      expect(data.municipalityConceptId).toBe(sacaba);
      expect(data.latitude).toBe('-17.78');
      expect(d.addressesRepo.closeVigente).toHaveBeenCalled();
    });

    it('el mismo texto no abre una dirección nueva', async () => {
      const d = conPaciente();
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Av. Nueva 200',
      });

      await d.service.updateOwnProfile(
        { homeAddressLines: 'Av. Nueva 200' } as any,
        titular,
      );

      expect(d.addressesRepo.create).not.toHaveBeenCalled();
    });

    /** El mismo defecto que el perfil del profesional tenía, y que vivía acá también. */
    /**
     * `reemplazarDireccion` funde el cuerpo con la fila vigente en vez de
     * exigir el par completo — el defecto que tenían por separado
     * `reemplazarDomicilio` (perdía calle y GPS al cambiar el municipio) y
     * `reemplazarTextoDeDireccion`. Las cuatro pruebas de acá fijan la fusión;
     * la de más abajo fija además el `CONCEPTS.COUNTRY_BOLIVIA` que no existía.
     */
    it('cambiar sólo el municipio conserva la calle y el GPS', async () => {
      const d = conPaciente();
      const sacaba = boMunicipalityConceptId('031001');
      const trinidad = boMunicipalityConceptId('030301');
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Av. Blanco Galindo km 5',
        municipalityConceptId: sacaba,
        latitude: '-17.40',
        longitude: '-66.03',
        countryConceptId: CONCEPTS.COUNTRY_BO,
      });

      await d.service.updateOwnProfile(
        { residenceMunicipalityConceptId: trinidad } as any,
        titular,
      );

      const [, data] = d.addressesRepo.create.mock.calls[0];
      expect(data.municipalityConceptId).toBe(trinidad);
      expect(data.lines).toBe('Av. Blanco Galindo km 5');
      expect(data.latitude).toBe('-17.4');
      expect(data.longitude).toBe('-66.03');
      expect(d.addressesRepo.closeVigente).toHaveBeenCalled();
    });

    it('cambiar sólo el GPS conserva la calle y el municipio', async () => {
      const d = conPaciente();
      const sacaba = boMunicipalityConceptId('031001');
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Av. Blanco Galindo km 5',
        municipalityConceptId: sacaba,
        latitude: '-17.40',
        longitude: '-66.03',
        countryConceptId: CONCEPTS.COUNTRY_BO,
      });

      await d.service.updateOwnProfile(
        { homeLatitude: -17.41, homeLongitude: -66.05 } as any,
        titular,
      );

      const [, data] = d.addressesRepo.create.mock.calls[0];
      expect(data.municipalityConceptId).toBe(sacaba);
      expect(data.lines).toBe('Av. Blanco Galindo km 5');
      expect(data.latitude).toBe('-17.41');
      expect(data.longitude).toBe('-66.05');
    });

    it('los mismos tres valores no cierran ni abren ninguna fila', async () => {
      const d = conPaciente();
      const sacaba = boMunicipalityConceptId('031001');
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Av. Blanco Galindo km 5',
        municipalityConceptId: sacaba,
        latitude: '-17.40',
        longitude: '-66.03',
        countryConceptId: CONCEPTS.COUNTRY_BO,
      });

      await d.service.updateOwnProfile(
        {
          residenceMunicipalityConceptId: sacaba,
          homeAddressLines: 'Av. Blanco Galindo km 5',
          homeLatitude: -17.4,
          homeLongitude: -66.03,
        } as any,
        titular,
      );

      expect(d.addressesRepo.closeVigente).not.toHaveBeenCalled();
      expect(d.addressesRepo.create).not.toHaveBeenCalled();
    });

    /**
     * El defecto real: `reemplazarTextoDeDireccion` escribía
     * `CONCEPTS.COUNTRY_BOLIVIA`, que no existe en `CONCEPT_DEFS` (la
     * constante es `COUNTRY_BO`). Como `CONCEPT_DEFS` está tipado
     * `Record<string, ConceptDef>`, TypeScript no lo marcaba, y en runtime la
     * fila se habría escrito con `country_concept_id: undefined` — columna
     * no-nulable — para cualquiera que declarara la dirección de trabajo por
     * primera vez desde el editor de perfil. Este caso, sin dirección de
     * trabajo previa, no estaba cubierto por ningún spec.
     */
    it('sin dirección de trabajo previa, el país es el de Bolivia', async () => {
      const d = conPaciente();
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue(null);

      await d.service.updateOwnProfile(
        { workAddressLines: 'Av. América esq. Beijing' } as any,
        titular,
      );

      const [, data] = d.addressesRepo.create.mock.calls[0];
      expect(data.countryConceptId).toBe(CONCEPTS.COUNTRY_BO);
      expect(data.lines).toBe('Av. América esq. Beijing');
    });

    /** El mismo defecto que el perfil del profesional tenía, y que vivía acá también. */
    it('borrar la fecha de nacimiento la deja sin valor, no en 1970', async () => {
      const d = conPaciente();
      d.person.birthDate = new Date(1990, 4, 5);

      await d.service.updateOwnProfile({ birthDate: null } as any, titular);

      expect(d.person.birthDate).toBeUndefined();
    });
  });

  /**
   * **Lo que quedaba fuera del `PATCH` y ya tiene dónde ir en el alta.**
   *
   * Trabajo (municipio + calle + GPS fundidos, igual que el domicilio),
   * empresa (misma regla de las dos formas que la ocupación), el departamento
   * de emisión del documento, el tutor declarado y el seguro declarado —los
   * dos últimos con las limitaciones que documenta el DTO: ninguno tiene hoy
   * un estado de baja en el modelo, así que no hay «reemplazo» ni «quitar»,
   * sólo declarar o corregir.
   */
  describe('updateOwnProfile · trabajo, empresa, expedición, tutor y seguro', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    function conPaciente() {
      const d = build();
      const person = {
        id: 'per-1',
        name: 'Ada',
        lastName: 'Lovelace',
        workEmployerFreeText: undefined,
        workEmployerConceptId: undefined,
      } as any;
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue(person);
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return { ...d, person };
    }

    /* ---- trabajo: municipio + calle + GPS fundidos, igual que el domicilio */

    it('el municipio de trabajo se guarda como una dirección de uso WORK', async () => {
      const d = conPaciente();
      const trinidad = boMunicipalityConceptId('030301');
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue(null);

      await d.service.updateOwnProfile(
        { workMunicipalityConceptId: trinidad } as any,
        titular,
      );

      expect(d.addressesRepo.findVigenteByOwnerAndUse).toHaveBeenCalledWith(
        d.tx,
        'per-1',
        CONCEPTS.ADDR_USE_WORK,
      );
      const [, data] = d.addressesRepo.create.mock.calls[0];
      expect(data.useConceptId).toBe(CONCEPTS.ADDR_USE_WORK);
      expect(data.municipalityConceptId).toBe(trinidad);
    });

    /* ---- empresa: misma matriz de reglas que la ocupación ------------------ */

    it('elegir una empresa del catálogo borra el texto libre que hubiera', async () => {
      const d = conPaciente();
      d.person.workEmployerFreeText = 'Kiosco de la esquina';
      const empresa = boEmployerConceptId('BANCO_UNION');

      await d.service.updateOwnProfile(
        { workEmployerConceptId: empresa } as any,
        titular,
      );

      expect(d.person.workEmployerConceptId).toBe(empresa);
      expect(d.person.workEmployerFreeText).toBeUndefined();
    });

    it('vaciar la del catálogo la deja en NULL y no toca el texto libre', async () => {
      const d = conPaciente();
      d.person.workEmployerConceptId = boEmployerConceptId('BANCO_UNION');
      d.person.workEmployerFreeText = 'Kiosco de la esquina';

      await d.service.updateOwnProfile(
        { workEmployerConceptId: '' } as any,
        titular,
      );

      expect(d.person.workEmployerConceptId).toBeUndefined();
      expect(d.person.workEmployerFreeText).toBe('Kiosco de la esquina');
    });

    it('declararla en texto libre borra la del catálogo', async () => {
      const d = conPaciente();
      d.person.workEmployerConceptId = boEmployerConceptId('BANCO_UNION');

      await d.service.updateOwnProfile(
        { workEmployerFreeText: 'Kiosco de la esquina' } as any,
        titular,
      );

      expect(d.person.workEmployerFreeText).toBe('Kiosco de la esquina');
      expect(d.person.workEmployerConceptId).toBeUndefined();
    });

    it('con las dos en el mismo cuerpo gana el catálogo', async () => {
      const d = conPaciente();
      const empresa = boEmployerConceptId('BANCO_UNION');

      await d.service.updateOwnProfile(
        {
          workEmployerConceptId: empresa,
          workEmployerFreeText: 'Kiosco de la esquina',
        } as any,
        titular,
      );

      expect(d.person.workEmployerConceptId).toBe(empresa);
      expect(d.person.workEmployerFreeText).toBeUndefined();
    });

    /* ---- expedición del documento: edita en el lugar, no cierra y reabre --- */

    it('corrige el departamento de emisión sin tocar el número del documento', async () => {
      const d = conPaciente();
      const documento = {
        typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        value: '4821993',
        issuerAdministrativeAreaConceptId: 'dep-lp',
        validTo: null,
      } as any;
      d.tx.find.mockResolvedValue([documento]);

      await d.service.updateOwnProfile(
        { issuerAdministrativeAreaConceptId: 'dep-sc' } as any,
        titular,
      );

      expect(documento.issuerAdministrativeAreaConceptId).toBe('dep-sc');
      expect(documento.value).toBe('4821993');
      expect(documento.validTo).toBeNull();
      expect(d.identifiersRepo.create).not.toHaveBeenCalled();
    });

    it('sin documento vigente no hace nada: no hay a qué departamento atarlo', async () => {
      const d = conPaciente();
      d.tx.find.mockResolvedValue([]);

      await d.service.updateOwnProfile(
        { issuerAdministrativeAreaConceptId: 'dep-sc' } as any,
        titular,
      );

      expect(d.identifiersRepo.create).not.toHaveBeenCalled();
    });

    /* ---- tutor: declara si no hay, corrige en el lugar si ya había -------- */

    it('sin tutor declarado, lo crea con el mismo helper del alta', async () => {
      const d = conPaciente();
      d.relatedPersonsRepo.findActiveDeclaredGuardian.mockResolvedValue(null);
      d.personsRepo.create.mockReturnValue({ id: 'guardian-1' });

      await d.service.updateOwnProfile(
        {
          guardianName: 'María Paz',
          guardianPhone: '+591 70011111',
        } as any,
        titular,
      );

      expect(d.relatedPersonsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pp-1',
          personId: 'guardian-1',
          isEmergencyContact: true,
          isLegalGuardian: false,
        }),
      );
      expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
          ownerId: 'guardian-1',
          value: '+591 70011111',
        }),
      );
    });

    it('con un tutor ya declarado, corrige su nombre en el lugar', async () => {
      const d = conPaciente();
      const guardianPerson = {
        id: 'guardian-1',
        displayName: 'María Paz',
      } as any;
      d.relatedPersonsRepo.findActiveDeclaredGuardian.mockResolvedValue({
        personId: 'guardian-1',
        relationshipConceptId: 'rel-madre',
      } as any);
      // El primer `findById` resuelve al titular; el segundo, al tutor.
      d.personsRepo.findById
        .mockResolvedValueOnce(d.person)
        .mockResolvedValueOnce(guardianPerson);

      await d.service.updateOwnProfile(
        { guardianName: 'María Paz Quispe' } as any,
        titular,
      );

      expect(guardianPerson.displayName).toBe('María Paz Quispe');
      // No se crea una segunda fila: se corrige la que ya existía.
      expect(d.relatedPersonsRepo.create).not.toHaveBeenCalled();
    });

    it('con un tutor ya declarado, corrige el parentesco sin tocar el nombre', async () => {
      const d = conPaciente();
      const declarado = {
        personId: 'guardian-1',
        relationshipConceptId: 'rel-madre',
      } as any;
      d.relatedPersonsRepo.findActiveDeclaredGuardian.mockResolvedValue(
        declarado,
      );

      await d.service.updateOwnProfile(
        { guardianRelationshipConceptId: 'rel-abuela' } as any,
        titular,
      );

      expect(declarado.relationshipConceptId).toBe('rel-abuela');
      // `findById` se llama para resolver al titular y de nuevo al releer el
      // perfil al final, pero nunca con el id del tutor: sin `guardianName` en
      // el cuerpo no hay por qué corregirle el nombre.
      expect(d.personsRepo.findById).not.toHaveBeenCalledWith(
        d.tx,
        'guardian-1',
      );
    });

    /* ---- seguro declarado: agrega si no había, no reemplaza si ya había --- */

    it('declara el seguro privado si el paciente no tenía ninguno de ese sector', async () => {
      const d = conPaciente();
      const plan = carrierPlanId(
        'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
        'RED_MAX',
      );
      d.coverageRepo.findActiveByPatientAndOrder.mockResolvedValue(null);
      d.coverageRepo.findByMemberAndPlan.mockResolvedValue(null);
      d.insuranceCatalogRepo.findPlan.mockResolvedValue({
        id: 'plan-1',
        statusConceptId: INS.PLAN_ACTIVE,
      });
      d.tx.find.mockResolvedValue([
        { typeConceptId: CONCEPTS.ID_TYPE_NATIONAL, value: '4821993' },
      ]);

      await d.service.updateOwnProfile(
        { privateInsurancePlanId: plan } as any,
        titular,
      );

      expect(d.coverageRepo.createCoverage).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pp-1',
          insurancePlanId: plan,
          coverageOrder: 1,
          memberIdentifier: '4821993',
          verificationStatusConceptId: INS.VERIFY_PENDING,
        }),
      );
    });

    it('el seguro público usa el orden 2, y no se toca si ya había uno declarado', async () => {
      const d = conPaciente();
      const plan = carrierPlanId(BOLIVIA_PUBLIC_INSURERS[0].code, 'BASE');
      d.coverageRepo.findActiveByPatientAndOrder.mockResolvedValue({
        id: 'cov-existente',
      } as any);

      await d.service.updateOwnProfile(
        { publicInsurancePlanId: plan } as any,
        titular,
      );

      expect(d.coverageRepo.createCoverage).not.toHaveBeenCalled();
    });

    it('sin documento vigente, no declara el seguro: no hay número de afiliado', async () => {
      const d = conPaciente();
      const plan = carrierPlanId(
        'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
        'RED_MAX',
      );
      d.coverageRepo.findActiveByPatientAndOrder.mockResolvedValue(null);
      d.tx.find.mockResolvedValue([]);

      await d.service.updateOwnProfile(
        { privateInsurancePlanId: plan } as any,
        titular,
      );

      expect(d.coverageRepo.createCoverage).not.toHaveBeenCalled();
    });
  });

  /**
   * **Una dirección sin GPS no puede salir ubicada en el golfo de Guinea.**
   *
   * `aDireccion` descartaba las coordenadas comparando con `=== undefined`, pero
   * la columna es nullable y la base devuelve **null**. La comparación estricta
   * tomaba la rama de «sí hay coordenadas» y emitía `Number(null)`, que es 0. La
   * ficha del paciente dibujaba entonces un «Ver en el mapa» que apuntaba a
   * `0,0`. Se vio en pantalla con una dirección de trabajo cargada sin GPS.
   */
  describe('las coordenadas de una dirección', () => {
    const titular = { id: 'user-1', roles: [] } as any;

    function conDireccion(direccion: any) {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'per-1',
      });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1', name: 'Ana' });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue(direccion);
      return d;
    }

    it('sin coordenadas no viaja ninguna, ni como cero', async () => {
      const d = conDireccion({
        lines: 'Calle Ayacucho 241',
        latitude: null,
        longitude: null,
      });

      const perfil = await d.service.getOwnProfile(titular);

      expect(perfil.homeAddress?.latitude).toBeUndefined();
      expect(perfil.homeAddress?.longitude).toBeUndefined();
    });

    it('y con coordenadas viajan como números', async () => {
      const d = conDireccion({
        lines: 'Av. Beni 5100',
        latitude: '-17.758',
        longitude: '-63.178',
      });

      const perfil = await d.service.getOwnProfile(titular);

      expect(perfil.homeAddress?.latitude).toBe(-17.758);
      expect(perfil.homeAddress?.longitude).toBe(-63.178);
    });
  });
});
