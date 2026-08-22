import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';
import { CONCEPTS } from '../../../common';
import { GroupsRepository } from '../repositories';
import { CommunityVisibilityService } from './community-visibility.service';
import { CommunityGroupAccessService } from './community-group-access.service';
import { COMM } from '../community.concepts';
import type {
  GroupPageDto,
  GroupMemberPageDto,
  GroupDetailDto,
  TopicPageDto,
} from '../dto';

/** Tope de temas que devuelve el listado del arbol. */
const TOPICS_LIMIT = 200;

/**
 * Cara de lectura de los grupos (UC-19-12).
 *
 * `groups` es una de las pocas tablas del módulo con `tenant_id`, así que el
 * listado exige la organización: sin ese filtro, el directorio de grupos de una
 * clínica se vería desde otra.
 */
@Injectable()
export class CommunityGroupsReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param groupsRepo - Acceso a `community.groups` y `group_members`.
   * @param visibility - Resuelve el perfil del lector contra la sesión.
   * @param access - Reglas de quién ve qué dentro de un grupo.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: GroupsRepository,
    private readonly visibility: CommunityVisibilityService,
    private readonly access: CommunityGroupAccessService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityGroupsReadService.name);
  }

  /**
   * Directorio de grupos de una organización.
   *
   * Los grupos secretos quedan fuera del listado por definición: existen para
   * quien ya fue invitado, y aparecer en un directorio los volvería no
   * secretos.
   *
   * @param tenantId - Organización cuyos grupos se listan.
   * @param options - Cursor y tope.
   * @returns Página de grupos.
   */
  async listGroups(
    tenantId: string,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
      /** Tema por el que se acota el directorio (P7). */
      topicId?: string;
      /** Texto libre que se busca en nombre y descripción (P7). */
      query?: string;
    },
  ): Promise<GroupPageDto> {
    const em = this.em.fork();
    const afterKey = this.decodeCreatedAtCursor(options.cursor);

    const rows = await this.groupsRepo.searchPage(
      em,
      tenantId,
      COMM.GROUP_VISIBILITY_SECRET,
      afterKey,
      options.limit + 1,
      { topicId: options.topicId, query: options.query?.trim() || undefined },
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((group) => ({
        id: group.id,
        tenantId: group.tenantId ?? null,
        slug: group.slug,
        name: group.name,
        description: group.description ?? null,
        visibilityConceptId: group.visibilityConceptId,
        groupTypeConceptId: group.groupTypeConceptId,
        ownerProfileId: group.ownerProfileId ?? null,
        coverFileId: group.coverFileId ?? null,
        memberCount: group.memberCount ?? null,
        statusConceptId: group.statusConceptId,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor: this.encodeCreatedAtCursor(hasMore, last),
    };
  }

  /**
   * Integrantes de un grupo.
   *
   * Un grupo secreto sólo revela su padrón a quien ya es integrante; para el
   * resto responde 404, igual que si no existiera.
   *
   * @param groupId - Grupo a leer.
   * @param actor - Quien pide la lectura.
   * @param requestedProfileId - Perfil del lector **propuesto**; se verifica.
   * @param options - Cursor y tope.
   * @returns Página de integrantes.
   * @throws ResourceNotFoundException si el grupo no existe o es secreto y ajeno.
   */
  async listMembers(
    groupId: string,
    actor: AuthenticatedUser,
    requestedProfileId: string | undefined,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
      /** Estado de membresía a filtrar (P7: la cola de pendientes). */
      joinStatusConceptId?: string;
    },
  ): Promise<GroupMemberPageDto> {
    const em = this.em.fork();
    // La pertenencia a un grupo secreto se prueba contra la sesión: con el
    // perfil declarado en la consulta, bastaba con nombrar a un integrante para
    // listar los miembros de un grupo del que uno no forma parte.
    const actorProfileId = await this.visibility.resolveActorProfileId(
      em,
      actor,
      requestedProfileId,
    );
    const group = await this.groupsRepo.findById(em, groupId);
    if (!group)
      throw new ResourceNotFoundException('Grupo no encontrado', { groupId });

    if (group.visibilityConceptId === COMM.GROUP_VISIBILITY_SECRET) {
      const member = actorProfileId
        ? await this.groupsRepo.findMember(em, groupId, actorProfileId)
        : null;
      if (!member || member.joinStatusConceptId !== COMM.GROUP_JOIN_ACTIVE)
        throw new ResourceNotFoundException('Grupo no encontrado', { groupId });
    }

    const afterKey = this.decodeCreatedAtCursor(options.cursor);
    const rows = await this.groupsRepo.listMembers(
      em,
      groupId,
      afterKey,
      options.limit + 1,
      options.joinStatusConceptId,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((member) => ({
        id: member.id,
        memberProfileId: member.memberProfileId,
        memberRoleConceptId: member.memberRoleConceptId,
        joinStatusConceptId: member.joinStatusConceptId,
        joinedAt: member.joinedAt ?? null,
        invitedByProfileId: member.invitedByProfileId ?? null,
      })),
      count: page.length,
      limit: options.limit,
      nextCursor: this.encodeCreatedAtCursor(hasMore, last),
    };
  }

  /**
   * Ficha de un grupo, con la posición del lector frente a él (P7).
   *
   * Devuelve `viewer` —si es integrante, si puede publicar, si administra— en
   * la misma respuesta y no en un endpoint aparte porque la pantalla del grupo
   * necesita las dos cosas para pintarse una sola vez: sin eso, el botón
   * «unirse» aparece por un instante frente a quien ya es integrante.
   *
   * `pendingCount` sólo viaja para quien administra: cuántas personas están
   * esperando entrar a un grupo privado no es asunto de quien mira desde afuera.
   *
   * @param groupId - Grupo a leer.
   * @param actor - Quien pide la ficha.
   * @param requestedProfileId - Perfil del lector propuesto; se verifica.
   * @returns Ficha del grupo.
   * @throws ResourceNotFoundException si no existe, o es secreto y ajeno.
   */
  async getGroup(
    groupId: string,
    actor: AuthenticatedUser,
    requestedProfileId?: string,
  ): Promise<GroupDetailDto> {
    const em = this.em.fork();
    const access = await this.access.resolve(
      em,
      groupId,
      actor,
      requestedProfileId,
    );
    const group = access.group;

    const pendingCount = access.canAdminister
      ? await this.groupsRepo.countMembersByStatus(
          em,
          groupId,
          COMM.GROUP_JOIN_PENDING,
        )
      : null;

    return {
      id: group.id,
      tenantId: group.tenantId ?? null,
      slug: group.slug,
      name: group.name,
      description: group.description ?? null,
      visibilityConceptId: group.visibilityConceptId,
      groupTypeConceptId: group.groupTypeConceptId,
      topicId: group.topicId ?? null,
      ownerProfileId: group.ownerProfileId ?? null,
      coverFileId: group.coverFileId ?? null,
      memberCount: group.memberCount ?? null,
      postCount: group.postCount ?? null,
      pendingCount,
      statusConceptId: group.statusConceptId,
      viewer: {
        isMember: access.isMember,
        canAdminister: access.canAdminister,
        canPost: access.canPost,
        membershipId: access.membership?.id ?? null,
        memberRoleConceptId: access.membership?.memberRoleConceptId ?? null,
        joinStatusConceptId: access.membership?.joinStatusConceptId ?? null,
      },
    };
  }

  /**
   * Temas con los que se clasifican grupos y publicaciones (P7).
   *
   * No pagina: el árbol de temas de una plataforma médica se cuenta en decenas,
   * y la pantalla que lo consume es un selector, no un listado infinito.
   *
   * @returns Temas activos, ordenados por nombre.
   */
  async listTopics(): Promise<TopicPageDto> {
    const em = this.em.fork();
    const rows = await this.groupsRepo.listTopics(
      em,
      CONCEPTS.STATE_ACTIVE,
      TOPICS_LIMIT,
    );

    return {
      items: rows.map((topic) => ({
        id: topic.id,
        code: topic.code,
        name: topic.name,
        parentTopicId: topic.parentTopicId ?? null,
        specialtyConceptId: topic.specialtyConceptId ?? null,
      })),
      count: rows.length,
      limit: TOPICS_LIMIT,
    };
  }

  /** Clave de continuación `(createdAt, id)` de un cursor, si es válida. */
  private decodeCreatedAtCursor(
    cursor?: string,
  ): { createdAt: string; id: string } | undefined {
    if (!cursor) return undefined;
    const after = decodeKeysetCursor(cursor);
    return typeof after.createdAt === 'string' && typeof after.id === 'string'
      ? { createdAt: after.createdAt, id: after.id }
      : undefined;
  }

  /** Cursor `(createdAt, id)` de la última fila, si hay página siguiente. */
  private encodeCreatedAtCursor(
    hasMore: boolean,
    last: { createdAt: Date; id: string } | undefined,
  ): string | null {
    return hasMore && last
      ? encodeKeysetCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;
  }
}
