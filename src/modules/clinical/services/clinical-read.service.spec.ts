import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ClinicalReadService } from './clinical-read.service';
import { FULL_READ_SCOPE as FULL } from '../domain/clinical-read-scope';
import { AUTHZ } from '../../authz/authz.concepts';
import { CLIN } from '../clinical.concepts';
import { Conditions } from '../entities';

/**
 * El aislamiento entre historias clínicas (carril 09).
 *
 * Es la prueba que el carril declara **obligatoria**: el archivo del paciente
 * abre `GET /clinical/patients/:id/summary` al rol `PATIENT`, y lo único que
 * separa la historia de una persona de la de otra es esta comprobación. Que se
 * resuelva contra la base y no contra el claim `pid` del token es deliberado —
 * la documentación de ese claim dice que no participa de decisiones de
 * autorización.
 */

/**
 * Los identificadores, con la forma que tienen **en la base**: el perfil de
 * paciente se identifica por su persona (`patient_profiles.profile_id` es FK a
 * `profiles.persons`), no por una fila intermedia. Nombrarlos así no es
 * cosmético: el defecto que estas pruebas no veían era exactamente confundir
 * uno con otro.
 */
const HOLDER_PERSON = '11111111-1111-1111-1111-111111111111';
const FOREIGN_PERSON = '22222222-2222-2222-2222-222222222222';

const titular = { id: 'user-1', roles: ['PATIENT'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * El doble del repositorio de perfiles **no devuelve lo que se le diga**: se
 * comporta como la tabla real, indexada por `profile_id`. Antes era un `mockFn`
 * suelto al que cada prueba le dictaba la respuesta, y así daba por buena la
 * traducción de identificadores equivocada — el servicio buscaba en
 * `person_profiles` por su `id` con un id de persona, la fila no existía nunca
 * y el titular recibía 403 siempre. El simulacro tapaba justo eso.
 *
 * Con una tabla de verdad, una búsqueda por la clave equivocada devuelve `null`
 * y la prueba se cae, que es lo que tiene que pasar.
 *
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const accountLinksRepo = { findActiveByUser: mockFn() };

  /** `profile_id` → fila, tal como la indexa `PatientProfilesRepository`. */
  const profiles = new Map<string, { profileId: string }>();
  const patientProfilesRepo = {
    findById: mockFn((_em: unknown, profileId: string) =>
      Promise.resolve(profiles.get(profileId) ?? null),
    ),
  };
  /** Da de alta un perfil de paciente de esa persona. */
  const registerPatient = (personId: string) =>
    profiles.set(personId, { profileId: personId });

  /** `profile_id` → fila, como lo indexa `HealthPractitionerProfilesRepository`. */
  const professionals = new Map<string, { profileId: string }>();
  const practitionerProfilesRepo = {
    findById: mockFn((_em: unknown, profileId: string) =>
      Promise.resolve(professionals.get(profileId) ?? null),
    ),
  };
  /** Da de alta un perfil profesional de esa persona. */
  const registerProfessional = (personId: string) =>
    professionals.set(personId, { profileId: personId });

  /**
   * Las reservas, indexadas por par (profesional, paciente) como lo hace la consulta
   * real. No devuelve lo que se le diga: si se pregunta por otro par, no hay filas —
   * que es lo que tiene que pasar.
   */
  const reservations = new Map<
    string,
    { startAt: Date; timeZone: string | null }[]
  >();
  const key = (pro: string, pac: string) => `${pro}→${pac}`;
  /** Consultas en curso, por par profesional→paciente. */
  const inCourse = new Set<string>();
  const bookingsRepo = {
    // Sin ventana de fechas a propósito: una consulta en curso no se pregunta
    // por el calendario.
    hasConsultationInProgress: mockFn(
      (_em: unknown, pro: string, pac: string) =>
        Promise.resolve(inCourse.has(key(pro, pac))),
    ),
    findConfirmedWithPatientBetween: mockFn(
      (
        _em: unknown,
        practitionerProfileId: string,
        patientProfileId: string,
        from: Date,
        until: Date,
      ) =>
        Promise.resolve(
          (
            reservations.get(key(practitionerProfileId, patientProfileId)) ?? []
          ).filter((r) => r.startAt >= from && r.startAt < until),
        ),
    ),
  };
  /** Agenda una reserva viva de ese profesional con ese paciente. */
  const schedule = (
    pro: string,
    pac: string,
    startAt: Date,
    timeZone: string | null = 'America/La_Paz',
  ) => {
    const previous = reservations.get(key(pro, pac)) ?? [];
    reservations.set(key(pro, pac), [...previous, { startAt, timeZone }]);
  };

  /** Marca que ese profesional YA empezó la consulta con ese paciente. */
  const startConsultation = (pro: string, pac: string): void => {
    inCourse.add(key(pro, pac));
  };

  /**
   * Relaciones asistenciales ACTIVAS, indexadas por par (profesional, paciente)
   * como lo hace `findActiveForPractitionerPatient`. Sin filtro de ventana acá
   * a propósito: la ventana la evalúa el servicio, no el repositorio.
   */
  const careRelations = new Map<
    string,
    {
      validFrom: Date;
      validTo?: Date;
      purposeConceptId?: string;
      relationshipTypeConceptId?: string;
    }[]
  >();
  const careRelationshipsRepo = {
    findActiveForPractitionerPatient: mockFn(
      (_em: unknown, pro: string, pac: string) =>
        Promise.resolve(careRelations.get(key(pro, pac)) ?? []),
    ),
  };
  /** Da de alta una relación asistencial ACTIVA entre ambos. */
  const link = (
    pro: string,
    pac: string,
    validFrom: Date = new Date(Date.now() - 86_400_000),
    validTo?: Date,
    purposeConceptId?: string,
    relationshipTypeConceptId?: string,
  ) => {
    const previous = careRelations.get(key(pro, pac)) ?? [];
    careRelations.set(key(pro, pac), [
      ...previous,
      { validFrom, validTo, purposeConceptId, relationshipTypeConceptId },
    ]);
  };

  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const pdp = { evaluate: mockFn().mockResolvedValue({ decision: 'DENY' }) };

  // B.1 — quién representa a quién. Por omisión nadie representa a nadie: el
  // permiso sale entonces del turno, de la relación asistencial o de ser el
  // titular, que es lo que el resto de estas pruebas mira.
  const representation = {
    representsPatient: mockFn().mockResolvedValue(false),
    assertMayActForPatient: mockFn().mockResolvedValue(undefined),
    findActiveProxiedPatientIds: mockFn().mockResolvedValue(new Set<string>()),
  };

  // N-04 — el asiento de lectura. Por defecto los seis repositorios de bloques
  // devuelven vacío: estas pruebas miran el gate y la auditoría, no el mapeo.
  const dataAccessLogRepo = { record: mockFn(() => ({ id: 'dal-1' })) };
  const empty = { findByPatient: mockFn().mockResolvedValue([]) };
  // BR-14 (CL-11 / CL-10): por defecto sin reacciones ni historia — estas
  // pruebas miran el gate y la auditoría, no el mapeo de campos nuevos.
  const allergyReactionsRepo = {
    findByAllergyIds: mockFn().mockResolvedValue([]),
  };
  const historyRepo = {
    latestBySource: mockFn().mockResolvedValue(new Map()),
  };
  em.flush = mockFn().mockResolvedValue(undefined);

  // Alcance por especialidad: por omisión todo lo que abre la historia la abre
  // completa y no hay encuentro propio; cada prueba lo dicta cuando le importa.
  const granularScope = {
    resolve: mockFn().mockResolvedValue({ kind: 'FULL' }),
    hasWriteLevelGrant: mockFn().mockResolvedValue(false),
  };
  const scopeFilter = { build: mockFn().mockResolvedValue(null) };
  const scopeRepo = {
    isOwnOpenEncounter: mockFn().mockResolvedValue(false),
    hasOwnOpenEncounter: mockFn().mockResolvedValue(false),
    page: mockFn(),
  };

  const service = new ClinicalReadService(
    em as any,
    empty as any,
    empty as any,
    allergyReactionsRepo as any,
    empty as any,
    empty as any,
    empty as any,
    empty as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    practitionerProfilesRepo as any,
    bookingsRepo as any,
    pdp as any,
    careRelationshipsRepo as any,
    logger as any,
    representation as any,
    dataAccessLogRepo as any,
    historyRepo as any,
    granularScope as any,
    scopeFilter as any,
    scopeRepo as any,
  );

  return {
    service,
    em,
    dataAccessLogRepo,
    representation,
    accountLinksRepo,
    patientProfilesRepo,
    practitionerProfilesRepo,
    bookingsRepo,
    pdp,
    careRelationshipsRepo,
    darDeAltaPaciente: registerPatient,
    darDeAltaProfesional: registerProfessional,
    agendar: schedule,
    iniciarConsulta: startConsultation,
    vincular: link,
    logger,
    vacio: empty,
    allergyReactionsRepo,
    historyRepo,
    granularScope,
    scopeFilter,
    scopeRepo,
  };
}

/**
 * N-04 (BR-13): hasta este cambio ninguna lectura clínica escribía en
 * `audit.data_access_log`; sólo el break-the-glass. Leer el resumen es leer
 * PHI, y tiene que dejar quién, qué paciente y con qué propósito — sin el
 * contenido leído.
 */
describe('ClinicalReadService · getPatientSummary deja rastro (N-04)', () => {
  const medical = {
    id: 'user-medica',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-1',
  } as any;

  it('asienta la lectura en audit.data_access_log con el actor y el paciente', async () => {
    const d = build();

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.patientProfileId).toBe(HOLDER_PERSON);
    expect(d.dataAccessLogRepo.record).toHaveBeenCalledTimes(1);
    expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
      d.em,
      expect.objectContaining({
        userId: 'user-medica',
        patientProfileId: HOLDER_PERSON,
        resourceType: 'PATIENT_CLINICAL_SUMMARY',
        resourceId: HOLDER_PERSON,
        purpose: 'TREATMENT',
        recordedByUserId: 'user-medica',
      }),
    );
    expect(d.em.flush).toHaveBeenCalled();
  });

  it('el asiento no lleva contenido clínico: sólo identificadores', async () => {
    const d = build();
    await d.service.getPatientSummary(HOLDER_PERSON, 50, medical, FULL);
    const entry = d.dataAccessLogRepo.record.mock.calls[0][1];
    expect(Object.keys(entry).sort()).toEqual(
      [
        'actionConceptId',
        'patientProfileId',
        'purpose',
        'recordedByUserId',
        'resourceId',
        'resourceType',
        'tenantId',
        'userId',
      ].sort(),
    );
  });

  it('si el asiento no se puede escribir, el resumen no se sirve (fail-closed)', async () => {
    const d = build();
    d.em.flush.mockRejectedValue(new Error('audit down'));
    await expect(
      d.service.getPatientSummary(HOLDER_PERSON, 50, medical, FULL),
    ).rejects.toThrow('audit down');
  });
});

