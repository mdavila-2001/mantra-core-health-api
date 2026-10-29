import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PharmacyCategoriesService } from './pharmacy-categories.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const T1 = 't1';
const actor = {
  id: 'staff-1',
  roles: ['PHARMACY_STAFF'],
  tenantIds: [T1],
} as any;
const inTenant = <T>(fn: () => Promise<T>) => runWithTenant(T1, fn);

function build() {
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    remove: mockFn(),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: () => tx,
  };
  const pharmaciesRepo = {
    findByIdInTenant: mockFn().mockResolvedValue({ id: 'ph1', tenantId: T1 }),
  };
  const catalogRepo = {
    listCategories: mockFn().mockResolvedValue([]),
    countLiveProductsByCategory: mockFn().mockResolvedValue(new Map()),
    findCategory: mockFn().mockResolvedValue(null),
    findCategoryByKey: mockFn().mockResolvedValue(null),
    createCategory: mockFn((_tx: unknown, data: any) => ({
      id: 'c-new',
      ...data,
    })),
    detachCategoryFromRetired: mockFn().mockResolvedValue(undefined),
    insertMissingCategories: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmacyCategoriesService(
    em,
    pharmaciesRepo as any,
    catalogRepo as any,
    logger as any,
  );
  return { service, tx, pharmaciesRepo, catalogRepo };
}

describe('PharmacyCategoriesService (P47 D8)', () => {
  it('lista por nombre con cuántos productos vivos usan cada una', async () => {
    const d = build();
    d.catalogRepo.listCategories.mockResolvedValue([
      { id: 'b', name: 'Bienestar' },
      { id: 'a', name: 'Dermocosmética' },
    ]);
    d.catalogRepo.countLiveProductsByCategory.mockResolvedValue(
      new Map([['a', 3]]),
    );
    const res = await inTenant(() => d.service.list('ph1', actor));
    expect(res.items).toEqual([
      { id: 'b', name: 'Bienestar', productCount: 0 },
      { id: 'a', name: 'Dermocosmética', productCount: 3 },
    ]);
  });

  it('la farmacia de otro tenant es el 404 de siempre', async () => {
    const d = build();
    d.pharmaciesRepo.findByIdInTenant.mockResolvedValue(null);
    await expect(
      inTenant(() => d.service.list('ph-x', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('crea con el nombre limpio y su clave', async () => {
    const d = build();
    const res = await inTenant(() =>
      d.service.create('ph1', '  Vitaminas  ', actor),
    );
    expect(d.catalogRepo.createCategory).toHaveBeenCalledWith(d.tx, {
      pharmacyId: 'ph1',
      name: 'Vitaminas',
      nameKey: 'vitaminas',
      actorUserId: 'staff-1',
    });
    expect(res).toEqual({ id: 'c-new', name: 'Vitaminas', productCount: 0 });
  });

  it('un nombre repetido sin tildes ni mayúsculas es 409', async () => {
    const d = build();
    d.catalogRepo.findCategoryByKey.mockResolvedValue({ id: 'x' });
    await expect(
      inTenant(() => d.service.create('ph1', 'DERMOCOSMETICA', actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.catalogRepo.findCategoryByKey).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'dermocosmetica',
    );
  });

  it('un nombre en blanco es 422', async () => {
    const d = build();
    await expect(
      inTenant(() => d.service.create('ph1', '   ', actor)),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('renombrar una categoría de otra farmacia es 404 y no toca nada', async () => {
    const d = build();
    await expect(
      inTenant(() => d.service.rename('ph1', 'c-ajena', 'Nueva', actor)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.catalogRepo.findCategory).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'c-ajena',
    );
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('renombrar a su propio nombre con otra grafía no es un conflicto', async () => {
    const d = build();
    const category = { id: 'c1', name: 'Bienestar', nameKey: 'bienestar' };
    d.catalogRepo.findCategory.mockResolvedValue(category);
    d.catalogRepo.findCategoryByKey.mockResolvedValue(category);
    const res = await inTenant(() =>
      d.service.rename('ph1', 'c1', 'BIENESTAR', actor),
    );
    expect(res.name).toBe('BIENESTAR');
  });

  it('eliminar una con productos vivos es 409', async () => {
    const d = build();
    d.catalogRepo.findCategory.mockResolvedValue({ id: 'c1' });
    d.catalogRepo.countLiveProductsByCategory.mockResolvedValue(
      new Map([['c1', 2]]),
    );
    await expect(
      inTenant(() => d.service.remove('ph1', 'c1', actor)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.tx.remove).not.toHaveBeenCalled();
  });

  it('eliminar una sin productos vivos suelta a los retirados y la borra', async () => {
    const d = build();
    const category = { id: 'c1' };
    d.catalogRepo.findCategory.mockResolvedValue(category);
    await inTenant(() => d.service.remove('ph1', 'c1', actor));
    expect(d.catalogRepo.detachCategoryFromRetired).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'c1',
    );
    expect(d.tx.remove).toHaveBeenCalledWith(category);
  });

  it('resolveByName busca sólo en la farmacia dada; otra es 422', async () => {
    const d = build();
    await expect(
      d.service.resolveByName(d.tx, 'ph1', 'Bienestar'),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.catalogRepo.findCategoryByKey).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'bienestar',
    );
  });

  it('provisionDefaults inserta las seis del mockup, idempotente', async () => {
    const d = build();
    await d.service.provisionDefaults(d.tx, 'ph1', 'u1');
    const [, , categories] =
      d.catalogRepo.insertMissingCategories.mock.calls[0];
    expect(categories.map((c: any) => c.nameKey)).toEqual([
      'medicamentos',
      'dermocosmetica',
      'cuidado personal',
      'bebe y maternidad',
      'dispositivos',
      'bienestar',
    ]);
  });
});
