import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { PublicProfilesRepository } from '../repositories';
import { CommunityMessagingService } from './community-messaging.service';

/** Quién escribe y a quién, tal como lo conoce la agenda. */
export interface ConfirmacionDeCitaPorChat {
  /** Cuenta y perfil profesional de quien atiende (los sujetos posibles de su vitrina). */
  readonly profesional: {
    readonly userId: string;
    readonly practitionerProfileId?: string;
  };
  /** Cuenta del paciente. */
  readonly pacienteUserId: string;
  /** El texto que va al hilo. */
  readonly texto: string;
}

/**
 * Deja en el chat de la app —el hilo directo entre el profesional y el
 * paciente— el aviso de que la cita quedó confirmada.
 *
 * El chat se apoya en la vitrina pública (`community.public_profiles`): el
 * participante de un hilo ES un perfil. Esta clase **no crea vitrinas**: hacerlo
 * publicaría a un paciente sin que lo haya decidido. Si alguno de los dos no
 * tiene la suya, no hace nada y devuelve `false`; el aviso de la campana sale
 * igual por su propio camino (`AgendaNoticePort`).
 *
 * Los errores de escritura se propagan; ver {@link enviarConfirmacion}.
 */
@Injectable()
export class CommunityBookingChatService {
  constructor(
    private readonly em: EntityManager,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly messaging: CommunityMessagingService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityBookingChatService.name);
  }

  /**
   * Deja la confirmación en el hilo del profesional y el paciente.
   *
   * El remitente es el perfil del **profesional de la cita**; quien ejecutó la
   * operación de agenda puede ser él, una persona de apoyo o la recepción. La
   * autora real queda en `authored_by_user_id` y, si no es el profesional, el
   * mensaje queda `on_behalf_of_profile_id` suyo.
   *
   * No traga errores: un fallo al escribir en el hilo se propaga con su causa,
   * y quien llama decide qué hacer con una cita que ya está confirmada (el
   * adaptador de agenda lo registra con nivel `error`). Sí devuelve `false` —sin
   * lanzar— cuando falta una vitrina pública, que es un estado esperado.
   *
   * @returns `true` si el mensaje quedó en el hilo.
   */
  async enviarConfirmacion(
    datos: ConfirmacionDeCitaPorChat,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const em = this.em.fork();
    let delProfesional = null;
    for (const sujeto of [
      datos.profesional.practitionerProfileId,
      datos.profesional.userId,
    ]) {
      if (!sujeto) continue;
      delProfesional = await this.profilesRepo.findByTarget(em, sujeto);
      if (delProfesional) break;
    }
    const delPaciente = await this.profilesRepo.findByTarget(
      em,
      datos.pacienteUserId,
    );
    if (!delProfesional || !delPaciente) {
      this.logger.info(
        {
          operation: 'community.booking-chat.skipped',
          profesionalConVitrina: Boolean(delProfesional),
          pacienteConVitrina: Boolean(delPaciente),
        },
        'Sin vitrina pública en ambos lados: la confirmación sólo sale por notificación',
      );
      return false;
    }
    // Es un aviso transaccional de la agenda: la preferencia de directorio del
    // paciente (vitrina privada) no impide recibir la confirmación de SU cita.
    // Por eso se usa el canal interno, que exige el rol `SYSTEM`; el rol se
    // concede sólo a esta llamada.
    const hilo = await this.messaging.createSystemDirectConversation(
      {
        conversationType: 'DIRECT',
        participantProfileIds: [delProfesional.id, delPaciente.id],
      },
      { ...actor, roles: [...actor.roles, 'SYSTEM'] },
    );
    await this.messaging.sendAgendaMessage(
      hilo.id,
      { senderProfileId: delProfesional.id, bodyText: datos.texto },
      actor,
    );
    return true;
  }
}
