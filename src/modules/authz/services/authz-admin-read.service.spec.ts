import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { AUTHZ } from '../authz.concepts';
import { AuthzErrorReason } from '../authz.error-reasons';
import { AuthzAdminReadService } from './authz-admin-read.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const AHORA = new Date('2026-10-24T12:00:00.000Z');

function armar() {
  const repo: Record<string, any> = {
    userExists: mockFn(async () => true),
    assignmentsOfUser: mockFn(async () => []),
    permissions: mockFn(async () => []),
    roleCodeOf: mockFn(async () => 'DPO'),
    rolePermissions: mockFn(async () => []),
    internalUsers: mockFn(async () => []),
    activeAssignmentsOf: mockFn(async () => []),
    globalRolesOf: mockFn(async () => []),
  };
  const em = { fork: () => em };
  return {
    service: new AuthzAdminReadService(em as never, repo as never),
    repo,
  };
}

const asignacion = (extra: Record<string, unknown> = {}) => ({
  id: 'a-1',
  role_id: 'r-1',
  role_code: 'DPO',
  role_name: 'Delegado de protección de datos',
  role_scope_concept_id: AUTHZ.SCOPE_GLOBAL,
  tenant_id: null,
  branch_id: null,
  practice_id: null,
  status_concept_id: CONCEPTS.STATE_ACTIVE,
  valid_from: null,
  valid_to: null,
  assigned_by_user_id: 'admin-1',
  created_at: '2026-10-01T00:00:00.000000Z',
  ...extra,
});

