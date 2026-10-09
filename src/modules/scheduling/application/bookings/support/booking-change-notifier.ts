import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../../ports/agenda-notice.port';
import type { BookingActorKind } from '../../../domain/booking/booking-transition';
import {
  bookingChangeNotice,
  requestNoticeForPatient,
  requestNoticeForPractitioner,
  type BookingChange,
} from '../../../domain/notices/agenda-notices';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingNoticeRepository } from '../../../infrastructure/repositories';

/**
 * Los avisos que siguen a un cambio de la cita (P8). Corren **después** de que
 * la transacción cerró y no lanzan: un canal caído no deshace una reserva.
 */

@Injectable()
export class BookingChangeNotifier {
  constructor(
    private readonly em: EntityManager,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BookingChangeNotifier.name);
  }

  /**
   * Avisa que entró una solicitud de turno, **a las dos partes**.
   *
   * ## Por qué a las dos y no a la contraparte
   *
   * {@link notifyChange} avisa a quien **no** actuó, y para aceptar, mover o
   * cancelar eso es correcto: quien lo hizo ya lo sabe. Pero pedir un turno no
   * es un cambio de estado que le ocurre a alguien: es el comienzo de una
   * espera. El profesional necesita enterarse de que hay algo que responder, y
   * el paciente necesita saber que su pedido entró — sin eso, pedir un turno se
   * siente como escribir a un buzón sin fondo, y vuelve a pedirlo.
   *
   * Es el punto 2 del pedido (AC-15-1 y AC-15-2), que pide explícitamente los
   * **dos** destinatarios.
   *
   * ## Por qué no lanza
   *
   * Igual que {@link notifyChange}: corre después de que la transacción cerró.
   * Un fallo del canal se registra y se descarta; la reserva ya existe.
   *
   * @param bookingId - La cita recién solicitada.
   */
  async notifyRequest(bookingId: string): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    // El del paciente sale siempre: su perfil es el dueño de la reserva, así
    // que siempre hay a quién dirigirlo.
    const notices: AgendaNotice[] = [requestNoticeForPatient(booking)];

    const practitioner = await this.noticeRepo.findResourceAccount(
      em,
      booking.resourceId,
    );
    if (practitioner === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay segundo destinatario, y
      // el acuse del paciente sale igual.
      this.logger.info(
        { operation: 'scheduling.notice.requested', bookingId },
        'El recurso de la solicitud no tiene profesional al que avisar',
      );
    } else {
      const patient = await this.noticeRepo.findDisplayNameForProfile(
        em,
        booking.patientProfileId,
      );
      notices.push(
        requestNoticeForPractitioner(
          booking,
          patient ?? undefined,
          practitioner,
        ),
      );
    }

    await this.notices.emitMany(notices);
  }

  /**
   * Avisa del cambio de estado a quien no lo provocó (P8, tareas 4 y 5).
   *
   * ## A quién
   *
   * Al paciente, salvo cuando fue él quien canceló o reprogramó: en ese caso el
   * que necesita enterarse es el profesional. Avisarle al paciente de su propia
   * cancelación sería ruido, y no avisarle al profesional lo dejaría con un
   * hueco en la agenda que nadie le anunció.
   *
   * ## Por qué no lanza
   *
   * Porque se invoca **después** de que la transacción cerró y el estado ya es
   * el nuevo. Un fallo del canal se registra y se descarta: la regla del README
   * es que emitir jamás rompa una reserva. Ver `ports/agenda-notice.port.ts`.
   */
  async notifyChange(
    bookingId: string,
    change: BookingChange,
    reason: string | undefined,
    actorKind: BookingActorKind,
  ): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    const toPractitioner = actorKind === 'PATIENT';
    const recipient = toPractitioner
      ? await this.noticeRepo.findResourceAccount(em, booking.resourceId)
      : null;

    if (toPractitioner && recipient === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay destinatario.
      this.logger.info(
        { operation: 'scheduling.notice.change', bookingId, cambio: change },
        'El recurso de la cita no tiene profesional al que avisar',
      );
      return;
    }

    await this.notices.emit(
      bookingChangeNotice(
        booking,
        change,
        reason,
        toPractitioner
          ? { userId: recipient as string }
          : { patientProfileId: booking.patientProfileId },
      ),
    );
  }
}
