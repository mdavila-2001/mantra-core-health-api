/**
 * Roles y alcance de la infraestructura hospitalaria (CONTRATO-F2-F5 §0.3).
 * Puro: la aplicación carga las asignaciones y el camino del espacio; acá se
 * decide qué roles tiene el actor sobre un objetivo.
 */

/** Rol del contrato (§0.3). */
export type InfraRole =
  | 'SUPERADMIN'
  | 'ORG_ADMIN'
  | 'SITE_ADMIN'
  | 'NURSE'
  | 'NURSE_SUPERVISOR'
  | 'ADMISSION'
  | 'HOUSEKEEPING'
  | 'HOUSEKEEPING_SUPERVISOR'
  | 'MAINTENANCE'
  | 'OR_MANAGER'
  | 'BILLING'
  | 'INFECTION_CONTROL'
  | 'UNIT_HEAD'
  /** Global `ACCOUNTING_APPROVER` (F5f): sólo cuenta donde la regla lo nombra en `globalRoles`. */
  | 'ACCOUNTING'
  /**
   * Globales de periop (`PERIOP_NURSE`, `SURGERY_SCHEDULER`, `SURGEON`,
   * `ANESTHESIOLOGIST`): «Ver agenda de quirófanos» R (matriz F4); sólo
   * donde la regla lo nombra en `globalRoles`.
   */
  | 'PERIOP_STAFF';

/** Alcance de una asignación (`organization_user_assignments.access_scope`). */
export type GrantScope = 'TENANT' | 'PRACTICE' | 'SITE' | 'UNIT' | 'SPACE';

/** Una asignación vigente del actor, ya traducida. */
export interface InfraGrant {
  readonly role: InfraRole;
  readonly scope: GrantScope;
  readonly practiceId?: string | null;
  readonly siteId?: string | null;
  readonly unitId?: string | null;
  readonly spaceId?: string | null;
}

/** Dónde cae la acción. */
export interface ScopeTarget {
  readonly practiceId: string;
  readonly siteId: string;
  /** Unidades que contienen al objetivo (vínculos vigentes del camino + ancestros). */
  readonly unitIds: readonly string[];
  /** El espacio y sus ancestros (`parent_space_id`); vacío si el objetivo es la sede o una unidad. */
  readonly spaceChain: readonly string[];
}

/** Supervisión implica el rol base (§0.3: supervisión de Enfermería/Limpieza). */
const IMPLIES: Partial<Record<InfraRole, InfraRole[]>> = {
  NURSE_SUPERVISOR: ['NURSE'],
  HOUSEKEEPING_SUPERVISOR: ['HOUSEKEEPING'],
};

/**
 * `true` si la asignación contiene el objetivo (camino de `parent_space_id` +
 * `space_unit_assignments` vigentes).
 *
 * @param grant - Asignación.
 * @param target - Objetivo.
 */
export function grantContains(grant: InfraGrant, target: ScopeTarget): boolean {
  switch (grant.scope) {
    case 'TENANT':
      return true;
    case 'PRACTICE':
      return grant.practiceId === target.practiceId;
    case 'SITE':
      return grant.siteId === target.siteId;
    case 'UNIT':
      return !!grant.unitId && target.unitIds.includes(grant.unitId);
    case 'SPACE':
      return !!grant.spaceId && target.spaceChain.includes(grant.spaceId);
    default:
      return false;
  }
}

/**
 * Roles del actor sobre el objetivo: los globales (plataforma, admin) más los
 * de cada asignación que lo contiene, con sus implicaciones.
 *
 * @param base - Roles que no dependen del alcance (plataforma, admin, globales).
 * @param grants - Asignaciones vigentes.
 * @param target - Objetivo.
 */
export function rolesOn(
  base: readonly InfraRole[],
  grants: readonly InfraGrant[],
  target: ScopeTarget,
): Set<InfraRole> {
  const out = new Set<InfraRole>(base);
  for (const g of grants) {
    if (!grantContains(g, target)) continue;
    out.add(g.role);
    for (const r of IMPLIES[g.role] ?? []) out.add(r);
  }
  return out;
}

/** Regla de una acción: quién puede, y quién sólo sobre quirófanos. */
export interface InfraActionRule {
  readonly roles: readonly InfraRole[];
  /** Roles que sólo valen si el objetivo es un quirófano (Jefe QX en F2). */
  readonly operatingRoomRoles?: readonly InfraRole[];
  /**
   * Roles **globales** (no asignados por alcance) que valen para esta acción:
   * p. ej. `BILLING` global sólo en las rutas de facturación. Un rol global
   * que no figura acá no cuenta.
   */
  readonly globalRoles?: readonly InfraRole[];
}

/** Política de una franja: sus acciones, en su propio archivo. */
export interface InfraPolicy {
  readonly name: string;
  readonly actions: Readonly<Record<string, InfraActionRule>>;
}

/**
 * Decide una acción.
 *
 * - Un rol del alcance que figura en `roles` basta.
 * - Un rol global sólo cuenta si la regla lo nombra en `globalRoles`, salvo
 *   `OR_MANAGER` (el `PERIOP_ADMIN` global), que cuenta sólo por
 *   `operatingRoomRoles` y sólo sobre un quirófano.
 * - `operatingRoomRoles` (asignados o el global) valen sobre un quirófano; con
 *   `partial` (objetivo sede/unidad de una lectura de colección) habilitan la
 *   lectura y la colección filtra después por fila.
 *
 * @param rule - Regla de la acción.
 * @param roles - Roles del alcance del actor sobre el objetivo.
 * @param isOperatingRoom - El objetivo es un quirófano.
 * @param globals - Roles globales equivalentes del actor.
 * @param partial - Objetivo de colección (sede o unidad).
 * @returns `true` si alguno de los roles basta.
 */
export function allows(
  rule: InfraActionRule,
  roles: ReadonlySet<InfraRole>,
  isOperatingRoom: boolean,
  globals: readonly InfraRole[] = [],
  partial = false,
): boolean {
  if (rule.roles.some((r) => roles.has(r))) return true;
  if ((rule.globalRoles ?? []).some((r) => globals.includes(r))) return true;
  if (!isOperatingRoom && !partial) return false;
  const orGlobals: readonly InfraRole[] = globals.filter(
    (r) => r === 'OR_MANAGER',
  );
  return (rule.operatingRoomRoles ?? []).some(
    (r) => roles.has(r) || orGlobals.includes(r),
  );
}

/** Roles que pueden ver datos de paciente en el tablero (§F2.3). */
export const PATIENT_VIEWERS: readonly InfraRole[] = [
  'NURSE',
  'NURSE_SUPERVISOR',
  'ADMISSION',
];
