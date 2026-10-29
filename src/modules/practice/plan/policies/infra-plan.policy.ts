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

import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
  type InfraRole,
} from '../../policies/infra-policy';
import { CLINICAL_TEXT_ROLES } from '../../services/ops-privacy';

/** Roles operativos que el plano distingue (por asignación delegada). */
export type PlanRole = 'ENF' | 'ADM' | 'LIM' | 'MAN' | 'JQ' | 'FAC' | 'IC';

/** Acciones del plano. */
export type PlanAction =
  'plan.view' | 'plan.state' | 'plan.patient' | 'plan.edit' | 'plan.history';

/**
 * Clave del concepto de la asignación delegada (`delegated_access:<CLAVE>`, que es
 * lo que se guarda en `terminology.catalog_concepts.code`) → rol del plano.
 */
export const PLAN_ROLE_BY_ASSIGNMENT_CODE: Readonly<Record<string, PlanRole>> =
  {
    'delegated_access:ASSIGN_ROLE_NURSE': 'ENF',
    'delegated_access:ASSIGN_ROLE_NURSE_SUPERVISOR': 'ENF',
    'delegated_access:ASSIGN_ROLE_ADMISSION': 'ADM',
    'delegated_access:ASSIGN_ROLE_HOUSEKEEPING': 'LIM',
    'delegated_access:ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR': 'LIM',
    'delegated_access:ASSIGN_ROLE_MAINTENANCE': 'MAN',
    'delegated_access:ASSIGN_ROLE_OR_MANAGER': 'JQ',
    'delegated_access:ASSIGN_ROLE_BILLING': 'FAC',
    'delegated_access:ASSIGN_ROLE_INFECTION_CONTROL': 'IC',
  };

/** Rol del plano → rol de infraestructura de F2 (para reutilizar sus conjuntos). */
const INFRA_ROLE_OF: Readonly<Record<PlanRole, InfraRole>> = {
  ENF: 'NURSE',
  ADM: 'ADMISSION',
  LIM: 'HOUSEKEEPING',
  MAN: 'MAINTENANCE',
  JQ: 'OR_MANAGER',
  FAC: 'BILLING',
  IC: 'INFECTION_CONTROL',
};

/** Roles que ven el estado superpuesto (Facturación no: F2 le da «—»). */
export const STATE_ROLES: ReadonlySet<PlanRole> = new Set<PlanRole>([
  'ENF',
  'ADM',
  'LIM',
  'MAN',
  'JQ',
  'IC',
]);

/**
 * Roles que ven el nombre del paciente (D-PL-14): Enfermería de la unidad y
 * Admisión. Limpieza, Mantenimiento y el resto **nunca**.
 */
export const PATIENT_ROLES: ReadonlySet<PlanRole> = new Set<PlanRole>([
  'ENF',
  'ADM',
]);

/**
 * Roles que ven el texto clínico libre (organismo, «condición del paciente»).
 * Sale de `CLINICAL_TEXT_ROLES` de F2: no se duplica la lista.
 */
export const CLINICAL_TEXT_PLAN_ROLES: ReadonlySet<PlanRole> = new Set(
  (Object.keys(INFRA_ROLE_OF) as PlanRole[]).filter((role) =>
    CLINICAL_TEXT_ROLES.includes(INFRA_ROLE_OF[role]),
  ),
);

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

/** Roles de infraestructura que cubre cada rol del plano (el supervisor incluido). */
const INFRA_ROLES_OF_PLAN_ROLE: Readonly<Record<PlanRole, InfraRole[]>> = {
  ENF: ['NURSE', 'NURSE_SUPERVISOR'],
  ADM: ['ADMISSION'],
  LIM: ['HOUSEKEEPING', 'HOUSEKEEPING_SUPERVISOR'],
  MAN: ['MAINTENANCE'],
  JQ: ['OR_MANAGER'],
  FAC: ['BILLING'],
  IC: ['INFECTION_CONTROL'],
};

/** Roles de estructura que editan y leen la historia del plano. */
const PLAN_STRUCTURE_ROLES: readonly InfraRole[] = [
  'SUPERADMIN',
  'ORG_ADMIN',
  'BRANCH_ADMIN',
];

/**
 * La política del plano en la forma del registro de infraestructura. Se deriva de
 * las mismas constantes que usa {@link InfraPlanPolicy} (`STATE_ROLES`,
 * `PATIENT_ROLES`): ver el plano lo ve cualquiera con acceso a la sede, así que
 * `plan.view` lista a todos los roles.
 */
export function infraPlanRegistryPolicy(): InfraPolicy {
  const operational = (set: Iterable<PlanRole>): InfraRole[] =>
    [...set].flatMap((role) => INFRA_ROLES_OF_PLAN_ROLE[role]);
  const everyone: InfraRole[] = [
    ...PLAN_STRUCTURE_ROLES,
    ...operational(Object.keys(INFRA_ROLE_OF) as PlanRole[]),
  ];
  return {
    name: 'PLAN',
    rules: {
      'plan.view': { roles: everyone, summary: 'Ver el plano de la sede' },
      'plan.state': {
        roles: [...PLAN_STRUCTURE_ROLES, ...operational(STATE_ROLES)],
        summary: 'Ver el estado operativo superpuesto al plano',
      },
      'plan.patient': {
        roles: operational(PATIENT_ROLES),
        summary: 'Ver el nombre del paciente en la cama',
      },
      'plan.edit': {
        roles: [...PLAN_STRUCTURE_ROLES],
        summary: 'Editar el plano (es editar estructura)',
      },
      'plan.history': {
        roles: [...PLAN_STRUCTURE_ROLES],
        summary: 'Ver la historia del plano',
      },
    },
  };
}

/** Alta de la política del plano en el registro de `practice` al arrancar el módulo. */
@Injectable()
export class InfraPlanPolicyInitializer implements OnModuleInit {
  /** @param registry - Registro de políticas (`INFRA_POLICIES`). */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(infraPlanRegistryPolicy());
  }
}
