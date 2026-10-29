import type { EntityManager } from '@mikro-orm/postgresql';

/** Token de inyección del puerto de operación de espacios. */
export const CARE_SPACE_OPS_PORT = 'PERIOP_CARE_SPACE_OPS_PORT';

/** Una ventana de tiempo `[start, end)`. */
export interface BookingWindow {
  readonly start: Date;
  readonly end: Date;
}

/** Quién y qué origina el ensuciado del espacio. */
export interface MarkDirtySource {
  /** Origen de la orden de limpieza (`OR_TURNOVER` al salir el paciente del quirófano). */
  readonly trigger: string;
  /** Id del hecho que lo origina (el caso quirúrgico). */
  readonly sourceRefId: string;
  /** `true` pide limpieza terminal; el recambio entre cirugías no lo es. */
  readonly terminal: boolean;
  /** Quien registró el hecho. */
  readonly actor: { readonly id: string };
  /** Id de correlación de la petición. */
  readonly requestId?: string;
}

/**
 * Parte del puerto `CareSpaceOpsPort` (CONTRATO-F2-F5 §F2.3) que F4 consume.
 *
 * La implementa la franja F2 (`practice/services/care-space-ops.port.ts`, exportada por
 * `PracticeModule`); acá se declara sólo lo que quirófanos usa, con la misma firma, para
 * programar contra el contrato sin esperar a F2. El integrador sustituye el proveedor del
 * token {@link CARE_SPACE_OPS_PORT} por el de F2 (`useExisting`); ningún servicio de este
 * módulo depende de la clase concreta.
 */
export interface CareSpaceOpsPort {
  /**
   * Falla si el espacio no puede reservarse en la ventana (mantenimiento, cierre, bloqueo
   * vigente, ciclo de vida no activo).
   *
   * @throws DomainException con `reason` `SPACE_NOT_BOOKABLE` y `details.block` cuando un
   *   bloqueo o el ciclo de vida lo impide.
   */
  assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: BookingWindow,
  ): Promise<void>;

  /**
   * Marca el espacio sucio por un hecho de origen y encola su orden de limpieza.
   *
   * @returns La orden de limpieza creada (o la ya abierta), o `null` si no hay cola de
   *   limpieza enlazada.
   */
  markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    source: MarkDirtySource,
  ): Promise<{ cleaningOrderId: string | null }>;
}

/** `reason` con que el puerto informa que el espacio no es reservable. */
export const SPACE_NOT_BOOKABLE = 'SPACE_NOT_BOOKABLE';
