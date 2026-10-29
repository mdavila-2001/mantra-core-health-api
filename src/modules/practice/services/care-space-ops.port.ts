import type { EntityManager } from '@mikro-orm/postgresql';
import type {
  AvailabilityCode,
  HygieneCode,
  IsolationCode,
  OccupancyCode,
  V2BedStatus,
} from '../domain/bed-status-v2';

/**
 * Puerto de la operación de espacios para las demás franjas (CONTRATO-F2-F5
 * §F2.3). F3 (internación/ADT) y F4 (quirófanos) lo llaman **dentro de su
 * transacción** (`tx`): la cama que queda sucia y su orden de limpieza se
 * confirman juntas con el egreso, o ninguna (INV-34).
 *
 * Es la **única** definición del puerto: `clinical` (ADT) y
 * `procedures_perioperative` (quirófanos) la importan de acá y reciben la
 * implementación real, `CareSpaceOpsPortService`, por el token
 * {@link CARE_SPACE_OPS_PORT}, que `PracticeModule` exporta. Las pruebas de
 * franja sustituyen el token por un doble con `overrideProviders`.
 *
 * Los métodos **no autorizan**: quien los llama ya autorizó su propia operación
 * (el egreso, la salida del paciente del quirófano). Sí exigen que el espacio sea
 * del tenant del contexto (404 si no).
 */
export const CARE_SPACE_OPS_PORT = 'PRACTICE_CARE_SPACE_OPS_PORT';

/** Quien origina el cambio: un usuario, el sistema (`null`) o un `AuthenticatedUser`. */
export type OpsActorRef =
  | { readonly id: string; readonly userId?: never }
  | { readonly userId: string | null; readonly id?: never }
  | null
  | undefined;

/** Resuelve el usuario de un {@link OpsActorRef}; `null` si lo origina el sistema. */
export function opsActorUserId(actor: OpsActorRef): string | null {
  if (!actor) return null;
  return (actor.userId ?? actor.id ?? null) || null;
}

/** Disparadores de una orden de limpieza (con o sin el prefijo `CLN_TRG_`). */
export type CleaningTriggerInput =
  | 'DISCHARGE'
  | 'TRANSFER'
  | 'MANUAL'
  | 'ISOLATION_END'
  | 'CONTAMINATION'
  | 'MAINTENANCE_END'
  | 'OR_TURNOVER'
  | 'INSPECTION_FAILED'
  | `CLN_TRG_${
      | 'DISCHARGE'
      | 'TRANSFER'
      | 'MANUAL'
      | 'ISOLATION_END'
      | 'CONTAMINATION'
      | 'MAINTENANCE_END'
      | 'OR_TURNOVER'
      | 'INSPECTION_FAILED'}`;

/** Ocupación (con o sin el prefijo `OCC_`). */
export type OccupancyInput =
  | 'FREE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'OCC_FREE'
  | 'OCC_RESERVED'
  | 'OCC_OCCUPIED';

/** Estado operativo de un espacio: ejes, ocupación derivada, resumen v2 y «asignable». */
export interface CareSpaceOperationalState {
  readonly careSpaceId: string;
  readonly tenantId: string;
  readonly practiceSiteId: string;
  /** El ciclo de vida es `SPACE_ACTIVE` y el espacio está vigente. */
  readonly lifecycleActive: boolean;
  readonly availability: AvailabilityCode;
  readonly availabilityReasonCode: string | null;
  readonly availabilityExpectedUntil: Date | null;
  readonly hygiene: HygieneCode;
  readonly terminalCleaningRequired: boolean;
  readonly isolation: IsolationCode;
  /**
   * Organismo del aislamiento: dato **clínico**. Sólo para reglas internas (F3, cohortes);
   * quien lo exponga por HTTP lo filtra con `CLINICAL_TEXT_ROLES` (`ops-privacy.ts`).
   */
  readonly isolationOrganism: string | null;
  /** Derivada de `encounter_locations`: nunca se escribe. */
  readonly occupancy: OccupancyCode;
  readonly v2Code: V2BedStatus;
  /** Lo que consume F3 para ofrecer la cama. */
  readonly assignable: boolean;
  readonly openCleaningOrderId: string | null;
  readonly opsVersion: number;
}

