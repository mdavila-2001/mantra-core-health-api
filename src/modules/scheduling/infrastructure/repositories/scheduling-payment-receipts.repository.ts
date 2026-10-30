import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AppointmentPaymentReceipts } from '../../entities';

/** Acceso a `scheduling.appointment_payment_receipts`. */
@Injectable()
export class SchedulingPaymentReceiptsRepository {
  /** Los comprobantes de una cita, del más reciente al más viejo. */
  findForBooking(
    em: EntityManager,
    bookingId: string,
  ): Promise<AppointmentPaymentReceipts[]> {
    return em.find(
      AppointmentPaymentReceipts,
      { appointmentBookingId: bookingId },
      { orderBy: { uploadedAt: 'desc', id: 'desc' } },
    );
  }

  /** Un comprobante de esa cita, sin bloquearlo. */
  findOfBooking(
    em: EntityManager,
    bookingId: string,
    receiptId: string,
  ): Promise<AppointmentPaymentReceipts | null> {
    return em.findOne(AppointmentPaymentReceipts, {
      id: receiptId,
      appointmentBookingId: bookingId,
    });
  }

  /**
   * Un comprobante de esa cita, bloqueado para revisarlo.
   *
   * `FOR UPDATE` por lo mismo que el estado de pago: dos revisiones a la vez
   * del mismo comprobante tienen que esperar su turno, no pisarse.
   */
  findOfBookingForUpdate(
    em: EntityManager,
    bookingId: string,
    receiptId: string,
  ): Promise<AppointmentPaymentReceipts | null> {
    return em.findOne(
      AppointmentPaymentReceipts,
      { id: receiptId, appointmentBookingId: bookingId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Cómo se llama cada cuenta, para mostrar quién subió y quién revisó. */
  async findUserDisplayNames(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return names;

    const rows = await em
      .getConnection()
      .execute<{ id: string; display_name: string | null }[]>(
        `SELECT id, display_name FROM iam.users WHERE id IN (${unique
          .map(() => '?')
          .join(', ')})`,
        unique,
      );
    for (const row of rows) {
      if (row.display_name !== null && row.display_name.trim() !== '') {
        names.set(row.id, row.display_name);
      }
    }
    return names;
  }
}
