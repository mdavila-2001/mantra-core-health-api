import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { NotificationsService } from '../../messaging/services';
import { GroupsRepository, PublicProfilesRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { GroupMembers, Groups, PublicProfiles } from '../entities';

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
 * The `debounceKey` identifies the fact (the approval, or the post) per
 * recipient, so retrying the action never produces a second notice, while a
 * second post in the same group is a new notice. The request is delivered
 * right away with its subject and body (same as the agenda notices): left to
 * the worker it reached the bell with an empty subject and never pushed.
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
   * @param member - The approved membership; its id and `joinedAt` key the
   *   fact, so a later re-join (same row, new `joinedAt`) notifies again.
   * @param actor - Quien aprobó el alta.
   */
  async notifyJoinApproved(
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>,
    member: Pick<GroupMembers, 'id' | 'memberProfileId' | 'joinedAt'>,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.safely('community.group.join.notify', group.id, async () => {
      const [recipientUserId] = await this.recipientsOf([
        member.memberProfileId,
      ]);
      if (!recipientUserId) return;
      await this.emit({
        group,
        recipientUserId,
        actor,
        categoryConceptId: CONCEPTS.NOTIF_CAT_GROUP_JOIN_APPROVED,
        factKey: `join:${member.id}:${member.joinedAt?.getTime() ?? 0}`,
        subject: `Ya es parte de ${group.name}`,
        bodyText:
          'Aceptaron su solicitud de ingreso. Entre para ver lo que se está publicando.',
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
   * @param postId - The new post, which keys the notice.
   */
  async notifyNewPost(
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>,
    authorProfileId: string,
    actor: AuthenticatedUser,
    postId: string,
  ): Promise<void> {
    await this.safely('community.group.post.notify', group.id, async () => {
      const memberProfileIds = await this.readInSavepoint((em) =>
        this.groupsRepo.listActiveMemberProfileIds(
          em,
          group.id,
          COMM.GROUP_JOIN_ACTIVE,
          MAX_POST_RECIPIENTS,
        ),
      );
      const recipients = await this.recipientsOf(
        memberProfileIds.filter((id) => id !== authorProfileId),
      );
      // One write (its own savepoint inside messaging) per recipient, outside
      // any shared transaction: one failing recipient never drops the rest,
      // and each announcement waits only for its own commit.
      for (const recipientUserId of recipients) {
        await this.safely('community.group.post.notify', group.id, () =>
          this.emit({
            group,
            recipientUserId,
            actor,
            categoryConceptId: CONCEPTS.NOTIF_CAT_GROUP_NEW_POST,
            factKey: `post:${postId}`,
            subject: `Hay algo nuevo en ${group.name}`,
            // El cuerpo de la publicación no viaja en el asunto: una bandeja se
            // mira en pantallas que pueden estar a la vista de cualquiera, y en
            // un grupo de apoyo el título ya diría demasiado.
            bodyText: 'Se publicó algo nuevo en el grupo. Entre para leerlo.',
          }),
        );
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
  /** Distinct accounts behind these public profiles (read in a savepoint). */
  private async recipientsOf(profileIds: readonly string[]): Promise<string[]> {
    if (profileIds.length === 0) return [];
    const profiles = await this.readInSavepoint((em) =>
      this.profilesRepo.listByIds(em, [...profileIds]),
    );
    const userIds = profiles
      .map((profile) => this.resolveRecipientUserId(profile))
      .filter((userId): userId is string => !!userId);
    return [...new Set(userIds)];
  }

  /** Savepoint: a swallowed failed read must not abort the request transaction. */
  private readInSavepoint<T>(
    read: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.em.fork({ keepTransactionContext: true }).transactional(read);
  }

  private resolveRecipientUserId(
    profile: PublicProfiles | undefined,
  ): string | undefined {
    if (!profile) return undefined;
    if (profile.targetTypeConceptId === COMM.PROFILE_TARGET_USER)
      return profile.targetId;
    return profile.createdByUserId;
  }

  /** Creates the in-app request and delivers it with its text. */
  private async emit(input: {
    group: Pick<Groups, 'id' | 'name' | 'tenantId'>;
    recipientUserId: string;
    actor: AuthenticatedUser;
    categoryConceptId: string;
    factKey: string;
    subject: string;
    bodyText: string;
  }): Promise<void> {
    const resource = COMMUNITY_NOTIFICATION_RESOURCES.group;
    const request = await this.notifications.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        tenantId: input.group.tenantId,
        recipientUserId: input.recipientUserId,
        categoryConceptId: input.categoryConceptId,
        relatedResourceType: resource,
        relatedResourceId: input.group.id,
        debounceKey: `${resource}:${input.group.id}:${input.factKey}:${input.recipientUserId}`,
        payloadJson: {
          subject: input.subject,
          bodyText: input.bodyText,
          resourceType: resource,
          resourceId: input.group.id,
          // Where the push opens (`routeFromPayload` in messaging).
          route: `/groups/${input.group.id}`,
        },
      },
      input.actor,
    );
    // Suppressed by preference, or the same fact already has a live request.
    if (request.suppressed || request.debounced) return;
    await this.notifications.deliverNotification(
      request.id,
      {
        outcome: 'SENT',
        providerChannelConfigId: MESSAGING_SEED.inAppChannelConfigId,
        subject: input.subject,
        bodyText: input.bodyText,
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
