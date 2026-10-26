import type { AppointmentBookings, BookableSlots } from '../../../entities';
import {
  CONCEPTS,
  PreconditionFailedException,
  touch,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingServiceAgendaService } from '../../service-offerings/scheduling-service-agenda.service';

/**
 * Qué pasa con el cupo de un servicio o de una cita puntual cuando su reserva
 * deja de ocupar tiempo (v4.2.40).
 */

@Injectable()
export class ServiceSlotLifecycle {
  constructor(
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly serviceAgenda: SchedulingServiceAgendaService,
    private readonly catalogRepo: SchedulingCatalogRepository,
  ) {}

  /**
   * El cupo puntual —el de un servicio o el de una cita que el doctor asignó— que
   * deja de ocupar tiempo.
   *
   * Nació para una sola reserva y nunca estuvo ofrecido, así que **no se reabre**
   * (sería un cupo fantasma): queda bloqueado. Lo que sí se hace es devolver las
   * consultas que había retraído y que ya no chocan con nada.
   *
   * El `flush` va antes de reabrir porque la lectura de lo ocupado es SQL: si la
   * cancelación sigue sólo en la unidad de trabajo, esa lectura todavía vería la
   * reserva viva y no reabriría nada.
   */
  async discardOneOffSlot(
    tx: EntityManager,
    slot: BookableSlots,
    actorUserId: string | undefined,
  ): Promise<void> {
    slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
    touch(slot, actorUserId);
    await tx.flush();
    await this.reopenRetractedConsultationsOf(tx, slot, actorUserId);
  }

  /** Devuelve las consultas retraídas que el rango de este cupo ya no pisa. */
  async reopenRetractedConsultationsOf(
    tx: EntityManager,
    slot: BookableSlots,
    actorUserId: string | undefined,
  ): Promise<void> {
    await this.serviceAgenda.reopenSpan(
      tx,
      slot,
      slot.startAt,
      slot.endAt ?? slot.startAt,
      actorUserId,
    );
  }

  /**
   * Terminar antes de lo reservado libera el sobrante.
   *
   * Un servicio se reserva por su duración **máxima**; si el profesional lo da por
   * cumplido antes, el cupo se recorta a ese instante y el tiempo que sobraba vuelve
   * a estar disponible —y las consultas que ese tiempo pisaba, a ofrecerse—. Sólo
   * aplica a cupos de servicio: el de una consulta mide lo que la plantilla dijo.
   */
  async releaseServiceLeftover(
    tx: EntityManager,
    booking: AppointmentBookings,
    actorUserId: string | undefined,
  ): Promise<void> {
    const slot = await this.bookingsRepo.findSlotForUpdate(
      tx,
      booking.bookableSlotId,
    );
    if (!slot?.practitionerServiceOfferingId || !slot.endAt) return;

    const now = new Date();
    const endsEarly =
      now.getTime() > slot.startAt.getTime() &&
      now.getTime() < slot.endAt.getTime();
    if (!endsEarly) return;

    const reservedEnd = slot.endAt;
    slot.endAt = now;
    touch(slot, actorUserId);
    await tx.flush();
    await this.serviceAgenda.reopenSpan(
      tx,
      slot,
      now,
      reservedEnd,
      actorUserId,
    );
  }

  /**
   * ¿El cupo nació para una sola reserva y no se vuelve a ofrecer al soltarse?
   *
   * El de un servicio (v4.2.40) y el de un horario flexible (P36): los dos se
   * crean al retener, en la hora que se pidió, y nunca estuvieron en una grilla.
   * Reabrirlo al cancelar o al vencer la retención dejaría un turno fijo
   * ofreciéndose en una agenda que el médico publicó sin turnos.
   */
  async isOneOffOnDemand(
    tx: EntityManager,
    slot: Pick<
      BookableSlots,
      'practitionerServiceOfferingId' | 'scheduleTemplateId'
    >,
  ): Promise<boolean> {
    if (slot.practitionerServiceOfferingId) return true;
    return this.isFlexible(tx, slot);
  }

  /** ¿El cupo es de una plantilla de horario flexible (P36)? */
  async isFlexible(
    tx: EntityManager,
    slot: Pick<BookableSlots, 'scheduleTemplateId'>,
  ): Promise<boolean> {
    if (!slot.scheduleTemplateId) return false;
    const template = await this.catalogRepo.findTemplateById(
      tx,
      slot.scheduleTemplateId,
    );
    return template?.flexibleHours === true;
  }

  /**
   * Un servicio no se mueve de horario: se cancela y se pide otro.
   *
   * Lo mismo un turno de horario flexible (P36): no hay un cupo libre al que
   * moverlo —en esa agenda los cupos nacen al pedirlos—, y mover el viejo a otra
   * grilla dejaría su hora reabierta como un turno fijo que nadie publicó.
   */
  async assertNotAService(
    tx: EntityManager,
    slotId: string,
    action: string,
  ): Promise<void> {
    const slot = await this.bookingsRepo.findSlotById(tx, slotId);
    if (slot?.practitionerServiceOfferingId) {
      throw new PreconditionFailedException(
        `Todavía no se puede ${action} un servicio: cancele la reserva y pida otro horario.`,
        { slotId },
      );
    }
    if (slot && (await this.isFlexible(tx, slot))) {
      throw new PreconditionFailedException(
        `Todavía no se puede ${action} un turno de horario flexible: cancele la reserva y pida otra hora.`,
        { slotId },
      );
    }
  }
}