/**
 * BR-14 (CL-11 / CL-10): el resumen traía menos de lo que el modelo ya
 * guardaba. Estas pruebas fijan los cuatro campos que antes faltaban.
 */
describe('ClinicalReadService · getPatientSummary trae lo que el modelo ya tiene (BR-14)', () => {
  const medical = {
    id: 'user-medica',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-1',
  } as any;

  it('CL-11: la receta trae encounterId, la condición trae lateralidad, el encuentro trae rowVersion', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([
        {
          id: 'cond-1',
          codeConceptId: 'code-1',
          lateralityConceptId: 'lat-1',
          createdAt: new Date(),
        },
      ]) // conditions
      .mockResolvedValueOnce([]) // allergies
      .mockResolvedValueOnce([
        {
          id: 'mr-1',
          medicationConceptId: 'med-1',
          statusConceptId: 'status-1',
          encounterId: 'enc-1',
          createdAt: new Date(),
        },
      ]) // medicationRequests
      .mockResolvedValueOnce([]) // observations
      .mockResolvedValueOnce([
        { id: 'enc-1', statusConceptId: 'status-1', rowVersion: 3 },
      ]) // encounters
      .mockResolvedValueOnce([]); // careEpisodes

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.conditions[0].lateralityConceptId).toBe('lat-1');
    expect(summary.medicationRequests[0].encounterId).toBe('enc-1');
    expect(summary.encounters[0].rowVersion).toBe(3);
  });

  it('v4294: la condición trae el diagnóstico que la reemplazó y, si es null, no trae el campo', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([
        {
          id: 'cond-1',
          codeConceptId: 'code-1',
          replacedByConditionId: 'cond-2',
          createdAt: new Date(),
        },
        {
          id: 'cond-2',
          codeConceptId: 'code-2',
          replacedByConditionId: null,
          createdAt: new Date(),
        },
      ]) // conditions
      .mockResolvedValueOnce([]) // allergies
      .mockResolvedValueOnce([]) // medicationRequests
      .mockResolvedValueOnce([]) // observations
      .mockResolvedValueOnce([]) // encounters
      .mockResolvedValueOnce([]); // careEpisodes

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.conditions[0].replacedByConditionId).toBe('cond-2');
    expect('replacedByConditionId' in summary.conditions[1]).toBe(false);
  });

  it('la receta trae la que la reemplazó y, si es null, no trae el campo', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([]) // conditions
      .mockResolvedValueOnce([]) // allergies
      .mockResolvedValueOnce([
        {
          id: 'med-1',
          medicationConceptId: 'levo-25',
          statusConceptId: 'st',
          replacedByRequestId: 'med-2',
          createdAt: new Date(),
        },
        {
          id: 'med-2',
          medicationConceptId: 'levo-50',
          statusConceptId: 'st',
          replacedByRequestId: null,
          createdAt: new Date(),
        },
      ]) // medicationRequests
      .mockResolvedValueOnce([]) // observations
      .mockResolvedValueOnce([]) // encounters
      .mockResolvedValueOnce([]); // careEpisodes

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.medicationRequests[0].replacedByRequestId).toBe('med-2');
    expect('replacedByRequestId' in summary.medicationRequests[1]).toBe(false);
  });

  it('la receta del resumen trae su cantidad recetada como número, y sin cantidad no la trae', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([]) // conditions
      .mockResolvedValueOnce([]) // allergies
      .mockResolvedValueOnce([
        {
          id: 'mr-1',
          medicationConceptId: 'med-1',
          statusConceptId: 'status-1',
          quantityDecimal: '4',
          createdAt: new Date(),
        },
        {
          id: 'mr-2',
          medicationConceptId: 'med-2',
          statusConceptId: 'status-1',
          createdAt: new Date(),
        },
      ]) // medicationRequests
      .mockResolvedValueOnce([]) // observations
      .mockResolvedValueOnce([]) // encounters
      .mockResolvedValueOnce([]); // careEpisodes

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.medicationRequests[0].quantityDecimal).toBe(4);
    expect(summary.medicationRequests[1].quantityDecimal).toBeUndefined();
  });

  it('CL-11: la alergia trae sus reacciones', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([]) // conditions
      .mockResolvedValueOnce([
        { id: 'all-1', substanceConceptId: 'sub-1', createdAt: new Date() },
      ]) // allergies
      .mockResolvedValueOnce([]) // medicationRequests
      .mockResolvedValueOnce([]) // observations
      .mockResolvedValueOnce([]) // encounters
      .mockResolvedValueOnce([]); // careEpisodes
    d.allergyReactionsRepo.findByAllergyIds.mockResolvedValue([
      { id: 'r1', allergyId: 'all-1', manifestationConceptId: 'manif-1' },
    ]);

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.allergies[0].reactions).toEqual([
      {
        id: 'r1',
        manifestationConceptId: 'manif-1',
        severityConceptId: undefined,
        description: undefined,
      },
    ]);
  });

  it('C3 / P41: expone la decisión de verificación aunque la última revisión sea un cambio de estado', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([
        { id: 'cond-1', codeConceptId: 'code-1', createdAt: new Date() },
        { id: 'cond-2', codeConceptId: 'code-2', createdAt: new Date() },
      ]) // conditions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const decision = {
      outcome: 'CONFIRMED',
      decidedAt: '2026-09-20T10:00:00.000Z',
      decidedByProfileId: 'prac-1',
      reasonText: 'Cuadro compatible',
      basedOn: { kind: 'NOTE', noteId: 'n-1', ajena: 'no sale' },
    };
    const reviews = [
      { dataSnapshot: { verification: decision } },
      { dataSnapshot: { statusChangeReasonText: 'Remite' } },
    ];
    // Sin filtro: la última revisión. Con filtro: la última que lo cumple.
    d.historyRepo.latestBySource.mockImplementation(
      async (_em: unknown, _e: string, _ids: string[], matches?: any) => {
        const candidates = matches ? reviews.filter(matches) : reviews;
        const last = candidates[candidates.length - 1];
        return new Map(last ? [['cond-1', last]] : []);
      },
    );

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.conditions[0].lastStatusChangeReasonText).toBe('Remite');
    expect(summary.conditions[0].verification).toEqual({
      outcome: 'CONFIRMED',
      decidedAt: '2026-09-20T10:00:00.000Z',
      decidedByProfileId: 'prac-1',
      reasonText: 'Cuadro compatible',
      basedOn: { kind: 'NOTE', noteId: 'n-1' },
    });
    // Sin decisión, `null`: el front distingue «no decidido» de «sin dato».
    expect(summary.conditions[1].verification).toBeNull();
  });

  it('CL-10: expone el motivo del último cambio de estado desde la historia, no del log', async () => {
    const d = build();
    d.vacio.findByPatient
      .mockResolvedValueOnce([
        { id: 'cond-1', codeConceptId: 'code-1', createdAt: new Date() },
      ]) // conditions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    d.historyRepo.latestBySource.mockResolvedValue(
      new Map([
        [
          'cond-1',
          {
            dataSnapshot: { statusChangeReasonText: 'Ya no presenta síntomas' },
          },
        ],
      ]),
    );

    const summary = await d.service.getPatientSummary(
      HOLDER_PERSON,
      50,
      medical,
      FULL,
    );

    expect(summary.conditions[0].lastStatusChangeReasonText).toBe(
      'Ya no presenta síntomas',
    );
  });
});

