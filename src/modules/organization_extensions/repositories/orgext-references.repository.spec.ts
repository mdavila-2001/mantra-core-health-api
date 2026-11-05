import { jest } from '@jest/globals';
import { Files } from '../../common/entities';
import { PublicProfiles } from '../../community/entities';
import {
  ClinicalUnits,
  HealthcareServices,
  PracticeSites,
  Practices,
} from '../../practice/entities';
import { DataUseAgreements } from '../entities';
import { OrgextReferencesRepository } from './orgext-references.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('OrgextReferencesRepository', () => {
  const repo = new OrgextReferencesRepository();
  const tenants = ['t1', 't2'];

  it('la práctica se busca por id acotada a los tenants', async () => {
    const em = {
      count: mockFn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
    } as any;

    await expect(repo.practiceInTenants(em, 'p', tenants)).resolves.toBe(true);
    await expect(repo.practiceInTenants(em, 'p', tenants)).resolves.toBe(false);

    expect(em.count).toHaveBeenCalledWith(Practices, {
      id: 'p',
      tenantId: { $in: tenants },
    });
  });

  it('la sede hereda el tenant de su práctica y una sede inexistente no pertenece', async () => {
    const em = {
      findOne: mockFn()
        .mockResolvedValueOnce({ practiceId: 'p' })
        .mockResolvedValueOnce(null),
      count: mockFn().mockResolvedValue(1),
    } as any;

    await expect(repo.practiceSiteInTenants(em, 's', tenants)).resolves.toBe(
      true,
    );
    await expect(repo.practiceSiteInTenants(em, 's9', tenants)).resolves.toBe(
      false,
    );

    expect(em.findOne).toHaveBeenNthCalledWith(1, PracticeSites, { id: 's' });
    expect(em.count).toHaveBeenCalledTimes(1);
    expect(em.count).toHaveBeenCalledWith(Practices, {
      id: 'p',
      tenantId: { $in: tenants },
    });
  });

  it('el servicio de salud y la unidad clínica heredan el tenant por su práctica y su sede', async () => {
    const em = {
      findOne: mockFn()
        .mockResolvedValueOnce({ practiceId: 'p' })
        .mockResolvedValueOnce({ practiceSiteId: 's' })
        .mockResolvedValueOnce({ practiceId: 'p2' }),
      count: mockFn().mockResolvedValueOnce(0).mockResolvedValueOnce(1),
    } as any;

    await expect(
      repo.healthcareServiceInTenants(em, 'hs', tenants),
    ).resolves.toBe(false);
    await expect(repo.clinicalUnitInTenants(em, 'cu', tenants)).resolves.toBe(
      true,
    );

    expect(em.findOne).toHaveBeenNthCalledWith(1, HealthcareServices, {
      id: 'hs',
    });
    expect(em.findOne).toHaveBeenNthCalledWith(2, ClinicalUnits, { id: 'cu' });
    expect(em.findOne).toHaveBeenNthCalledWith(3, PracticeSites, { id: 's' });
  });

  it('perfil público, archivo y DUA llevan tenant propio', async () => {
    const em = { count: mockFn().mockResolvedValue(1) } as any;

    await repo.publicProfileInTenants(em, 'pp', tenants);
    await repo.fileInTenants(em, 'f', tenants);
    await repo.dataUseAgreementInTenants(em, 'dua', tenants);

    expect(em.count).toHaveBeenNthCalledWith(1, PublicProfiles, {
      id: 'pp',
      tenantId: { $in: tenants },
    });
    expect(em.count).toHaveBeenNthCalledWith(2, Files, {
      id: 'f',
      tenantId: { $in: tenants },
    });
    expect(em.count).toHaveBeenNthCalledWith(3, DataUseAgreements, {
      id: 'dua',
      tenantId: { $in: tenants },
    });
  });
});
