/**
 * Formas de respuesta de la operación de espacios (F2, CONTRATO-F2-F5 §F2.3).
 *
 * Son `interface` y no clases con `@ApiProperty`: describen la respuesta que el
 * cliente arma y no se usan para validar (igual que `infrastructure.types.ts`).
 * Los códigos son siempre los **completos** del concepto (`HYG_DIRTY`).
 */
import type { CareSpacePathItem, ConceptRef } from './infrastructure.types';
import type { V2BedStatus } from '../domain/bed-status-v2';

/** Datos mínimos del paciente que viajan al tablero (sólo a Enfermería y Admisión). */
export interface BedBoardPatient {
  /** Iniciales (nombre y primer apellido). */
  readonly initials: string;
  /** `M`, `F` o `U` (sexo administrativo). */
  readonly sexCode: string;
  /** Edad en años cumplidos. */
  readonly ageYears: number | null;
}

/** Una celda del tablero: un espacio con sus ejes. */
export interface BedBoardCell {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly path: CareSpacePathItem[];
  readonly form: ConceptRef | null;
  readonly function: ConceptRef | null;
  readonly lifecycle: ConceptRef | null;
  readonly availability: {
    readonly code: string;
    readonly reasonCode: string | null;
    readonly reasonText: string | null;
    readonly expectedUntil: string | null;
    readonly since: string | null;
  };
  readonly hygiene: {
    readonly code: string;
    readonly since: string | null;
    readonly terminalRequired: boolean;
  };
  readonly isolation: {
    readonly code: string;
    readonly organism: string | null;
    readonly since: string | null;
  };
  readonly occupancy: {
    readonly code: string;
    readonly since: string | null;
    /** Sólo para Enfermería y Admisión sobre el espacio. */
    readonly encounterId?: string;
    /** Sólo para Enfermería y Admisión sobre el espacio. */
    readonly patient?: BedBoardPatient;
  };
  readonly v2Code: V2BedStatus;
  readonly assignable: boolean;
  readonly openCleaningOrderId: string | null;
  /** Instante del último evento A20 del espacio (para la antigüedad del dato, S7). */
  readonly lastEventAt: string | null;
  readonly opsVersion: number;
}

/** Recuentos derivados de una unidad (nunca se escriben a mano). */
export interface BedBoardCounts {
  readonly total: number;
  readonly assignable: number;
  readonly occupied: number;
  readonly reserved: number;
  /** Con disponibilidad bloqueada (clínica o administrativa) o cerrada. */
  readonly blocked: number;
  readonly maintenance: number;
  readonly dirty: number;
  readonly cleaning: number;
  readonly isolation: number;
  readonly contaminated: number;
}

/** Un grupo del tablero: la unidad dueña y sus celdas. */
export interface BedBoardUnit {
  /** `null` para los espacios sin unidad dueña. */
  readonly unitId: string | null;
  readonly name: string;
  readonly counts: BedBoardCounts;
  readonly cells: BedBoardCell[];
}

/** `GET /sites/:siteId/bed-board`. */
export interface BedBoard {
  readonly generatedAt: string;
  /** Último evento A20 de la sede dentro del alcance del actor; `null` si no hay. */
  readonly lastEventAt: string | null;
  readonly units: BedBoardUnit[];
  readonly nextCursor: string | null;
}

/** Un bloqueo, como lo ve el cliente. */
export interface CareSpaceBlockView {
  readonly id: string;
  readonly careSpaceId: string;
  readonly kind: ConceptRef | null;
  readonly reason: ConceptRef | null;
  readonly reasonText: string | null;
  readonly startsAt: string;
  readonly expectedEndAt: string | null;
  readonly endedAt: string | null;
  readonly endedByUserId: string | null;
  readonly endNote: string | null;
  readonly cancelledAt: string | null;
  readonly cancelReason: string | null;
  readonly workOrderRef: string | null;
  /** Derivado del estado del espacio: el bloqueo ya rige (no hay columna «aplicado»). */
  readonly applied: boolean;
  /** `true` si pasó la fecha estimada y sigue abierto. */
  readonly overdue: boolean;
  readonly createdAt: string;
  readonly createdByUserId: string | null;
  readonly rowVersion: number;
}

