import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  assertDeclaredProfileIsActor,
  assertOrderRequesterIsActor,
  assertOwnOrFullAccess,
} from './clinical-authorship';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const clinician = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;
const superadmin = { id: 'root', roles: ['SUPERADMIN'] } as any;
const scopedSuperadmin = {
  id: 'admin-a',
  roles: ['SUPERADMIN'],
  scopedRoles: { 'tenant-a': ['SUPERADMIN'] },
  practitionerProfileId: 'hp-9',
} as any;

describe('assertDeclaredProfileIsActor', () => {
  it('acepta el perfil de la propia sesión', () => {
    expect(() =>
      assertDeclaredProfileIsActor('hp-1', clinician, 'no'),
    ).not.toThrow();
  });

  it('un cuerpo que no declara a nadie se deja pasar', () => {
    expect(() =>
      assertDeclaredProfileIsActor(undefined, clinician, 'no'),
    ).not.toThrow();
  });

  it('rechaza con el mensaje dado el perfil de otro profesional', () => {
    expect(() =>
      assertDeclaredProfileIsActor('hp-2', clinician, 'No en nombre de otro'),
    ).toThrow(new ForbiddenException('No en nombre de otro'));
  });

  it('el SUPERADMIN global puede actuar por cualquiera; el acotado no', () => {
    expect(() =>
      assertDeclaredProfileIsActor('hp-2', superadmin, 'no'),
    ).not.toThrow();
    expect(() =>
      assertDeclaredProfileIsActor('hp-2', scopedSuperadmin, 'no'),
    ).toThrow(ForbiddenException);
  });
});

describe('assertOrderRequesterIsActor', () => {
  it('es la regla anterior con el texto de las órdenes', () => {
    expect(() => assertOrderRequesterIsActor('hp-1', clinician)).not.toThrow();
    expect(() => assertOrderRequesterIsActor('hp-2', clinician)).toThrow(
      /solicitante de la orden/,
    );
  });
});

describe('assertOwnOrFullAccess', () => {
  const condition = (recordedByUserId?: string) => ({
    recordedByUserId,
    patientProfileId: 'pat-1',
  });

  it('lo que registró el propio actor no necesita más', async () => {
    const scopes = { resolveReadScope: mockFn() };

    await expect(
      assertOwnOrFullAccess(scopes, condition('user-1'), clinician),
    ).resolves.toBeUndefined();
    expect(scopes.resolveReadScope).not.toHaveBeenCalled();
  });

  it('un registro sin autor conocido no se trata como ajeno', async () => {
    const scopes = { resolveReadScope: mockFn() };

    await expect(
      assertOwnOrFullAccess(scopes, condition(undefined), clinician),
    ).resolves.toBeUndefined();
    expect(scopes.resolveReadScope).not.toHaveBeenCalled();
  });

  it('lo de otro profesional se modifica con acceso completo', async () => {
    const scopes = {
      resolveReadScope: mockFn().mockResolvedValue({ kind: 'FULL' }),
    };

    await expect(
      assertOwnOrFullAccess(scopes, condition('user-2'), clinician),
    ).resolves.toBeUndefined();
    expect(scopes.resolveReadScope).toHaveBeenCalledWith('pat-1', clinician);
  });

  it('lo de otro profesional NO se modifica con un alcance por especialidades', async () => {
    const scopes = {
      resolveReadScope: mockFn().mockResolvedValue({
        kind: 'SPECIALTIES',
        specialtyConceptIds: ['esp-1'],
      }),
    };

    await expect(
      assertOwnOrFullAccess(scopes, condition('user-2'), clinician),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
