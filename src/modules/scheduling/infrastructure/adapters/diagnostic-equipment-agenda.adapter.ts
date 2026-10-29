import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CLIN } from '../../../clinical/clinical.concepts';
import {
  EquipmentAgendaRegistry,
  type EquipmentAgendaPort,
  type EquipmentCommitment,
} from '../../../diagnostic_units/services/equipment-agenda.port';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOpsPort,
} from '../../../practice/services/care-space-ops.port';
import {
  CareSpaceSlotSync,
  EQUIPMENT_STATUS_EXCEPTION_REASON,
} from '../../application/catalog/support/care-space-slot-sync';
import { EquipmentResourceLinker } from '../../application/catalog/support/equipment-resource-linker';
import {
  ACTIVE_BOOKING_STATES,
  PENDING_BOOKING_STATES,
} from '../../domain/booking/booking-states';
import { OPEN_ENDED_BLOCK_END } from '../../domain/catalog/care-space-agenda';

const LIVE_BOOKING_STATES: readonly string[] = [
  ...PENDING_BOOKING_STATES,
  ...ACTIVE_BOOKING_STATES,
];

const marks = (n: number): string =>
  Array.from({ length: n }, () => '?').join(', ');

/**
 * La agenda del equipo de diagnóstico vista desde `diagnostic_units` (F5a): implementa el
 * puerto que el servicio del equipo consulta y se anota en su registro al arrancar.
 *
 * `scheduling` es quien conoce reservas, cupos y excepciones; `diagnostic_units` sólo conoce
 * este contrato.
 */
@Injectable()
export class DiagnosticEquipmentAgendaAdapter
  implements EquipmentAgendaPort, OnModuleInit
{
  /**
   * @param registry - Registro del puerto (`DiagnosticUnitsModule`).
   * @param linker - Alta del recurso `EQUIPMENT`.
   * @param sync - Cierre y reapertura de cupos y excepciones.
   * @param ops - Puerto de F2: ¿se puede reservar la sala nueva?
   */
  constructor(
    private readonly registry: EquipmentAgendaRegistry,
    private readonly linker: EquipmentResourceLinker,
    private readonly sync: CareSpaceSlotSync,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /** Se anota en el registro del equipo. */
  onModuleInit(): void {
    this.registry.set(this);
  }

  /** @inheritdoc */
  linkResource(
    tx: EntityManager,
    equipmentId: string,
    input: { name?: string; timeZone?: string; capacity?: number },
    actor: Parameters<EquipmentAgendaPort['linkResource']>[3],
  ): ReturnType<EquipmentAgendaPort['linkResource']> {
    return this.linker.link(tx, equipmentId, input, actor);
  }

  /** @inheritdoc */
  async futureCommitments(
    tx: EntityManager,
    equipmentId: string,
    from: Date,
  ): Promise<EquipmentCommitment[]> {
    const rows = await tx.execute<{ id: string; start_at: Date }[]>(
      `select b.id, s.start_at
         from scheduling.appointment_bookings b
         join scheduling.bookable_slots s on s.id = b.bookable_slot_id
         join scheduling.schedulable_resources r on r.id = s.resource_id
        where r.resource_ref_type = 'diagnostic_equipment' and r.resource_ref_id = ?
          and b.status_concept_id in (${marks(LIVE_BOOKING_STATES.length)})
          and s.start_at > ?
        order by s.start_at limit 100`,
      [equipmentId, ...LIVE_BOOKING_STATES, from],
    );
    return rows.map((row) => ({
      kind: 'BOOKING' as const,
      id: row.id,
      startsAt: new Date(row.start_at).toISOString(),
      nextAction: 'Reprogramar o cancelar el estudio reservado en el equipo',
    }));
  }

  /** @inheritdoc */
  async syncStatus(
    tx: EntityManager,
    change: {
      equipmentId: string;
      tenantId: string;
      outOfService: boolean;
      actorUserId: string | null;
      now: Date;
    },
  ): Promise<void> {
    const scope = { equipmentId: change.equipmentId };
    const actor = { userId: change.actorUserId, now: change.now };
    if (change.outOfService) {
      const closed = await this.sync.closeCovered(
        tx,
        change.tenantId,
        scope,
        actor,
      );
      const resourceIds = await this.sync.affectedResourceIds(
        tx,
        change.tenantId,
        scope,
      );
      await this.sync.createSourceExceptions(tx, {
        tenantId: change.tenantId,
        source: 'EQUIPMENT_STATUS',
        sourceRefId: change.equipmentId,
        resourceIds,
        startAt: change.now,
        endAt: OPEN_ENDED_BLOCK_END,
        reason: EQUIPMENT_STATUS_EXCEPTION_REASON,
        actorUserId: change.actorUserId,
        closedSlots: closed.length,
      });
      return;
    }
    await this.sync.endSourceExceptions(tx, {
      tenantId: change.tenantId,
      source: 'EQUIPMENT_STATUS',
      sourceRefId: change.equipmentId,
      endedAt: change.now,
      actorUserId: change.actorUserId,
    });
    await this.sync.reopenUncovered(tx, change.tenantId, scope, actor);
  }

  /** @inheritdoc */
  async relocateBookings(
    tx: EntityManager,
    change: {
      equipmentId: string;
      tenantId: string;
      careSpaceId: string | null;
      actorUserId: string | null;
      now: Date;
    },
  ): Promise<number> {
    const rows = await tx.execute<
      { appointment_id: string; start_at: Date; end_at: Date | null }[]
    >(
      `select a.id as appointment_id, a.start_at, a.end_at
         from scheduling.appointment_bookings b
         join scheduling.bookable_slots s on s.id = b.bookable_slot_id
         join scheduling.schedulable_resources r on r.id = s.resource_id
         join clinical.appointments a on a.id = b.appointment_id
        where r.resource_ref_type = 'diagnostic_equipment' and r.resource_ref_id = ?
          and r.tenant_id = ? and b.status_concept_id in (${marks(LIVE_BOOKING_STATES.length)})
          and s.start_at > ? and a.status_concept_id in (?, ?, ?)
        order by s.start_at for update of a`,
      [
        change.equipmentId,
        change.tenantId,
        ...LIVE_BOOKING_STATES,
        change.now,
        CLIN.APPOINTMENT_PENDING,
        CLIN.APPOINTMENT_BOOKED,
        CLIN.APPOINTMENT_CHECKED_IN,
      ],
    );
    for (const row of rows) {
      if (change.careSpaceId) {
        const start = new Date(row.start_at);
        // 422 `SPACE_NOT_BOOKABLE` si la sala nueva está bloqueada o en mantenimiento en esa hora.
        await this.ops.assertBookable(tx, change.careSpaceId, {
          start,
          end: row.end_at ? new Date(row.end_at) : start,
        });
      }
    }
    if (rows.length === 0) return 0;
    // El `EXCLUDE ex_appointments_care_space_time` es la red: una sala ocupada a esa hora
    // rechaza el UPDATE (23P01 → 409 CARE_SPACE_DOUBLE_BOOKED) y la transacción entera se deshace.
    await tx.execute(
      `update clinical.appointments
          set care_space_id = ?, updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
        where id in (${marks(rows.length)})`,
      [
        change.careSpaceId,
        change.now,
        change.actorUserId,
        ...rows.map((row) => row.appointment_id),
      ],
    );
    return rows.length;
  }
}
