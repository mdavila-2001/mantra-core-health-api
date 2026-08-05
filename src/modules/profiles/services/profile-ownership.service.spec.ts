import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import { ProfileOwnershipService } from './profile-ownership.service';

const titular = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build({
  link = { personId: 'person-1' },
  practitioner = { profileId: 'person-1' },
  patient = { profileId: 'person-1' },
}: {
  link?: unknown;
  practitioner?: unknown;
  patient?: unknown;
} = {}) {
  const accountLinksRepo = {
    findActiveByUser: fn().mockResolvedValue(link),
  };
  const practitionersRepo = { findById: fn().mockResolvedValue(practitioner) };
  const patientsRepo = { findById: fn().mockResolvedValue(patient) };
  const service = new ProfileOwnershipService(
    accountLinksRepo as never,
    practitionersRepo as never,
    patientsRepo as never,
  );
  return {
    service,
    accountLinksRepo,
    practitionersRepo,
    patientsRepo,
    tx: {} as never,
  };
}

describe('ProfileOwnershipService', () => {
  it('deja pasar al profesional titular de su propio perfil', async () => {
    // El caso que motivó el servicio: el auto-registrado carga su propia matrícula.
    const { service, accountLinksRepo, tx } = build();

    await expect(
      service.assertOwnsPractitionerProfile(tx, 'person-1', titular),
    ).resolves.toBeUndefined();
    // El titular se resuelve del vínculo activo de la CUENTA, no de la petición.
    expect(accountLinksRepo.findActiveByUser).toHaveBeenCalledWith(
      tx,
      'user-1',
    );
  });

  it('rechaza a quien intenta tocar el perfil profesional de otra persona', async () => {
    const { service, tx } = build({ link: { personId: 'person-OTRA' } });

    await expect(
      service.assertOwnsPractitionerProfile(tx, 'person-1', titular),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza a una cuenta sin vínculo activo con ninguna persona', async () => {
    const { service, tx } = build({ link: null });

    await expect(
      service.assertOwnsPractitionerProfile(tx, 'person-1', titular),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza sobre un perfil inexistente sin revelar que no existe', async () => {
    // 403 y no 404: el que no es dueño no obtiene ni la existencia del perfil.
    const { service, tx } = build({ practitioner: null });

    await expect(
      service.assertOwnsPractitionerProfile(tx, 'person-x', titular),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deja pasar al paciente titular y rechaza al que no lo es', async () => {
    const { service, tx } = build();
    await expect(
      service.assertOwnsPatientProfile(tx, 'person-1', titular),
    ).resolves.toBeUndefined();

    const ajeno = build({ link: { personId: 'person-OTRA' } });
    await expect(
      ajeno.service.assertOwnsPatientProfile(ajeno.tx, 'person-1', titular),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deja pasar a la plataforma sin consultar perfiles ni vínculos', async () => {
    const { service, accountLinksRepo, practitionersRepo, patientsRepo, tx } =
      build({ link: null, practitioner: null, patient: null });

    for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
      const admin = { id: 'admin', roles: [role] } as any;
      await expect(
        service.assertOwnsPractitionerProfile(tx, 'person-1', admin),
      ).resolves.toBeUndefined();
      await expect(
        service.assertOwnsPatientProfile(tx, 'person-1', admin),
      ).resolves.toBeUndefined();
    }
    expect(accountLinksRepo.findActiveByUser).not.toHaveBeenCalled();
    expect(practitionersRepo.findById).not.toHaveBeenCalled();
    expect(patientsRepo.findById).not.toHaveBeenCalled();
  });
});
