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
const PERSONA_DEL_TITULAR = '11111111-1111-1111-1111-111111111111';
const PERSONA_AJENA = '22222222-2222-2222-2222-222222222222';

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
  const perfiles = new Map<string, { profileId: string }>();
  const patientProfilesRepo = {
    findById: mockFn((_em: unknown, profileId: string) =>
      Promise.resolve(perfiles.get(profileId) ?? null),
    ),
  };
  /** Da de alta un perfil de paciente de esa persona. */
  const darDeAltaPaciente = (personId: string) =>
    perfiles.set(personId, { profileId: personId });

  /** `profile_id` → fila, como lo indexa `HealthPractitionerProfilesRepository`. */
  const profesionales = new Map<string, { profileId: string }>();
  const practitionerProfilesRepo = {
    findById: mockFn((_em: unknown, profileId: string) =>
      Promise.resolve(profesionales.get(profileId) ?? null),
    ),
  };
  /** Da de alta un perfil profesional de esa persona. */
  const darDeAltaProfesional = (personId: string) =>
    profesionales.set(personId, { profileId: personId });

  /**
   * Las reservas, indexadas por par (profesional, paciente) como lo hace la consulta
   * real. No devuelve lo que se le diga: si se pregunta por otro par, no hay filas —
   * que es lo que tiene que pasar.
   */
  const reservas = new Map<
    string,
    { startAt: Date; timeZone: string | null }[]
  >();
  const clave = (pro: string, pac: string) => `${pro}→${pac}`;
  /** Consultas en curso, por par profesional→paciente. */
  const enCurso = new Set<string>();
  const bookingsRepo = {
    // Sin ventana de fechas a propósito: una consulta en curso no se pregunta
    // por el calendario.
    tieneConsultaEnCurso: mockFn((_em: unknown, pro: string, pac: string) =>
      Promise.resolve(enCurso.has(clave(pro, pac))),
    ),
    findConfirmadasConPacienteEntre: mockFn(
      (
        _em: unknown,
        practitionerProfileId: string,
        patientProfileId: string,
        desde: Date,
        hasta: Date,
      ) =>
        Promise.resolve(
          (
            reservas.get(clave(practitionerProfileId, patientProfileId)) ?? []
          ).filter((r) => r.startAt >= desde && r.startAt < hasta),
        ),
    ),
  };
  /** Agenda una reserva viva de ese profesional con ese paciente. */
  const agendar = (
    pro: string,
    pac: string,
    startAt: Date,
    timeZone: string | null = 'America/La_Paz',
  ) => {
    const previas = reservas.get(clave(pro, pac)) ?? [];
    reservas.set(clave(pro, pac), [...previas, { startAt, timeZone }]);
  };

  /** Marca que ese profesional YA empezó la consulta con ese paciente. */
  const iniciarConsulta = (pro: string, pac: string): void => {
    enCurso.add(clave(pro, pac));
  };

  /**
   * Relaciones asistenciales ACTIVAS, indexadas por par (profesional, paciente)
   * como lo hace `findActiveForPractitionerPatient`. Sin filtro de ventana acá
   * a propósito: la ventana la evalúa el servicio, no el repositorio.
   */
  const relacionesAsistenciales = new Map<
    string,
    { validFrom: Date; validTo?: Date; purposeConceptId?: string }[]
  >();
  const careRelationshipsRepo = {
    findActiveForPractitionerPatient: mockFn(
      (_em: unknown, pro: string, pac: string) =>
        Promise.resolve(relacionesAsistenciales.get(clave(pro, pac)) ?? []),
    ),
  };
  /** Da de alta una relación asistencial ACTIVA entre ambos. */
  const vincular = (
    pro: string,
    pac: string,
    validFrom: Date = new Date(Date.now() - 86_400_000),
    validTo?: Date,
    purposeConceptId?: string,
  ) => {
    const previas = relacionesAsistenciales.get(clave(pro, pac)) ?? [];
    relacionesAsistenciales.set(clave(pro, pac), [
      ...previas,
      { validFrom, validTo, purposeConceptId },
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
  const vacio = { findByPatient: mockFn().mockResolvedValue([]) };
  // BR-14 (CL-11 / CL-10): por defecto sin reacciones ni historia — estas
  // pruebas miran el gate y la auditoría, no el mapeo de campos nuevos.
  const allergyReactionsRepo = {
    findByAllergyIds: mockFn().mockResolvedValue([]),
  };
  const historyRepo = {
    latestBySource: mockFn().mockResolvedValue(new Map()),
  };
  em.flush = mockFn().mockResolvedValue(undefined);

  const service = new ClinicalReadService(
    em as any,
    vacio as any,
    vacio as any,
    allergyReactionsRepo as any,
    vacio as any,
    vacio as any,
    vacio as any,
    vacio as any,
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
    darDeAltaPaciente,
    darDeAltaProfesional,
    agendar,
    iniciarConsulta,
    vincular,
    logger,
    vacio,
    allergyReactionsRepo,
    historyRepo,
  };
}

/**
 * N-04 (BR-13): hasta este cambio ninguna lectura clínica escribía en
 * `audit.data_access_log`; sólo el break-the-glass. Leer el resumen es leer
 * PHI, y tiene que dejar quién, qué paciente y con qué propósito — sin el
 * contenido leído.
 */
describe('ClinicalReadService · getPatientSummary deja rastro (N-04)', () => {
  const medica = {
    id: 'user-medica',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-1',
  } as any;

  it('asienta la lectura en audit.data_access_log con el actor y el paciente', async () => {
    const d = build();

    const resumen = await d.service.getPatientSummary(
      PERSONA_DEL_TITULAR,
      50,
      medica,
    );

    expect(resumen.patientProfileId).toBe(PERSONA_DEL_TITULAR);
    expect(d.dataAccessLogRepo.record).toHaveBeenCalledTimes(1);
    expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
      d.em,
      expect.objectContaining({
        userId: 'user-medica',
        patientProfileId: PERSONA_DEL_TITULAR,
        resourceType: 'PATIENT_CLINICAL_SUMMARY',
        resourceId: PERSONA_DEL_TITULAR,
        purpose: 'TREATMENT',
        recordedByUserId: 'user-medica',
      }),
    );
    expect(d.em.flush).toHaveBeenCalled();
  });

  it('el asiento no lleva contenido clínico: sólo identificadores', async () => {
    const d = build();
    await d.service.getPatientSummary(PERSONA_DEL_TITULAR, 50, medica);
    const asiento = d.dataAccessLogRepo.record.mock.calls[0][1];
    expect(Object.keys(asiento).sort()).toEqual(
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
      d.service.getPatientSummary(PERSONA_DEL_TITULAR, 50, medica),
    ).rejects.toThrow('audit down');
  });
});

/**
 * BR-14 (CL-11 / CL-10): el resumen traía menos de lo que el modelo ya
 * guardaba. Estas pruebas fijan los cuatro campos que antes faltaban.
 */
describe('ClinicalReadService · getPatientSummary trae lo que el modelo ya tiene (BR-14)', () => {
  const medica = {
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

    const resumen = await d.service.getPatientSummary(
      PERSONA_DEL_TITULAR,
      50,
      medica,
    );

    expect(resumen.conditions[0].lateralityConceptId).toBe('lat-1');
    expect(resumen.medicationRequests[0].encounterId).toBe('enc-1');
    expect(resumen.encounters[0].rowVersion).toBe(3);
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

    const resumen = await d.service.getPatientSummary(
      PERSONA_DEL_TITULAR,
      50,
      medica,
    );

    expect(resumen.allergies[0].reactions).toEqual([
      {
        id: 'r1',
        manifestationConceptId: 'manif-1',
        severityConceptId: undefined,
        description: undefined,
      },
    ]);
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

    const resumen = await d.service.getPatientSummary(
      PERSONA_DEL_TITULAR,
      50,
      medica,
    );

    expect(resumen.conditions[0].lastStatusChangeReasonText).toBe(
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
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    await expect(
      d.service.assertOwnRecord(PERSONA_DEL_TITULAR, titular),
    ).resolves.toBeUndefined();
  });

  /** Se busca por `profile_id`, que es la clave de la tabla de pacientes. */
  it('busca el perfil por el identificador que se pidió, sin traducirlo', async () => {
    const d = build();
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    await d.service.assertOwnRecord(PERSONA_DEL_TITULAR, titular);

    expect(d.patientProfilesRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      PERSONA_DEL_TITULAR,
    );
  });

  it('rechaza la historia de otra persona', async () => {
    const d = build();
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.darDeAltaPaciente(PERSONA_AJENA);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    await expect(
      d.service.assertOwnRecord(PERSONA_AJENA, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza a una cuenta sin persona vinculada', async () => {
    const d = build();
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);

    await expect(
      d.service.assertOwnRecord(PERSONA_DEL_TITULAR, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza un perfil que no existe: un uuid inventado no abre nada', async () => {
    const d = build();
    // Nadie dado de alta: la tabla está vacía, como cuando el uuid es inventado.
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    await expect(
      d.service.assertOwnRecord(PERSONA_DEL_TITULAR, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el intento queda registrado: leer una historia ajena no es un error mudo', async () => {
    const d = build();
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.darDeAltaPaciente(PERSONA_AJENA);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    await expect(
      d.service.assertOwnRecord(PERSONA_AJENA, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('NO usa el claim del token: la titularidad sale de la base', async () => {
    const d = build();
    d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
    d.darDeAltaPaciente(PERSONA_AJENA);
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PERSONA_DEL_TITULAR,
    });

    // El actor afirma en su token ser el titular de la historia ajena; da igual.
    const mentiroso = { ...titular, patientProfileId: PERSONA_AJENA } as any;

    await expect(
      d.service.assertOwnRecord(PERSONA_AJENA, mentiroso),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('la historia del dependiente (B.1)', () => {
    it('deja pasar a quien representa al paciente', async () => {
      // La madre que pidió el turno de su hijo tiene que poder leer lo que el
      // pediatra escribió: si no, la consulta que ella gestionó no le sirve.
      const d = build();
      d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
      d.darDeAltaPaciente(PERSONA_AJENA);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: PERSONA_DEL_TITULAR,
      });
      d.representation.representsPatient.mockResolvedValue(true);

      await expect(
        d.service.assertOwnRecord(PERSONA_AJENA, titular),
      ).resolves.toBeUndefined();
      expect(d.representation.representsPatient).toHaveBeenCalledWith(
        PERSONA_AJENA,
        titular,
      );
    });

    it('al titular que lee lo suyo no se le pregunta por apoderamientos', async () => {
      // El caso normal no paga una consulta de más sobre una tabla que para
      // casi todo el mundo está vacía.
      const d = build();
      d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: PERSONA_DEL_TITULAR,
      });

      await d.service.assertOwnRecord(PERSONA_DEL_TITULAR, titular);

      expect(d.representation.representsPatient).not.toHaveBeenCalled();
    });

    it('sin apoderamiento el rechazo es el de siempre, con el mismo mensaje', async () => {
      // Quien no puede leerla no tiene por qué distinguir «no sos el titular»
      // de «no lo representás»: las dos cosas se dicen igual.
      const d = build();
      d.darDeAltaPaciente(PERSONA_DEL_TITULAR);
      d.darDeAltaPaciente(PERSONA_AJENA);
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: PERSONA_DEL_TITULAR,
      });
      d.representation.representsPatient.mockResolvedValue(false);

      await expect(
        d.service.assertOwnRecord(PERSONA_AJENA, titular),
      ).rejects.toThrow('Sólo podés consultar tu propia historia clínica.');
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
  const MEDICO = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PACIENTE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const OTRO_PACIENTE = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const LA_PAZ = 'America/La_Paz';

  /** Un actor con los roles pedidos. */
  const actorCon = (id: string, ...roles: string[]) => ({ id, roles }) as any;

  /** Hoy a las `hora` en punto, hora de La Paz (UTC−4), como instante UTC. */
  const hoyEnLaPazALas = (hora: number) => {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - 4 * 3600_000);
    return new Date(
      Date.UTC(
        local.getUTCFullYear(),
        local.getUTCMonth(),
        local.getUTCDate(),
        hora + 4,
      ),
    );
  };

  it('el titular lee su propia historia, como antes', async () => {
    const c = build();
    c.darDeAltaPaciente(PACIENTE);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PACIENTE,
    });

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'PATIENT')),
    ).resolves.toBeUndefined();
  });

  it('quien atiende pasa si HOY tiene turno con esa persona', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.agendar(MEDICO, PACIENTE, hoyEnLaPazALas(10), LA_PAZ);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('el turno de AYER ya no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.agendar(
      MEDICO,
      PACIENTE,
      new Date(hoyEnLaPazALas(10).getTime() - 86_400_000),
      LA_PAZ,
    );

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sin turno con esa persona no alcanza el rol', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });

    await expect(
      c.service.assertPuedeLeerHistoria(
        PACIENTE,
        actorCon('u', 'PRACTITIONER'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el turno de hoy con OTRO paciente no abre esta historia', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.agendar(MEDICO, OTRO_PACIENTE, hoyEnLaPazALas(10), LA_PAZ);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una cuenta con rol de atender pero sin perfil profesional no pasa', async () => {
    const c = build();
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  describe('sin turno hoy, autorización explícita vía PDP (FT-07-R05/R06/R08)', () => {
    const actorAutorizado = () =>
      ({
        id: 'u',
        roles: ['PRACTITIONER'],
        practitionerProfileId: MEDICO,
        tenantIds: ['t1'],
      }) as any;

    it('pasa cuando el PDP concede (relación asistencial/grant vigente)', async () => {
      const c = build();
      c.darDeAltaProfesional(MEDICO);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: MEDICO,
      });
      c.pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });

      await expect(
        c.service.assertPuedeLeerHistoria(PACIENTE, actorAutorizado()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientProfileId: PACIENTE,
          practitionerProfileId: MEDICO,
          action: 'READ',
          purposeOfUse: 'TREATMENT',
        }),
        expect.anything(),
      );
    });

    it('sigue rechazando cuando el PDP también deniega', async () => {
      const c = build();
      c.darDeAltaProfesional(MEDICO);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: MEDICO,
      });
      c.pdp.evaluate.mockResolvedValue({ decision: 'DENY' });

      await expect(
        c.service.assertPuedeLeerHistoria(PACIENTE, actorAutorizado()),
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
      c.darDeAltaProfesional(MEDICO);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: MEDICO,
      });
      c.pdp.evaluate.mockImplementation(async (dto: any) => ({
        decision: dto.purposeOfUse === 'EMERGENCY' ? 'PERMIT' : 'DENY',
      }));

      await expect(
        c.service.assertPuedeLeerHistoria(PACIENTE, actorAutorizado()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          patientProfileId: PACIENTE,
          action: 'READ',
          purposeOfUse: 'EMERGENCY',
        }),
        expect.anything(),
      );
    });

    it('la escritura también reconoce el acceso de emergencia (el nivel lo decide el PDP)', async () => {
      const c = build();
      c.darDeAltaProfesional(MEDICO);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: MEDICO,
      });
      c.pdp.evaluate.mockImplementation(async (dto: any) => ({
        decision: dto.purposeOfUse === 'EMERGENCY' ? 'PERMIT' : 'DENY',
      }));

      await expect(
        c.service.assertPuedeEscribirHistoria(PACIENTE, actorAutorizado()),
      ).resolves.toBeUndefined();
      expect(c.pdp.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'WRITE', purposeOfUse: 'EMERGENCY' }),
        expect.anything(),
      );
    });

    it('no consulta el PDP sin tenant en el actor', async () => {
      const c = build();
      c.darDeAltaProfesional(MEDICO);
      c.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: MEDICO,
      });

      await expect(
        c.service.assertPuedeLeerHistoria(PACIENTE, {
          id: 'u',
          roles: ['PRACTITIONER'],
          practitionerProfileId: MEDICO,
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
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    const alas2330 = hoyEnLaPazALas(23);
    c.agendar(
      MEDICO,
      PACIENTE,
      new Date(alas2330.getTime() + 30 * 60_000),
      LA_PAZ,
    );

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('el recurso sin zona declarada cae al default del producto (UTC−4)', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.agendar(MEDICO, PACIENTE, hoyEnLaPazALas(10), null);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
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
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    // Sin turno hoy: la agenda de este profesional con este paciente está vacía
    // en la ventana que mira `atiendeHoy`.
    c.iniciarConsulta(MEDICO, PACIENTE);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('sin consulta en curso Y sin turno hoy, sigue sin poder', async () => {
    // La cita con ese paciente sigue siendo el filtro: esto es lo que impide
    // que «en curso» se lea como «cualquiera puede».
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('la consulta en curso es de ESE par, no de cualquiera', async () => {
    // Iniciar con un paciente no abre el expediente de otro. Es el error fácil
    // de cometer si la consulta se escribiera sin el par completo.
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.iniciarConsulta(MEDICO, 'otro-paciente-cualquiera');

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el camino barato va primero: con consulta en curso no se consulta la agenda', async () => {
    // No es cosmético: `findConfirmadasConPacienteEntre` trae una ventana de 96
    // horas y compara zona por zona. Si la respuesta ya se sabe, no se paga.
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.iniciarConsulta(MEDICO, PACIENTE);

    await c.service.assertPuedeLeerHistoria(
      PACIENTE,
      actorCon('u', 'CLINICIAN'),
    );

    expect(
      c.bookingsRepo.findConfirmadasConPacienteEntre,
    ).not.toHaveBeenCalled();
  });

  it('SUPERADMIN pasa sin turno y sin perfil: el guard ya lo trata como comodín', async () => {
    const c = build();

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'SUPERADMIN')),
    ).resolves.toBeUndefined();
    expect(
      c.bookingsRepo.findConfirmadasConPacienteEntre,
    ).not.toHaveBeenCalled();
  });

  it('el profesional lee su PROPIA historia aunque no tenga turno consigo mismo', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.darDeAltaPaciente(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });

    await expect(
      c.service.assertPuedeLeerHistoria(MEDICO, actorCon('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  /**
   * Sin esto, el mensaje delata: «no es tuya» contra «no la atendés hoy» le confirmaría
   * a quien probó un uuid al azar que esa persona existe.
   */
  it('el rechazo es indistinguible entre paciente inexistente y sin-turno', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    const actor = actorCon('u', 'CLINICIAN');

    const existeSinTurno = await c.service
      .assertPuedeLeerHistoria(PACIENTE, actor)
      .catch((e: Error) => e.message);
    const inventado = await c.service
      .assertPuedeLeerHistoria('dddddddd-dddd-dddd-dddd-dddddddddddd', actor)
      .catch((e: Error) => e.message);

    expect(existeSinTurno).toBe(inventado);
  });

  /**
   * ALV-029. Antes de esta base, un profesional con paciente asignado pero sin
   * cupo agendado para hoy caía en `assertOwnRecord` como un desconocido.
   */
  it('un profesional con relación asistencial vigente abre la historia aunque no tenga turno hoy', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.vincular(MEDICO, PACIENTE);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).resolves.toBeUndefined();
  });

  it('una relación asistencial YA VENCIDA no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.vincular(
      MEDICO,
      PACIENTE,
      new Date(Date.now() - 30 * 86_400_000),
      new Date(Date.now() - 86_400_000),
    );

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una relación asistencial que TODAVÍA no empieza no abre la historia', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.vincular(MEDICO, PACIENTE, new Date(Date.now() + 86_400_000));

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
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
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.vincular(
      MEDICO,
      PACIENTE,
      new Date(Date.now() - 86_400_000),
      undefined,
      'purpose:second-opinion',
    );

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('la relación asistencial es de ESE par: con OTRO paciente no abre esta historia', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.vincular(MEDICO, OTRO_PACIENTE);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el camino barato va primero: con turno de hoy no se consulta la relación asistencial', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    c.agendar(MEDICO, PACIENTE, hoyEnLaPazALas(10), LA_PAZ);

    await c.service.assertPuedeLeerHistoria(
      PACIENTE,
      actorCon('u', 'CLINICIAN'),
    );

    expect(
      c.careRelationshipsRepo.findActiveForPractitionerPatient,
    ).not.toHaveBeenCalled();
  });

  it('resuelve el vínculo de la cuenta UNA sola vez por lectura', async () => {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });

    await c.service
      .assertPuedeLeerHistoria(PACIENTE, actorCon('u', 'CLINICIAN'))
      .catch(() => undefined);

    expect(c.accountLinksRepo.findActiveByUser).toHaveBeenCalledTimes(1);
  });
});

