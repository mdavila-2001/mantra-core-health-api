import { clinicalRoleId, type ClinicalRoleSeed } from './authz.seed';

/**
 * Roles de negocio no clínicos, materializados en `authz.roles`.
 *
 * `BILLING` y `FINANCE` los exigen los controladores de `insurance`
 * (`broker-commission`, `claims`, `appeals`, `prior-auth`, `coverage`) y
 * `ACCOUNTING_APPROVER` el `approve` de asientos de `accounting-ledger`. Ninguno
 * vive en el módulo dueño de esos controladores (`insurance`/`accounting`, fuera
 * de alcance de este carril): se declaran acá, en `authz`, por el mismo motivo
 * que `pharma_lab.roles.ts` y `scheduling.roles.ts` declaran los suyos en su
 * propio módulo — que dos carriles puedan sembrar roles sin editar el mismo
 * archivo — pero sin tocar un módulo ajeno a este carril (regla de alcance).
 *
 * Sin estas filas, `conceptIdsToRoleCodes`/`AuthzEffectiveRolesService` nunca
 * puede poner estos códigos en el claim `roles` del token, y el único sujeto
 * capaz de ejercer esos endpoints es `SUPERADMIN` por comodín (`RolesGuard`).
 *
 * Ninguno es `CLINICAL`: son funciones administrativas/financieras, no
 * asistenciales, y no deben quedar sujetas al PDP clínico.
 */
export const AUTHZ_BUSINESS_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('BILLING'),
    code: 'BILLING',
    name: 'Facturación',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('FINANCE'),
    code: 'FINANCE',
    name: 'Finanzas',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('ACCOUNTING_APPROVER'),
    code: 'ACCOUNTING_APPROVER',
    name: 'Aprobador de asientos contables',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
] as const;

/** Códigos sembrados por este archivo. */
export const AUTHZ_BUSINESS_ROLE_CODES: readonly string[] =
  AUTHZ_BUSINESS_ROLE_SEED.map((role) => role.code);
