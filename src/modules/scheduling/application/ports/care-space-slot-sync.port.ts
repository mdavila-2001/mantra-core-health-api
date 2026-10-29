import type { TimeWindow } from '../../domain/catalog/care-space-agenda';
import type { UnitOfWork } from './unit-of-work';

/** Qué cupos se examinan. */
export type SlotScope =
  | { readonly careSpaceId: string }
  | { readonly equipmentId: string }
  | { readonly resourceIds: readonly string[] };

/** Quién provoca el cambio. */
export interface SyncActor {
  readonly userId: string | null;
  readonly now?: Date;
}

/** Tipo de fuente de una excepción. */
export type ExceptionSource = 'CARE_SPACE_BLOCK' | 'EQUIPMENT_STATUS';

/**
 * Mantiene al día la agenda con el estado de la fuente de cada cupo (F5a, F5d): el espacio
 * donde se atiende (bloqueado, en mantenimiento o cerrado) y, en imagen, el equipo.
 *
 * Todo corre en la transacción del llamador y es idempotente.
 */
export interface CareSpaceSlotSyncPort {
  /**
   * Ids (de entre `slotIds`) de los cupos cubiertos por un bloqueo o un equipo fuera de
   * servicio. La oferta descarta estos aunque su estado todavía diga «abierto».
   */
  coveredSlotIds(
    tx: UnitOfWork,
    slotIds: readonly string[],
  ): Promise<Set<string>>;

  /** Cierra los cupos libres y futuros del alcance que quedaron cubiertos. */
  closeCovered(
    tx: UnitOfWork,
    tenantId: string,
    scope: SlotScope,
    actor: SyncActor,
  ): Promise<string[]>;

  /** Reabre los cupos futuros del alcance que había cerrado la fuente y ya no están cubiertos. */
  reopenUncovered(
    tx: UnitOfWork,
    tenantId: string,
    scope: SlotScope,
    actor: SyncActor,
  ): Promise<string[]>;

  /** Recursos activos afectados por una fuente. */
  affectedResourceIds(
    tx: UnitOfWork,
    tenantId: string,
    scope: SlotScope,
  ): Promise<string[]>;

  /**
   * Crea la excepción de solo lectura de una fuente en cada recurso afectado. Idempotente por
   * `(recurso, fuente, origen)`.
   *
   * @returns Los recursos en los que se creó.
   */
  createSourceExceptions(
    tx: UnitOfWork,
    input: {
      tenantId: string;
      source: ExceptionSource;
      sourceRefId: string;
      resourceIds: readonly string[];
      startAt: Date;
      endAt: Date | null;
      /** Texto genérico: nunca el motivo clínico del bloqueo. */
      reason: string;
      actorUserId: string | null;
      closedSlots: number;
    },
  ): Promise<string[]>;

  /**
   * La fuente volvió: acorta las excepciones que empezaron antes de `endedAt` y borra las que
   * nunca llegaron a regir.
   */
  endSourceExceptions(
    tx: UnitOfWork,
    input: {
      tenantId: string;
      source: ExceptionSource;
      sourceRefId: string;
      /** `null`: la fuente se canceló y las excepciones se borran enteras. */
      endedAt: Date | null;
      actorUserId: string | null;
    },
  ): Promise<number>;

  /**
   * Los tramos de `[from, to)` en los que el espacio (o el equipo) del recurso y la plantilla
   * no están disponibles. Lo lee la generación de cupos.
   */
  unavailableWindows(
    tx: UnitOfWork,
    tenantId: string,
    input: {
      careSpaceIds: readonly (string | null | undefined)[];
      equipmentId?: string | null;
      from: Date;
      to: Date;
    },
  ): Promise<TimeWindow[]>;
}

/** Token de inyección de la sincronización de cupos con el espacio y el equipo. */
export const CARE_SPACE_SLOT_SYNC_PORT = Symbol('CARE_SPACE_SLOT_SYNC_PORT');
