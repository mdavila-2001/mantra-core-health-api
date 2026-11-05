import type { ClinicalRoleSeed } from '../authz/authz.seed';
import { clinicalRoleId } from '../authz/authz.seed';

/**
 * Roles de plataforma del centro de datos, materializados en `authz.roles`.
 *
 * La API exige estos códigos en `@Roles(...)` (catálogo, auditoría, gobierno) pero nadie los
 * sembraba: escribir o revisar el catálogo sólo lo pasaba `SUPERADMIN` por comodín. Con estas
 * filas existen como rol asignable (`POST /authz/users/:userId/role-assignments`).
 *
 * Todos son de ámbito `GLOBAL`: son datos de la plataforma, no de un tenant. **Condición de la
 * cadena de autorización:** el rol se asigna **sin `tenantId`**; con tenant, el código entra a
 * `scopedRoles` del token y en las rutas `@TenantAgnostic` no hay tenant resuelto (403).
 *
 * Ninguno es `CLINICAL`: gobernar datos no es personal asistencial y no queda sujeto al PDP
 * clínico.
 *
 * Se declaran acá y no en `authz.seed.ts` para no editar un archivo compartido con otros carriles.
 */
export const DATA_CATALOG_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('GOVERNANCE_ADMIN'),
    code: 'GOVERNANCE_ADMIN',
    name: 'Administrador de gobierno de datos',
    baseRole: 'ADMIN',
    scope: 'GLOBAL',
  },
  {
    id: clinicalRoleId('DATA_PLATFORM_ADMIN'),
    code: 'DATA_PLATFORM_ADMIN',
    name: 'Administrador de la plataforma de datos',
    baseRole: 'ADMIN',
    scope: 'GLOBAL',
  },
  {
    id: clinicalRoleId('DPO'),
    code: 'DPO',
    name: 'Delegado de protección de datos',
    baseRole: 'STAFF',
    scope: 'GLOBAL',
  },
  {
    id: clinicalRoleId('AUDITOR'),
    code: 'AUDITOR',
    name: 'Auditor (sólo lectura)',
    baseRole: 'STAFF',
    scope: 'GLOBAL',
  },
  {
    id: clinicalRoleId('DATA_STEWARD'),
    code: 'DATA_STEWARD',
    name: 'Custodio de datos',
    baseRole: 'STAFF',
    scope: 'GLOBAL',
  },
] as const;

/** Códigos sembrados por este módulo. */
export const DATA_CATALOG_ROLE_CODES: readonly string[] =
  DATA_CATALOG_ROLE_SEED.map((role) => role.code);
