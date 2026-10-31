import { describe, expect, it, jest } from '@jest/globals';
import { CONCEPTS, runWithTenant } from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import { AdminServiceCatalogService } from './admin-service-catalog.service';

/**
 * Pruebas del editor administrativo con DOBLES declarados de EntityManager,
 * repositorio de servicios y repositorio de prácticas. Verifican las reglas de
 * negocio (tenant, 404 de ajeno, versión, idempotencia, desactivar sin borrar),
 * no la persistencia real: BLOQUEADO contra PostgreSQL real en esta máquina.
 */
const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as never;
const TYPE_LAB = 'type-lab';
const TYPE_OFFICE = 'type-office';

type Row = {
  id: string;
  practiceId: string;
  code: string;
  name: string;
  descriptionText?: string | null;
  termsText?: string | null;
  serviceConceptId?: string | null;
  defaultPrice: string;
  currencyConceptId?: string | null;
  isActive: boolean;
  rowVersion: number;
  updatedAt: Date;
  updatedByUserId?: string | null;
};

const row = (over: Partial<Row> = {}): Row => ({
  id: 's1',
  practiceId: 'p-mine',
  code: 'A',
  name: 'Servicio A',
  defaultPrice: '10.00',
  isActive: true,
  rowVersion: 3,
  updatedAt: new Date('2026-10-31T00:00:00Z'),
  ...over,
});

function build(rows: Row[] = []) {
  const em: Record<string, unknown> = {};
  em.fork = () => em;
  em.transactional = (cb: (tx: unknown) => unknown) => cb(em);
  em.flush = jest.fn(async () => {
    // Simula `version: true`: cada flush con cambios sube la versión.
    for (const r of rows) {
      if ((r as Row & { __dirty?: boolean }).__dirty) {
        r.rowVersion += 1;
        (r as Row & { __dirty?: boolean }).__dirty = false;
      }
    }
  });
  const repo = {
    findById: jest.fn(
      async (_em: unknown, id: string) => rows.find((r) => r.id === id) ?? null,
    ),
    findByCode: jest.fn(
      async (_em: unknown, practiceId: string, code: string) =>
        rows.find((r) => r.practiceId === practiceId && r.code === code) ??
        null,
    ),
    searchAdminPage: jest.fn(
      async (
        _em: unknown,
        f: { practiceIds: string[]; after?: { code: string; id: string } },
        limit: number,
      ) =>
        rows
          .filter((r) => f.practiceIds.includes(r.practiceId))
          .slice(0, limit),
    ),
    create: jest.fn((_em: unknown, data: Record<string, unknown>) => {
      const created = row({
        id: `new-${rows.length}`,
        rowVersion: 1,
        ...(data as Partial<Row>),
      });
      rows.push(created);
      return created;
    }),
  };
  const practices = {
    findByTenant: jest.fn(
      async (_em: unknown, tenantId: string, _active?: string) =>
        tenantId === 't-mine'
          ? [
              { id: 'p-mine', tenantId: 't-mine', typeConceptId: TYPE_OFFICE },
              { id: 'p-lab', tenantId: 't-mine', typeConceptId: TYPE_LAB },
            ]
          : [],
    ),
    findById: jest.fn(async (_em: unknown, id: string) => {
      const all: Record<
        string,
        { id: string; tenantId: string; typeConceptId: string }
      > = {
        'p-mine': {
          id: 'p-mine',
          tenantId: 't-mine',
          typeConceptId: TYPE_OFFICE,
        },
        'p-lab': { id: 'p-lab', tenantId: 't-mine', typeConceptId: TYPE_LAB },
        'p-other': {
          id: 'p-other',
          tenantId: 't-other',
          typeConceptId: TYPE_OFFICE,
        },
      };
      return all[id] ?? null;
    }),
  };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new AdminServiceCatalogService(
    em as never,
    repo as never,
    practices as never,
    logger as never,
  );
  const inTenant = <T>(fn: () => Promise<T>, tenant = 't-mine') =>
    runWithTenant(tenant, fn);
  return { service, repo, practices, em, rows, inTenant };
}

