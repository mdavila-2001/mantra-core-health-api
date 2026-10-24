import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { PublicProfiles } from '../entities';
import type { ListPublicProfilesQueryDto, PublicProfileItemDto } from '../dto';

/**
 * Lecturas de colección de `community`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class CommunityCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar perfiles públicos del tenant (V19-15).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPublicProfiles(
    query: ListPublicProfilesQueryDto,
  ): Promise<PageResponseDto<PublicProfileItemDto>> {
    return listTenantCollection(this.em.fork(), PublicProfiles, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PublicProfileItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        targetTypeConceptId: row.targetTypeConceptId,
        targetId: row.targetId,
        slug: row.slug,
        displayName: row.displayName,
        headline: row.headline ?? null,
        biography: row.biography ?? null,
        avatarFileId: row.avatarFileId ?? null,
        coverFileId: row.coverFileId ?? null,
        verificationStatusConceptId: row.verificationStatusConceptId ?? null,
        visibilityConceptId: row.visibilityConceptId ?? null,
        acceptsReviews: row.acceptsReviews ?? null,
        commentsDefaultEnabled: row.commentsDefaultEnabled ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
