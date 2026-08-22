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
    logger as any,
  );

  return {
    service,
    accountLinksRepo,
    patientProfilesRepo,
    darDeAltaPaciente,
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
