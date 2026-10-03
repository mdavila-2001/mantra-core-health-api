import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';
import { PublicProfileProjectionService } from './public-profile-projection.service';
const fn = (impl?: any): any => (jest.fn as any)(impl);
function setup(profile: any = null) {
  const em: any = {
    flush: fn().mockResolvedValue(undefined),
    assign: fn((target: any, data: any) => Object.assign(target, data)),
  };
  const repo = {
    findByTarget: fn().mockResolvedValue(profile),
    create: fn((_: any, data: any) => ({ id: 'anchor', ...data })),
  };
  return { em, repo, service: new PublicProfileProjectionService(repo as any) };
}
const data = {
  tenantId: 'tenant',
  displayName: 'Alianza',
  fileId: 'logo',
  actorUserId: 'actor',
};
describe('Logo anterior a la publicación', () => {
  it('guardar crea un ancla pendiente sin visibilidad pública', async () => {
    const s = setup();
    await s.service.setOrganizationLogo(s.em, data);
    const record = s.repo.create.mock.calls[0][1];
    expect(record.statusConceptId).toBe(CONCEPTS.STATE_PENDING);
    expect(record.visibilityConceptId).toBeUndefined();
    expect(record.avatarFileId).toBe('logo');
  });
  it('quitar cuando no existe perfil no crea ni publica nada', async () => {
    const s = setup();
    await s.service.setOrganizationLogo(s.em, { ...data, fileId: null });
    expect(s.repo.create).not.toHaveBeenCalled();
  });
  it('la verificación posterior publica el mismo ancla conservando su logo', async () => {
    const profile = {
      id: 'anchor',
      avatarFileId: 'logo',
      statusConceptId: CONCEPTS.STATE_PENDING,
    } as any;
    const s = setup(profile);
    expect(
      await s.service.projectOrganization(s.em, {
        tenantId: 'tenant',
        targetId: 'tenant',
        slug: 'organization-tenant',
        displayName: 'Alianza',
        actorUserId: 'actor',
      }),
    ).toBe('anchor');
    expect(profile.visibilityConceptId).toBe(COMM.PROFILE_VISIBILITY_PUBLIC);
    expect(profile.avatarFileId).toBe('logo');
    expect(s.repo.create).not.toHaveBeenCalled();
  });
  it('verificar no cambia la visibilidad privada decidida explícitamente', async () => {
    const profile = {
      id: 'profile',
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PRIVATE,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    };
    const s = setup(profile);
    await s.service.projectOrganization(s.em, {
      tenantId: 'tenant',
      targetId: 'tenant',
      slug: 'organization-tenant',
      displayName: 'Alianza',
      actorUserId: 'actor',
    });
    expect(profile.visibilityConceptId).toBe(COMM.PROFILE_VISIBILITY_PRIVATE);
  });
});
