import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { GroupsRepository } from '../repositories';
import { COMM } from '../community.concepts';
import type { GroupPageDto, GroupMemberPageDto } from '../dto';

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
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: GroupsRepository,
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
   * @param actorProfileId - Perfil del lector, si declaró uno.
   * @param options - Cursor y tope.
   * @returns Página de integrantes.
   * @throws ResourceNotFoundException si el grupo no existe o es secreto y ajeno.
   */
  async listMembers(
    groupId: string,
    actorProfileId: string | undefined,
    options: {
      /** Cursor opaco de la página anterior. */
      cursor?: string;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<GroupMemberPageDto> {
    const em = this.em.fork();
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
