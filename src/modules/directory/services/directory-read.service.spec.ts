import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ForbiddenException } from '@nestjs/common';
import { DirectoryReadService } from './directory-read.service';
import { ResourceNotFoundException } from '../../../common';

const actor = { id: 'u1', roles: ['STAFF'] } as any;
const TENANT = 't1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const tenantsRepo = {
    findById: mockFn(() => Promise.resolve({ id: TENANT })),
    searchPage: mockFn(() => Promise.resolve([])),
  };
  const membershipsRepo = {
    findPageByTenant: mockFn(() => Promise.resolve([])),
    findByIdInTenant: mockFn(() => Promise.resolve({ id: 'm1' })),
  };
  const branchesRepo = { findByTenant: mockFn(() => Promise.resolve([])) };
  const branchMembershipsRepo = {
    findByMembership: mockFn(() => Promise.resolve([])),
  };
  const tenantAdmin = { assertCanRead: mockFn(() => Promise.resolve()) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryReadService(
    em,
    tenantsRepo as any,
    membershipsRepo as any,
    branchesRepo as any,
    branchMembershipsRepo as any,
    tenantAdmin as any,
    logger as any,
  );
  return {
    service,
    tenantsRepo,
    membershipsRepo,
    branchesRepo,
    branchMembershipsRepo,
    tenantAdmin,
  };
}

/** Fila de organización con los campos que el listado publica. */
const tenantRow = (id: string, code: string) => ({
  id,
  code,
  legalName: `Razón ${code}`,
  tradeName: undefined,
  tenantTypeConceptId: 'tipo',
  statusConceptId: 'activo',
  verificationStatusConceptId: 'verificado',
  legalEntityTypeConceptId: 'forma',
  parentTenantId: undefined,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
});

describe('DirectoryReadService — alcance por organización', () => {
  it.each([
    ['listBranches', (s: any) => s.listBranches(TENANT, actor)],
    [
      'listMemberships',
      (s: any) => s.listMemberships(TENANT, { limit: 50 }, actor),
    ],
    [
      'listChildTenants',
      (s: any) => s.listChildTenants(TENANT, { limit: 50 }, actor),
    ],
    [
      'listBranchAssignments',
      (s: any) => s.listBranchAssignments(TENANT, 'm1', actor),
    ],
    ['getTenantById', (s: any) => s.getTenantById(TENANT, actor)],
  ])('%s exige poder leer la organización', async (_nombre, invocar) => {
    // Un listado es justo la forma en que un fallo de alcance se vuelve una fuga
    // masiva entre organizaciones.
    const d = build();
    d.tenantAdmin.assertCanRead.mockRejectedValue(new ForbiddenException());

    await expect(invocar(d.service)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el listado global de organizaciones no pasa por el alcance de tenant', async () => {
    // Se publica en `/admin/tenants`, que ya exige rol de plataforma.
    const d = build();

    await d.service.searchTenants({ limit: 50 });

    expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
  });

  it('una organización inexistente es 404 y no 403', async () => {
    // Lo contrario permitiría sondear qué identificadores existen midiendo el
    // código de error.
    const d = build();
    d.tenantsRepo.findById.mockResolvedValue(null);

    await expect(d.service.getTenantById(TENANT, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.tenantAdmin.assertCanRead).not.toHaveBeenCalled();
  });

  it('busca la membresía dentro de su organización, no por id suelto', async () => {
    const d = build();

    await d.service.listBranchAssignments(TENANT, 'm1', actor);

    expect(d.membershipsRepo.findByIdInTenant).toHaveBeenCalledWith(
      expect.anything(),
      'm1',
      TENANT,
    );
  });

  it('falla cuando la membresía no pertenece a esa organización', async () => {
    const d = build();
    d.membershipsRepo.findByIdInTenant.mockResolvedValue(null);

    await expect(
      d.service.listBranchAssignments(TENANT, 'm1', actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('DirectoryReadService.searchTenants', () => {
  it('pide una fila de más y la recorta para saber si hay página siguiente', async () => {
    const d = build();
    d.tenantsRepo.searchPage.mockResolvedValue([
      tenantRow('t1', 'AAA'),
      tenantRow('t2', 'BBB'),
      tenantRow('t3', 'CCC'),
    ]);

    const result = await d.service.searchTenants({ limit: 2 });

    expect(result.count).toBe(2);
    expect(result.items.map((item: any) => item.code)).toEqual(['AAA', 'BBB']);
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('continúa desde el cursor de la página anterior', async () => {
    const d = build();
    d.tenantsRepo.searchPage.mockResolvedValue([
      tenantRow('t1', 'AAA'),
      tenantRow('t2', 'BBB'),
    ]);
    const primera = await d.service.searchTenants({ limit: 1 });

    d.tenantsRepo.searchPage.mockClear();
    d.tenantsRepo.searchPage.mockResolvedValue([]);
    await d.service.searchTenants({ cursor: primera.nextCursor!, limit: 1 });

    expect(d.tenantsRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      {
        query: undefined,
        statusConceptId: undefined,
        parentTenantId: undefined,
        afterCode: 'AAA',
      },
      2,
    );
  });

  it('acota las hijas a su organización madre', async () => {
    const d = build();

    await d.service.listChildTenants(TENANT, { limit: 50 }, actor);

    expect(d.tenantsRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parentTenantId: TENANT }),
      51,
    );
  });
});

describe('DirectoryReadService.listMemberships', () => {
  const membershipRow = (id: string, createdAt: string) => ({
    id,
    userId: 'u9',
    tenantRoleConceptId: 'rol',
    statusConceptId: 'activa',
    accessScopeConceptId: 'ambito',
    primaryBranchId: undefined,
    startDate: undefined,
    endDate: undefined,
    createdAt: new Date(createdAt),
  });

  it('desempata el cursor por identificador, no sólo por fecha', async () => {
    // Varias membresías se crean en la misma transacción y comparten `created_at`.
    const d = build();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([
      membershipRow('m1', '2026-01-01T00:00:00Z'),
      membershipRow('m2', '2026-01-01T00:00:00Z'),
    ]);
    const primera = await d.service.listMemberships(
      TENANT,
      { limit: 1 },
      actor,
    );

    d.membershipsRepo.findPageByTenant.mockClear();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([]);
    await d.service.listMemberships(
      TENANT,
      { cursor: primera.nextCursor!, limit: 1 },
      actor,
    );

    expect(d.membershipsRepo.findPageByTenant).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      {
        statusConceptId: undefined,
        after: { createdAt: new Date('2026-01-01T00:00:00Z'), id: 'm1' },
      },
      2,
    );
  });

  it('normaliza a `null` las fechas ausentes', async () => {
    const d = build();
    d.membershipsRepo.findPageByTenant.mockResolvedValue([
      membershipRow('m1', '2026-01-01T00:00:00Z'),
    ]);

    const result = await d.service.listMemberships(
      TENANT,
      { limit: 50 },
      actor,
    );

    expect(result.items[0].startDate).toBeNull();
    expect(result.items[0].endDate).toBeNull();
    expect(result.items[0].primaryBranchId).toBeNull();
  });
});
