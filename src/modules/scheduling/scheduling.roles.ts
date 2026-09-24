import type { ClinicalRoleSeed } from '../authz/authz.seed';
import { clinicalRoleId } from '../authz/authz.seed';

/** Roles operativos que los controladores de agenda permiten asignar. */
export const SCHEDULING_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('SCHEDULING_ADMIN'),
    code: 'SCHEDULING_ADMIN',
    name: 'Administrador de agenda',
    baseRole: 'ADMIN',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('SCHEDULING_AGENT'),
    code: 'SCHEDULING_AGENT',
    name: 'Agente de agenda',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
] as const;

/** Códigos disponibles para asignación administrativa. */
export const SCHEDULING_ROLE_CODES: readonly string[] =
  SCHEDULING_ROLE_SEED.map((role) => role.code);
