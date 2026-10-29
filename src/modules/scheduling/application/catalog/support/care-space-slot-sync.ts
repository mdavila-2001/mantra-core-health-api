import { randomUUID } from 'node:crypto';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../../common';
import { DUNIT } from '../../../../diagnostic_units/diagnostic_units.concepts';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { PRAC } from '../../../../practice/practice.concepts';
import {
  CARE_SPACE_BLOCK_LISTENERS,
  CareSpaceBlockListenerRegistry,
  type BlockListenerContext,
  type BlockOutcome,
  type CareSpaceBlockListener,
} from '../../../../practice/services/care-space-block-listeners';
import type {
  BlockRow,
  SpaceOpsRow,
} from '../../../../practice/services/ops-rows';
import {
  OPEN_ENDED_BLOCK_END,
  type TimeWindow,
} from '../../../domain/catalog/care-space-agenda';
import { SCHED } from '../../../domain/scheduling.concepts';
import { AvailabilityExceptions } from '../../../entities';

/** `scheduling.availability_exception.created` (con `sourceKind`). */
export const AVAILABILITY_EXCEPTION_CREATED_EVENT =
  'scheduling.availability_exception.created';
/** `scheduling.availability_exception.ended`: la fuente volvió y la excepción se acortó o se quitó. */
export const AVAILABILITY_EXCEPTION_ENDED_EVENT =
  'scheduling.availability_exception.ended';

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

const SOURCE_CONCEPT: Readonly<Record<ExceptionSource, string>> = {
  CARE_SPACE_BLOCK: SCHED.EXC_SRC_CARE_SPACE_BLOCK,
  EQUIPMENT_STATUS: SCHED.EXC_SRC_EQUIPMENT_STATUS,
};

/** Estados del equipo que lo sacan de servicio. */
const EQUIPMENT_OUT_OF_SERVICE: readonly string[] = [
  DUNIT.EQUIPMENT_MAINTENANCE,
  DUNIT.EQUIPMENT_OUT_OF_SERVICE,
];

const marks = (n: number): string =>
  Array.from({ length: n }, () => '?').join(', ');

/**
 * Qué es «un cupo cubierto»: el cupo de un recurso cuyo espacio tiene un bloqueo abierto
 * (aplicado o programado antes de que el cupo termine) o cuyo equipo está en mantenimiento
 * o fuera de servicio. Es la misma regla que aplica `assertBookable` de F2 —un bloqueo rige
 * hasta que alguien lo termina—, así que el cupo que esta consulta cubre es exactamente el
 * que la reserva rechazaría.
 *
 * `coalesce(…, false)`: un recurso sin equipo da `NULL` en la segunda mitad, y `not (false or NULL)`
 * sería `NULL`, es decir, «no se reabre nunca».
 *
 * Los espacios que importan son tres: el del recurso (sala), el de la plantilla que generó el
 * cupo (consultorio de un profesional) y el del equipo del recurso (sala del equipo).
 */
const COVERED = `(
  exists (
    select 1 from practice.care_space_blocks b
     where b.tenant_id = r.tenant_id
       and b.cancelled_at is null and b.ended_at is null
       and b.starts_at < coalesce(bs.end_at, bs.start_at)
       and b.care_space_id in (r.care_space_id, t.care_space_id, eq.care_space_id)
  )
  or coalesce(eq.operational_status_concept_id in (${marks(EQUIPMENT_OUT_OF_SERVICE.length)}), false)
)`;

/** Los cupos con el recurso, la plantilla y el equipo a mano. */
const SLOT_FROM = `from scheduling.bookable_slots bs
  join scheduling.schedulable_resources r on r.id = bs.resource_id
  left join scheduling.schedule_templates t on t.id = bs.schedule_template_id
  left join diagnostic_units.diagnostic_equipment eq
         on r.resource_ref_type = 'diagnostic_equipment' and eq.id = r.resource_ref_id`;

