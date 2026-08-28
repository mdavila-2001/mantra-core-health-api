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
  const bookingsRepo = {
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

  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ClinicalReadService(
    em as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    practitionerProfilesRepo as any,
    bookingsRepo as any,
    logger as any,
  );

  return {
    service,
    accountLinksRepo,
    patientProfilesRepo,
    practitionerProfilesRepo,
    bookingsRepo,
    darDeAltaPaciente,
    darDeAltaProfesional,
    agendar,
    logger,
  };
}

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