describe('AuthzAdminReadService.assignmentsOf', () => {
  it('un usuario inexistente es 404, no una lista vacía', async () => {
    const { service, repo } = armar();
    repo.userExists.mockResolvedValue(false);
    const error = await service.assignmentsOf('u-1', AHORA).catch((e) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(error.reason).toBe(AuthzErrorReason.ROLE_ASSIGNMENT_USER_NOT_FOUND);
    expect(repo.assignmentsOfUser).not.toHaveBeenCalled();
  });

  it('presenta estado, ámbito y vigencia por código, nunca por concepto', async () => {
    const { service, repo } = armar();
    repo.assignmentsOfUser.mockResolvedValueOnce([
      asignacion(),
      asignacion({ id: 'a-2', status_concept_id: CONCEPTS.STATE_REVOKED }),
      asignacion({ id: 'a-3', valid_to: '2026-10-01T00:00:00.000000Z' }),
      asignacion({ id: 'a-4', valid_from: '2026-11-01T00:00:00.000000Z' }),
    ]);
    const r = await service.assignmentsOf('u-1', AHORA);
    expect(
      r.items.map((i) => [i.id, i.status, i.roleScope, i.isEffective]),
    ).toEqual([
      ['a-1', 'ACTIVE', 'GLOBAL', true],
      ['a-2', 'REVOKED', 'GLOBAL', false],
      ['a-3', 'ACTIVE', 'GLOBAL', false],
      ['a-4', 'ACTIVE', 'GLOBAL', false],
    ]);
  });

  it('appliesGlobally exige rol global SIN tenant, sede ni consultorio (la condición del §6)', async () => {
    const { service, repo } = armar();
    repo.assignmentsOfUser.mockResolvedValueOnce([
      asignacion({ id: 'sin-tenant' }),
      asignacion({ id: 'con-tenant', tenant_id: 't-1' }),
      asignacion({ id: 'con-sede', branch_id: 'b-1' }),
      asignacion({
        id: 'rol-de-tenant',
        role_scope_concept_id: AUTHZ.SCOPE_TENANT,
      }),
    ]);
    const r = await service.assignmentsOf('u-1', AHORA);
    expect(r.items.map((i) => [i.id, i.appliesGlobally])).toEqual([
      ['sin-tenant', true],
      ['con-tenant', false],
      ['con-sede', false],
      ['rol-de-tenant', false],
    ]);
  });
});

describe('AuthzAdminReadService.permissions / rolePermissions', () => {
  it('pagina por código y emite cursor si hay otra página', async () => {
    const { service, repo } = armar();
    const p = (code: string) => ({
      id: code,
      code,
      name: code,
      resource: 'r',
      category_id: null,
      is_dangerous: null,
      is_field_level: null,
      is_role_restricted: false,
    });
    repo.permissions.mockResolvedValueOnce([p('a'), p('b'), p('c')]);
    const r = await service.permissions({ limit: 2 });
    expect(r.items.map((i) => i.code)).toEqual(['a', 'b']);
    expect(r.items[0]).toMatchObject({
      isDangerous: false,
      isFieldLevel: false,
    });
    expect(r.nextCursor).toBe(encodeKeysetCursor({ code: 'b' }));
    expect(repo.permissions.mock.calls[0][1].limit).toBe(2);
  });

  it('el cursor llega al repositorio como el último código', async () => {
    const { service, repo } = armar();
    await service.permissions({ cursor: encodeKeysetCursor({ code: 'b' }) });
    expect(repo.permissions.mock.calls[0][1].afterCode).toBe('b');
  });

  it('un cursor ajeno es un error del cliente', async () => {
    const { service } = armar();
    await expect(
      service.permissions({ cursor: encodeKeysetCursor({ x: 1 }) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un rol inexistente es 404', async () => {
    const { service, repo } = armar();
    repo.roleCodeOf.mockResolvedValueOnce(null);
    await expect(service.rolePermissions('r-1')).rejects.toMatchObject({
      reason: AuthzErrorReason.ROLE_NOT_FOUND,
    });
  });

  it('presenta efecto y ámbito por código y sólo pide los permisos activos', async () => {
    const { service, repo } = armar();
    repo.rolePermissions.mockResolvedValueOnce([
      {
        permission_id: 'p-1',
        code: 'catalog.read',
        name: 'Leer',
        resource: 'catalog',
        effect_concept_id: AUTHZ.EFFECT_DENY,
        scope_concept_id: AUTHZ.SCOPE_TENANT,
      },
    ]);
    const r = await service.rolePermissions('r-1');
    expect(r).toMatchObject({
      roleId: 'r-1',
      roleCode: 'DPO',
      items: [{ code: 'catalog.read', effect: 'DENY', scope: 'TENANT' }],
    });
    expect(repo.rolePermissions.mock.calls[0][2]).toBe(CONCEPTS.STATE_ACTIVE);
  });
});

describe('AuthzAdminReadService.internalUsers', () => {
  const usuario = (id: string, name: string) => ({
    id,
    display_name: name,
    status_concept_id: CONCEPTS.STATE_ACTIVE,
    last_login_at: null,
  });

  it('une cada usuario con sus roles globales de iam y sus asignaciones activas', async () => {
    const { service, repo } = armar();
    repo.internalUsers.mockResolvedValueOnce([usuario('u-1', 'Ana')]);
    repo.activeAssignmentsOf.mockResolvedValueOnce([
      { ...asignacion(), user_id: 'u-1' },
      { ...asignacion({ id: 'a-9' }), user_id: 'otro' },
    ]);
    repo.globalRolesOf.mockResolvedValueOnce([
      { user_id: 'u-1', role_concept_id: CONCEPTS.ROLE_SECURITY_ADMIN },
      { user_id: 'otro', role_concept_id: CONCEPTS.ROLE_SUPERADMIN },
    ]);
    const r = await service.internalUsers({});
    expect(r.items).toHaveLength(1);
    expect(r.items[0].globalRoles).toEqual(['SECURITY_ADMIN']);
    expect(r.items[0].assignments).toEqual([
      {
        assignmentId: 'a-1',
        roleCode: 'DPO',
        roleName: 'Delegado de protección de datos',
        tenantId: null,
        validTo: null,
      },
    ]);
  });

  it('sin rol pedido, «interno» son los roles de ámbito global y los globales de plataforma de iam', async () => {
    const { service, repo } = armar();
    await service.internalUsers({ q: 'an' });
    expect(repo.internalUsers.mock.calls[0][1]).toMatchObject({
      q: 'an',
      roleCode: undefined,
      globalScopeConceptId: AUTHZ.SCOPE_GLOBAL,
      platformRoleConceptIds: [
        CONCEPTS.ROLE_SECURITY_ADMIN,
        CONCEPTS.ROLE_SUPERADMIN,
      ],
    });
  });

  it('con roleCode filtra por ese rol', async () => {
    const { service, repo } = armar();
    await service.internalUsers({ roleCode: 'DPO' });
    expect(repo.internalUsers.mock.calls[0][1].roleCode).toBe('DPO');
  });

  it('pagina por nombre visible e id', async () => {
    const { service, repo } = armar();
    repo.internalUsers.mockResolvedValueOnce([
      usuario('u-1', 'Ana'),
      usuario('u-2', 'Beto'),
    ]);
    const r = await service.internalUsers({ limit: 1 });
    expect(r.items.map((u) => u.id)).toEqual(['u-1']);
    expect(r.nextCursor).toBe(encodeKeysetCursor({ n: 'Ana', i: 'u-1' }));
    await service.internalUsers({ cursor: r.nextCursor as string });
    expect(repo.internalUsers.mock.calls[1][1].after).toEqual({
      displayName: 'Ana',
      id: 'u-1',
    });
  });
});
