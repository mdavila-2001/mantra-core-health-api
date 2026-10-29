import type { EntityManager } from '@mikro-orm/postgresql';
import type { SpaceState } from './floor-plan.types';

/**
 * Puerto del estado operativo que el plano colorea (CONTRATO-PLANO §3.6).
 *
 * El plano **no** reimplementa la operación de camas (F2) ni la ocupación (F3):
 * las lee a través de esta interfaz fina. La implementación por defecto
 * ({@link DefaultPlanOperationalState}) lee las columnas de F2 de
 * `practice.care_spaces` y `clinical.encounter_locations`; cuando F2 tenga su
 * lector del tablero (`bed-board-read.service`), se reemplaza el proveedor del
 * token {@link PLAN_OPERATIONAL_STATE} sin tocar nada del plano.
 */
export const PLAN_OPERATIONAL_STATE = 'PLAN_OPERATIONAL_STATE';

/** Quién puede ver el ocupante: todos, ninguno o un conjunto de espacios. */
export type PatientVisibility = 'NONE' | 'ALL' | ReadonlySet<string>;

/** Pedido de estado de un conjunto de espacios. */
export interface OpsStateRequest {
  readonly tenantId: string;
  readonly practiceId: string;
  readonly spaceIds: readonly string[];
  /**
   * Dónde viajan las iniciales del paciente. El puerto **no consulta** a la
   * persona fuera de este alcance: el dato no entra ni en memoria.
   */
  readonly patientVisibility: PatientVisibility;
}

/** Bloqueo abierto de un espacio. */
export interface OpenBlockView {
  readonly id: string;
  readonly kind: string;
  readonly reasonCode: string | null;
  readonly reasonText: string | null;
  readonly startsAt: string;
  readonly expectedEndAt: string | null;
}

/** Orden de limpieza abierta de un espacio. */
export interface OpenCleaningView {
  readonly id: string;
  readonly type: string;
  readonly status: string;
  readonly priority: string;
  readonly requestedAt: string;
}

/** Ocupante de un espacio, con identidad. Sólo para quien está autorizado. */
export interface OccupantView {
  readonly displayName: string;
  readonly initials: string;
  readonly sexCode: string;
  readonly ageYears: number;
  readonly encounterId: string;
  readonly patientProfileId: string;
  readonly admittedAt: string;
  readonly losDays: number;
  readonly expectedDischargeAt?: string;
}

/** Lo que el puerto entrega para la tarjeta de un espacio. */
export interface OpsCardView {
  readonly openBlocks: OpenBlockView[];
  readonly openCleaningOrder?: OpenCleaningView;
  /** Presente sólo si se pidió `withOccupant` y hay un paciente en el espacio. */
  readonly occupant?: OccupantView;
}

/** Contrato del estado operativo que consume el plano. */
export interface PlanOperationalStatePort {
  /**
   * Estado de los espacios pedidos (los que no tienen perfil de estado no
   * aparecen en el mapa).
   *
   * @param tx - Transacción de lectura.
   * @param request - Espacios y alcance del paciente.
   * @returns Un `SpaceState` por espacio, sin la clave `patient` salvo que esté autorizada.
   */
  read(
    tx: EntityManager,
    request: OpsStateRequest,
  ): Promise<Map<string, SpaceState>>;

  /** Instante del último evento A20 de los espacios del lienzo, o `null`. */
  lastEventAt(tx: EntityManager, planId: string): Promise<string | null>;

  /**
   * Huella de todo lo que puede cambiar el estado del lienzo (ejes, ocupación,
   * bloqueos, órdenes). Alimenta el `ETag` y el `304` del sondeo.
   */
  fingerprint(
    tx: EntityManager,
    tenantId: string,
    planId: string,
  ): Promise<string>;

  /** Bloqueos, orden de limpieza y —sólo si se pide— ocupante de un espacio. */
  card(
    tx: EntityManager,
    tenantId: string,
    spaceId: string,
    withOccupant: boolean,
  ): Promise<OpsCardView>;
}
