import { describe, expect, it } from '@jest/globals';
import {
  CANONICAL_ACTIONS,
  UNASSIGNED_MODULE,
  deriveRoute,
  moduleKeyFromClassName,
  placePermission,
  proposedPermissionCode,
} from './authz-modules-route-derivation';

describe('moduleKeyFromClassName', () => {
  it.each([
    ['PharmaLabModule', 'pharma_lab'],
    ['IamModule', 'iam'],
    ['MedicalCentersModule', 'medical_centers'],
    ['DirectoryAuthorizationModule', 'directory'],
    ['InsurancePatientSettlementModule', 'insurance'],
    ['QaLabModule', 'qa_lab'],
  ])('%s → %s', (name, key) => {
    expect(moduleKeyFromClassName(name)).toBe(key);
  });
});

describe('deriveRoute', () => {
  const d = (m: string, t: string, mod = 'authz') => deriveRoute(m, t, mod);

  it('correcto: el verbo HTTP fija la acción de un CRUD', () => {
    expect(d('GET', '/authz/roles')).toMatchObject({
      resource: 'roles',
      action: 'list',
      mutating: false,
    });
    expect(d('GET', '/authz/roles/:roleId')).toMatchObject({
      resource: 'roles',
      action: 'read',
    });
    expect(d('POST', '/authz/roles')).toMatchObject({
      action: 'create',
      mutating: true,
    });
    expect(d('PATCH', '/authz/roles/:roleId')).toMatchObject({
      action: 'update',
    });
    expect(d('PUT', '/authz/roles/:roleId/permissions')).toMatchObject({
      resource: 'roles_permissions',
      action: 'update',
    });
    expect(d('DELETE', '/authz/roles/:roleId')).toMatchObject({
      action: 'delete',
    });
  });

  it('un verbo final conocido manda sobre el verbo HTTP y sale del recurso', () => {
    expect(
      d('POST', '/practice/role-assignments/:id/approve', 'practice'),
    ).toMatchObject({
      resource: 'role_assignments',
      action: 'approve',
    });
    expect(d('POST', '/x/:id/reject', 'x')).toMatchObject({
      resource: 'x',
      action: 'reject',
    });
    expect(d('POST', '/reporting/exports/:id/export', 'reporting').action).toBe(
      'export',
    );
    expect(d('GET', '/audit/me/audit', 'audit').action).toBe('audit');
    expect(d('POST', '/scheduling/slots/:id/assign', 'scheduling').action).toBe(
      'assign',
    );
    expect(d('PUT', '/ops/settings', 'ops').action).toBe('configure');
  });

  it('límite: POST a una colección bajo un id es alta; POST a un verbo bajo un id es cambio de estado', () => {
    expect(
      d('POST', '/pharma-labs/:id/medical-visitors', 'pharma_lab'),
    ).toMatchObject({
      resource: 'medical_visitors',
      action: 'create',
    });
    expect(d('POST', '/authz/users/:userId/lifecycle/suspend').action).toBe(
      'update',
    );
  });

  it('límite: un POST que sólo lee (búsqueda, evaluación) cuenta como lectura', () => {
    expect(d('POST', '/iam/users/search', 'iam')).toMatchObject({
      action: 'read',
      mutating: false,
    });
    expect(d('POST', '/authz/decisions/evaluate').action).toBe('read');
  });

  it('límite: ruido (admin, internal, v1) y el propio módulo no son recurso; sin nada, el recurso es el módulo', () => {
    expect(
      d('GET', '/admin/catalogs/services', 'admin_catalogs').resource,
    ).toBe('catalogs_services');
    expect(d('GET', '/internal/files', 'common').resource).toBe('files');
    expect(d('GET', '/crm', 'crm')).toMatchObject({
      resource: 'crm',
      action: 'read',
    });
  });

  it('límite: /me/ marca autoservicio; un singular sin id es lectura y no listado', () => {
    expect(d('GET', '/authz/me/access')).toMatchObject({
      selfService: true,
      action: 'read',
    });
    expect(d('GET', '/x/status', 'x').action).toBe('read');
  });

  it('inválido: una plantilla vacía o rara no rompe y cae en el módulo', () => {
    expect(d('GET', '/')).toMatchObject({ resource: 'authz', action: 'read' });
    expect(d('GET', '/:id', 'iam')).toMatchObject({
      resource: 'iam',
      action: 'read',
    });
  });

  it('toda acción derivada es canónica', () => {
    for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const t of [
        '/a',
        '/a/:id',
        '/a/:id/b',
        '/a/:id/approve',
        '/a/search',
      ]) {
        expect(CANONICAL_ACTIONS).toContain(d(m, t, 'a').action);
      }
    }
  });
});

describe('proposedPermissionCode', () => {
  it('une módulo, recurso y acción', () => {
    expect(proposedPermissionCode('pharma_lab', 'products', 'update')).toBe(
      'pharma_lab.products.update',
    );
  });
});

describe('placePermission', () => {
  it('correcto: un código canónico se ubica por sí mismo', () => {
    expect(
      placePermission({
        code: 'billing.invoices.export',
        resource: 'x',
        legacyAction: 'READ',
      }),
    ).toEqual({
      module: 'billing',
      resource: 'invoices',
      action: 'export',
      canonical: true,
    });
  });

  it('límite: un permiso sembrado a mano se ubica por el prefijo de su recurso y la acción sembrada', () => {
    expect(
      placePermission({
        code: 'DIAGNOSTIC_RESULT_READ',
        resource: 'diagnostics.diagnostic_report',
        legacyAction: 'READ',
      }),
    ).toEqual({
      module: 'diagnostics',
      resource: 'diagnostic_report',
      action: 'read',
      canonical: false,
    });
  });

  it('límite: WRITE es update y EXECUTE no tiene equivalente canónico', () => {
    expect(
      placePermission({ code: 'A', resource: 'm.r', legacyAction: 'WRITE' })
        .action,
    ).toBe('update');
    expect(
      placePermission({ code: 'A', resource: 'm.r', legacyAction: 'EXECUTE' })
        .action,
    ).toBe('other');
  });

  it('inválido: sin módulo en el código ni en el recurso va al módulo virtual, y una acción final desconocida no es canónica', () => {
    expect(
      placePermission({
        code: 'PATIENT_READ',
        resource: 'patient',
        legacyAction: 'READ',
      }),
    ).toMatchObject({
      module: UNASSIGNED_MODULE,
      canonical: false,
    });
    expect(
      placePermission({
        code: 'a.b.fly',
        resource: 'patient',
        legacyAction: null,
      }),
    ).toMatchObject({
      canonical: false,
      action: 'other',
    });
  });
});