/** Condición y parámetros de un alcance. */
function scopeSql(scope: SlotScope): { sql: string; params: unknown[] } {
  if ('careSpaceId' in scope) {
    return {
      sql: '(r.care_space_id = ? or t.care_space_id = ? or eq.care_space_id = ?)',
      params: [scope.careSpaceId, scope.careSpaceId, scope.careSpaceId],
    };
  }
  if ('equipmentId' in scope) {
    return {
      sql: "(r.resource_ref_type = 'diagnostic_equipment' and r.resource_ref_id = ?)",
      params: [scope.equipmentId],
    };
  }
  if (scope.resourceIds.length === 0) return { sql: 'false', params: [] };
  return {
    sql: `r.id in (${marks(scope.resourceIds.length)})`,
    params: [...scope.resourceIds],
  };
}

/**
 * Mantiene al día la agenda con el estado de la fuente de cada cupo (F5a, F5d).
 *
 * Un cupo depende de dos cosas que la agenda no gobierna: el **espacio** donde se atiende
 * (F2 lo bloquea, lo pone en mantenimiento o lo cierra) y, en imagen, el **equipo**
 * (mantenimiento o fuera de servicio). Cuando la fuente sale de servicio los cupos libres
 * pasan a `SLOT_SOURCE_CLOSED` y se crea una excepción de disponibilidad de solo lectura
 * (`CARE_SPACE_BLOCK` / `EQUIPMENT_STATUS`) en cada recurso afectado; cuando vuelve, los
 * cupos que cerró la fuente se reabren y la excepción se acorta o se quita.
 *
 * Los cupos con una reserva viva **no se tocan**: la cita sigue en pie y el equipo la ve en la
 * lista de compromisos de F2 (`FUTURE_COMMITMENTS_CONFLICT`) con su próxima acción.
 *
 * Los cupos que otra transacción tiene bloqueados (una reserva en curso) se saltean con
 * `SKIP LOCKED` en vez de esperar: esperarlos cruzaría el orden de candados de la reserva
 * (cupo, después espacio) con el del bloqueo (espacio, después cupos) y las dos terminarían en
 * interbloqueo. El cupo saltado no se pierde: sigue «cubierto», así que ni la oferta lo
 * muestra ni la reserva lo acepta, y la próxima sincronización lo cierra.
 *
 * Todo corre en la transacción del llamador y es idempotente: se puede volver a llamar con el
 * mismo alcance sin duplicar nada. El cierre y la reapertura se calculan siempre contra la
 * verdad (la consulta de «cubierto»), no contra lo que se recuerda de la última llamada.
 */
@Injectable()
export class CareSpaceSlotSync {
  /** @param outbox - Outbox transaccional. */
  constructor(private readonly outbox: OutboxService) {}

  /**
   * Ids (de entre `slotIds`) de los cupos cubiertos. La lectura de la oferta descarta estos
   * aunque su estado todavía diga «abierto» (un cupo liberado por una cancelación dentro de un
   * bloqueo vuelve a `OPEN` por el camino de la cancelación).
   */
  async coveredSlotIds(
    tx: EntityManager,
    slotIds: readonly string[],
  ): Promise<Set<string>> {
    if (slotIds.length === 0) return new Set();
    const rows = await tx.execute<{ id: string }[]>(
      `select bs.id ${SLOT_FROM}
        where bs.id in (${marks(slotIds.length)}) and ${COVERED}`,
      [...slotIds, ...EQUIPMENT_OUT_OF_SERVICE],
    );
    return new Set(rows.map((row) => row.id));
  }

  /** Cierra los cupos libres y futuros del alcance que quedaron cubiertos. */
  async closeCovered(
    tx: EntityManager,
    tenantId: string,
    scope: SlotScope,
    actor: SyncActor,
  ): Promise<string[]> {
    const where = scopeSql(scope);
    const rows = await tx.execute<{ id: string }[]>(
      `update scheduling.bookable_slots set
          status_concept_id = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        where id in (
          select bs.id ${SLOT_FROM}
           where r.tenant_id = ? and ${where.sql}
             and bs.status_concept_id = ? and bs.remaining_capacity = bs.capacity
             and coalesce(bs.end_at, bs.start_at) > ? and ${COVERED}
           for update of bs skip locked
        ) returning id`,
      [
        SCHED.SLOT_SOURCE_CLOSED,
        actor.now ?? new Date(),
        actor.userId,
        tenantId,
        ...where.params,
        CONCEPTS.SLOT_OPEN,
        actor.now ?? new Date(),
        ...EQUIPMENT_OUT_OF_SERVICE,
      ],
    );
    return rows.map((row) => row.id);
  }

