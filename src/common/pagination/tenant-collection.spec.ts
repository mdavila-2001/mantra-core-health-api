import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PreconditionFailedException } from '../errors/domain.exception';
import { runWithTenant } from '../tenant/tenant-context';
import {
  assertRouteTenant,
  definedFilters,
  listTenantCollection,
} from './tenant-collection';

class Row {
  id!: string;
  tenantId?: string | null;
  createdAt!: Date;
  secret?: string;
}

const query = {
  page: 2,
  pageSize: 10,
  order: 'DESC' as const,
  sortBy: 'createdAt',
  offset: 10,
};

/** `EntityManager` mínimo: sólo `findAndCount`, que es lo que usa el helper. */
function fakeEm(rows: Row[] = [], total = rows.length) {
  const findAndCount = jest.fn(
    async (..._args: unknown[]) => [rows, total] as const,
  );
  return { em: { findAndCount } as any, findAndCount };
}

describe('listTenantCollection', () => {
  it('acota al tenant del contexto, no a uno que llegue en los filtros', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query,
        sortable: ['createdAt'],
        where: { tenantId: 't-2' } as any,
        map: (r) => r,
      }),
    );

    const [, where] = findAndCount.mock.calls[0] as unknown as [
      unknown,
      Record<string, unknown>,
    ];
    // Los dos filtros se exigen juntos: el del cliente no reemplaza al del tenant.
    expect(where).toEqual({
      $and: [{ tenantId: 't-2' }, { tenantId: 't-1' }],
    });
  });

  it('sin filtros, el where es sólo el tenant', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query,
        sortable: ['createdAt'],
        map: (r) => r,
      }),
    );

    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ tenantId: 't-1' });
  });

  it('suma las filas de plataforma sólo cuando se pide', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query,
        sortable: ['createdAt'],
        includePlatformRows: true,
        map: (r) => r,
      }),
    );

    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $or: [{ tenantId: 't-1' }, { tenantId: null }],
    });
  });

  it('respeta una propiedad de tenant con otro nombre', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query,
        sortable: ['createdAt'],
        tenantField: 'secret',
        map: (r) => r,
      }),
    );

    expect(findAndCount.mock.calls[0]?.[1]).toEqual({ secret: 't-1' });
  });

  it('sin tenant en el contexto falla con 422 y no consulta', async () => {
    const { em, findAndCount } = fakeEm();

    await expect(
      listTenantCollection(em, Row, {
        query,
        sortable: ['createdAt'],
        map: (r) => r,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(findAndCount).not.toHaveBeenCalled();
  });

  it('rechaza un sortBy fuera de la allowlist con 400 y no consulta', async () => {
    const { em, findAndCount } = fakeEm();

    await expect(
      runWithTenant('t-1', () =>
        listTenantCollection(em, Row, {
          query: { ...query, sortBy: 'secret' },
          sortable: ['createdAt'],
          map: (r) => r,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findAndCount).not.toHaveBeenCalled();
  });

  it('sin created_at, el sortBy por defecto del DTO cae en la primera columna ordenable', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query,
        sortable: ['secret'],
        map: (r) => r,
      }),
    );

    expect(findAndCount.mock.calls[0]?.[2]).toMatchObject({
      orderBy: { secret: 'DESC', id: 'DESC' },
    });
  });

  it('sin columnas ordenables, ordena sólo por id y rechaza un sortBy explícito', async () => {
    const { em, findAndCount } = fakeEm();

    await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, { query, sortable: [], map: (r) => r }),
    );
    expect(findAndCount.mock.calls[0]?.[2]).toMatchObject({
      orderBy: { id: 'DESC' },
    });

    await expect(
      runWithTenant('t-1', () =>
        listTenantCollection(em, Row, {
          query: { ...query, sortBy: 'secret' },
          sortable: [],
          map: (r) => r,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ordena con desempate por id, pagina con offset y publica sólo lo mapeado', async () => {
    const created = new Date('2026-10-24T10:00:00Z');
    const { em, findAndCount } = fakeEm(
      [{ id: 'r-1', tenantId: 't-1', createdAt: created, secret: 'x' }],
      31,
    );

    const page = await runWithTenant('t-1', () =>
      listTenantCollection(em, Row, {
        query: { ...query, order: 'ASC' },
        sortable: ['createdAt'],
        map: (r) => ({ id: r.id, createdAt: r.createdAt }),
      }),
    );

    expect(findAndCount.mock.calls[0]?.[2]).toEqual({
      orderBy: { createdAt: 'ASC', id: 'ASC' },
      limit: 10,
      offset: 10,
    });
    expect(page.data).toEqual([{ id: 'r-1', createdAt: created }]);
    expect(page.meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 31,
      totalPages: 4,
    });
  });
});

describe('assertRouteTenant', () => {
  it('deja pasar el tenant del contexto', () => {
    expect(() =>
      runWithTenant('t-1', () => assertRouteTenant('t-1')),
    ).not.toThrow();
  });

  it('rechaza con 403 una ruta que nombra otro tenant', () => {
    expect(() => runWithTenant('t-1', () => assertRouteTenant('t-2'))).toThrow(
      ForbiddenException,
    );
  });

  it('sin tenant en el contexto falla con 422', () => {
    expect(() => assertRouteTenant('t-1')).toThrow(PreconditionFailedException);
  });
});

describe('definedFilters', () => {
  it('quita los filtros que no llegaron', () => {
    expect(definedFilters({ a: 'x', b: undefined })).toEqual({ a: 'x' });
  });

  it('sin filtros devuelve undefined, no un objeto vacío', () => {
    expect(definedFilters({ a: undefined })).toBeUndefined();
  });
});
