import { jest } from '@jest/globals';
import {
  FacilityLicenses,
  Hospitals,
  OrganizationAffiliations,
} from '../entities';
import { FacilityLicensesRepository } from './facility-licenses.repository';
import { HospitalsRepository } from './hospitals.repository';
import { OrganizationAffiliationsRepository } from './organization-affiliations.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '00000000-0000-4000-8000-0000000000a1';
const ID = '00000000-0000-4000-8000-0000000000d4';

describe('Repositorios de organization_extensions · búsquedas acotadas al tenant (ORGEXT-01)', () => {
  it('hospital y licencia se buscan por id + tenant, nunca sólo por id', async () => {
    const em = { findOne: mockFn().mockResolvedValue(null) } as any;

    await new HospitalsRepository().findByIdInTenant(em, ID, T1);
    await new FacilityLicensesRepository().findByIdInTenant(em, ID, T1);

    expect(em.findOne).toHaveBeenNthCalledWith(1, Hospitals, {
      id: ID,
      tenantId: T1,
    });
    expect(em.findOne).toHaveBeenNthCalledWith(2, FacilityLicenses, {
      id: ID,
      tenantId: T1,
    });
  });

  it('la afiliación sólo se encuentra para una de sus dos partes', async () => {
    const em = { findOne: mockFn().mockResolvedValue(null) } as any;

    await new OrganizationAffiliationsRepository().findByIdForParty(em, ID, T1);

    expect(em.findOne).toHaveBeenCalledWith(OrganizationAffiliations, {
      id: ID,
      $or: [{ primaryTenantId: T1 }, { participatingTenantId: T1 }],
    });
  });
});
