/**
 * Política de permisos del plano de planta (CONTRATO-PLANO §4).
 *
 * Declara **qué** exige cada acción y decide con datos ya resueltos (nivel
 * estructural del actor y roles operativos); no consulta la base. Está en su
 * propio archivo, como pide el contrato (§0.3 de F2–F5), para que otra franja
 * pueda registrarlo en `INFRA_POLICIES` sin editar la política de estructura.
 *
 * Editar el plano **es** editar estructura: misma gente, mismo alcance y misma
 * regla que `PATCH /care-spaces/:id`; no hay permiso nuevo.
 */

/** Roles operativos que el plano distingue (por asignación delegada). */
export type PlanRole = 'ENF' | 'ADM' | 'LIM' | 'MAN' | 'JQ' | 'FAC';

/** Acciones del plano. */
export type PlanAction =
  | 'plan.view'
  | 'plan.state'
  | 'plan.patient'
  | 'plan.edit'
  | 'plan.history';

/**
 * Clave del concepto de la asignación delegada (`delegated_access:<CLAVE>`, que es
 * lo que se guarda en `terminology.catalog_concepts.code`) → rol del plano.
 */
export const PLAN_ROLE_BY_ASSIGNMENT_CODE: Readonly<Record<string, PlanRole>> = {
  'delegated_access:ASSIGN_ROLE_NURSE': 'ENF',
  'delegated_access:ASSIGN_ROLE_NURSE_SUPERVISOR': 'ENF',
  'delegated_access:ASSIGN_ROLE_ADMISSION': 'ADM',
  'delegated_access:ASSIGN_ROLE_HOUSEKEEPING': 'LIM',
  'delegated_access:ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR': 'LIM',
  'delegated_access:ASSIGN_ROLE_MAINTENANCE': 'MAN',
  'delegated_access:ASSIGN_ROLE_OR_MANAGER': 'JQ',
  'delegated_access:ASSIGN_ROLE_BILLING': 'FAC',
};

/** Roles que ven el estado superpuesto (Facturación no: F2 le da «—»). */
export const STATE_ROLES: ReadonlySet<PlanRole> = new Set<PlanRole>([
  'ENF',
  'ADM',
  'LIM',
  'MAN',
  'JQ',
]);

/**
 * Roles que ven el nombre del paciente (D-PL-14): Enfermería de la unidad y
 * Admisión. Limpieza, Mantenimiento y el resto **nunca**.
 */
export const PATIENT_ROLES: ReadonlySet<PlanRole> = new Set<PlanRole>([
  'ENF',
  'ADM',
]);

/** Quiénes pueden editar, para `details.requiredRoles` del 403. */
export const PLAN_EDIT_REQUIRED_ROLES: readonly string[] = [
  'ORGANIZATION_OWNER_OR_ADMIN',
  'BRANCH_ADMIN',
  'PLATFORM_SUPPORT',
];

/** Lo que la política necesita saber del actor. */
export interface PlanActorFacts {
  /** `StructureAccessService.canWriteStructure` sobre la sede. */
  readonly canWriteStructure: boolean;
  /** Nivel estructural es de plataforma (soporte: exige motivo). */
  readonly isPlatform: boolean;
  /** Roles operativos con alguna asignación vigente aplicable a la sede. */
  readonly roles: ReadonlySet<PlanRole>;
}

/** Decide cada acción del plano. */
export class InfraPlanPolicy {
  /**
   * ¿Puede el actor hacer la acción?
   *
   * @param action - Acción del plano.
   * @param facts - Nivel y roles del actor.
   * @returns `true` si la acción está permitida **en algún alcance** (el
   *   alcance exacto lo resuelve quien lee el estado).
   */
  allows(action: PlanAction, facts: PlanActorFacts): boolean {
    switch (action) {
      case 'plan.view':
        return true;
      case 'plan.edit':
      case 'plan.history':
        return facts.canWriteStructure;
      case 'plan.state':
        return (
          facts.canWriteStructure ||
          [...facts.roles].some((role) => STATE_ROLES.has(role))
        );
      case 'plan.patient':
        return [...facts.roles].some((role) => PATIENT_ROLES.has(role));
    }
  }
}
