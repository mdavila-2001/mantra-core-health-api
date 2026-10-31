import { jest } from '@jest/globals';
import { PractitionerAffiliationRepository } from './practitioner-affiliation.repository';
import { SupportDirectoryRepository } from './support-directory.repository';
import { PRAC } from '../../practice/practice.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import {
  PracticeSites,
  Practices,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import {
  HealthPractitionerProfiles,
  PersonAccountLinks,
} from '../../profiles/entities';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PractitionerAffiliationRepository', () => {
  const repo = new PractitionerAffiliationRepository();

  it('el destino es la primera práctica activa por código y su primera sede activa por código', async () => {
    const em: any = {
      find: mockFn((entity: unknown) =>
        Promise.resolve(
          entity === Practices
            ? [
                { id: 'p-b', code: 'B' },
                { id: 'p-a', code: 'A' },
              ]
            : entity === PracticeSites
              ? [
                  { id: 's-2', code: 'S2' },
                  { id: 's-1', code: 'S1' },
                ]
              : [],
        ),
      ),
    };
    await expect(repo.findTarget(em, 'tenant-1')).resolves.toEqual({
      practiceId: 'p-a',
      practiceSiteId: 's-1',
    });
    expect(em.find).toHaveBeenCalledWith(Practices, {
      tenantId: 'tenant-1',
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
    expect(em.find).toHaveBeenCalledWith(PracticeSites, {
      practiceId: 'p-a',
      statusConceptId: PRAC.SITE_ACTIVE,
    });
  });

  it('sin práctica activa no hay destino; sin sede activa queda sin sede', async () => {
    const none: any = { find: mockFn().mockResolvedValue([]) };
    await expect(repo.findTarget(none, 't')).resolves.toBeNull();
    const noSite: any = {
      find: mockFn((entity: unknown) =>
        Promise.resolve(entity === Practices ? [{ id: 'p', code: 'A' }] : []),
      ),
    };
    await expect(repo.findTarget(noSite, 't')).resolves.toEqual({
      practiceId: 'p',
      practiceSiteId: undefined,
    });
  });

  it('crea la solicitud PENDING con rol de atención, sin servicio, iniciada por la cuenta del médico', async () => {
    const em: any = {
      findOne: mockFn().mockResolvedValue(null),
      create: mockFn((_e: unknown, data: any) => ({ id: 'new', ...data })),
    };
    const row = await repo.ensurePending(
      em,
      'hp1',
      { practiceId: 'p1', practiceSiteId: 's1' },
      'user-ana',
    );
    expect(em.create).toHaveBeenCalledWith(
      PractitionerRoleAssignments,
      expect.objectContaining({
        practitionerProfileId: 'hp1',
        practiceId: 'p1',
        practiceSiteId: 's1',
        roleConceptId: PRAC.ROLE_ATTENDING,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        createdByUserId: 'user-ana',
      }),
      { partial: true },
    );
    expect(row.id).toBe('new');
  });

  it('si ya hay una pendiente sin servicio en esa práctica la devuelve y no apila otra', async () => {
    const em: any = {
      findOne: mockFn().mockResolvedValue({ id: 'ya' }),
      create: mockFn(),
    };
    const row = await repo.ensurePending(em, 'hp1', { practiceId: 'p1' }, 'u');
    expect(row.id).toBe('ya');
    expect(em.create).not.toHaveBeenCalled();
    expect(em.findOne).toHaveBeenCalledWith(PractitionerRoleAssignments, {
      practitionerProfileId: 'hp1',
      practiceId: 'p1',
      healthcareServiceId: null,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
    });
  });
});

describe('SupportDirectoryRepository · persona y perfil profesional de la cuenta', () => {
  const repo = new SupportDirectoryRepository();

  it('la persona sale del vínculo activo de profiles (PROF.ACCOUNT_LINK_ACTIVE), no de otro estado', async () => {
    const em: any = {
      findOne: mockFn().mockResolvedValue({ personId: 'person-ana' }),
    };
    await expect(repo.findPersonIdOfUser(em, 'user-ana')).resolves.toBe(
      'person-ana',
    );
    expect(em.findOne).toHaveBeenCalledWith(PersonAccountLinks, {
      userId: 'user-ana',
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  });

  it('el perfil profesional es el de la persona (profile_id = persons.id); sin él, null', async () => {
    const em: any = {
      findOne: mockFn((entity: unknown) =>
        Promise.resolve(
          entity === PersonAccountLinks
            ? { personId: 'person-ana' }
            : { profileId: 'person-ana' },
        ),
      ),
    };
    await expect(
      repo.findPractitionerProfileIdOfUser(em, 'user-ana'),
    ).resolves.toBe('person-ana');
    expect(em.findOne).toHaveBeenCalledWith(HealthPractitionerProfiles, {
      profileId: 'person-ana',
    });
    const notDoctor: any = {
      findOne: mockFn((entity: unknown) =>
        Promise.resolve(
          entity === PersonAccountLinks ? { personId: 'p' } : null,
        ),
      ),
    };
    await expect(
      repo.findPractitionerProfileIdOfUser(notDoctor, 'u'),
    ).resolves.toBeNull();
    const noPerson: any = { findOne: mockFn().mockResolvedValue(null) };
    await expect(
      repo.findPractitionerProfileIdOfUser(noPerson, 'u'),
    ).resolves.toBeNull();
  });
});
