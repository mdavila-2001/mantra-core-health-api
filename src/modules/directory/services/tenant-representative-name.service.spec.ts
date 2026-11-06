import { ForbiddenException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../../../common';
import { ResourceNotFoundException } from '../../../common';
import { TenantRepresentativeNameService } from './tenant-representative-name.service';

const fn = (): any => jest.fn();
const ROLE_CONCEPT = 'concept-legal-rep';
const actor = { id: 'user-1' } as AuthenticatedUser;

function build(options: { links?: object[]; person?: object; deny?: boolean }) {
  const flush = fn();
  const tx = { flush };
  const em = { transactional: (fn: (t: unknown) => unknown) => fn(tx) };
  const tenantAdmin = {
    assertCanAdminister: jest.fn(() =>
      options.deny
        ? Promise.reject(new ForbiddenException())
        : Promise.resolve(),
    ),
  };
  const legalRepo = {
    listLegalRepsByTenant: fn().mockResolvedValue(options.links ?? []),
    findPersonsByIds: fn().mockResolvedValue(
      new Map(options.person ? [['person-1', options.person]] : []),
    ),
  };
  const concepts = {
    resolve: fn().mockResolvedValue({ representativeRole: new Map() }),
    conceptIdOf: fn().mockReturnValue(ROLE_CONCEPT),
  };
  const logger = { setContext: fn(), info: fn() };
  const service = new TenantRepresentativeNameService(
    em as never,
    tenantAdmin as never,
    legalRepo as never,
    concepts as never,
    logger as never,
  );
  return { service, flush, tenantAdmin };
}

const link = {
  personId: 'person-1',
  representativeRoleConceptId: ROLE_CONCEPT,
  isPrimary: true,
};
const dto = {
  name: ' Wendy ',
  middleName: 'Jennyfer',
  lastName: 'Dávila',
  motherLastName: 'Yamal',
};

describe('TenantRepresentativeNameService', () => {
  it('stores the four parts and recomposes the display name', async () => {
    const person = { name: 'Old', lastName: 'Old', displayName: 'Old Old' };
    const { service, flush } = build({ links: [link], person });

    const result = await service.update(
      'tenant-1',
      'LEGAL_REPRESENTATIVE',
      dto,
      actor,
    );

    expect(result).toMatchObject({
      role: 'LEGAL_REPRESENTATIVE',
      fullName: 'Wendy Jennyfer Dávila Yamal',
      name: 'Wendy',
      middleName: 'Jennyfer',
      lastName: 'Dávila',
      motherLastName: 'Yamal',
    });
    expect(person).toMatchObject({
      displayName: 'Wendy Jennyfer Dávila Yamal',
      updatedByUserId: 'user-1',
    });
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('clears an optional part sent as an empty string', async () => {
    const person = { name: 'A', lastName: 'B', middleName: 'C' };
    const { service } = build({ links: [link], person });

    const result = await service.update(
      'tenant-1',
      'LEGAL_REPRESENTATIVE',
      { name: 'Wendy', middleName: '', lastName: 'Dávila' },
      actor,
    );

    expect(result.fullName).toBe('Wendy Dávila');
    expect(result.middleName).toBeUndefined();
    expect((person as { middleName: unknown }).middleName).toBeNull();
  });

  it('rejects an actor that does not administer the organization', async () => {
    const { service, flush } = build({ deny: true });

    await expect(
      service.update('tenant-1', 'LEGAL_REPRESENTATIVE', dto, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flush).not.toHaveBeenCalled();
  });

  it('answers 404 when the organization has no such representative', async () => {
    const { service } = build({ links: [] });

    await expect(
      service.update('tenant-1', 'GENERAL_MANAGER', dto, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