  /**
   * Reabre los cupos futuros del alcance que había cerrado la fuente y ya no están cubiertos
   * (el bloqueo terminó o se canceló, el equipo volvió a servicio).
   */
  async reopenUncovered(
    tx: EntityManager,
    tenantId: string,
    scope: SlotScope,
    actor: SyncActor,
  ): Promise<string[]> {
    const where = scopeSql(scope);
    const rows = await tx.execute<{ id: string }[]>(
      `update scheduling.bookable_slots set
          status_concept_id = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        where id in (
          select bs.id ${SLOT_FROM}
           where r.tenant_id = ? and ${where.sql}
             and bs.status_concept_id = ? and bs.remaining_capacity = bs.capacity
             and bs.start_at > ? and not ${COVERED}
           for update of bs skip locked
        ) returning id`,
      [
        CONCEPTS.SLOT_OPEN,
        actor.now ?? new Date(),
        actor.userId,
        tenantId,
        ...where.params,
        SCHED.SLOT_SOURCE_CLOSED,
        actor.now ?? new Date(),
        ...EQUIPMENT_OUT_OF_SERVICE,
      ],
    );
    return rows.map((row) => row.id);
  }

  /**
   * Recursos activos afectados por una fuente: la sala (recurso del espacio), los profesionales
   * con una plantilla publicada en el espacio y los equipos ubicados en él.
   */
  async affectedResourceIds(
    tx: EntityManager,
    tenantId: string,
    scope: SlotScope,
  ): Promise<string[]> {
    if ('resourceIds' in scope) return [...scope.resourceIds];
    const spaceFilter =
      'careSpaceId' in scope
        ? {
            sql: '(r.care_space_id = ? or t.care_space_id = ? or eq.care_space_id = ?)',
            params: [scope.careSpaceId, scope.careSpaceId, scope.careSpaceId],
          }
        : {
            sql: "(r.resource_ref_type = 'diagnostic_equipment' and r.resource_ref_id = ?)",
            params: [scope.equipmentId],
          };
    const rows = await tx.execute<{ id: string }[]>(
      `select distinct r.id
         from scheduling.schedulable_resources r
         left join scheduling.schedule_templates t
                on t.resource_id = r.id and t.status_concept_id = ?
         left join diagnostic_units.diagnostic_equipment eq
                on r.resource_ref_type = 'diagnostic_equipment' and eq.id = r.resource_ref_id
        where r.tenant_id = ? and r.state_concept_id = ? and ${spaceFilter.sql}`,
      [
        CONCEPTS.TEMPLATE_PUBLISHED,
        tenantId,
        CONCEPTS.STATE_ACTIVE,
        ...spaceFilter.params,
      ],
    );
    return rows.map((row) => row.id);
  }

  /**
   * Crea la excepción de solo lectura de una fuente en cada recurso afectado. Idempotente por
   * `(recurso, fuente, origen)`: si ya existe no se duplica.
   *
   * @returns Los recursos en los que se creó.
   */
  async createSourceExceptions(
    tx: EntityManager,
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
  ): Promise<string[]> {
    const created: string[] = [];
    const endAt =
      input.endAt && input.endAt > input.startAt
        ? input.endAt
        : OPEN_ENDED_BLOCK_END;
    const kind = SOURCE_CONCEPT[input.source];
    const now = new Date();
    for (const resourceId of input.resourceIds) {
      const existing = await tx.execute<{ id: string }[]>(
        `select id from scheduling.availability_exceptions
          where tenant_id = ? and resource_id = ? and source_kind_concept_id = ? and source_ref_id = ?`,
        [input.tenantId, resourceId, kind, input.sourceRefId],
      );
      if (existing.length > 0) continue;
      const id = randomUUID();
      await tx.insert(AvailabilityExceptions, {
        id,
        tenantId: input.tenantId,
        resourceId,
        exceptionTypeConceptId: CONCEPTS.EXCEPTION_OTHER,
        startAt: input.startAt,
        endAt,
        reason: input.reason,
        isAvailable: false,
        sourceKindConceptId: kind,
        sourceRefId: input.sourceRefId,
        createdAt: now,
        updatedAt: now,
        createdByUserId: input.actorUserId ?? undefined,
        updatedByUserId: input.actorUserId ?? undefined,
        rowVersion: 1,
      });
      await this.outbox.publishDomainEvent(tx, {
        tenantId: input.tenantId,
        eventType: AVAILABILITY_EXCEPTION_CREATED_EVENT,
        aggregateType: 'availability_exception',
        aggregateId: id,
        payloadJson: {
          exceptionId: id,
          resourceId,
          sourceKind: input.source,
          sourceRefId: input.sourceRefId,
          startAt: input.startAt.toISOString(),
          endAt: endAt.toISOString(),
          isAvailable: false,
          blockedSlots: input.closedSlots,
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
        },
        actorUserId: input.actorUserId ?? undefined,
      });
      created.push(resourceId);
    }
    return created;
  }

