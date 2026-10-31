import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { CommunityBookingChatService } from '../../../community/services';
import type { BookingChatPort } from '../../application/ports/booking-chat.port';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';

/**
 * Puerto del chat de citas contra `community`: resuelve las dos cuentas de la
 * cita y delega en {@link CommunityBookingChatService}, que escribe en el hilo
 * directo profesional ↔ paciente sin crear vitrinas.
 *
 * No lanza nunca: un chat que no sale no deshace una cita confirmada.
 */
@Injectable()
export class CommunityBookingChatAdapter implements BookingChatPort {
  constructor(
    private readonly em: EntityManager,
    private readonly noticeRepo: SchedulingNoticeRepository,
    private readonly chat: CommunityBookingChatService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityBookingChatAdapter.name);
  }

  async announceAcceptance(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    try {
      const em = this.em.fork();
      const cita = await this.noticeRepo.describeBooking(em, bookingId);
      if (!cita || !cita.resourceId || !cita.startAt) return false;
      const [pacienteUserId, profesionalUserId, profesionalPerfilId] =
        await Promise.all([
          this.noticeRepo.findAccountForProfile(em, cita.patientProfileId),
          this.noticeRepo.findResourceAccount(em, cita.resourceId),
          this.noticeRepo.findResourcePractitionerProfileId(
            em,
            cita.resourceId,
          ),
        ]);
      if (!pacienteUserId || !profesionalUserId) return false;
      const cuando = new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/La_Paz',
      }).format(cita.startAt);
      return await this.chat.enviarConfirmacion(
        {
          profesional: {
            userId: profesionalUserId,
            // El profesional de la CITA, no el de quien la acepta: quien acepta
            // puede ser personal de apoyo o la recepción.
            practitionerProfileId: profesionalPerfilId ?? undefined,
          },
          pacienteUserId,
          texto: `Su cita con ${cita.resourceLabel} del ${cuando} quedó confirmada.`,
        },
        actor,
      );
    } catch (error) {
      // El puerto no lanza (la cita ya está confirmada), pero el fallo NO se
      // esconde: queda con nivel `error` y su causa para poder atenderlo.
      this.logger.error(
        { operation: 'scheduling.booking.chat', bookingId, err: error },
        'No se pudo dejar la confirmación en el chat',
      );
      return false;
    }
  }
}
