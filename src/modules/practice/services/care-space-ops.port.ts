import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type { V2BedStatus } from '../domain/ops/bed-status-v2';

/** Ejes y resumen de un espacio, para quien lo consume desde otra franja. */
export interface CareSpaceOperationalState {
  readonly careSpaceId: string;
  readonly tenantId: string;
  readonly practiceSiteId: string;
  readonly practiceId: string;
  readonly formCode: string | null;
  readonly functionCode: string | null;
  readonly lifecycle: string;
  readonly availability: string;
  readonly hygiene: string;
  readonly isolation: string;
  readonly occupancy: string;
  readonly terminalCleaningRequired: boolean;
  readonly v2Code: V2BedStatus;
  readonly assignable: boolean;
  /** Reglas de asignabilidad que fallan (`LIFECYCLE|AVAILABILITY|OCCUPANCY|HYGIENE`). */
  readonly violations: readonly string[];
  readonly opsVersion: number;
  readonly bedCategoryConceptId: string | null;
  readonly prepMinutes: number | null;
  readonly cleanupMinutes: number | null;
}

/** Quién y desde qué petición. */
export interface OpsActorContext {
  readonly actor?: Pick<AuthenticatedUser, 'id'>;
  readonly requestId?: string;
}

/** Disparadores que otra franja puede usar al ensuciar un espacio. */
export type DirtyTrigger =
  | 'CLN_TRG_DISCHARGE'
  | 'CLN_TRG_TRANSFER'
  | 'CLN_TRG_OR_TURNOVER'
  | 'CLN_TRG_CONTAMINATION';

/**
 * Puerto de F2 para F3/F4/F5 (CONTRATO-F2-F5 §F2.3). Se llama **dentro** de
 * la transacción del llamador: los cambios de F2 se confirman o revierten
 * junto con el movimiento ADT o el evento de quirófano. El adaptador valida
 * que el espacio sea del tenant activo (404 si no).
 */
export interface CareSpaceOpsPort {
  /** Ejes + asignable + v2. */
  getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState>;
  /**
   * Higiene → sucia y orden de limpieza (TERMINAL si `terminal` o si el
   * espacio exige limpieza terminal; `terminal` además prende la bandera).
   * Si ya hay una orden abierta, la devuelve (y la escala a TERMINAL si hace
   * falta) en vez de fallar.
   */
  markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: OpsActorContext & {
      trigger: DirtyTrigger;
      sourceRefId: string;
      terminal: boolean;
    },
  ): Promise<{ cleaningOrderId: string }>;
  /** Evento A20 del eje OCCUPANCY (la ocupación es derivada de ADT). */
  recordOccupancyChange(
    tx: EntityManager,
    careSpaceId: string,
    input: OpsActorContext & {
      from: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
      to: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
      sourceRefId: string;
    },
  ): Promise<void>;
  /**
   * 422 `SPACE_NOT_BOOKABLE` (con `details.block` o `details.lifecycle`) si el
   * espacio no está ACTIVE y vigente o tiene un bloqueo que se pisa con la
   * ventana.
   */
  assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: { start: Date; end: Date },
  ): Promise<void>;
  /**
   * Bloquea las filas de los espacios (`FOR UPDATE`, por id) en la
   * transacción del llamador (ADT, §F3.3).
   */
  lockSpaces(tx: EntityManager, careSpaceIds: readonly string[]): Promise<void>;
}

/** Token de inyección del puerto (lo exporta `PracticeModule`). */
export const CARE_SPACE_OPS_PORT = Symbol('CARE_SPACE_OPS_PORT');