  /**
   * La fuente volvió: acorta las excepciones que empezaron antes de `endedAt` y borra las que
   * nunca llegaron a regir (empezaban después, o la fuente se canceló).
   */
  async endSourceExceptions(
    tx: EntityManager,
    input: {
      tenantId: string;
      source: ExceptionSource;
      sourceRefId: string;
      /** `null`: la fuente se canceló y las excepciones se borran enteras. */
      endedAt: Date | null;
      actorUserId: string | null;
    },
  ): Promise<number> {
    const kind = SOURCE_CONCEPT[input.source];
    const rows = await tx.execute<
      { id: string; resource_id: string; start_at: Date }[]
    >(
      `select id, resource_id, start_at from scheduling.availability_exceptions
        where tenant_id = ? and source_kind_concept_id = ? and source_ref_id = ?`,
      [input.tenantId, kind, input.sourceRefId],
    );
    for (const row of rows) {
      const startedBefore =
        input.endedAt !== null && new Date(row.start_at) < input.endedAt;
      if (startedBefore) {
        await tx.execute(
          `update scheduling.availability_exceptions
              set end_at = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
            where id = ?`,
          [input.endedAt, input.endedAt, input.actorUserId, row.id],
        );
      } else {
        await tx.execute(
          `delete from scheduling.availability_exceptions where id = ?`,
          [row.id],
        );
      }
      await this.outbox.publishDomainEvent(tx, {
        tenantId: input.tenantId,
        eventType: AVAILABILITY_EXCEPTION_ENDED_EVENT,
        aggregateType: 'availability_exception',
        aggregateId: row.id,
        payloadJson: {
          exceptionId: row.id,
          resourceId: row.resource_id,
          sourceKind: input.source,
          sourceRefId: input.sourceRefId,
          endedAt: input.endedAt?.toISOString() ?? null,
          removed: !startedBefore,
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
        },
        actorUserId: input.actorUserId ?? undefined,
      });
    }
    return rows.length;
  }

  /**
   * Los tramos de `[from, to)` en los que el espacio (o el equipo) del recurso y la plantilla no
   * están disponibles: bloqueos abiertos, espacios que ya no están activos y, si el equipo está
   * fuera de servicio, toda la ventana. Lo lee la generación de cupos para no ofrecer lo que la
   * reserva rechazaría.
   */
  async unavailableWindows(
    tx: EntityManager,
    tenantId: string,
    input: {
      careSpaceIds: readonly (string | null | undefined)[];
      equipmentId?: string | null;
      from: Date;
      to: Date;
    },
  ): Promise<TimeWindow[]> {
    const windows: TimeWindow[] = [];
    const spaces = new Set(input.careSpaceIds.filter(Boolean) as string[]);
    if (input.equipmentId) {
      const rows = await tx.execute<
        {
          care_space_id: string | null;
          operational_status_concept_id: string;
        }[]
      >(
        `select e.care_space_id, e.operational_status_concept_id
           from diagnostic_units.diagnostic_equipment e where e.id = ?`,
        [input.equipmentId],
      );
      const equipment = rows[0];
      if (equipment?.care_space_id) spaces.add(equipment.care_space_id);
      if (
        equipment &&
        EQUIPMENT_OUT_OF_SERVICE.includes(
          equipment.operational_status_concept_id,
        )
      ) {
        windows.push({ start: input.from, end: OPEN_ENDED_BLOCK_END });
      }
    }
    if (spaces.size > 0) {
      const ids = [...spaces];
      const blocks = await tx.execute<{ starts_at: Date }[]>(
        `select b.starts_at from practice.care_space_blocks b
          where b.tenant_id = ? and b.care_space_id in (${marks(ids.length)})
            and b.cancelled_at is null and b.ended_at is null and b.starts_at < ?`,
        [tenantId, ...ids, input.to],
      );
      for (const row of blocks) {
        windows.push({
          start: new Date(row.starts_at),
          end: OPEN_ENDED_BLOCK_END,
        });
      }
      const inactive = await tx.execute<{ id: string }[]>(
        `select id from practice.care_spaces
          where tenant_id = ? and id in (${marks(ids.length)}) and status_concept_id <> ?`,
        [tenantId, ...ids, PRAC.SPACE_ACTIVE],
      );
      if (inactive.length > 0) {
        windows.push({ start: input.from, end: OPEN_ENDED_BLOCK_END });
      }
    }
    return windows;
  }
}