/** Una orden de limpieza, sin datos de paciente. */
export interface CleaningOrderView {
  readonly id: string;
  readonly careSpaceId: string;
  readonly careSpace: { readonly code: string; readonly name: string };
  readonly practiceSiteId: string;
  readonly clinicalUnitId: string | null;
  readonly type: ConceptRef | null;
  readonly trigger: ConceptRef | null;
  readonly priority: ConceptRef | null;
  readonly status: ConceptRef | null;
  readonly sourceRefId: string | null;
  readonly previousOrderId: string | null;
  readonly requestedAt: string;
  readonly dueAt: string | null;
  /** Minutos desde `requestedAt` hasta `generatedAt`: la antigüedad que muestra la cola. */
  readonly ageMinutes: number;
  readonly assignedUserId: string | null;
  readonly startedAt: string | null;
  readonly startedByUserId: string | null;
  readonly finishedAt: string | null;
  readonly finishedByUserId: string | null;
  readonly inspectedAt: string | null;
  readonly inspectedByUserId: string | null;
  readonly inspectionResult: ConceptRef | null;
  readonly rejectionReason: string | null;
  readonly cancelReason: string | null;
  readonly rowVersion: number;
}

/** `GET /sites/:siteId/cleaning-orders`. */
export interface CleaningOrderPage {
  readonly items: CleaningOrderView[];
  readonly nextCursor: string | null;
  readonly generatedAt: string;
}

/** Un evento de estado (A20) del historial. */
export interface StatusEventView {
  readonly id: string;
  readonly careSpaceId: string;
  readonly axis: ConceptRef | null;
  readonly from: ConceptRef | null;
  readonly to: ConceptRef | null;
  readonly reason: ConceptRef | null;
  readonly reasonText: string | null;
  readonly expectedUntil: string | null;
  readonly v2Code: string;
  readonly source: ConceptRef | null;
  readonly sourceRefId: string | null;
  readonly occurredAt: string;
  readonly recordedByUserId: string | null;
  readonly requestId: string | null;
}

/** `GET /care-spaces/:id/status-events`. */
export interface StatusEventPage {
  readonly items: StatusEventView[];
  readonly nextCursor: string | null;
}

/** `GET /care-spaces/:id/operational-state`. */
export interface OperationalStateView {
  readonly cell: BedBoardCell;
  readonly openBlocks: CareSpaceBlockView[];
  readonly openCleaningOrder: CleaningOrderView | null;
}

/** Un compromiso futuro que choca con la ventana de un bloqueo. */
export interface FutureCommitment {
  readonly kind: 'PROCEDURE_CASE' | 'APPOINTMENT' | 'BOOKING';
  readonly id: string;
  readonly startsAt: string;
  readonly nextAction: string;
}

/** Respuesta de `POST /care-spaces/:id/availability`. */
export interface AvailabilityResult {
  readonly cell: BedBoardCell;
  /** El bloqueo creado o terminado; `null` si se reabrió un cierre anterior al modelo. */
  readonly blockId: string | null;
  /** Compromisos futuros reconocidos con `acknowledgeConflicts` (siguen listados). */
  readonly conflicts: FutureCommitment[];
}

/** Respuesta de `POST /care-spaces/:id/hygiene`. */
export interface HygieneResult {
  readonly cell: BedBoardCell;
  readonly cleaningOrderId: string;
}

/** Respuesta de `POST /care-spaces/:id/isolation`. */
export interface IsolationResult {
  readonly cell: BedBoardCell;
  /** Camas hermanas libres que se bloquearon por cohorte (o se liberaron al levantar). */
  readonly companionBlocks: { careSpaceId: string; blockId: string }[];
}

/** Respuesta de terminar o cancelar un bloqueo. */
export interface BlockActionResult {
  readonly block: CareSpaceBlockView;
  readonly cell: BedBoardCell;
  /** Orden `MAINTENANCE_END` que abrió el fin de un mantenimiento. */
  readonly cleaningOrderId: string | null;
}
