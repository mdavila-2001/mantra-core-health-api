import { jest } from '@jest/globals';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { LabStaffGuard } from '../../diagnostics/guards';
import { LabPortalServicesController } from './lab-portal-services.controller';

describe('LabPortalServicesController', () => {
  it('hangs from diagnostics/lab and is guarded by lab membership, not a platform role', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, LabPortalServicesController),
    ).toBe('diagnostics/lab');
    expect(
      Reflect.getMetadata(GUARDS_METADATA, LabPortalServicesController),
    ).toEqual([LabStaffGuard]);
    expect(
      Reflect.getMetadata(ROLES_KEY, LabPortalServicesController),
    ).toBeUndefined();
  });

  it('delegates to the catalog, the categories and the importer', async () => {
    const catalog = {
      list: jest.fn(async () => ({ items: [], count: 0 })),
      create: jest.fn(async () => ({ id: 's1' })),
      update: jest.fn(async () => ({ id: 's1' })),
      withdraw: jest.fn(async () => ({ id: 's1', status: 'WITHDRAWN' })),
    };
    const categories = {
      list: jest.fn(async () => ({ items: [], count: 0 })),
      create: jest.fn(async () => ({ id: 'c1' })),
      rename: jest.fn(async () => ({ id: 'c1' })),
      remove: jest.fn(async () => ({ ok: true })),
    };
    const importer = { import: jest.fn(async () => ({ created: 0 })) };
    const studyCatalog = {
      catalog: jest.fn(async () => ({ sections: [], count: 0 })),
      importCatalog: jest.fn(async () => ({ created: 1 })),
    };
    const controller = new LabPortalServicesController(
      catalog as any,
      categories as any,
      importer as any,
      studyCatalog as any,
    );
    const actor = { id: 'u1' } as any;

    await controller.listServices({ q: 'x' });
    await controller.createService({ code: 'A' } as any, actor);
    await controller.updateService('s1', { name: 'B' } as any, actor);
    await controller.withdrawService('s1', actor);
    await controller.importServices(
      { mode: 'UPDATE_ONLY', rows: [] } as any,
      actor,
    );
    await controller.listCategories();
    await controller.createCategory({ name: 'Hormonas' }, actor);
    await controller.renameCategory('c1', { name: 'Hormonas II' }, actor);
    await controller.deleteCategory('c1');
    await controller.studyCatalogItems();
    await controller.importCatalog({ conceptIds: ['c1'] }, actor);

    expect(catalog.list).toHaveBeenCalledWith({ q: 'x' });
    expect(catalog.create).toHaveBeenCalledWith({ code: 'A' }, actor);
    expect(catalog.update).toHaveBeenCalledWith('s1', { name: 'B' }, actor);
    expect(catalog.withdraw).toHaveBeenCalledWith('s1', actor);
    expect(importer.import).toHaveBeenCalledWith(
      { mode: 'UPDATE_ONLY', rows: [] },
      actor,
    );
    expect(categories.list).toHaveBeenCalled();
    expect(categories.create).toHaveBeenCalledWith('Hormonas', actor);
    expect(categories.rename).toHaveBeenCalledWith('c1', 'Hormonas II', actor);
    expect(categories.remove).toHaveBeenCalledWith('c1');
    expect(studyCatalog.catalog).toHaveBeenCalled();
    expect(studyCatalog.importCatalog).toHaveBeenCalledWith(
      { conceptIds: ['c1'] },
      actor,
    );
  });
});
