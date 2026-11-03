import { jest } from '@jest/globals';
import { DirectoryTenantAdministrationAdapter } from './directory-tenant-administration.adapter';

describe('DirectoryTenantAdministrationAdapter', () => {
  it('delegates tenant administration checks with the caller unit of work', async () => {
    const uow = {};
    const actor = { id: 'user-1', roles: ['USER'] };
    const directory = {
      canAdminister: jest.fn(async () => true),
    };
    const adapter = new DirectoryTenantAdministrationAdapter(directory as any);

    await expect(
      adapter.canAdminister(uow as any, 'tenant-1', actor),
    ).resolves.toBe(true);
    expect(directory.canAdminister).toHaveBeenCalledWith(
      uow,
      'tenant-1',
      actor,
    );
  });
});
