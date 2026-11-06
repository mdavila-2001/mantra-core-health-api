import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { AccountingLedgerController } from '../../modules/accounting/controllers/accounting-ledger.controller';
import { AccountingPractitionerSimpleController } from '../../modules/accounting/controllers/accounting-practitioner-simple.controller';
import { AuthzAdminController } from '../../modules/authz/controllers/authz-admin.controller';
import { AuthzClinicalController } from '../../modules/authz/controllers/authz-clinical.controller';
import { AuthzGovernanceExtController } from '../../modules/authz/controllers/authz-governance-ext.controller';
import { SchedulingBookingsController } from '../../modules/scheduling/presentation/controllers/scheduling-bookings.controller';
import { SchedulingController } from '../../modules/scheduling/presentation/controllers/scheduling.controller';
import { RequirePermissionGuard } from './require-permission.guard';
import { REQUIRED_PERMISSION_KEY } from './permission-decision.port';
import { ROLES_KEY } from './roles.decorator';

/**
 * Piloto de permisos finos (docs/trabajo/2026-10-31-visibilidad-rbac/PILOTO-REQUIRE-PERMISSION.md):
 * las 11 rutas llevan `@RequirePermission` con el código acordado y **conservan** su `@Roles`
 * (mismo método, misma ruta, mismos roles que antes del piloto).
 */
const PILOT: ReadonlyArray<{
  ctrl: abstract new (...args: never[]) => unknown;
  handler: string;
  method: RequestMethod;
  path: string;
  roles: string[];
  code: string;
  resourceIdParam: string;
}> = [
  {
    ctrl: AccountingLedgerController,
    handler: 'approve',
    method: RequestMethod.POST,
    path: 'journal-transactions/:id/approve',
    roles: ['SECURITY_ADMIN', 'ACCOUNTING_APPROVER'],
    code: 'accounting.journal_transactions.approve',
    resourceIdParam: 'id',
  },
  {
    ctrl: AccountingPractitionerSimpleController,
    handler: 'deleteAccount',
    method: RequestMethod.DELETE,
    path: 'accounts/:id',
    roles: ['PRACTITIONER'],
    code: 'accounting.simple_accounts.delete',
    resourceIdParam: 'id',
  },
  {
    ctrl: AccountingPractitionerSimpleController,
    handler: 'deleteRecord',
    method: RequestMethod.DELETE,
    path: 'records/:id',
    roles: ['PRACTITIONER'],
    code: 'accounting.simple_records.delete',
    resourceIdParam: 'id',
  },
  {
    ctrl: AccountingPractitionerSimpleController,
    handler: 'deleteTransaction',
    method: RequestMethod.DELETE,
    path: 'transactions/:id',
    roles: ['PRACTITIONER'],
    code: 'accounting.simple_transactions.delete',
    resourceIdParam: 'id',
  },
  {
    ctrl: AuthzAdminController,
    handler: 'revoke',
    method: RequestMethod.DELETE,
    path: 'users/:userId/role-assignments/:assignmentId',
    roles: ['SECURITY_ADMIN'],
    code: 'authz.users_role_assignments.delete',
    resourceIdParam: 'assignmentId',
  },
  {
    ctrl: AuthzClinicalController,
    handler: 'revokeClinicalAccess',
    method: RequestMethod.DELETE,
    path: 'clinical-access-grants/:grantId',
    roles: ['SECURITY_ADMIN'],
    code: 'authz.clinical_access_grants.delete',
    resourceIdParam: 'grantId',
  },
  {
    ctrl: AuthzGovernanceExtController,
    handler: 'endScopeGrant',
    method: RequestMethod.DELETE,
    path: 'resource-scope-grants/:grantId',
    roles: ['SECURITY_ADMIN'],
    code: 'authz.resource_scope_grants.delete',
    resourceIdParam: 'grantId',
  },
  {
    ctrl: SchedulingBookingsController,
    handler: 'reject',
    method: RequestMethod.POST,
    path: ':id/reject',
    roles: ['SCHEDULING_ADMIN', 'SCHEDULING_AGENT', 'PRACTITIONER'],
    code: 'scheduling.bookings.reject',
    resourceIdParam: 'id',
  },
  {
    ctrl: SchedulingBookingsController,
    handler: 'rejectPaymentReceipt',
    method: RequestMethod.POST,
    path: ':id/payment-receipts/:receiptId/reject',
    roles: ['PRACTITIONER', 'SCHEDULING_ADMIN', 'SCHEDULING_AGENT'],
    code: 'scheduling.bookings_payment_receipts.reject',
    resourceIdParam: 'receiptId',
  },
  {
    ctrl: SchedulingController,
    handler: 'retireTemplate',
    method: RequestMethod.DELETE,
    path: 'templates/:id',
    roles: ['SCHEDULING_ADMIN', 'PRACTITIONER'],
    code: 'scheduling.templates.delete',
    resourceIdParam: 'id',
  },
  {
    ctrl: SchedulingController,
    handler: 'removeException',
    method: RequestMethod.DELETE,
    path: 'exceptions/:id',
    roles: ['SCHEDULING_ADMIN', 'PRACTITIONER'],
    code: 'scheduling.exceptions.delete',
    resourceIdParam: 'id',
  },
];

describe('Piloto @RequirePermission: 11 rutas', () => {
  it('son exactamente 11 códigos distintos', () => {
    expect(new Set(PILOT.map((r) => r.code)).size).toBe(11);
  });

  it.each(PILOT.map((r) => [`${r.ctrl.name}.${r.handler}`, r] as const))(
    '%s lleva el permiso esperado y conserva método, ruta y @Roles',
    (_name, r) => {
      const handler = (r.ctrl.prototype as Record<string, unknown>)[r.handler];
      expect(typeof handler).toBe('function');
      expect(Reflect.getMetadata(METHOD_METADATA, handler as object)).toBe(
        r.method,
      );
      expect(Reflect.getMetadata(PATH_METADATA, handler as object)).toBe(
        r.path,
      );
      expect(Reflect.getMetadata(ROLES_KEY, handler as object)).toEqual(
        r.roles,
      );
      expect(
        Reflect.getMetadata(REQUIRED_PERMISSION_KEY, handler as object),
      ).toEqual({
        code: r.code,
        resourceIdParam: r.resourceIdParam,
      });
      expect(Reflect.getMetadata(GUARDS_METADATA, handler as object)).toContain(
        RequirePermissionGuard,
      );
    },
  );
});
