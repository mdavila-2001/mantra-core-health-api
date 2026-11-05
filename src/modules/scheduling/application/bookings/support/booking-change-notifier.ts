import {
  BOOKING_CHAT_PORT,
  type BookingChatPort,
} from '../../ports/booking-chat.port';
import type { AuthenticatedUser } from '../../../../../common';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../../ports/agenda-notice.port';
import type { BookingActorKind } from '../../../domain/booking/booking-transition';
import {
  bookingChangeNotice,
  receiptReviewedNotice,
  receiptUploadedNotice,
  requestNoticeForPatient,
  requestNoticeForPractitioner,
  type BookingChange,
} from '../../../domain/notices/agenda-notices';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingNoticeRepository } from '../../../infrastructure/repositories';

/**
 * Notices that follow a booking change (P8). They run after the use case's own
 * transaction (a savepoint under the request transaction when RLS is enforced,
 * so the request transaction is still open) and do not throw: a down channel
 * does not undo a booking.
 */

@Injectable()
export class BookingChangeNotifier {
  constructor(
    private readonly em: EntityManager,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    @Inject(BOOKING_CHAT_PORT)
    private readonly bookingChat: BookingChatPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BookingChangeNotifier.name);
  }

  /**
   * Deja la confirmación de una cita aceptada en el chat de la app (hilo
   * profesional ↔ paciente). Corre después de la transacción y no lanza: ver
   * `ports/booking-chat.port.ts`.
   */
  async notifyAcceptedInChat(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.bookingChat.announceAcceptance(bookingId, actor);
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
   * Igual que {@link notifyChange}: corre después de la transacción del caso de
   * uso, dentro de la de la petición (el fork la conserva para leer la cita
   * recién escrita bajo RLS). Un fallo del canal se registra y se descarta; la
   * reserva ya existe.
   *
   * @param bookingId - La cita recién solicitada.
   */
  async notifyRequest(bookingId: string): Promise<void> {
    const em = this.em.fork({ keepTransactionContext: true });
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
   * Porque se invoca **después** de la transacción del caso de uso, con el
   * estado ya nuevo y la transacción de la petición todavía abierta (el fork la
   * conserva, por RLS). Un fallo del canal se registra y se descarta: la regla del README
   * es que emitir jamás rompa una reserva. Ver `ports/agenda-notice.port.ts`.
   */
  async notifyChange(
    bookingId: string,
    change: BookingChange,
    reason: string | undefined,
    actorKind: BookingActorKind,
  ): Promise<void> {
    const em = this.em.fork({ keepTransactionContext: true });
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

  /**
   * Avisa al médico de la agenda que el paciente subió un comprobante.
   *
   * Corre después de la transacción y no lanza: un canal caído no deshace la
   * subida. Un recurso sin profesional —una sala— no tiene a quién avisarle.
   *
   * @param bookingId - La cita del comprobante.
   * @param receiptId - El comprobante subido.
   */
  async notifyReceiptUploaded(
    bookingId: string,
    receiptId: string,
  ): Promise<void> {
    await this.safely(
      'scheduling.notice.payment-receipt-uploaded',
      bookingId,
      () =>
        this.inSavepoint(async (em) => {
          const booking = await this.noticeRepo.describeBooking(em, bookingId);
          if (!booking) return;
          const practitioner = await this.noticeRepo.findResourceAccount(
            em,
            booking.resourceId,
          );
          if (practitioner === null) return;
          const patient = await this.noticeRepo.findDisplayNameForProfile(
            em,
            booking.patientProfileId,
          );
          await this.notices.emit(
            receiptUploadedNotice(
              booking,
              patient ?? undefined,
              practitioner,
              receiptId,
            ),
          );
        }),
    );
  }

  /**
   * Avisa al paciente que su comprobante se confirmó o se rechazó, con el
   * motivo si se rechazó. Corre después de la transacción y no lanza.
   *
   * @param bookingId - La cita del comprobante.
   * @param receiptId - El comprobante revisado.
   * @param confirmed - `true` si se confirmó.
   * @param reason - El motivo del rechazo.
   */
  async notifyReceiptReviewed(
    bookingId: string,
    receiptId: string,
    confirmed: boolean,
    reason?: string,
  ): Promise<void> {
    await this.safely(
      'scheduling.notice.payment-receipt-reviewed',
      bookingId,
      () =>
        this.inSavepoint(async (em) => {
          const booking = await this.noticeRepo.describeBooking(em, bookingId);
          if (!booking) return;
          await this.notices.emit(
            receiptReviewedNotice(booking, receiptId, confirmed, reason),
          );
        }),
    );
  }

  /**
   * Runs the reads of a notice inside a savepoint of the request transaction
   * (or a transaction of its own when there is none). If the notice fails, the
   * savepoint rolls back and the request transaction stays healthy; the caller
   * (`safely`) swallows the error outside it.
   */
  private inSavepoint(work: (em: EntityManager) => Promise<void>) {
    return this.em
      .fork({ keepTransactionContext: true })
      .transactional((tx) => work(tx));
  }

  /**
   * Corre un aviso sin dejar que su fallo suba: la operación que lo originó ya
   * se confirmó, y un aviso que no sale no puede volverla un error.
   */
  private async safely(
    operation: string,
    bookingId: string,
    send: () => Promise<void>,
  ): Promise<void> {
    try {
      await send();
    } catch (error: unknown) {
      this.logger.warn(
        { operation, bookingId, err: error },
        'No se pudo emitir el aviso del comprobante',
      );
    }
  }
}
