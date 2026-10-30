import { jest } from '@jest/globals';
import { CategoriesBulkHandler } from './categories.bulk-handler';

const CTX = { pharmacy: { id: 'pharmacy-1' }, actor: { id: 'user-1' } } as any;

function build() {
  const catalogRepo = {
    findCategoryByKey: jest.fn(async () => null as unknown),
  };
  const categories = {
    create: jest.fn(async () => ({
      id: 'cat-new',
      name: 'x',
      productCount: 0,
    })),
    rename: jest.fn(async () => ({ id: 'cat-1', name: 'x', productCount: 0 })),
  };
  const handler = new CategoriesBulkHandler(
    catalogRepo as any,
    categories as any,
  );
  return { handler, catalogRepo, categories };
}

describe('CategoriesBulkHandler', () => {
  it('keys a category by its name without case or accents', () => {
    const { handler } = build();
    expect(handler.keyOf({ name: 'Analgésicos' })).toBe(
      handler.keyOf({ name: '  analgesicos ' }),
    );
  });

  it('an empty or missing name has no key (the row is rejected)', () => {
    const { handler } = build();
    expect(handler.keyOf({ name: '' })).toBeNull();
    expect(handler.keyOf({ name: '   ' })).toBeNull();
    expect(handler.keyOf({})).toBeNull();
  });

  it('creates through the usual categories service', async () => {
    const d = build();
    await expect(
      d.handler.create({} as any, CTX, { name: 'Vitaminas' }),
    ).resolves.toBe('cat-new');
    expect(d.categories.create).toHaveBeenCalledWith(
      'pharmacy-1',
      'Vitaminas',
      CTX.actor,
    );
  });

  it('the same key with another spelling renames (UPDATED)', async () => {
    const d = build();
    const existing = { id: 'cat-1', name: 'analgesicos' } as any;
    await expect(
      d.handler.update({} as any, CTX, existing, { name: 'Analgésicos' }),
    ).resolves.toEqual({ id: 'cat-1', changed: true });
    expect(d.categories.rename).toHaveBeenCalledWith(
      'pharmacy-1',
      'cat-1',
      'Analgésicos',
      CTX.actor,
    );
  });

  it('the same spelling is UNCHANGED and does not rename', async () => {
    const d = build();
    const existing = { id: 'cat-1', name: 'Analgésicos' } as any;
    await expect(
      d.handler.update({} as any, CTX, existing, { name: 'Analgésicos' }),
    ).resolves.toEqual({ id: 'cat-1', changed: false });
    expect(d.categories.rename).not.toHaveBeenCalled();
  });
});
