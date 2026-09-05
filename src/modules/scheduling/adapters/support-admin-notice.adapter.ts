import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { SEED, type AuthenticatedUser } from '../../../common';
import {
  CommunityMessagingService,
  PublicProfileProjectionService,
} from '../../community/services';
import { COMM } from '../../community/community.concepts';
import { Users } from '../../iam/entities';
import type { AgendaNotice } from '../ports/agenda-notice.port';

/**
 * `SupportAdmin`: quién escribe el aviso de agenda en el chat de la empresa
 * (TAREA-15, punto 1 y 3 — P-15-1, decidido).
 *
 * ## Qué es (la decisión)
 *
 * No es un tenant nuevo ni un tipo de conversación nuevo: es una **cuenta de
 * servicio** (`iam.users`, sembrada como `SEED.supportAdminUserId`, mismo
 * patrón que `SEED.systemWorkerUserId`) con una **vitrina pública**
 * (`community.public_profiles`, tipo `PROFILE_TARGET_ORGANIZATION`) para
 * poder ser participante de una conversación — que exige un perfil, no una
 * cuenta desnuda.
 *
 * ## Por qué no es una tercera mensajería
 *
 * El aviso se manda con {@link CommunityMessagingService.createConversation}
 * y {@link CommunityMessagingService.sendMessage} tal cual los usa cualquier
 * «Escribir al doctor»: misma tabla, mismo websocket, mismo centro de
 * mensajes. Es la decisión que ya está escrita en `features/messaging`:
 * duplicar el chat en el módulo 35 tendría dos mensajerías que se contradicen.
 *
 * ## Por qué no bloquea la campana ni el correo
 *
 * No pasa por `NotificationsService`: el chat no es uno de los dos canales
 * que M35 declara (`CHANNEL_TYPE_IN_APP`, `CHANNEL_TYPE_EMAIL`), así que no
 * hay preferencia de canal que evaluar acá — es un efecto de `community`, no
 * de mensajería. Nunca lanza, igual que el resto del puerto.
 */
@Injectable()
export class SupportAdminNoticeAdapter {
  constructor(
    private readonly em: EntityManager,
    private readonly messaging: CommunityMessagingService,
    private readonly profiles: PublicProfileProjectionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportAdminNoticeAdapter.name);
  }

  /**
   * Manda el mismo texto del aviso al hilo de `SupportAdmin` del destinatario.
   *
   * Nunca lanza: un chat que no sale no puede tumbar la agenda ni degradar lo
   * que ya entregaron el in-app o el correo.
   *
   * @param notice - El aviso, con el texto ya redactado.
   * @param recipientUserId - Cuenta destinataria, ya resuelta por el adaptador de mensajería.
   */
  async notify(
    notice: AgendaNotice,
    recipientUserId: string,
  ): Promise<{ chatDelivered: boolean; chatSkippedReason?: string }> {
    try {
      const em = this.em.fork();
      const actor: AuthenticatedUser = {
        id: SEED.supportAdminUserId,
        roles: ['SYSTEM'],
      };

      const supportAdminProfileId = await this.profiles.projectOrganization(
        em,
        {
          tenantId: notice.tenantId ?? SEED.tenantId,
          targetId: SEED.supportAdminUserId,
          slug: SEED.supportAdminProfileSlug,
          displayName: SEED.supportAdminDisplayName,
          actorUserId: SEED.supportAdminUserId,
        },
      );

      const recipientProfileId = await this.getOrCreateRecipientProfile(
        em,
        recipientUserId,
        notice.tenantId,
        actor,
      );

      const conversation = await this.messaging.createConversation(
        {
          participantProfileIds: [supportAdminProfileId, recipientProfileId],
          conversationType: 'DIRECT',
        },
        actor,
      );

      await this.messaging.sendMessage(
        conversation.id,
        {
          senderProfileId: supportAdminProfileId,
          bodyText: notice.bodyText,
          contentType: 'TEXT',
        },
        actor,
      );

      return { chatDelivered: true };
    } catch (error: unknown) {
      // Regla 1 del puerto: emitir no puede romper la agenda. El in-app y el
      // correo ya se resolvieron cuando esto corre.
      this.logger.warn(
        {
          operation: 'scheduling.notice.chat',
          kind: notice.kind,
          relatedResourceId: notice.relatedResourceId,
          err: error,
        },
        'No se pudo emitir el aviso de agenda por el chat de SupportAdmin',
      );
      return {
        chatDelivered: false,
        chatSkippedReason: 'No se pudo entregar el aviso por chat',
      };
    }
  }

  /**
   * El perfil social del destinatario, o uno nuevo si nunca tuvo vitrina.
   *
   * `projectOrganization` es idempotente **por `targetId`**. Para un
   * **paciente** eso alcanza: su vitrina propia (si la tiene) también usa su
   * `userId` como `targetId` (`CommunitySocialService.sujetoDe`), así que esto
   * la encuentra y la reutiliza.
   *
   * **Simplificación conocida, no un bug:** la vitrina de un **profesional**
   * usa `practitionerProfileId` como `targetId`, no su `userId` — este método
   * no lo resuelve (evita acoplar `scheduling` a `profiles` sólo para esto),
   * así que a un profesional se le crea una vitrina mínima aparte, sólo para
   * este chat. El mensaje igual llega; lo que no pasa es que se sume al
   * contador de su vitrina pública. Si eso importa, resolver primero
   * `practitionerProfileId` antes de proyectar es el arreglo.
   */
  private async getOrCreateRecipientProfile(
    em: EntityManager,
    userId: string,
    tenantId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const cuenta = await em.findOne(Users, { id: userId });
    const nombre = cuenta?.displayName?.trim();
    return this.profiles.projectOrganization(em, {
      tenantId: tenantId ?? SEED.tenantId,
      targetId: userId,
      targetTypeConceptId: COMM.PROFILE_TARGET_USER,
      // Único y estable por usuario; no es la vitrina pública final de nadie
      // — si la persona más tarde arma la suya, `findByTarget` la encuentra a
      // ella primero y esta rama nunca se ejecuta.
      slug: `support-thread-${randomUUID()}`,
      displayName: nombre === undefined || nombre === '' ? 'Usuario' : nombre,
      actorUserId: actor.id,
    });
  }
}
