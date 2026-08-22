import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { GroupsRepository, PublicProfilesRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { Groups, PublicProfiles } from '../entities';

/**
 * Tipo de recurso del enlace profundo de comunidad.
 *
 * Sigue el mismo contrato que P1 definió para lo clínico: `esquema.tabla`, y el
 * front decide la ruta a partir de este valor y no del texto del asunto.
 */
export const COMMUNITY_NOTIFICATION_RESOURCES = {
  group: 'community.groups',
} as const;

/**
 * Tope de destinatarios de un aviso de muro.
 *
 * Un grupo grande no puede convertir una publicación en miles de escrituras
 * sincrónicas dentro del request de quien publicó. Con el tope, el aviso llega
 * a los primeros integrantes y el resto lo ve al entrar al grupo; cuando exista
 * el fan-out por cola, este número se va.
 */
const MAX_POST_RECIPIENTS = 200;

/**
 * Notificaciones in-app que origina la actividad de un grupo (P7 sobre P1).
 *
 * ## Por qué vive acá y no en `messaging`
 *
 * Por lo mismo que `ClinicalNotificationsService`: `messaging` sabe entregar,
 * y este servicio sabe a quién y por qué. Quién debe enterarse de que hay una
 * publicación nueva en un grupo es una decisión de comunidad.
 *
 * ## Por qué nunca lanza
 *
 * El llamador ya selló su escritura: la persona entró al grupo, o su
 * publicación quedó en el muro. Que el canal de notificación esté caído no
 * puede deshacer ninguna de las dos. Todo fallo se registra y se traga, igual
 * que en el carril clínico.
 *
 * El `debounceKey` es determinista por recurso, destinatario y categoría, así
 * que reintentar la acción no produce un segundo aviso del mismo hecho.
 */
@Injectable()
export class CommunityGroupNotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param notifications - Solicitudes de notificación de `messaging`.
   * @param groupsRepo - Acceso a `community.groups` y `group_members`.
   * @param profilesRepo - Acceso a `community.public_profiles`.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly groupsRepo: GroupsRepository,
    private readonly profilesRepo: PublicProfilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityGroupNotificationsService.name);
  }

  /**
   * Avisa a quien acaba de ser aceptado en un grupo.
   *
   * @param group - Grupo al que entró.
   * @param memberProfileId - Perfil aceptado.
   * @param actor - Quien aprobó el alta.
   */
  async notifyJoinApproved(
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>,
    memberProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.safely('community.group.join.notify', group.id, async () => {
      const em = this.em.fork();
      const [profile] = await this.profilesRepo.listByIds(em, [
        memberProfileId,
      ]);
      const recipientUserId = this.resolveRecipientUserId(profile);
      if (!recipientUserId) return;

      await this.emit({
        group,
        recipientUserId,
        actor,
        categoryConceptId: CONCEPTS.NOTIF_CAT_GROUP_JOIN_APPROVED,
        subject: `Ya sos parte de ${group.name}`,
        bodyText:
          'Aceptaron tu solicitud de ingreso. Entrá para ver lo que se está publicando.',
      });
    });
  }

  /**
   * Avisa a los integrantes de que hay una publicación nueva en el muro.
   *
   * El autor queda fuera del reparto: nadie necesita que le avisen de lo que
   * acaba de escribir.
   *
   * @param group - Grupo donde se publicó.
   * @param authorProfileId - Perfil que publicó.
   * @param actor - Quien publicó.
   */
  async notifyNewPost(
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>,
    authorProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.safely('community.group.post.notify', group.id, async () => {
      const em = this.em.fork();
      const memberProfileIds = await this.groupsRepo.listActiveMemberProfileIds(
        em,
        group.id,
        COMM.GROUP_JOIN_ACTIVE,
        MAX_POST_RECIPIENTS,
      );
      const targets = memberProfileIds.filter((id) => id !== authorProfileId);
      if (targets.length === 0) return;

      const profiles = await this.profilesRepo.listByIds(em, targets);
      const recipients = profiles
        .map((profile) => this.resolveRecipientUserId(profile))
        .filter((userId): userId is string => !!userId);

      for (const recipientUserId of new Set(recipients)) {
        await this.emit({
          group,
          recipientUserId,
          actor,
          categoryConceptId: CONCEPTS.NOTIF_CAT_GROUP_NEW_POST,
          subject: `Hay algo nuevo en ${group.name}`,
          // El cuerpo de la publicación no viaja en el asunto: una bandeja se
          // mira en pantallas que pueden estar a la vista de cualquiera, y en
          // un grupo de apoyo el título ya diría demasiado.
          bodyText: 'Se publicó algo nuevo en el grupo. Entrá para leerlo.',
        });
      }
    });
  }

  // --- Apoyo ---

  /**
   * Perfil público → cuenta de portal.
   *
   * ## Por qué se resuelve así
   *
   * **No hay tabla que ate `iam.users` con `community.public_profiles`**: el
   * vínculo es polimórfico (`target_type_concept_id` + `target_id`). Se usa la
   * misma prueba de titularidad que ya aplica `CommunityVisibilityService` para
   * decidir de quién es un perfil: `target_id` cuando el perfil es de una
   * cuenta, y `created_by_user_id` cuando lo creó su propio titular.
   *
   * Un perfil de profesional u organización que creó un administrador no
   * resuelve a nadie, y entonces no hay aviso: es preferible que no llegue a
   * mandárselo a quien lo dio de alta.
   */
  private resolveRecipientUserId(
    profile: PublicProfiles | undefined,
  ): string | undefined {
    if (!profile) return undefined;
    if (profile.targetTypeConceptId === COMM.PROFILE_TARGET_USER)
      return profile.targetId;
    return profile.createdByUserId;
  }

  /** Crea la solicitud in-app contra el canal de P1. */
  private async emit(input: {
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>;
    recipientUserId: string;
    actor: AuthenticatedUser;
    categoryConceptId: string;
    subject: string;
    bodyText: string;
  }): Promise<void> {
    await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        tenantId: input.group.tenantId,
        recipientUserId: input.recipientUserId,
        categoryConceptId: input.categoryConceptId,
        relatedResourceType: COMMUNITY_NOTIFICATION_RESOURCES.group,
        relatedResourceId: input.group.id,
        debounceKey: `${COMMUNITY_NOTIFICATION_RESOURCES.group}:${input.group.id}:${input.recipientUserId}:${input.categoryConceptId}`,
        payloadJson: {
          subject: input.subject,
          bodyText: input.bodyText,
          resourceType: COMMUNITY_NOTIFICATION_RESOURCES.group,
          resourceId: input.group.id,
        },
      },
      input.actor,
    );
  }

  /** Ejecuta el reparto tragándose cualquier fallo del canal. */
  private async safely(
    operation: string,
    groupId: string,
    run: () => Promise<void>,
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.logger.warn(
        { operation, groupId, err: error },
        'No se pudo registrar la notificación in-app del grupo',
      );
    }
  }
}
