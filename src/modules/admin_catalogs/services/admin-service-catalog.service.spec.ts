import { jest } from '@jest/globals';
import { OptimisticLockError } from '@mikro-orm/core';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ServiceCatalog } from '../../billing/entities';
import { Practices } from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { CatalogConcepts } from '../../terminology/entities';
import { AdminCatalogsErrorReason } from '../admin-catalogs.error-reasons';
import {
  AdminServiceCatalogService,
  price2,
} from './admin-service-catalog.service';

type Row = Record<string, any>;

const TENANT = 'tenant-1';
const OTHER_TENANT = 'tenant-2';
const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Patrón `ILIKE` a regex: `\\x` es literal, `%` cualquier cosa, `_` un carácter. */
function likeToRegex(pattern: string): RegExp {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '\\')
      source += (pattern[++i] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    else if (c === '%') source += '.*';
    else if (c === '_') source += '.';
    else source += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`, 'i');
}

/** Cumple `where` con el subconjunto de operadores que usa el servicio. */
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === '$or') return (cond as Row[]).some((w) => matches(row, w));
    if (key === '$and') return (cond as Row[]).every((w) => matches(row, w));
    const value = row[key];
    if (cond !== null && typeof cond === 'object') {
      if ('$in' in cond) return (cond.$in as unknown[]).includes(value);
      if ('$gt' in cond) return value > cond.$gt;
      if ('$ilike' in cond)
        return likeToRegex(String(cond.$ilike)).test(String(value));
    }
    return value === cond;
  });
}

/** Un EntityManager en memoria: sólo lo que el servicio le pide. */
function fakeEm(seed: { practices: Row[]; services: Row[]; concepts?: Row[] }) {
  const tables = new Map<unknown, Row[]>([
    [Practices, seed.practices],
    [ServiceCatalog, seed.services],
    [CatalogConcepts, seed.concepts ?? []],
  ]);
  const snapshots = new Map<Row, string>();
  const remember = () =>
    seed.services.forEach((r) => snapshots.set(r, JSON.stringify(r)));
  remember();
  const em: any = {
    fork: () => em,
    transactional: async (cb: (tx: unknown) => unknown) => cb(em),
    find: jest.fn(async (entity: unknown, where: Row, opts: Row = {}) => {
      let rows = (tables.get(entity) ?? []).filter((r) => matches(r, where));
      if (opts.orderBy) {
        const keys = Object.keys(opts.orderBy);
        rows = [...rows].sort((a, b) => {
          for (const k of keys) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1;
          return 0;
        });
      }
      return opts.limit ? rows.slice(0, opts.limit) : rows;
    }),
    findOne: jest.fn(
      async (entity: unknown, where: Row) =>
        (tables.get(entity) ?? []).find((r) => matches(r, where)) ?? null,
    ),
    create: (_entity: unknown, data: Row) => {
      const row = {
        id: `new-${seed.services.length + 1}`,
        rowVersion: 1,
        ...data,
      };
      seed.services.push(row);
      return row;
    },
    flush: jest.fn(async () => {
      for (const row of seed.services) {
        const before = snapshots.get(row);
        if (before !== undefined && before !== JSON.stringify(row))
          row.rowVersion += 1;
        snapshots.set(row, JSON.stringify(row));
      }
    }),
  };
  return em;
}

function practice(
  id: string,
  tenantId = TENANT,
  typeConceptId = 'type-clinic',
): Row {
  return {
    id,
    tenantId,
    name: `Práctica ${id}`,
    typeConceptId,
    statusConceptId: PRAC.PRACTICE_ACTIVE,
  };
}

function service(
  id: string,
  practiceId: string,
  code: string,
  extra: Row = {},
): Row {
  return {
    id,
    practiceId,
    code,
    name: `Servicio ${code}`,
    defaultPrice: '150.00',
    currencyConceptId: CONCEPTS.CURRENCY_BOB,
    isActive: true,
    rowVersion: 1,
    updatedAt: new Date('2026-10-31T10:00:00Z'),
    ...extra,
  };
}

function build(seed?: Partial<Parameters<typeof fakeEm>[0]>) {
  const data = {
    practices: [
      practice('p1'),
      practice('p2', TENANT, 'type-lab'),
      practice('foreign', OTHER_TENANT),
    ],
    services: [
      service('s1', 'p1', 'A'),
      service('s2', 'p1', 'B'),
      service('s3', 'p2', 'A'),
      service('sx', 'foreign', 'Z'),
    ],
    concepts: [
      { id: 'type-clinic', code: 'PR_TYPE_CLINIC', display: 'Clínica' },
      { id: 'type-lab', code: 'PR_TYPE_LAB', display: 'Laboratorio' },
    ],
    ...seed,
  };
  const em = fakeEm(data);
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const svc = new AdminServiceCatalogService(em, logger as any);
  const as = <T>(fn: () => Promise<T>, tenant = TENANT) =>
    runWithTenant(tenant, fn);
  return { svc, em, data, as };
}

describe('AdminServiceCatalogService', () => {
  describe('alcance por organización', () => {
    it('scopes devuelve sólo los tipos y las prácticas de la organización del token', async () => {
      const { svc, as } = build();
      const scopes = await as(() => svc.scopes());
      expect(scopes.practices.map((p) => p.id)).toEqual(['p1', 'p2']);
      expect(scopes.types.map((t) => t.code)).toEqual([
        'PR_TYPE_CLINIC',
        'PR_TYPE_LAB',
      ]);
      expect(scopes.currencies.map((c) => c.code)).toEqual(['BOB', 'USD']);
    });

    it('la lista nunca trae servicios de otra organización', async () => {
      const { svc, as } = build();
      const page = await as(() => svc.list({}));
      expect(page.items.map((i) => i.id)).toEqual(['s1', 's3', 's2']);
      expect(page.items.map((i) => i.id)).not.toContain('sx');
    });

    it('filtra por tipo de organización y marca el tipo en cada fila', async () => {
      const { svc, as } = build();
      const page = await as(() =>
        svc.list({ practiceTypeConceptId: 'type-lab' }),
      );
      expect(page.items).toHaveLength(1);
      expect(page.items[0]).toMatchObject({
        id: 's3',
        practiceTypeConceptId: 'type-lab',
      });
    });

    it('una práctica de otra organización es 404, no una lista vacía; igual que una inexistente', async () => {
      const { svc, as } = build();
      await expect(
        as(() => svc.list({ practiceId: 'foreign' })),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        as(() => svc.list({ practiceId: 'no-existe' })),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un servicio de otra organización responde el mismo 404 en lectura y en toda mutación', async () => {
      const { svc, as, data } = build();
      const antes = JSON.stringify(data.services.find((s) => s.id === 'sx'));
      await expect(as(() => svc.get('sx'))).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      await expect(as(() => svc.get('no-existe'))).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      await expect(
        as(() =>
          svc.update('sx', { expectedRowVersion: 1, name: 'Hack' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        as(() => svc.setActive('sx', 1, false, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(JSON.stringify(data.services.find((s) => s.id === 'sx'))).toBe(
        antes,
      );
    });

    it('sin organización en el contexto no hay catálogo', async () => {
      const { svc } = build();
      await expect(svc.list({})).rejects.toBeDefined();
    });
  });

  describe('paginación', () => {
    it('orden determinista (código, id) y cursor que no repite ni salta filas', async () => {
      const { svc, as } = build();
      const first = await as(() => svc.list({ limit: 2 }));
      expect(first.items.map((i) => i.id)).toEqual(['s1', 's3']);
      expect(first.nextCursor).not.toBeNull();
      const second = await as(() =>
        svc.list({ limit: 2, cursor: first.nextCursor! }),
      );
      expect(second.items.map((i) => i.id)).toEqual(['s2']);
      expect(second.nextCursor).toBeNull();
    });

    it('el texto de búsqueda no se interpreta como patrón: «%» y «_» son literales', async () => {
      const { svc, as } = build();
      expect((await as(() => svc.list({ q: '%' }))).items).toEqual([]);
      expect(
        (await as(() => svc.list({ q: 'servicio b' }))).items.map((i) => i.id),
      ).toEqual(['s2']);
    });
  });

  describe('alta', () => {
    const dto = {
      practiceId: 'p1',
      code: 'NUEVO',
      name: 'Servicio nuevo',
      defaultPrice: '99.5',
    };

    it('crea con los campos de creación y devuelve el precio con dos decimales', async () => {
      const { svc, as, data } = build();
      const result = await as(() => svc.create(dto as any, actor));
      expect(result.created).toBe(true);
      expect(result.item).toMatchObject({
        practiceId: 'p1',
        practiceTypeConceptId: 'type-clinic',
        code: 'NUEVO',
        defaultPrice: '99.50',
        currencyCode: 'BOB',
        isActive: true,
      });
      expect(
        data.services.some(
          (s) => s.code === 'NUEVO' && s.createdByUserId === 'admin-1',
        ),
      ).toBe(true);
    });

    it('es idempotente: la repetición idéntica devuelve el mismo servicio sin escribir', async () => {
      const { svc, as, data, em } = build();
      const first = await as(() => svc.create(dto as any, actor));
      const total = data.services.length;
      em.flush.mockClear();
      const again = await as(() =>
        svc.create({ ...dto, defaultPrice: '99.50' } as any, actor),
      );
      expect(again.created).toBe(false);
      expect(again.item.id).toBe(first.item.id);
      expect(data.services).toHaveLength(total);
      expect(em.flush).not.toHaveBeenCalled();
    });

    it('el mismo código con datos distintos es 409 SERVICE_CATALOG_CODE_ALREADY_EXISTS', async () => {
      const { svc, as } = build();
      await as(() => svc.create(dto as any, actor));
      const error = await as(() =>
        svc.create({ ...dto, name: 'Otro nombre' } as any, actor),
      ).catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_CODE_ALREADY_EXISTS,
      );
    });

    it('en otra práctica el mismo código sí se permite', async () => {
      const { svc, as } = build();
      const result = await as(() =>
        svc
          .create({ ...dto, practiceId: 'p2', code: 'NUEVO' } as any, actor)
          .catch((e) => e),
      );
      expect(result).not.toBeInstanceOf(ConflictException);
    });

    it('precio cero es 422; moneda no admitida es 422; práctica ajena es 404 y no escribe', async () => {
      const { svc, as, data } = build();
      const total = data.services.length;
      const cero = await as(() =>
        svc.create({ ...dto, defaultPrice: '0.00' } as any, actor),
      ).catch((e) => e);
      expect(cero).toBeInstanceOf(PreconditionFailedException);
      expect(cero.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
      );
      const moneda = await as(() =>
        svc.create({ ...dto, currencyConceptId: 'otra-moneda' } as any, actor),
      ).catch((e) => e);
      expect(moneda.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_CURRENCY_NOT_SUPPORTED,
      );
      await expect(
        as(() => svc.create({ ...dto, practiceId: 'foreign' } as any, actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(data.services).toHaveLength(total);
    });
  });

  describe('edición con versión optimista', () => {
    it('aplica el cambio, sube la versión y sella al actor', async () => {
      const { svc, as, data } = build();
      const item = await as(() =>
        svc.update(
          's1',
          {
            expectedRowVersion: 1,
            name: 'Nuevo nombre',
            defaultPrice: '175',
          } as any,
          actor,
        ),
      );
      expect(item).toMatchObject({
        name: 'Nuevo nombre',
        defaultPrice: '175.00',
        rowVersion: 2,
        updatedByUserId: 'admin-1',
      });
      expect(data.services.find((s) => s.id === 's1')!.rowVersion).toBe(2);
    });

    it('versión vencida: 409 con expected/actual y la fila queda intacta', async () => {
      const { svc, as, data } = build();
      data.services.find((s) => s.id === 's1')!.rowVersion = 4;
      const antes = JSON.stringify(data.services.find((s) => s.id === 's1'));
      const error = await as(() =>
        svc.update(
          's1',
          { expectedRowVersion: 3, name: 'Pisada' } as any,
          actor,
        ),
      ).catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_VERSION_MISMATCH,
      );
      expect(error.details).toEqual({ expected: 3, actual: 4 });
      expect(JSON.stringify(data.services.find((s) => s.id === 's1'))).toBe(
        antes,
      );
    });

    it('la carrera que gana el otro flush (OptimisticLockError) también es 409 de versión', async () => {
      const { svc, as, em } = build();
      em.flush.mockRejectedValueOnce(new (OptimisticLockError as any)('lock'));
      const error = await as(() =>
        svc.update('s1', { expectedRowVersion: 1, name: 'X' } as any, actor),
      ).catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_VERSION_MISMATCH,
      );
    });

    it('vaciar un texto lo limpia; la moneda sólo cambia junto con el precio', async () => {
      const { svc, as, data } = build();
      data.services.find((s) => s.id === 's1')!.descriptionText = 'Algo';
      const limpio = await as(() =>
        svc.update(
          's1',
          { expectedRowVersion: 1, descriptionText: '' } as any,
          actor,
        ),
      );
      expect(limpio.descriptionText).toBeNull();
      const soloMoneda = await as(() =>
        svc.update(
          's1',
          {
            expectedRowVersion: 2,
            name: 'Y',
            currencyConceptId: CONCEPTS.CURRENCY_USD,
          } as any,
          actor,
        ),
      );
      expect(soloMoneda.currencyCode).toBe('BOB');
      const conPrecio = await as(() =>
        svc.update(
          's1',
          {
            expectedRowVersion: 3,
            defaultPrice: '20.00',
            currencyConceptId: CONCEPTS.CURRENCY_USD,
          } as any,
          actor,
        ),
      );
      expect(conPrecio.currencyCode).toBe('USD');
    });

    it('edición vacía y precio cero se rechazan sin leer ni escribir', async () => {
      const { svc, as, em } = build();
      const vacia = await as(() =>
        svc.update('s1', { expectedRowVersion: 1 } as any, actor),
      ).catch((e) => e);
      expect(vacia.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_EMPTY_UPDATE,
      );
      const cero = await as(() =>
        svc.update(
          's1',
          { expectedRowVersion: 1, defaultPrice: '0' } as any,
          actor,
        ),
      ).catch((e) => e);
      expect(cero.reason).toBe(
        AdminCatalogsErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
      );
      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe('desactivar y reactivar', () => {
    it('desactiva sin borrar y sube la versión', async () => {
      const { svc, as, data } = build();
      const item = await as(() => svc.setActive('s1', 1, false, actor));
      expect(item).toMatchObject({ isActive: false, rowVersion: 2 });
      expect(data.services.some((s) => s.id === 's1')).toBe(true);
    });

    it('repetir la misma acción es idempotente: no sube la versión ni escribe', async () => {
      const { svc, as, em } = build();
      await as(() => svc.setActive('s1', 1, false, actor));
      em.flush.mockClear();
      const again = await as(() => svc.setActive('s1', 2, false, actor));
      expect(again).toMatchObject({ isActive: false, rowVersion: 2 });
      expect(em.flush).not.toHaveBeenCalled();
    });

    it('con versión vencida es 409, incluso si ya estaba en ese estado', async () => {
      const { svc, as } = build();
      const error = await as(() => svc.setActive('s1', 9, false, actor)).catch(
        (e) => e,
      );
      expect(error).toBeInstanceOf(ConflictException);
    });

    it('reactiva', async () => {
      const { svc, as } = build();
      await as(() => svc.setActive('s1', 1, false, actor));
      expect(await as(() => svc.setActive('s1', 2, true, actor))).toMatchObject(
        { isActive: true, rowVersion: 3 },
      );
    });
  });

  it('price2 normaliza sin pasar por number', () => {
    expect(price2('150')).toBe('150.00');
    expect(price2('150.5')).toBe('150.50');
    expect(price2('9007199254740993.1')).toBe('9007199254740993.10');
    expect(price2('007.30')).toBe('7.30');
  });
});
