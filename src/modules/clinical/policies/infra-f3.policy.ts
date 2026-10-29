import { DELEG } from '../../delegated_access/delegated_access.concepts';

/**
 * Política de la internación / ADT (CONTRATO-F2-F5 §0.3 y permisos de F3.3).
 *
 * Es **declarativa**: dice qué rol puede cada acción y nada más. Quien la evalúa
 * (`AdtAccessService`) resuelve el rol del actor con el alcance que contiene el
 * espacio. Cuando F2 publique su evaluador único (`InfrastructureAccessService`
 * y el token multi-proveedor `INFRA_POLICIES`), este objeto se registra allí tal
 * cual: ninguna franja edita la política de otra.
 */

/** Rol operativo por asignación delegada. */
export type InfraOperationalRole =
  | 'NURSE'
  | 'NURSE_SUPERVISOR'
  | 'ADMISSION'
  | 'INFECTION_CONTROL'
  | 'BILLING';

/** Rol de estructura / plataforma. */
export type InfraAdminRole = 'ORG_ADMIN' | 'BRANCH_ADMIN' | 'PLATFORM';

/** Cómo reconoce la API cada rol operativo (`delegated_access.organization_user_assignments`). */
export const INFRA_OPERATIONAL_ROLE_CONCEPTS: Readonly<
  Record<InfraOperationalRole, string>
> = {
  NURSE: DELEG.ASSIGN_ROLE_NURSE,
  NURSE_SUPERVISOR: DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR,
  ADMISSION: DELEG.ASSIGN_ROLE_ADMISSION,
  INFECTION_CONTROL: DELEG.ASSIGN_ROLE_INFECTION_CONTROL,
  BILLING: DELEG.ASSIGN_ROLE_BILLING,
};

/** Acciones de F3. */
export const INFRA_F3_ACTIONS = {
  /** Consultar compatibilidad de una cama sin escribir. */
  COMPATIBILITY_CHECK: 'adt.compatibility_check',
  /** Ingreso con o sin cama. */
  ADMIT: 'adt.admit',
  /** Asignar o reservar una cama a un encuentro. */
  ASSIGN_BED: 'adt.assign_bed',
  /** Traslado e intercambio. */
  TRANSFER: 'adt.transfer',
  /** Egreso. */
  DISCHARGE: 'adt.discharge',
  /** Cancelar una reserva o un traslado. */
  CANCEL: 'adt.cancel',
  /** Forzar la compatibilidad (justificación + incidente). */
  OVERRIDE: 'adt.override',
  /** Avalar una cohorte de aislamiento al forzar. */
  COHORT_APPROVAL: 'adt.cohort_approval',
  /** Revisar un incidente de colocación. */
  INCIDENT_REVIEW: 'adt.incident_review',
  /** Censo vivo y ficha de internación (con datos de paciente). */
  INPATIENT_VIEW: 'adt.inpatient_view',
  /** Ver el censo diario (agregados, sin paciente). */
  CENSUS_VIEW: 'census.view',
  /** Cerrar el censo a mano. */
  CENSUS_CLOSE: 'census.close',
  /** Ajustar un censo cerrado. */
  CENSUS_ADJUST: 'census.adjust',
  /** Ver los indicadores. */
  INDICATORS_VIEW: 'indicators.view',
} as const;

/** Nombre de una acción de F3. */
export type InfraF3Action =
  (typeof INFRA_F3_ACTIONS)[keyof typeof INFRA_F3_ACTIONS];

/** Quién puede una acción. */
export interface InfraActionRule {
  /** Roles operativos (alcance que **contiene** el espacio o la sede). */
  readonly operational: readonly InfraOperationalRole[];
  /** Roles de estructura / plataforma. `PLATFORM` es siempre de sólo lectura. */
  readonly admin: readonly InfraAdminRole[];
}

const FLOOR: readonly InfraOperationalRole[] = [
  'NURSE',
  'NURSE_SUPERVISOR',
  'ADMISSION',
];
const SUPERVISION: readonly InfraOperationalRole[] = ['NURSE_SUPERVISOR'];

/**
 * Matriz de permisos de F3 (el contrato manda sobre `matriz-de-permisos.md`).
 *
 * Enfermería y Admisión asignan, trasladan, dan egreso y cancelan; **Limpieza,
 * Mantenimiento, Jefe de quirófano y Facturación no operan camas**; los
 * administradores de estructura no operan camas por defecto (separación de
 * funciones, INV-44).
 */
export const INFRA_F3_POLICY: Readonly<Record<InfraF3Action, InfraActionRule>> =
  {
    [INFRA_F3_ACTIONS.COMPATIBILITY_CHECK]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.ADMIT]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.ASSIGN_BED]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.TRANSFER]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.DISCHARGE]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.CANCEL]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.OVERRIDE]: { operational: SUPERVISION, admin: [] },
    [INFRA_F3_ACTIONS.COHORT_APPROVAL]: {
      operational: ['INFECTION_CONTROL'],
      admin: [],
    },
    [INFRA_F3_ACTIONS.INCIDENT_REVIEW]: {
      operational: [...SUPERVISION, 'INFECTION_CONTROL'],
      admin: [],
    },
    [INFRA_F3_ACTIONS.INPATIENT_VIEW]: { operational: FLOOR, admin: [] },
    [INFRA_F3_ACTIONS.CENSUS_VIEW]: {
      operational: [...FLOOR, 'BILLING'],
      admin: ['ORG_ADMIN', 'BRANCH_ADMIN', 'PLATFORM'],
    },
    [INFRA_F3_ACTIONS.CENSUS_CLOSE]: {
      operational: [...SUPERVISION, 'ADMISSION'],
      admin: ['ORG_ADMIN', 'BRANCH_ADMIN'],
    },
    [INFRA_F3_ACTIONS.CENSUS_ADJUST]: {
      operational: SUPERVISION,
      admin: ['ORG_ADMIN', 'BRANCH_ADMIN'],
    },
    [INFRA_F3_ACTIONS.INDICATORS_VIEW]: {
      operational: [...FLOOR, 'BILLING'],
      admin: ['ORG_ADMIN', 'BRANCH_ADMIN', 'PLATFORM'],
    },
  };

/** El rol de supervisión implica el de piso. */
export const IMPLIED_ROLES: Readonly<
  Partial<Record<InfraOperationalRole, readonly InfraOperationalRole[]>>
> = {
  NURSE_SUPERVISOR: ['NURSE'],
};

/**
 * Registro de la política para el evaluador de F2 (token `INFRA_POLICIES`).
 * Se exporta como valor para que el integrador lo enchufe con una línea.
 */
export const INFRA_F3_POLICY_REGISTRATION = {
  module: 'clinical',
  franja: 'F3',
  actions: INFRA_F3_POLICY,
} as const;
