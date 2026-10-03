import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import { OrganizationLogoService } from './organization-logo.service';

const fn = (): any => jest.fn();
const actor = { id: 'operator', roles: ['USER'] } as any;
function setup() {
  const em: any = { fork: fn(), transactional: fn() };
  em.fork.mockReturnValue(em);
  em.transactional.mockImplementation((cb: any) => cb(em));
  const tenants = {
    findById: fn().mockResolvedValue({ id: 'tenant', legalName: 'Company' }),
  };
  const permissions = {
    assertCanRead: fn().mockResolvedValue(undefined),
    assertCanAdminister: fn().mockResolvedValue(undefined),
  };
  const profiles = {
    getOrganizationLogo: fn().mockResolvedValue('logo'),
    setOrganizationLogo: fn().mockResolvedValue('public-profile'),
  };
  const valid = {
    file: {
      sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
      createdByUserId: 'other-member',
    },
    version: { sizeBytes: '135' },
  };
  const attachable = {
    assertUsableBy: fn().mockResolvedValue(valid),
    assertUsableForAuthorizedContext: fn().mockResolvedValue(valid),
  };
  const uploads = {
    downloadForAuthorizedContext: fn().mockResolvedValue({
      buffer: Buffer.from('image'),
      mimeType: 'image/png',
    }),
  };
  const service = new OrganizationLogoService(
    em,
    tenants as any,
    permissions as any,
    profiles as any,
    attachable as any,
    uploads as any,
  );
  return { service, permissions, profiles, attachable, uploads, valid };
}

describe('OrganizationLogoService — permisos y contexto', () => {
  it('no escribe cuando el actor no administra ese tenant', async () => {
    const s = setup();
    s.permissions.assertCanAdminister.mockRejectedValue(
      new ForbiddenException(),
    );
    await expect(s.service.set('foreign', 'logo', actor)).rejects.toThrow(
      ForbiddenException,
    );
    expect(s.attachable.assertUsableBy).not.toHaveBeenCalled();
    expect(s.profiles.setOrganizationLogo).not.toHaveBeenCalled();
  });
  it('rechaza imagen PHI sin asociarla a una vitrina', async () => {
    const s = setup();
    s.valid.file.sensitivityConceptId = CONCEPTS.SENSITIVITY_PHI;
    await expect(s.service.set('tenant', 'logo', actor)).rejects.toThrow(
      'NORMAL',
    );
    expect(s.profiles.setOrganizationLogo).not.toHaveBeenCalled();
  });
  it('rechaza archivos de más de 2 MiB', async () => {
    const s = setup();
    s.valid.version.sizeBytes = String(2 * 1024 * 1024 + 1);
    await expect(s.service.set('tenant', 'logo', actor)).rejects.toThrow(
      '2 MB',
    );
    expect(s.profiles.setOrganizationLogo).not.toHaveBeenCalled();
  });
  it('conserva la comprobación de propietario al asociar un archivo', async () => {
    const s = setup();
    s.attachable.assertUsableBy.mockRejectedValue(new ForbiddenException());
    await expect(
      s.service.set('tenant', 'foreign-file', actor),
    ).rejects.toThrow(ForbiddenException);
    expect(s.profiles.setOrganizationLogo).not.toHaveBeenCalled();
  });
  it('quitar usa null explícito y no altera otros campos de la vitrina', async () => {
    const s = setup();
    await s.service.set('tenant', null, actor);
    expect(s.profiles.setOrganizationLogo).toHaveBeenCalledWith(
      expect.anything(),
      {
        tenantId: 'tenant',
        displayName: 'Company',
        fileId: null,
        actorUserId: 'operator',
      },
    );
    expect(s.attachable.assertUsableBy).not.toHaveBeenCalled();
  });
  it('miembro autorizado lee logo subido por otro miembro mediante su contexto', async () => {
    const s = setup();
    await s.service.content('tenant', actor);
    expect(s.permissions.assertCanRead).toHaveBeenCalledWith(
      expect.anything(),
      'tenant',
      actor,
    );
    expect(s.uploads.downloadForAuthorizedContext).toHaveBeenCalledWith(
      'logo',
      'directory.organization.logo',
    );
  });
  it('no lee bytes de una organización ajena', async () => {
    const s = setup();
    s.permissions.assertCanRead.mockRejectedValue(new ForbiddenException());
    await expect(s.service.content('foreign', actor)).rejects.toThrow(
      ForbiddenException,
    );
    expect(s.uploads.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });
});
