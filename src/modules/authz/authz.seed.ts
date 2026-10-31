import { deterministicId } from '../../common/constants/concepts';
import {
  SUPPORT_ACTIONS,
  SUPPORT_PERMISSION_CATALOG,
} from '../delegated_access/domain/support-actions';
import type { BaseRole, RoleScope } from './dto';
import {
  SUPPORT_ATOM_SEED,
  legacyGovernance,
  type PermissionGovernanceSeed,
} from './authz.support-atoms.seed';

export {
  PERMISSION_CATEGORY_SEED,
  SUPPORT_STAFF_FIELD_FLOOR,
  type PermissionCategorySeed,
  type PermissionGovernanceSeed,
  type SupportFieldFloorSeed,
} from './authz.support-atoms.seed';

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
  /**
   * ¿Puede asignarse con `POST /authz/users/:id/role-assignments`? Por omisión
   * sí. `false` marca un rol de ejecución que solo el login deriva (p. ej.
   * `SUPPORT_STAFF`): existe como fila de sistema pero nadie lo recibe a mano.
   */
  assignable?: boolean;
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

/* ============================================================================
    Permisos de plataforma materializados en `authz.permissions`.

    Un `resource_scope_grants` —el grant polimórfico sujeto→recurso— exige un
    `permission_id` que exista. Hasta ahora la única forma de tener uno era que
    un `SECURITY_ADMIN` diera de alta el permiso a mano por
    `POST /authz/permissions`, lo que dejaba **inutilizable** todo flujo donde
    quien concede no es un administrador: el caso del paciente que comparte un
    resultado con un profesional.

    Se siembran acá, con id determinista y por código, exactamente los permisos
    que un flujo de producto necesita nombrar. No es un catálogo de permisos
    completo y no pretende serlo: cada fila entra cuando un caso de uso la pide.
    ========================================================================== */

/** Un permiso de sistema que algún flujo del producto nombra por código. */
export interface PlatformPermissionSeed {
  /** Identificador determinista de la fila en `authz.permissions`. */
  id: string;
  /** Código por el que el flujo lo busca. */
  code: string;
  /** Nombre legible en español. */
  name: string;
  /** Recurso sobre el que actúa, en la nomenclatura del catálogo. */
  resource: string;
  /** Acción que habilita. */
  action: 'READ' | 'WRITE' | 'CREATE' | 'DELETE' | 'EXECUTE' | 'APPROVE';
  /** Ámbito por defecto de la concesión. */
  scope: RoleScope;
  /** Código de la categoría de la pantalla de permisos; ausente en lo heredado. */
  categoryCode?: string;
  /** Permiso de campo (`is_field_level`). */
  fieldLevel?: boolean;
  /** `is_dangerous` (sensibilidad ALTA o CRÍTICA en los átomos). */
  dangerous?: boolean;
  /**
   * Metadatos de gobierno (sensibilidad, obligaciones, propósito, base legal,
   * asignabilidad a apoyo). Ausente en los permisos de sistema que no son del
   * catálogo de apoyo: la semilla no los toca.
   */
  governance?: PermissionGovernanceSeed;
}

/** Deriva el id determinista de un permiso de sistema por su código. */
export function platformPermissionId(code: string): string {
  return deterministicId(`seed:authz-permission:${code}`);
}

/**
 * Permiso de lectura de un resultado diagnóstico concreto.
 *
 * Es el que respalda «compartir temporalmente un estudio con un profesional
 * autorizado» (M20): el grant que el paciente crea apunta a este permiso, al
 * informe como recurso y al profesional como sujeto, con `valid_to` como
 * vencimiento. El «temporalmente» del requisito **es** ese `valid_to`.
 */
export const DIAGNOSTIC_RESULT_READ_PERMISSION_CODE = 'DIAGNOSTIC_RESULT_READ';

/**
 * Permiso con el que el personal de apoyo pide ver la historia clínica de un
 * paciente por un rato. Lo decide el doctor titular de la delegación; el permiso
 * concedido lleva `valid_to` y se acota a un paciente (y, si se indica, a un
 * encuentro).
 */
export const CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE =
  'CLINICAL_RECORD_TEMPORARY_VIEW';

/** Los permisos de sistema, en el orden en que se siembran. */
export const PLATFORM_PERMISSION_SEED: readonly PlatformPermissionSeed[] = [
  {
    id: platformPermissionId(DIAGNOSTIC_RESULT_READ_PERMISSION_CODE),
    code: DIAGNOSTIC_RESULT_READ_PERMISSION_CODE,
    name: 'Leer un resultado diagnóstico compartido',
    resource: 'diagnostics.diagnostic_report',
    action: 'READ',
    scope: 'SELF',
  },
  {
    id: platformPermissionId(CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE),
    code: CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE,
    name: 'Ver la historia clínica de un paciente con acceso temporal',
    resource: 'clinical.patient_record',
    action: 'READ',
    scope: 'TENANT',
  },
  // Acciones del personal de apoyo (secretaria y otros roles): el vínculo las
  // reparte permiso por permiso en `delegated_access.support_grant_actions`.
  ...SUPPORT_ACTIONS.map((code): PlatformPermissionSeed => ({
    id: platformPermissionId(code),
    code,
    name: SUPPORT_PERMISSION_CATALOG[code].name,
    resource: SUPPORT_PERMISSION_CATALOG[code].resource,
    action: SUPPORT_PERMISSION_CATALOG[code].action,
    scope: 'TENANT',
    // Alias heredado: asignable a apoyo con la sensibilidad de su átomo
    // primario y SIN obligaciones nuevas (regla de no regresión, §2.3).
    governance: legacyGovernance(code),
  })),
  // Los 73 permisos atómicos del catálogo de apoyo (§2.2).
  ...SUPPORT_ATOM_SEED,
] as const;
