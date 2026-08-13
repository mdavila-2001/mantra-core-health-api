import { deterministicId } from '../../common/constants/concepts';
import type { BaseRole, RoleScope } from './dto';

/**
 * Roles asistenciales de sistema materializados en `authz.roles`.
 *
 * Son los diez actores que `docs/business/actors-and-roles.md` agrupa como
 * clínicos y asistenciales: los únicos sujetos al PDP clínico. Existen como
 * filas de sistema (sin `tenant_id`) porque su significado no depende del
 * tenant —un cirujano es un cirujano en cualquier organización— mientras que
 * **la asignación** sí lo acota (`user_role_assignments.tenant_id`).
 *
 * Sin estas filas no hay nada que asignar: `POST /authz/users/:id/role-assignments`
 * exige un `roleId` existente y asignable, y el claim `roles` del token se
 * construye a partir del `code` de estas filas. Antes de sembrarlas, el único
 * sujeto capaz de ejecutar un flujo clínico era `SUPERADMIN` por comodín.
 *
 * Los ids son deterministas por el mismo motivo que el resto de los seeds: el
 * arranque y el runtime coinciden sin coordinación, y una segunda pasada no
 * duplica.
 */
export interface ClinicalRoleSeed {
  /** Identificador determinista de la fila en `authz.roles`. */
  id: string;
  /** Código que viaja en el claim `roles` y que exige `@Roles(...)`. */
  code: string;
  /** Nombre legible en español. */
  name: string;
  /** Rol base de composición. */
  baseRole: BaseRole;
  /** Ámbito por defecto de la asignación. */
  scope: RoleScope;
}

/** Deriva el id determinista de un rol de sistema por su código. */
export function clinicalRoleId(code: string): string {
  return deterministicId(`seed:authz-role:${code}`);
}

/** Los diez actores clínicos y asistenciales, en el orden del documento. */
export const CLINICAL_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('CLINICIAN'),
    code: 'CLINICIAN',
    name: 'Clínico',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('PRACTITIONER'),
    code: 'PRACTITIONER',
    name: 'Profesional sanitario',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('SURGEON'),
    code: 'SURGEON',
    name: 'Cirujano',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('ANESTHESIOLOGIST'),
    code: 'ANESTHESIOLOGIST',
    name: 'Anestesiólogo',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('PERIOP_NURSE'),
    code: 'PERIOP_NURSE',
    name: 'Enfermería perioperatoria',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('PERIOP_ADMIN'),
    code: 'PERIOP_ADMIN',
    name: 'Administración perioperatoria',
    baseRole: 'ADMIN',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('SURGERY_SCHEDULER'),
    code: 'SURGERY_SCHEDULER',
    name: 'Programación quirúrgica',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('CLINICAL_APPROVER'),
    code: 'CLINICAL_APPROVER',
    name: 'Aprobador clínico',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('CLINICAL_INFORMATICIAN'),
    code: 'CLINICAL_INFORMATICIAN',
    name: 'Informático clínico',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('PRINCIPAL_INVESTIGATOR'),
    code: 'PRINCIPAL_INVESTIGATOR',
    name: 'Investigador principal',
    baseRole: 'CLINICAL',
    scope: 'TENANT',
  },
] as const;

/** Códigos sembrados, para validar un alta administrativa contra el catálogo. */
export const CLINICAL_ROLE_CODES: readonly string[] = CLINICAL_ROLE_SEED.map(
  (r) => r.code,
);