describe('ClinicalReadService · assertPuedeEscribirHistoria (MCH-007)', () => {
  const MEDICO = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const PACIENTE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const LA_PAZ = 'America/La_Paz';

  const medico = () =>
    ({
      id: 'u',
      roles: ['PRACTITIONER'],
      practitionerProfileId: MEDICO,
      tenantIds: ['t1'],
    }) as any;

  /** El PDP de verdad decide por nivel: acá sólo concede lo que se le diga. */
  const pdpQueConcede = (c: ReturnType<typeof build>, acciones: string[]) =>
    c.pdp.evaluate.mockImplementation(async (dto: { action: string }) => ({
      decision: acciones.includes(dto.action) ? 'PERMIT' : 'DENY',
    }));

  function medicoSinTurno() {
    const c = build();
    c.darDeAltaProfesional(MEDICO);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({ personId: MEDICO });
    return c;
  }

  it('un grant de sólo lectura deja leer pero no escribir', async () => {
    const c = medicoSinTurno();
    pdpQueConcede(c, ['READ']);

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, medico()),
    ).resolves.toBeUndefined();
    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, medico()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(c.pdp.evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'WRITE', patientProfileId: PACIENTE }),
      expect.anything(),
    );
  });

  it('un grant de escritura habilita escribir', async () => {
    const c = medicoSinTurno();
    pdpQueConcede(c, ['READ', 'WRITE']);

    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, medico()),
    ).resolves.toBeUndefined();
  });

  it('sin vínculo ni grant no se escribe', async () => {
    const c = medicoSinTurno();

    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, medico()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('quien lo atiende hoy escribe sin preguntarle al PDP', async () => {
    const c = medicoSinTurno();
    const ahora = new Date();
    c.agendar(MEDICO, PACIENTE, ahora, LA_PAZ);

    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, medico()),
    ).resolves.toBeUndefined();
    expect(c.pdp.evaluate).not.toHaveBeenCalled();
  });

  it('el titular no escribe su propia historia por serlo', async () => {
    const c = build();
    c.darDeAltaPaciente(PACIENTE);
    c.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: PACIENTE,
    });
    const paciente = { id: 'u', roles: ['PATIENT'] } as any;

    await expect(
      c.service.assertPuedeLeerHistoria(PACIENTE, paciente),
    ).resolves.toBeUndefined();
    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, paciente),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('SUPERADMIN pasa, como en el resto del sistema de roles', async () => {
    const c = build();
    await expect(
      c.service.assertPuedeEscribirHistoria(PACIENTE, {
        id: 'root',
        roles: ['SUPERADMIN'],
      } as any),
    ).resolves.toBeUndefined();
  });
});
