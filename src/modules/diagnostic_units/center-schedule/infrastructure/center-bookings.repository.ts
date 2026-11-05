import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { VISIBLE_BOOKING_STATES } from '../../../scheduling/domain/booking/booking-states';

/**
 * What an order booking freezes in `appointment_bookings.service_snapshot`:
 * what the patient accepted (study, price, preparation) plus the order it
 * fulfils. `kind` tells these bookings apart from the scheduling engine's.
 */
export interface OrderBookingSnapshot {
  kind: 'DIAGNOSTIC_ORDER';
  serviceRequestId: string;
  diagnosticUnitId: string;
  unitName: string;
  siteName: string | null;
  addressText: string | null;
  studyCode: string;
  studyName: string;
  modalityCode: string;
  price: number | null;
  currency: string | null;
  preparation: string | null;
  /** The device that attends it; absent on bookings older than per-device scheduling. */
  equipmentId?: string;
  equipmentName?: string;
}

export interface OccupyingRow {
  id: string;
  slot_id: string;
  resource_id: string;
  start_at: Date;
  end_at: Date;
  modality_code: string | null;
  study_code: string | null;
  equipment_id: string | null;
}

export interface OrderBookingRow {
  id: string;
  bookable_slot_id: string;
  start_at: Date;
  end_at: Date;
  snapshot: OrderBookingSnapshot;
}

export interface CenterBookingRow {
  id: string;
  start_at: Date;
  end_at: Date;
  status_concept_id: string;
  patient_name: string | null;
  snapshot: Partial<OrderBookingSnapshot> | null;
}

const VISIBLE = `{${VISIBLE_BOOKING_STATES.join(',')}}`;

/** Raw reads/writes of the bookings taken on a center's scheduling resource. */
@Injectable()
export class CenterBookingsRepository {
  /** Bookings that take capacity on the resources and overlap `[from, to)`. */
  findOccupying(
    em: EntityManager,
    resourceIds: readonly string[],
    from: Date,
    to: Date,
  ): Promise<OccupyingRow[]> {
    if (resourceIds.length === 0) return Promise.resolve([]);
    return em.execute<OccupyingRow[]>(
      `SELECT b.id, s.id AS slot_id, s.resource_id, s.start_at, s.end_at,
              b.service_snapshot->>'modalityCode' AS modality_code,
              b.service_snapshot->>'studyCode' AS study_code,
              b.service_snapshot->>'equipmentId' AS equipment_id
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
        WHERE s.resource_id = ANY(?::uuid[]) AND b.status_concept_id = ANY(?::uuid[])
          AND s.start_at < ? AND s.end_at > ?`,
      [`{${resourceIds.join(',')}}`, VISIBLE, to, from],
      'all',
    );
  }

  /**
   * Moves a legacy booking from the center's resource to the device that
   * adopts it: a new booked slot on the device, the booking pointed at it with
   * the device frozen in its snapshot, and the old place given back.
   */
  async moveToDevice(
    em: EntityManager,
    booking: OccupyingRow,
    device: { id: string; name: string; resourceId: string },
    actorId: string,
  ): Promise<void> {
    const slotId = await this.takeSlot(
      em,
      device.resourceId,
      new Date(booking.start_at),
      new Date(booking.end_at),
      actorId,
    );
    await em.execute(
      `UPDATE scheduling.appointment_bookings
          SET bookable_slot_id = ?, resource_id = ?,
              service_snapshot = service_snapshot || ?::jsonb,
              updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = ?`,
      [
        slotId,
        device.resourceId,
        JSON.stringify({ equipmentId: device.id, equipmentName: device.name }),
        actorId,
        booking.id,
      ],
    );
    await this.releaseSlot(em, booking.slot_id, actorId);
  }

  async findForOrder(
    em: EntityManager,
    patientProfileId: string,
    orderId: string,
  ): Promise<OrderBookingRow | null> {
    const [row] = await em.execute<OrderBookingRow[]>(
      `SELECT b.id, b.bookable_slot_id, s.start_at, s.end_at, b.service_snapshot AS snapshot
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
        WHERE b.patient_profile_id = ? AND b.service_snapshot->>'kind' = 'DIAGNOSTIC_ORDER'
          AND b.service_snapshot->>'serviceRequestId' = ?
          AND b.status_concept_id = ANY(?::uuid[])
        ORDER BY b.created_at DESC LIMIT 1`,
      [patientProfileId, orderId, VISIBLE],
      'all',
    );
    return row ?? null;
  }