/** Texto de la excepción creada por un bloqueo del espacio (sin el motivo clínico). */
export const CARE_SPACE_BLOCK_EXCEPTION_REASON = 'Bloqueo del consultorio';
/** Texto de la excepción creada por el estado del equipo. */
export const EQUIPMENT_STATUS_EXCEPTION_REASON = 'Equipo fuera de servicio';

/**
 * Oyente de F2: cuando un espacio se bloquea, la agenda cierra sus cupos y crea la excepción de
 * solo lectura; cuando el bloqueo termina o se cancela, los reabre. Corre en la transacción
 * del bloqueo: o quedan los dos, o ninguno.
 */
@Injectable()
export class CareSpaceBlockAgendaListener
  implements CareSpaceBlockListener, OnModuleInit
{
  /**
   * @param sync - Cierre y reapertura de cupos y excepciones de la fuente.
   * @param registry - Registro de oyentes de `practice`.
   */
  constructor(
    private readonly sync: CareSpaceSlotSync,
    @Inject(CARE_SPACE_BLOCK_LISTENERS)
    private readonly registry: CareSpaceBlockListenerRegistry,
  ) {}

  /** Se anota en el registro de `practice`. */
  onModuleInit(): void {
    this.registry.register('scheduling', this);
  }

  /** @inheritdoc */
  async afterCreated(
    tx: EntityManager,
    block: BlockRow,
    _space: SpaceOpsRow,
    context: BlockListenerContext,
  ): Promise<void> {
    const scope = { careSpaceId: block.careSpaceId };
    const closed = await this.sync.closeCovered(tx, block.tenantId, scope, {
      userId: context.actorUserId,
      now: context.now,
    });
    const resourceIds = await this.sync.affectedResourceIds(
      tx,
      block.tenantId,
      scope,
    );
    await this.sync.createSourceExceptions(tx, {
      tenantId: block.tenantId,
      source: 'CARE_SPACE_BLOCK',
      sourceRefId: block.id,
      resourceIds,
      startAt: block.startsAt,
      endAt: block.expectedEndAt,
      reason: CARE_SPACE_BLOCK_EXCEPTION_REASON,
      actorUserId: context.actorUserId,
      closedSlots: closed.length,
    });
  }

  /** @inheritdoc */
  async afterClosed(
    tx: EntityManager,
    block: BlockRow,
    _space: SpaceOpsRow,
    outcome: BlockOutcome,
    context: BlockListenerContext,
  ): Promise<void> {
    await this.sync.endSourceExceptions(tx, {
      tenantId: block.tenantId,
      source: 'CARE_SPACE_BLOCK',
      sourceRefId: block.id,
      endedAt: outcome === 'ENDED' ? (block.endedAt ?? context.now) : null,
      actorUserId: context.actorUserId,
    });
    await this.sync.reopenUncovered(
      tx,
      block.tenantId,
      { careSpaceId: block.careSpaceId },
      { userId: context.actorUserId, now: context.now },
    );
  }
}
