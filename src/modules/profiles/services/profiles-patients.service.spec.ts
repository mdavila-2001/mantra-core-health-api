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
import { CONCEPTS } from '../../../common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { boMunicipalityConceptId } from '../../../common/seed/bo-geography.catalog';
import { boOccupationConceptId } from '../../../common/seed/bo-occupations.catalog';

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
    findVigenteByOwnerAndSystem: mockFn().mockResolvedValue(null),
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
  // La propiedad del perfil se prueba en `profile-ownership.service.spec.ts`; aquí el
  // doble deja pasar para no mezclar el permiso con la lógica del servicio.
  const ownership = {
    assertOwnsPatientProfile: mockFn().mockResolvedValue(undefined),
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
    identifiersRepo as never,
    ownership as never,
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
    contactPointsRepo,
    addressesRepo,
    identifiersRepo,
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
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: 'per-1' });
      d.personsRepo.findById.mockResolvedValue(person);
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      return { ...d, person };
    }

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
      const anterior = { typeConceptId: CONCEPTS.ID_TYPE_TAX, value: '111', validTo: null } as any;
      d.tx.find.mockResolvedValue([anterior]);

      await d.service.updateOwnProfile({ taxId: '222' } as any, titular);

      expect(anterior.validTo).toBeInstanceOf(Date);
    });

    it('vaciarlo cierra el anterior y no abre otro', async () => {
      const d = conPaciente();
      const anterior = { typeConceptId: CONCEPTS.ID_TYPE_TAX, value: '111', validTo: null } as any;
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
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({
        lines: 'Calle vieja 1',
        municipalityConceptId: 'muni-1',
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
      expect(data.municipalityConceptId).toBe('muni-1');
      expect(data.latitude).toBe('-17.78');
      expect(d.addressesRepo.closeVigente).toHaveBeenCalled();
    });

    it('el mismo texto no abre una dirección nueva', async () => {
      const d = conPaciente();
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue({ lines: 'Av. Nueva 200' });

      await d.service.updateOwnProfile(
        { homeAddressLines: 'Av. Nueva 200' } as any,
        titular,
      );

      expect(d.addressesRepo.create).not.toHaveBeenCalled();
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
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: 'per-1' });
      d.personsRepo.findById.mockResolvedValue({ id: 'per-1', name: 'Ana' });
      d.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'pp-1',
        patientCode: 'PC-1',
      });
      d.addressesRepo.findVigenteByOwnerAndUse.mockResolvedValue(direccion);
      return d;
    }

    it('sin coordenadas no viaja ninguna, ni como cero', async () => {
      const d = conDireccion({ lines: 'Calle Ayacucho 241', latitude: null, longitude: null });

      const perfil = await d.service.getOwnProfile(titular);

      expect(perfil.homeAddress?.latitude).toBeUndefined();
      expect(perfil.homeAddress?.longitude).toBeUndefined();
    });

    it('y con coordenadas viajan como números', async () => {
      const d = conDireccion({ lines: 'Av. Beni 5100', latitude: '-17.758', longitude: '-63.178' });

      const perfil = await d.service.getOwnProfile(titular);

      expect(perfil.homeAddress?.latitude).toBe(-17.758);
      expect(perfil.homeAddress?.longitude).toBe(-63.178);
    });
  });

});