describe('ClinicalReadService · assertOwnRecord', () => {
  /**
   * **La prueba que faltaba (D-3).** El titular pide su propia historia con el
   * identificador que la aplicación le devuelve al registrarse, que es el de su
   * persona. Mientras la comprobación lo buscó en `person_profiles` por `id`,
   * esto respondía 403 — a todos los pacientes, siempre, desde el PR #90.
   */
  it('deja pasar al titular que pide su propia historia', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    await expect(
      d.service.assertOwnRecord(HOLDER_PERSON, titular),
    ).resolves.toBeUndefined();
  });

  /** Se busca por `profile_id`, que es la clave de la tabla de pacientes. */
  it('busca el perfil por el identificador que se pidió, sin traducirlo', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    await d.service.assertOwnRecord(HOLDER_PERSON, titular);

    expect(d.patientProfilesRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      HOLDER_PERSON,
    );
  });

  it('rechaza la historia de otra persona', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.darDeAltaPaciente(FOREIGN_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    await expect(
      d.service.assertOwnRecord(FOREIGN_PERSON, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza a una cuenta sin persona vinculada', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

    await expect(
      d.service.assertOwnRecord(HOLDER_PERSON, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza un perfil que no existe: un uuid inventado no abre nada', async () => {
    const d = build();
    // Nadie dado de alta: la tabla está vacía, como cuando el uuid es inventado.
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    await expect(
      d.service.assertOwnRecord(HOLDER_PERSON, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el intento queda registrado: leer una historia ajena no es un error mudo', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.darDeAltaPaciente(FOREIGN_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    await expect(
      d.service.assertOwnRecord(FOREIGN_PERSON, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('NO usa el claim del token: la titularidad sale de la base', async () => {
    const d = build();
    d.darDeAltaPaciente(HOLDER_PERSON);
    d.darDeAltaPaciente(FOREIGN_PERSON);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: HOLDER_PERSON,
    });

    // El actor afirma en su token ser el titular de la historia ajena; da igual.
    const lying = { ...titular, patientProfileId: FOREIGN_PERSON } as any;

    await expect(
      d.service.assertOwnRecord(FOREIGN_PERSON, lying),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('la historia del dependiente (B.1)', () => {
    it('deja pasar a quien representa al paciente', async () => {
      // La madre que pidió el turno de su hijo tiene que poder leer lo que el
      // pediatra escribió: si no, la consulta que ella gestionó no le sirve.
      const d = build();
      d.darDeAltaPaciente(HOLDER_PERSON);
      d.darDeAltaPaciente(FOREIGN_PERSON);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: HOLDER_PERSON,
      });
      d.representation.representsPatient.mockResolvedValue(true);

      await expect(
        d.service.assertOwnRecord(FOREIGN_PERSON, titular),
      ).resolves.toBeUndefined();
      expect(d.representation.representsPatient).toHaveBeenCalledWith(
        FOREIGN_PERSON,
        titular,
      );
    });

    it('al titular que lee lo suyo no se le pregunta por apoderamientos', async () => {
      // El caso normal no paga una consulta de más sobre una tabla que para
      // casi todo el mundo está vacía.
      const d = build();
      d.darDeAltaPaciente(HOLDER_PERSON);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: HOLDER_PERSON,
      });

      await d.service.assertOwnRecord(HOLDER_PERSON, titular);

      expect(d.representation.representsPatient).not.toHaveBeenCalled();
    });

    it('sin apoderamiento el rechazo es el de siempre, con el mismo mensaje', async () => {
      // Quien no puede leerla no tiene por qué distinguir «no sos el titular»
      // de «no lo representás»: las dos cosas se dicen igual.
      const d = build();
      d.darDeAltaPaciente(HOLDER_PERSON);
      d.darDeAltaPaciente(FOREIGN_PERSON);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: HOLDER_PERSON,
      });
      d.representation.representsPatient.mockResolvedValue(false);

      await expect(
        d.service.assertOwnRecord(FOREIGN_PERSON, titular),
      ).rejects.toThrow('Sólo puede consultar su propia historia clínica.');
    });
  });
});

/**
 * El permiso de lectura de la historia (v4.2.2).
 *
 * Antes bastaba el rol: cualquier médico con sesión leía la historia de cualquier
 * persona, y la tabla de permisos por paciente estaba —y sigue— vacía. Ahora quien
 * atiende pasa sólo si HOY tiene turno con esa persona, y «hoy» es el día de la sede.
 */
describe('ClinicalReadService · assertPuedeLeerHistoria', () => {
  const DOCTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PATIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const OTHER_PATIENT = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const LA_PAZ = 'America/La_Paz';

  /** Un actor con los roles pedidos. */
  const actorWith = (id: string, ...roles: string[]) => ({ id, roles }) as any;

  /** Hoy a las `hora` en punto, hora de La Paz (UTC−4), como instante UTC. */
  const todayInLaPazAt = (time: number) => {
    const now = new Date();
    const local = new Date(now.getTime() - 4 * 3600_000);
    return new Date(
      Date.UTC(
        local.getUTCFullYear(),
        local.getUTCMonth(),
        local.getUTCDate(),
        time + 4,
      ),
    );
  };

  it('el titular lee su propia historia, como antes', async () => {
    const c = build();
    c.darDeAltaPaciente(PATIENT);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PATIENT,
    });

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'PATIENT')),
    ).resolves.toBeUndefined();
  });

  it('quien atiende pasa si HOY tiene turno con esa persona', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.agendar(DOCTOR, PATIENT, todayInLaPazAt(10), LA_PAZ);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('el turno de AYER ya no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.agendar(
      DOCTOR,
      PATIENT,
      new Date(todayInLaPazAt(10).getTime() - 86_400_000),
      LA_PAZ,
    );

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sin turno con esa persona no alcanza el rol', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'PRACTITIONER')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el turno de hoy con OTRO paciente no abre esta historia', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.agendar(DOCTOR, OTHER_PATIENT, todayInLaPazAt(10), LA_PAZ);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una cuenta con rol de atender pero sin perfil profesional no pasa', async () => {
    const c = build();
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('sin turno hoy, autorización explícita vía PDP (FT-07-R05/R06/R08)', () => {
    const actorAuthorized = () =>
      ({
        id: 'u',
        roles: ['PRACTITIONER'],
        practitionerProfileId: DOCTOR,
        tenantIds: ['t1'],
      }) as any;

    it('pasa cuando el PDP concede (relación asistencial/grant vigente)', async () => {
      const c = build();
      c.darDeAltaProfesional(DOCTOR);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: DOCTOR,
      });
      c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });

      await expect(
        c.service.assertCanReadHistory(PATIENT, actorAuthorized()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientProfileId: PATIENT,
          practitionerProfileId: DOCTOR,
          action: 'READ',
          purposeOfUse: 'TREATMENT',
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('sigue rechazando cuando el PDP también deniega', async () => {
      const c = build();
      c.darDeAltaProfesional(DOCTOR);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: DOCTOR,
      });
      c.pdp.evaluate.mockResolvedValue({ decision: 'DENY' });

      await expect(
        c.service.assertCanReadHistory(PATIENT, actorAuthorized()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      // Se preguntó por los dos propósitos que abren la historia y ninguno concedió.
      expect(c.pdp.evaluate).toHaveBeenCalledTimes(2);
    });

    /**
     * BR-20 / CV-19 · el acceso de emergencia. El grant de `break-the-glass` lleva
     * propósito EMERGENCY; el PDP compara propósito con propósito, así que la
     * pregunta por TREATMENT lo deniega. Reproducido contra la API viva el
     * 2026-09-26 con una médica CLINICAL_APPROVER real: 201 en la emergencia y
     * 403 al abrir la historia. La lectura tiene que preguntar también por
     * EMERGENCY.
     */
    it('pasa con un acceso de emergencia vigente aunque TREATMENT sea denegado', async () => {
      const c = build();
      c.darDeAltaProfesional(DOCTOR);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: DOCTOR,
      });
      c.pdp.evaluate.mockImplementation(async (dto: any) => ({
        decision: dto.purposeOfUse === 'EMERGENCY' ? 'PERMIT' : 'DENY',
      }));

      await expect(
        c.service.assertCanReadHistory(PATIENT, actorAuthorized()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientProfileId: PATIENT,
          action: 'READ',
          purposeOfUse: 'EMERGENCY',
        }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('la escritura también reconoce el acceso de emergencia (el nivel lo decide el PDP)', async () => {
      const c = build();
      c.darDeAltaProfesional(DOCTOR);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: DOCTOR,
      });
      c.pdp.evaluate.mockImplementation(async (dto: any) => ({
        decision: dto.purposeOfUse === 'EMERGENCY' ? 'PERMIT' : 'DENY',
      }));

      await expect(
        c.service.assertCanWriteHistory(PATIENT, actorAuthorized()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'WRITE', purposeOfUse: 'EMERGENCY' }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('no consulta el PDP sin tenant en el actor', async () => {
      const c = build();
      c.darDeAltaProfesional(DOCTOR);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: DOCTOR,
      });

      await expect(
        c.service.assertCanReadHistory(PATIENT, {
          id: 'u',
          roles: ['PRACTITIONER'],
          practitionerProfileId: DOCTOR,
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(c.pdp.evaluate).not.toHaveBeenCalled();
    });
  });

  /**
   * El borde que hace fallar a quien decide con la fecha del servidor: a las 23:30 en
   * La Paz ya es el día siguiente en UTC. El turno es de hoy para la sede, y es la
   * sede la que manda.
   */
  it('el turno de las 23:30 en La Paz es de HOY, aunque en UTC ya sea mañana', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    const alas2330 = todayInLaPazAt(23);
    c.agendar(
      DOCTOR,
      PATIENT,
      new Date(alas2330.getTime() + 30 * 60_000),
      LA_PAZ,
    );

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('el recurso sin zona declarada cae al default del producto (UTC−4)', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.agendar(DOCTOR, PATIENT, todayInLaPazAt(10), null);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  /**
   * LA CONSULTA YA EMPEZADA ABRE EL EXPEDIENTE, SIN MIRAR EL CALENDARIO.
   *
   * Las dos reglas del producto se contradecían y se midió en un recorrido
   * real: la agenda deja **empezar una cita confirmada cuando el profesional
   * decide, no cuando el reloj lo permite** (corrección #15, pedido del
   * propietario), y el expediente exigía que el cupo fuera de hoy. Se podía
   * iniciar la consulta y no leer la historia de quien estaba enfrente.
   */
  it('una consulta EN CURSO abre el expediente aunque el turno sea de otro día', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    // Sin turno hoy: la agenda de este profesional con este paciente está vacía
    // en la ventana que mira `atiendeHoy`.
    c.iniciarConsulta(DOCTOR, PATIENT);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('sin consulta en curso Y sin turno hoy, sigue sin poder', async () => {
    // La cita con ese paciente sigue siendo el filtro: esto es lo que impide
    // que «en curso» se lea como «cualquiera puede».
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('la consulta en curso es de ESE par, no de cualquiera', async () => {
    // Iniciar con un paciente no abre el expediente de otro. Es el error fácil
    // de cometer si la consulta se escribiera sin el par completo.
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.iniciarConsulta(DOCTOR, 'otro-paciente-cualquiera');

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el camino barato va primero: con consulta en curso no se consulta la agenda', async () => {
    // No es cosmético: `findConfirmedWithPatientBetween` trae una ventana de 96
    // horas y compara zona por zona. Si la respuesta ya se sabe, no se paga.
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.iniciarConsulta(DOCTOR, PATIENT);

    await c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN'));

    expect(
      c.bookingsRepo.findConfirmedWithPatientBetween,
    ).not.toHaveBeenCalled();
  });

  it('SUPERADMIN pasa sin turno y sin perfil: el guard ya lo trata como comodín', async () => {
    const c = build();

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'SUPERADMIN')),
    ).resolves.toBeUndefined();
    expect(
      c.bookingsRepo.findConfirmedWithPatientBetween,
    ).not.toHaveBeenCalled();
  });

  it('el profesional lee su PROPIA historia aunque no tenga turno consigo mismo', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.darDeAltaPaciente(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });

    await expect(
      c.service.assertCanReadHistory(DOCTOR, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  /**
   * Sin esto, el mensaje delata: «no es tuya» contra «no la atendés hoy» le confirmaría
   * a quien probó un uuid al azar que esa persona existe.
   */
  it('el rechazo es indistinguible entre paciente inexistente y sin-turno', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    const actor = actorWith('u', 'CLINICIAN');

    const existsWithoutSlot = await c.service
      .assertCanReadHistory(PATIENT, actor)
      .catch((e: Error) => e.message);
    const invented = await c.service
      .assertCanReadHistory('dddddddd-dddd-dddd-dddd-dddddddddddd', actor)
      .catch((e: Error) => e.message);

    expect(existsWithoutSlot).toBe(invented);
  });

  /**
   * ALV-029. Antes de esta base, un profesional con paciente asignado pero sin
   * cupo agendado para hoy caía en `assertOwnRecord` como un desconocido.
   */
  it('un profesional con relación asistencial vigente abre la historia aunque no tenga turno hoy', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.vincular(DOCTOR, PATIENT);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('una relación asistencial YA VENCIDA no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.vincular(
      DOCTOR,
      PATIENT,
      new Date(Date.now() - 30 * 86_400_000),
      new Date(Date.now() - 86_400_000),
    );

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una relación asistencial que TODAVÍA no empieza no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.vincular(DOCTOR, PATIENT, new Date(Date.now() + 86_400_000));

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  /**
   * Espejo del caso 6c del PDP (`AuthzPdpService`): una relación acotada a un
   * propósito sólo habilita acciones que declaren ese mismo propósito. Este
   * endpoint no pide propósito de uso —es el resumen completo—, así que una
   * relación acotada no debe abrirlo: sería darle más alcance del que su
   * propio propósito le fija.
   */
  it('una relación asistencial ACOTADA A UN PROPÓSITO no abre el resumen completo', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.vincular(
      DOCTOR,
      PATIENT,
      new Date(Date.now() - 86_400_000),
      undefined,
      'purpose:second-opinion',
    );

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('la relación asistencial es de ESE par: con OTRO paciente no abre esta historia', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.vincular(DOCTOR, OTHER_PATIENT);

    await expect(
      c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el camino barato va primero: con turno de hoy no se consulta la relación asistencial', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    c.agendar(DOCTOR, PATIENT, todayInLaPazAt(10), LA_PAZ);

    await c.service.assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN'));

    expect(
      c.careRelationshipsRepo.findActiveForPractitionerPatient,
    ).not.toHaveBeenCalled();
  });

  it('resuelve el vínculo de la cuenta UNA sola vez por lectura', async () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });

    await c.service
      .assertCanReadHistory(PATIENT, actorWith('u', 'CLINICIAN'))
      .catch(() => undefined);

    expect(c.accountLinksRepo.findActiveByUser).toHaveBeenCalledTimes(1);
  });

  // `SUPERADMIN` acotado a un tenant (`scopedRoles`, MCH-001) no es el comodín:
  // `RolesGuard` tampoco lo trata como tal. La historia no es de ningún tenant,
  // así que el atajo exige el rol global (#1241).
  it('SUPERADMIN acotado a un tenant NO lee la historia ajena sin turno ni vínculo', async () => {
    const c = build();
    await expect(
      c.service.assertCanReadHistory(PATIENT, {
        id: 'admin-a',
        roles: ['SUPERADMIN'],
        scopedRoles: { 'tenant-a': ['SUPERADMIN'] },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('SUPERADMIN acotado que además atiende: cae a la regla del profesional', async () => {
    const c = build();
    await expect(
      c.service.assertCanReadHistory(PATIENT, {
        id: 'admin-a',
        roles: ['SUPERADMIN', 'CLINICIAN'],
        scopedRoles: { 'tenant-a': ['SUPERADMIN'] },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ClinicalReadService · assertPuedeEscribirHistoria (MCH-007)', () => {
  const DOCTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PATIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const LA_PAZ = 'America/La_Paz';

  const doctor = () =>
    ({
      id: 'u',
      roles: ['PRACTITIONER'],
      practitionerProfileId: DOCTOR,
      tenantIds: ['t1'],
    }) as any;

  /** El PDP de verdad decide por nivel: acá sólo concede lo que se le diga. */
  const pdpThatGrants = (c: ReturnType<typeof build>, actions: string[]) =>
    c.pdp.evaluate.mockImplementation(async (dto: { action: string }) => ({
      decision: actions.includes(dto.action) ? 'PERMIT' : 'DENY',
    }));

  function doctorWithoutSlot() {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    return c;
  }

  it('un grant de sólo lectura deja leer pero no escribir', async () => {
    const c = doctorWithoutSlot();
    pdpThatGrants(c, ['READ']);

    await expect(
      c.service.assertCanReadHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(c.pdp.evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'WRITE', patientProfileId: PATIENT }),
      expect.anything(),
      expect.anything(),
    );
  });

  it('un grant de escritura habilita escribir', async () => {
    const c = doctorWithoutSlot();
    pdpThatGrants(c, ['READ', 'WRITE']);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
  });

  it('sin vínculo ni grant no se escribe', async () => {
    const c = doctorWithoutSlot();

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('quien lo atiende hoy escribe, dentro de un encuentro propio abierto, sin preguntarle al PDP', async () => {
    const c = doctorWithoutSlot();
    const now = new Date();
    c.agendar(DOCTOR, PATIENT, now, LA_PAZ);
    c.scopeRepo.hasOwnOpenEncounter.mockResolvedValue(true);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
    expect(c.pdp.evaluate).not.toHaveBeenCalled();
  });

  it('el titular no escribe su propia historia por serlo', async () => {
    const c = build();
    c.darDeAltaPaciente(PATIENT);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PATIENT,
    });
    const patient = { id: 'u', roles: ['PATIENT'] } as any;

    await expect(
      c.service.assertCanReadHistory(PATIENT, patient),
    ).resolves.toBeUndefined();
    await expect(
      c.service.assertCanWriteHistory(PATIENT, patient),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('SUPERADMIN pasa, como en el resto del sistema de roles', async () => {
    const c = build();
    await expect(
      c.service.assertCanWriteHistory(PATIENT, {
        id: 'root',
        roles: ['SUPERADMIN'],
      } as any),
    ).resolves.toBeUndefined();
  });

  // `SUPERADMIN` acotado a un tenant (`scopedRoles`, MCH-001) no es el comodín:
  // `RolesGuard` tampoco lo trata como tal. La historia no es de ningún tenant,
  // así que el atajo exige el rol global (#1241).
  it('SUPERADMIN acotado a un tenant NO escribe la historia sin base asistencial', async () => {
    const c = build();
    await expect(
      c.service.assertCanWriteHistory(PATIENT, {
        id: 'admin-a',
        roles: ['SUPERADMIN'],
        scopedRoles: { 'tenant-a': ['SUPERADMIN'] },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

/**
 * Alcance de lectura por especialidad: `resolveReadScope` devuelve la historia
 * completa o solo las especialidades que el paciente autorizó, y
 * `assertCanReadHistory` sigue siendo el sí/no de siempre.
 */
describe('ClinicalReadService · resolveReadScope', () => {
  const DOCTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PATIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const LA_PAZ = 'America/La_Paz';
  const SPECIALTIES = {
    kind: 'SPECIALTIES',
    specialtyConceptIds: ['esp-cardio'],
  };

  const doctor = () =>
    ({
      id: 'u',
      roles: ['PRACTITIONER'],
      practitionerProfileId: DOCTOR,
      tenantIds: ['t1'],
    }) as any;

  function doctorWithoutSlot() {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    return c;
  }

  type Built = ReturnType<typeof build>;

  it('SUPERADMIN y el titular leen todo', async () => {
    const c = build();
    c.darDeAltaPaciente(PATIENT);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PATIENT,
    });

    await expect(
      c.service.resolveReadScope(PATIENT, {
        id: 'r',
        roles: ['SUPERADMIN'],
      } as any),
    ).resolves.toEqual(FULL);
    await expect(
      c.service.resolveReadScope(PATIENT, {
        id: 'u',
        roles: ['PATIENT'],
      } as any),
    ).resolves.toEqual(FULL);
  });

  it.each([
    ['la consulta en curso', (c: Built) => c.iniciarConsulta(DOCTOR, PATIENT)],
    [
      'el turno de hoy',
      (c: Built) => c.agendar(DOCTOR, PATIENT, new Date(), LA_PAZ),
    ],
    [
      'una relación que no es la cabecera',
      (c: Built) =>
        c.vincular(
          DOCTOR,
          PATIENT,
          undefined,
          undefined,
          undefined,
          AUTHZ.CARE_REL_TREATING,
        ),
    ],
    [
      'la cabecera',
      (c: Built) =>
        c.vincular(
          DOCTOR,
          PATIENT,
          undefined,
          undefined,
          undefined,
          AUTHZ.CARE_REL_PRIMARY,
        ),
    ],
  ])(
    '%s abre la historia completa sin consultar el consentimiento',
    async (_name, arrange) => {
      const c = doctorWithoutSlot();
      arrange(c);

      await expect(
        c.service.resolveReadScope(PATIENT, doctor()),
      ).resolves.toEqual(FULL);
      expect(c.granularScope.resolve).not.toHaveBeenCalled();
      expect(c.pdp.evaluate).not.toHaveBeenCalled();
    },
  );

  it('cuando solo el PDP concede, el alcance lo decide el consentimiento granular', async () => {
    const c = doctorWithoutSlot();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    c.granularScope.resolve.mockResolvedValue(SPECIALTIES);

    await expect(
      c.service.resolveReadScope(PATIENT, doctor()),
    ).resolves.toEqual(SPECIALTIES);
    expect(c.granularScope.resolve).toHaveBeenCalledWith(
      c.em,
      PATIENT,
      expect.objectContaining({ id: 'u' }),
    );
  });

  it('el acceso de emergencia lee todo aunque no haya consentimiento granular', async () => {
    const c = doctorWithoutSlot();
    c.pdp.evaluate.mockImplementation(async (dto: any) => ({
      decision: dto.purposeOfUse === 'EMERGENCY' ? 'PERMIT' : 'DENY',
    }));

    await expect(
      c.service.resolveReadScope(PATIENT, doctor()),
    ).resolves.toEqual(FULL);
    expect(c.granularScope.resolve).not.toHaveBeenCalled();
  });

  it('sin ninguna base devuelve el mismo 403 de siempre', async () => {
    const c = doctorWithoutSlot();
    await expect(
      c.service.resolveReadScope(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertCanReadHistory delega en resolveReadScope y conserva el sí/no', async () => {
    const c = doctorWithoutSlot();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    c.granularScope.resolve.mockResolvedValue(SPECIALTIES);
    const spy = jest.spyOn(c.service, 'resolveReadScope');

    await expect(
      c.service.assertCanReadHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      PATIENT,
      expect.objectContaining({ id: 'u' }),
      undefined,
    );
  });
});

describe('ClinicalReadService · getPatientSummary por alcance', () => {
  const PATIENT = '11111111-1111-1111-1111-111111111111';
  const medical = {
    id: 'user-medica',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-1',
  } as any;
  const SPECIALTIES = {
    kind: 'SPECIALTIES',
    specialtyConceptIds: ['esp-cardio'],
  } as const;
  const FILTER = {
    profileIds: ['hp-9'],
    userIds: ['u-9'],
    encounterIds: ['enc-9'],
  };

  it('sin alcance lo calcula: un alcance ausente no se asume completo', async () => {
    const d = build();
    // Sin turno ni consentimiento ni vínculo: el cálculo corta con 403.
    d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

    await expect(
      d.service.getPatientSummary(PATIENT, 50, medical),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.dataAccessLogRepo.record).not.toHaveBeenCalled();
  });

  it('con alcance completo no filtra ni informa lo oculto', async () => {
    const d = build();
    const summary = await d.service.getPatientSummary(
      PATIENT,
      50,
      medical,
      FULL,
    );

    expect(d.scopeFilter.build).toHaveBeenCalledWith(d.em, PATIENT, FULL);
    expect(d.scopeRepo.page).not.toHaveBeenCalled();
    expect(summary.hiddenByScope).toBeUndefined();
  });

  it('con especialidades lee en SQL con lo IPS siempre visible y cuenta lo oculto', async () => {
    const d = build();
    d.scopeFilter.build.mockResolvedValue(FILTER);
    d.scopeRepo.page.mockResolvedValue({ rows: [], hidden: 2 });

    const summary = await d.service.getPatientSummary(
      PATIENT,
      50,
      medical,
      SPECIALTIES,
    );

    expect(d.scopeFilter.build).toHaveBeenCalledWith(
      d.em,
      PATIENT,
      SPECIALTIES,
    );
    expect(d.scopeRepo.page).toHaveBeenCalledTimes(5);
    const conditions = d.scopeRepo.page.mock.calls.find(
      (call: any[]) => call[1].entity === Conditions,
    )[1];
    expect(conditions.filter).toBe(FILTER);
    expect(conditions.limit).toBe(51);
    expect(conditions.always).toEqual([
      {
        clinicalStatusConceptId: {
          $in: [
            CLIN.CONDITION_ACTIVE,
            CLIN.CONDITION_RECURRENCE,
            CLIN.CONDITION_RELAPSE,
          ],
        },
      },
    ]);
    // Las alergias son IPS completas: no pasan por el filtro.
    expect(d.vacio.findByPatient).toHaveBeenCalled();
    expect(summary.hiddenByScope).toEqual({
      conditions: 2,
      medicationRequests: 2,
      observations: 2,
      encounters: 2,
      careEpisodes: 2,
    });
  });

  it('el asiento de auditoría se escribe igual con alcance reducido', async () => {
    const d = build();
    d.scopeFilter.build.mockResolvedValue(FILTER);
    d.scopeRepo.page.mockResolvedValue({ rows: [], hidden: 0 });

    await d.service.getPatientSummary(PATIENT, 50, medical, SPECIALTIES);

    expect(d.dataAccessLogRepo.record).toHaveBeenCalledTimes(1);
  });
});

/**
 * Escritura (reglas (a) y (b)): una relación que no es la cabecera no habilita
 * escribir por sí sola, y una base de atención escribe dentro de un encuentro
 * abierto del propio profesional.
 */
describe('ClinicalReadService · escritura por base de atención', () => {
  const DOCTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PATIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const LA_PAZ = 'America/La_Paz';
  const doctor = () =>
    ({
      id: 'u',
      roles: ['PRACTITIONER'],
      practitionerProfileId: DOCTOR,
      tenantIds: ['t1'],
    }) as any;
  type Built = ReturnType<typeof build>;
  const pdpThatGrants = (c: Built, actions: string[]) =>
    c.pdp.evaluate.mockImplementation(
      async (dto: { action: string; purposeOfUse: string }) => ({
        decision:
          actions.includes(dto.action) && dto.purposeOfUse === 'TREATMENT'
            ? 'PERMIT'
            : 'DENY',
      }),
    );

  function doctorWithoutSlot() {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    return c;
  }
  const relation = (c: Built, type: string) =>
    c.vincular(DOCTOR, PATIENT, undefined, undefined, undefined, type);

  it('la cabecera escribe sin encuentro y sin preguntarle al PDP', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_PRIMARY);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
    expect(c.pdp.evaluate).not.toHaveBeenCalled();
    expect(c.scopeRepo.hasOwnOpenEncounter).not.toHaveBeenCalled();
  });

  it('la cabecera con turno hoy tampoco queda acotada a un encuentro', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_PRIMARY);
    c.agendar(DOCTOR, PATIENT, new Date(), LA_PAZ);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), {
        encounterId: 'enc-ajeno',
      }),
    ).resolves.toBeUndefined();
    expect(c.scopeRepo.isOwnOpenEncounter).not.toHaveBeenCalled();
  });

  it('una relación que no es cabecera NO escribe sin un encuentro propio abierto (a)', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_TREATING);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(c.scopeRepo.hasOwnOpenEncounter).toHaveBeenCalledWith(
      c.em,
      PATIENT,
      DOCTOR,
    );
  });

  it('esa misma relación escribe cuando hay un encuentro abierto del propio profesional', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_TREATING);
    c.scopeRepo.hasOwnOpenEncounter.mockResolvedValue(true);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
  });

  it('con encuentro en la petición se exige que sea propio, abierto y de ese paciente (b)', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_TREATING);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), {
        encounterId: 'enc-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(c.scopeRepo.isOwnOpenEncounter).toHaveBeenCalledWith(
      c.em,
      'enc-1',
      PATIENT,
      DOCTOR,
    );

    c.scopeRepo.isOwnOpenEncounter.mockResolvedValue(true);
    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), {
        encounterId: 'enc-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('el turno de hoy sin encuentro propio abierto NO escribe (b)', async () => {
    const c = doctorWithoutSlot();
    c.agendar(DOCTOR, PATIENT, new Date(), LA_PAZ);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(c.scopeRepo.hasOwnOpenEncounter).toHaveBeenCalledWith(
      c.em,
      PATIENT,
      DOCTOR,
    );
  });

  it('el turno de hoy con un encuentro propio abierto escribe sin encounterId', async () => {
    const c = doctorWithoutSlot();
    c.agendar(DOCTOR, PATIENT, new Date(), LA_PAZ);
    c.scopeRepo.hasOwnOpenEncounter.mockResolvedValue(true);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
  });

  it('la consulta en curso sin encuentro propio abierto NO escribe (b)', async () => {
    const c = doctorWithoutSlot();
    c.iniciarConsulta(DOCTOR, PATIENT);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('base de atención con encounterId propio y abierto escribe; con uno ajeno no', async () => {
    const c = doctorWithoutSlot();
    c.agendar(DOCTOR, PATIENT, new Date(), LA_PAZ);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), {
        encounterId: 'enc-ajeno',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    c.scopeRepo.isOwnOpenEncounter.mockResolvedValue(true);
    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), {
        encounterId: 'enc-1',
      }),
    ).resolves.toBeUndefined();
    expect(c.scopeRepo.isOwnOpenEncounter).toHaveBeenLastCalledWith(
      c.em,
      'enc-1',
      PATIENT,
      DOCTOR,
    );
  });

  it('un PDP que concede WRITE solo por una relación no abre la escritura', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_TREATING);
    pdpThatGrants(c, ['READ', 'WRITE']);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un grant de escritura sí la abre aunque haya una relación', async () => {
    const c = doctorWithoutSlot();
    relation(c, AUTHZ.CARE_REL_TREATING);
    pdpThatGrants(c, ['READ', 'WRITE']);
    c.granularScope.hasWriteLevelGrant.mockResolvedValue(true);

    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor()),
    ).resolves.toBeUndefined();
  });
});

describe('ClinicalReadService · puerta con el manager del guard (RLS)', () => {
  const DOCTOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PATIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const scoped = { tag: 'scoped-by-the-guard' } as any;
  const doctor = () =>
    ({
      id: 'u',
      roles: ['PRACTITIONER'],
      practitionerProfileId: DOCTOR,
      tenantIds: ['t1'],
    }) as any;
  const withDoctor = () => {
    const c = build();
    c.darDeAltaProfesional(DOCTOR);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: DOCTOR });
    return c;
  };

  it('la lectura usa el manager recibido en vez de forkear, y se lo pasa al PDP', async () => {
    const c = withDoctor();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    await expect(
      c.service.assertCanReadHistory(PATIENT, doctor(), scoped),
    ).resolves.toBeUndefined();
    expect(c.em.fork).not.toHaveBeenCalled();
    expect(c.accountLinksRepo.findActiveByUser).toHaveBeenCalledWith(
      scoped,
      'u',
    );
    expect(c.pdp.evaluate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      scoped,
    );
  });

  it('la escritura usa el manager recibido y se lo pasa al PDP', async () => {
    const c = withDoctor();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    await expect(
      c.service.assertCanWriteHistory(PATIENT, doctor(), { scoped }),
    ).resolves.toBeUndefined();
    expect(c.em.fork).not.toHaveBeenCalled();
    expect(c.pdp.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WRITE' }),
      expect.anything(),
      scoped,
    );
  });

  it('el PDP sigue evaluando con el primer tenant del token, no con el del manager', async () => {
    const c = withDoctor();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    await c.service.assertCanReadHistory(
      PATIENT,
      { ...doctor(), tenantIds: ['t1', 't2'] },
      scoped,
    );
    expect(c.pdp.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1' }),
      expect.anything(),
      scoped,
    );
  });

  it('sin manager recibido forkea como siempre', async () => {
    const c = withDoctor();
    c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    await c.service.assertCanReadHistory(PATIENT, doctor());
    expect(c.em.fork).toHaveBeenCalled();
  });
});