describe('AdminServiceCatalogService', () => {
  describe('list', () => {
    it('sólo consulta prácticas activas de la organización del actor', async () => {
      const d = build([
        row(),
        row({ id: 's2', practiceId: 'p-lab', code: 'B' }),
      ]);
      const res = await d.inTenant(() => d.service.list({}));
      expect(d.practices.findByTenant).toHaveBeenCalledWith(
        expect.anything(),
        't-mine',
        PRAC.PRACTICE_ACTIVE,
      );
      expect(d.repo.searchAdminPage.mock.calls[0][1].practiceIds).toEqual([
        'p-mine',
        'p-lab',
      ]);
      expect(res.items.map((i) => i.practiceTypeConceptId)).toEqual([
        TYPE_OFFICE,
        TYPE_LAB,
      ]);
    });

    it('filtra por tipo de organización', async () => {
      const d = build([
        row(),
        row({ id: 's2', practiceId: 'p-lab', code: 'B' }),
      ]);
      const res = await d.inTenant(() =>
        d.service.list({ practiceTypeConceptId: TYPE_LAB }),
      );
      expect(d.repo.searchAdminPage.mock.calls[0][1].practiceIds).toEqual([
        'p-lab',
      ]);
      expect(res.items).toHaveLength(1);
      expect(res.items[0].practiceId).toBe('p-lab');
    });

    it('practiceId de otra organización => 404 sin consultar servicios', async () => {
      const d = build([row({ practiceId: 'p-other' })]);
      await expect(
        d.inTenant(() => d.service.list({ practiceId: 'p-other' })),
      ).rejects.toMatchObject({ status: 404 });
      expect(d.repo.searchAdminPage).not.toHaveBeenCalled();
    });

    it('organización sin prácticas => página vacía, no un error', async () => {
      const d = build([row()]);
      const res = await d.inTenant(() => d.service.list({}), 't-vacia');
      expect(res).toEqual({ items: [], count: 0, limit: 50, nextCursor: null });
    });

    it('pide limit+1 y emite cursor (code,id) si hay más páginas', async () => {
      const d = build([
        row({ id: 'a', code: 'A' }),
        row({ id: 'b', code: 'A' }),
        row({ id: 'c', code: 'B' }),
      ]);
      const res = await d.inTenant(() => d.service.list({ limit: 2 }));
      expect(d.repo.searchAdminPage.mock.calls[0][2]).toBe(3);
      expect(res.count).toBe(2);
      expect(res.nextCursor).toEqual(expect.any(String));
      const second = await d.inTenant(() =>
        d.service.list({ limit: 2, cursor: res.nextCursor as string }),
      );
      expect(d.repo.searchAdminPage.mock.calls[1][1].after).toEqual({
        code: 'A',
        id: 'b',
      });
      expect(second.items).toBeDefined();
    });

    it('cursor corrupto => 400', async () => {
      const d = build([row()]);
      await expect(
        d.inTenant(() => d.service.list({ cursor: '%%%no-base64-json' })),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('sin tenant en el contexto => 422 (nunca se infiere del cliente)', async () => {
      const d = build([row()]);
      await expect(d.service.list({})).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('get', () => {
    it('devuelve el servicio con su versión y tipo', async () => {
      const d = build([row()]);
      const res = await d.inTenant(() => d.service.get('s1'));
      expect(res).toMatchObject({
        id: 's1',
        rowVersion: 3,
        practiceTypeConceptId: TYPE_OFFICE,
      });
    });

    it('servicio de otra organización responde el mismo 404 que uno inexistente', async () => {
      const d = build([row({ id: 'x', practiceId: 'p-other' })]);
      const foreign = await d
        .inTenant(() => d.service.get('x'))
        .catch((e) => e);
      const missing = await d
        .inTenant(() => d.service.get('no-existe'))
        .catch((e) => e);
      expect(foreign.getStatus?.() ?? foreign.status).toBe(404);
      expect(missing.getStatus?.() ?? missing.status).toBe(404);
      expect(foreign.message).toBe(missing.message);
    });
  });

  describe('create (idempotente por práctica y código)', () => {
    const dto = {
      practiceId: 'p-mine',
      code: 'NEW',
      name: 'Nuevo',
      defaultPrice: '25.50',
    };

    it('primera vez crea y marca created=true; moneda por defecto BOB', async () => {
      const d = build([]);
      const res = await d.inTenant(() => d.service.create(dto, actor));
      expect(res.created).toBe(true);
      expect(d.repo.create).toHaveBeenCalledTimes(1);
      expect(d.repo.create.mock.calls[0][1]).toMatchObject({
        practiceId: 'p-mine',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        isActive: true,
        actorUserId: 'admin-1',
      });
    });

    it('segunda vez con el mismo cuerpo no escribe y devuelve el mismo servicio', async () => {
      const d = build([]);
      const first = await d.inTenant(() => d.service.create(dto, actor));
      const second = await d.inTenant(() => d.service.create(dto, actor));
      expect(second.created).toBe(false);
      expect(second.item.id).toBe(first.item.id);
      expect(d.repo.create).toHaveBeenCalledTimes(1);
      expect(d.rows).toHaveLength(1);
    });

    it('código ocupado con datos distintos => 409 SERVICE_CATALOG_CODE_ALREADY_EXISTS', async () => {
      const d = build([row({ code: 'NEW', name: 'Otro nombre' })]);
      await expect(
        d.inTenant(() => d.service.create(dto, actor)),
      ).rejects.toMatchObject({
        status: 409,
        reason: BillingErrorReason.SERVICE_CATALOG_CODE_ALREADY_EXISTS,
      });
    });

    it('práctica de otra organización => 404 y nada se escribe', async () => {
      const d = build([]);
      await expect(
        d.inTenant(() =>
          d.service.create({ ...dto, practiceId: 'p-other' }, actor),
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(d.repo.create).not.toHaveBeenCalled();
    });

    it('práctica inexistente => el mismo 404', async () => {
      const d = build([]);
      await expect(
        d.inTenant(() =>
          d.service.create({ ...dto, practiceId: 'p-nada' }, actor),
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it.each(['0', '0.00'])(
      'precio %s (borde) => 422 y no escribe',
      async (price) => {
        const d = build([]);
        await expect(
          d.inTenant(() =>
            d.service.create({ ...dto, defaultPrice: price }, actor),
          ),
        ).rejects.toMatchObject({
          status: 422,
          reason: BillingErrorReason.SERVICE_CATALOG_PRICE_NOT_POSITIVE,
        });
        expect(d.repo.create).not.toHaveBeenCalled();
      },
    );

    it('precio mínimo válido 0.01 (borde) se acepta', async () => {
      const d = build([]);
      const res = await d.inTenant(() =>
        d.service.create({ ...dto, defaultPrice: '0.01' }, actor),
      );
      expect(res.created).toBe(true);
    });
  });

  describe('update (precondición de versión)', () => {
    it('con la versión correcta edita y la versión sube', async () => {
      const r = row({ rowVersion: 3 }) as Row & { __dirty?: boolean };
      const d = build([r]);
      // Marca como modificada cualquier fila al hacer touch (updatedAt cambia).
      const before = r.updatedAt;
      const res = await d.inTenant(() => {
        r.__dirty = true;
        return d.service.update(
          's1',
          { expectedRowVersion: 3, name: 'Nuevo' },
          actor,
        );
      });
      expect(res.name).toBe('Nuevo');
      expect(res.rowVersion).toBe(4);
      expect(res.updatedAt).not.toBe(before.toISOString());
      expect(res.updatedByUserId).toBe('admin-1');
    });

    it('versión desfasada => 409 SERVICE_CATALOG_VERSION_MISMATCH y no escribe', async () => {
      const r = row({ rowVersion: 5 });
      const d = build([r]);
      await expect(
        d.inTenant(() =>
          d.service.update(
            's1',
            { expectedRowVersion: 3, name: 'Pisado' },
            actor,
          ),
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: BillingErrorReason.SERVICE_CATALOG_VERSION_MISMATCH,
        details: { expected: 3, actual: 5 },
      });
      expect(r.name).toBe('Servicio A');
      expect(d.em.flush).not.toHaveBeenCalled();
    });

    it('servicio de otra organización => 404 (antes de mirar la versión)', async () => {
      const d = build([row({ id: 'x', practiceId: 'p-other' })]);
      await expect(
        d.inTenant(() =>
          d.service.update('x', { expectedRowVersion: 3, name: 'Z' }, actor),
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('precio 0 => 422; null en textos los limpia; vacío también', async () => {
      const r = row({ descriptionText: 'viejo', termsText: 'viejo' });
      const d = build([r]);
      await expect(
        d.inTenant(() =>
          d.service.update(
            's1',
            { expectedRowVersion: 3, defaultPrice: '0' },
            actor,
          ),
        ),
      ).rejects.toMatchObject({ status: 422 });
      await d.inTenant(() =>
        d.service.update(
          's1',
          { expectedRowVersion: 3, descriptionText: null, termsText: '   ' },
          actor,
        ),
      );
      expect(r.descriptionText).toBeNull();
      expect(r.termsText).toBeNull();
    });

    it('cambiar precio fija la moneda (BOB si la fila no tenía)', async () => {
      const r = row();
      const d = build([r]);
      await d.inTenant(() =>
        d.service.update(
          's1',
          { expectedRowVersion: 3, defaultPrice: '99.99' },
          actor,
        ),
      );
      expect(r.defaultPrice).toBe('99.99');
      expect(r.currencyConceptId).toBe(CONCEPTS.CURRENCY_BOB);
    });
  });

  describe('setActive (desactivar en lugar de borrar)', () => {
    it('desactiva con la versión correcta y conserva la fila', async () => {
      const r = row() as Row & { __dirty?: boolean };
      const d = build([r]);
      const res = await d.inTenant(() => {
        r.__dirty = true;
        return d.service.setActive('s1', false, 3, actor);
      });
      expect(res.isActive).toBe(false);
      expect(res.rowVersion).toBe(4);
      expect(d.rows).toHaveLength(1);
    });

    it('idempotente: ya inactivo => mismo estado sin escribir ni subir versión', async () => {
      const r = row({ isActive: false, rowVersion: 7 });
      const d = build([r]);
      const res = await d.inTenant(() =>
        d.service.setActive('s1', false, 1, actor),
      );
      expect(res).toMatchObject({ isActive: false, rowVersion: 7 });
      expect(d.em.flush).not.toHaveBeenCalled();
    });

    it('versión desfasada al cambiar de estado => 409', async () => {
      const d = build([row({ rowVersion: 5 })]);
      await expect(
        d.inTenant(() => d.service.setActive('s1', false, 4, actor)),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('reactiva un servicio inactivo', async () => {
      const r = row({ isActive: false, rowVersion: 2 }) as Row & {
        __dirty?: boolean;
      };
      const d = build([r]);
      const res = await d.inTenant(() => {
        r.__dirty = true;
        return d.service.setActive('s1', true, 2, actor);
      });
      expect(res.isActive).toBe(true);
    });

    it('servicio ajeno => 404', async () => {
      const d = build([row({ id: 'x', practiceId: 'p-other' })]);
      await expect(
        d.inTenant(() => d.service.setActive('x', false, 3, actor)),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