/** Entrada de {@link CareSpaceOpsPort.markDirtyFromSource}. */
export interface MarkDirtyInput {
  /** Qué lo disparó (egreso, traslado, recambio de quirófano…). */
  readonly trigger: CleaningTriggerInput;
  /** Id del hecho que lo originó (encuentro, ubicación, caso quirúrgico). */
  readonly sourceRefId?: string | null;
  /** Limpieza terminal (aislamiento, contaminación): fuerza el tipo y la bandera. */
  readonly terminal: boolean;
  readonly actor?: OpsActorRef;
  readonly requestId?: string | null;
  /** `CLN_PRIO_*` (por omisión, rutina). */
  readonly priority?: 'ROUTINE' | 'URGENT' | 'STAT';
}

/** Entrada de {@link CareSpaceOpsPort.recordOccupancyChange}. */
export interface OccupancyChangeInput {
  readonly from: OccupancyInput;
  readonly to: OccupancyInput;
  /** Id de la ubicación o del encuentro que cambió la ocupación. */
  readonly sourceRefId?: string | null;
  readonly actor?: OpsActorRef;
  readonly requestId?: string | null;
}

/** Entrada de {@link CareSpaceOpsPort.revertDirtyFromSource}. */
export interface RevertDirtyInput {
  /** Hecho que originó la orden que se deshace (la ubicación de origen del traslado). */
  readonly sourceRefId: string;
  readonly actor?: OpsActorRef;
  readonly requestId?: string | null;
}

/** Ventana pedida por una reserva o una cirugía. */
export interface BookingWindow {
  readonly start: Date;
  readonly end: Date;
}

/** El puerto. */
export interface CareSpaceOpsPort {
  /**
   * Ejes, ocupación derivada, resumen v2 y «asignable» del espacio.
   *
   * @throws ResourceNotFoundException (404) si el espacio no es del tenant.
   */
  getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState>;

  /**
   * Deja el espacio sucio y abre su orden de limpieza en la misma transacción.
   * Idempotente: con una orden abierta no falla, la reutiliza (y la escala a
   * terminal si hace falta); sobre una orden `DONE` sin inspeccionar la reemplaza.
   *
   * @returns El id de la orden abierta.
   */
  markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: MarkDirtyInput,
  ): Promise<{ cleaningOrderId: string }>;

  /**
   * Deshace el ensuciado de un hecho de origen que luego se cancela (un traslado
   * cancelado, A12): cancela su orden de limpieza si nadie la empezó y devuelve la
   * higiene a lo que era.
   *
   * @returns `reverted: false` si no hay una orden `PENDING` de ese hecho (la
   *   limpieza ya empezó, terminó o la orden era de otro hecho): no se deshace.
   */
  revertDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: RevertDirtyInput,
  ): Promise<{ reverted: boolean }>;

  /**
   * Registra el cambio de ocupación como evento A20 del eje OCCUPANCY (la
   * ocupación en sí la deriva `encounter_locations`; esto deja el rastro, sube
   * `ops_version` y publica `practice.care_space.status_changed`).
   */
  recordOccupancyChange(
    tx: EntityManager,
    careSpaceId: string,
    input: OccupancyChangeInput,
  ): Promise<void>;

  /**
   * Exige que el espacio se pueda reservar o programar en la ventana.
   *
   * @throws PreconditionFailedException (422 `SPACE_NOT_BOOKABLE`) con el bloqueo o el ciclo de vida en `details`.
   */
  assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: BookingWindow,
  ): Promise<void>;
}
