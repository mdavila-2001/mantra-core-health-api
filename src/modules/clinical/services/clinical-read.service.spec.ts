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

const PACIENTE = '11111111-1111-1111-1111-111111111111';
const OTRO_PACIENTE = '22222222-2222-2222-2222-222222222222';

const titular = { id: 'user-1', roles: ['PATIENT'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const accountLinksRepo = { findActiveByUser: mockFn() };
  const personProfilesRepo = { findById: mockFn() };
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
    personProfilesRepo as any,
    logger as any,
  );

  return { service, accountLinksRepo, personProfilesRepo, logger };
}

describe('ClinicalReadService · assertOwnRecord', () => {
  it('deja pasar al titular: su cuenta y el perfil apuntan a la misma persona', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-1',
    });
    d.personProfilesRepo.findById.mockResolvedValue({ personId: 'persona-1' });

    await expect(
      d.service.assertOwnRecord(PACIENTE, titular),
    ).resolves.toBeUndefined();
  });

  it('rechaza la historia de otra persona', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-1',
    });
    d.personProfilesRepo.findById.mockResolvedValue({ personId: 'persona-2' });

    await expect(
      d.service.assertOwnRecord(OTRO_PACIENTE, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza a una cuenta sin persona vinculada', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);
    d.personProfilesRepo.findById.mockResolvedValue({ personId: 'persona-1' });

    await expect(
      d.service.assertOwnRecord(PACIENTE, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza un perfil que no existe: un uuid inventado no abre nada', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-1',
    });
    d.personProfilesRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.assertOwnRecord(PACIENTE, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el intento queda registrado: leer una historia ajena no es un error mudo', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-1',
    });
    d.personProfilesRepo.findById.mockResolvedValue({ personId: 'persona-2' });

    await expect(
      d.service.assertOwnRecord(OTRO_PACIENTE, titular),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('NO usa el claim del token: la titularidad sale de la base', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'persona-1',
    });
    d.personProfilesRepo.findById.mockResolvedValue({ personId: 'persona-2' });

    // El actor afirma en su token ser el titular de la historia ajena; da igual.
    const mentiroso = { ...titular, patientProfileId: OTRO_PACIENTE } as any;

    await expect(
      d.service.assertOwnRecord(OTRO_PACIENTE, mentiroso),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
