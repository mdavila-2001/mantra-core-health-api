/* ============================================================================
    Quién puede qué en `/billing/simulated/*` (decisión de negocio, 2026-10-11).

    - ADMINISTRACIÓN de la clínica (`SECURITY_ADMIN`, `BILLING`, `FINANCE`,
      `CASHIER`, `PAYMENTS_ADMIN`; `SUPERADMIN` global sin acotar, el acotado
      en `scopedRoles` sólo en sus tenants): ve los cobros de los
      tenants de los que es miembro, aplica pagos reales, emite, anula,
      revierte, entrega por correo y ve la bandeja.
    - MÉDICO (`PRACTITIONER`, `CLINICIAN`, con perfil profesional): sólo los
      cobros de SUS consultas (`encounters.primary_practitioner_id`). Puede
      cobrar e iniciar la facturación de SU consulta bajo estas rutas
      simuladas; NO anula, NO ve la bandeja ni los cobros de otro profesional
      (404: no se revela que existen). El 403 de
      `POST /billing/invoices:issue-from-encounter` para el médico NO cambia.
    - PACIENTE (`PATIENT` con perfil de paciente): sólo «Mis facturas», las que
      le emitieron.
    ========================================================================== */

import { roleAuthorizesInTenant, type AuthenticatedUser } from '../../common';

export const ADMIN_ROLES: readonly string[] = [
  'SECURITY_ADMIN',
  'BILLING',
  'FINANCE',
  'CASHIER',
  'PAYMENTS_ADMIN',
];
export const PRACTITIONER_ROLES: readonly string[] = [
  'PRACTITIONER',
  'CLINICIAN',
];

export type OperatingScope =
  | {
      kind: 'admin';
      /** `null` = sin acotar (SUPERADMIN global). */
      tenantIds: readonly string[] | null;
    }
  | { kind: 'practitioner'; practitionerProfileId: string };

/** El alcance con el que se opera cobros y facturas; `null` = sin permiso. */
export function operatingScope(user: AuthenticatedUser): OperatingScope | null {
  // Sin acotar sólo el `SUPERADMIN` global. Uno acotado en `scopedRoles`
  // administra los tenants donde se le concedió, nada más (#1241).
  if (roleAuthorizesInTenant(user, 'SUPERADMIN', undefined))
    return { kind: 'admin', tenantIds: null };
  const superadminTenants = Object.keys(user.scopedRoles ?? {}).filter((t) =>
    roleAuthorizesInTenant(user, 'SUPERADMIN', t),
  );
  const isAdmin = user.roles.some((r) => ADMIN_ROLES.includes(r));
  if (isAdmin || superadminTenants.length > 0) {
    const memberTenants = isAdmin ? (user.tenantIds ?? []) : [];
    return {
      kind: 'admin',
      tenantIds: [...new Set([...memberTenants, ...superadminTenants])],
    };
  }
  if (
    user.practitionerProfileId !== undefined &&
    user.roles.some((r) => PRACTITIONER_ROLES.includes(r))
  ) {
    return {
      kind: 'practitioner',
      practitionerProfileId: user.practitionerProfileId,
    };
  }
  return null;
}

/** Sólo la administración anula, revierte, entrega y ve la bandeja. */
export function isAdminScope(scope: OperatingScope): boolean {
  return scope.kind === 'admin';
}

export type MyInvoicesScope =
  | { view: 'ISSUED'; scope: OperatingScope }
  | { view: 'RECEIVED'; patientProfileId: string }
  | { view: 'ISSUED'; scope: null };

/** De qué lado de la factura está quien mira «Mis facturas». */
export function myInvoicesScope(user: AuthenticatedUser): MyInvoicesScope {
  const operating = operatingScope(user);
  if (operating !== null) return { view: 'ISSUED', scope: operating };
  if (user.patientProfileId !== undefined && user.roles.includes('PATIENT')) {
    return { view: 'RECEIVED', patientProfileId: user.patientProfileId };
  }
  return { view: 'ISSUED', scope: null };
}