  /** Serializes bookings of one center: the capacity check and the insert must not interleave. */
  async lockResource(em: EntityManager, resourceId: string): Promise<void> {
    await em.execute(
      'SELECT id FROM scheduling.schedulable_resources WHERE id = ? FOR UPDATE',
      [resourceId],
    );
  }

  /** Reuses an open slot with the same instants (seeded ones) or opens one of its own. */
  async takeSlot(
    em: EntityManager,
    resourceId: string,
    startAt: Date,
    endAt: Date,
    actorId: string,
  ): Promise<string> {
    const [reused] = await em.execute<{ id: string }[]>(
      `UPDATE scheduling.bookable_slots
          SET remaining_capacity = remaining_capacity - 1,
              status_concept_id = CASE WHEN remaining_capacity <= 1 THEN ? ELSE status_concept_id END,
              updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = (SELECT id FROM scheduling.bookable_slots
                     WHERE resource_id = ? AND start_at = ? AND end_at = ?
                       AND status_concept_id = ? AND remaining_capacity > 0
                       AND practitioner_service_offering_id IS NULL
                     ORDER BY created_at LIMIT 1 FOR UPDATE)
        RETURNING id`,
      [
        CONCEPTS.SLOT_BOOKED,
        actorId,
        resourceId,
        startAt,
        endAt,
        CONCEPTS.SLOT_OPEN,
      ],
      'all',
    );
    if (reused) return reused.id;
    const [created] = await em.execute<{ id: string }[]>(
      `INSERT INTO scheduling.bookable_slots
         (id, resource_id, start_at, end_at, capacity, remaining_capacity, status_concept_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (gen_random_uuid(), ?, ?, ?, 1, 0, ?, now(), now(), ?, ?, 1)
       RETURNING id`,
      [resourceId, startAt, endAt, CONCEPTS.SLOT_BOOKED, actorId, actorId],
      'all',
    );
    return created.id;
  }

  async insertBooking(
    em: EntityManager,
    data: {
      tenantId: string;
      patientProfileId: string;
      slotId: string;
      resourceId: string;
      snapshot: OrderBookingSnapshot;
    },
    actorId: string,
  ): Promise<string> {
    const [row] = await em.execute<{ id: string }[]>(
      `INSERT INTO scheduling.appointment_bookings
         (id, tenant_id, patient_profile_id, bookable_slot_id, resource_id, booking_channel_concept_id,
          booked_by_user_id, status_concept_id, confirmed_at, service_snapshot, pre_visit_instructions_snapshot,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, now(), ?::jsonb, ?, now(), now(), ?, ?, 1)
       RETURNING id`,
      [
        data.tenantId,
        data.patientProfileId,
        data.slotId,
        data.resourceId,
        CONCEPTS.CHANNEL_PORTAL,
        actorId,
        CONCEPTS.BOOKING_CONFIRMED,
        JSON.stringify(data.snapshot),
        data.snapshot.preparation,
        actorId,
        actorId,
      ],
      'all',
    );
    return row.id;
  }

  /** Cancels the booking and gives its place back to the slot. */
  async cancel(
    em: EntityManager,
    booking: OrderBookingRow,
    actorId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE scheduling.appointment_bookings
          SET status_concept_id = ?, updated_at = now(), updated_by_user_id = ?,
              row_version = row_version + 1
        WHERE id = ?`,
      [CONCEPTS.BOOKING_CANCELLED, actorId, booking.id],
    );
    await this.releaseSlot(em, booking.bookable_slot_id, actorId);
  }

  private async releaseSlot(
    em: EntityManager,
    slotId: string,
    actorId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE scheduling.bookable_slots
          SET remaining_capacity = LEAST(capacity, remaining_capacity + 1), status_concept_id = ?,
              updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = ?`,
      [CONCEPTS.SLOT_OPEN, actorId, slotId],
    );
  }

  /** The center's visible bookings (on its resource and its devices') starting in `[from, to)`, by start. */
  listForResources(
    em: EntityManager,
    resourceIds: readonly string[],
    from: Date,
    to: Date,
  ): Promise<CenterBookingRow[]> {
    if (resourceIds.length === 0) return Promise.resolve([]);
    return em.execute<CenterBookingRow[]>(
      `SELECT b.id, s.start_at, s.end_at, b.status_concept_id,
              p.display_name AS patient_name, b.service_snapshot AS snapshot
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
         LEFT JOIN profiles.persons p ON p.id = b.patient_profile_id
        WHERE s.resource_id = ANY(?::uuid[]) AND b.status_concept_id = ANY(?::uuid[])
          AND s.start_at >= ? AND s.start_at < ?
        ORDER BY s.start_at, b.id`,
      [`{${resourceIds.join(',')}}`, VISIBLE, from, to],
      'all',
    );
  }
}
