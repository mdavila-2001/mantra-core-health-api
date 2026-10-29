import { deterministicId } from '../../../common/constants/concepts';

/**
 * Política de F4 (quirófanos): quién puede qué sobre un quirófano
 * (`CONTRATO-F2-F5` §0.3 y «Permisos F4»; `matriz-de-permisos` §5).
 *
 * Es **dato**, como pide el contrato: cada franja declara sus acciones en su propio
 * archivo (`<modulo>/policies/infra-<franja>.policy.ts`) y el evaluador las lee.
 * El evaluador único de F2 (`InfrastructureAccessService`) todavía no existe en esta
 * rama; `OperatingRoomAccessService` aplica esta misma tabla con las piezas que sí
 * están (`StructureAccessService` de F1 y el alcance delegado por espacio), y cuando
 * F2 integre su evaluador basta registrar este objeto en `INFRA_POLICIES`.
 */
export const INFRA_F4_ACTIONS = [
  /** `POST /scheduling/resources` con `care_spaces`: vincular el quirófano como recurso agendable. */
  'OR_RESOURCE_LINK',
  /** Lo mismo para un espacio agendable que no es quirófano (sólo estructura). */
  'SPACE_RESOURCE_LINK',
  /** Crear bloques y series, cancelarlos, acortar una serie. */
  'OR_BLOCK_MANAGE',
  /** Liberar un bloque antes de tiempo. */
  'OR_BLOCK_RELEASE',
  /** Ver quirófanos, agenda del día y bloques. */
  'OR_SCHEDULE_VIEW',
  /** Ver la utilización de quirófano y de bloque. */
  'OR_UTILIZATION_VIEW',
  /** Registrar eventos de caso en sala y operar el check-list OMS. */
  'OR_CASE_ROOM_OPERATE',
] as const;

/** Una acción de la política de F4. */
export type InfraF4Action = (typeof INFRA_F4_ACTIONS)[number];

/** Cómo se concede una acción. */
export interface InfraActionRule {
  /**
   * Quienes administran la estructura del establecimiento (plataforma, organización,
   * administrador de la sucursal) pueden la acción.
   */
  readonly structureAdmin: boolean;
  /** Quienes sólo leen la estructura (membresía sin rol de administración) la pueden. */
  readonly structureReader: boolean;
  /** Roles globales/ámbito-tenant que la conceden (`PERIOP_ADMIN` es el «jefe de quirófano» global). */
  readonly roles: readonly string[];
  /** Claves de rol delegado (`delegated_access:<clave>`) que la conceden sobre el espacio. */
  readonly delegatedRoleKeys: readonly string[];
}

/** Roles globales que operan el quirófano el día del caso. */
const CASE_DAY_ROLES = [
  'PERIOP_NURSE',
  'SURGEON',
  'ANESTHESIOLOGIST',
  'PERIOP_ADMIN',
] as const;

/** Roles de lectura de agenda: los perioperatorios, programación y facturación. */
const VIEW_ROLES = [...CASE_DAY_ROLES, 'SURGERY_SCHEDULER', 'BILLING'] as const;

/** La tabla de la política. */
export const INFRA_F4_POLICY: Readonly<Record<InfraF4Action, InfraActionRule>> =
  {
    OR_RESOURCE_LINK: {
      structureAdmin: true,
      structureReader: false,
      roles: ['PERIOP_ADMIN'],
      delegatedRoleKeys: ['ASSIGN_ROLE_OR_MANAGER'],
    },
    SPACE_RESOURCE_LINK: {
      structureAdmin: true,
      structureReader: false,
      roles: [],
      delegatedRoleKeys: [],
    },
    OR_BLOCK_MANAGE: {
      structureAdmin: false,
      structureReader: false,
      roles: ['PERIOP_ADMIN'],
      delegatedRoleKeys: ['ASSIGN_ROLE_OR_MANAGER'],
    },
    OR_BLOCK_RELEASE: {
      structureAdmin: false,
      structureReader: false,
      roles: ['PERIOP_ADMIN'],
      delegatedRoleKeys: ['ASSIGN_ROLE_OR_MANAGER'],
    },
    OR_SCHEDULE_VIEW: {
      structureAdmin: true,
      structureReader: false,
      roles: VIEW_ROLES,
      delegatedRoleKeys: [
        'ASSIGN_ROLE_OR_MANAGER',
        'ASSIGN_ROLE_NURSE',
        'ASSIGN_ROLE_NURSE_SUPERVISOR',
        'ASSIGN_ROLE_HOUSEKEEPING',
        'ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR',
        'ASSIGN_ROLE_MAINTENANCE',
        'ASSIGN_ROLE_BILLING',
      ],
    },
    OR_UTILIZATION_VIEW: {
      structureAdmin: true,
      structureReader: false,
      roles: ['PERIOP_ADMIN', 'BILLING'],
      delegatedRoleKeys: ['ASSIGN_ROLE_OR_MANAGER', 'ASSIGN_ROLE_BILLING'],
    },
    OR_CASE_ROOM_OPERATE: {
      structureAdmin: false,
      structureReader: false,
      roles: CASE_DAY_ROLES,
      delegatedRoleKeys: ['ASSIGN_ROLE_OR_MANAGER'],
    },
  };

/** UUID del concepto de un rol delegado (`delegated_access:<clave>`), sin importar quién lo declare. */
export function delegatedRoleConceptId(key: string): string {
  return deterministicId(`delegated_access:${key}`);
}

/** `reason` del 403 de F4 (el mismo que el evaluador de F2). */
export const INFRA_ACTION_NOT_ALLOWED = 'INFRA_ACTION_NOT_ALLOWED';
