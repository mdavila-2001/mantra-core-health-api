import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { IdentityAuthorities } from '../entities';
import type { IdentityAuthorityItemDto, ListAuthoritiesQueryDto } from '../dto';

/**
 * Lecturas de colección de `identity_assurance`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class IdentityCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar las autoridades de verificación del tenant (V27-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listAuthorities(
    query: ListAuthoritiesQueryDto,
  ): Promise<PageResponseDto<IdentityAuthorityItemDto>> {
    return listTenantCollection(this.em.fork(), IdentityAuthorities, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name'],
      where: definedFilters({
        authorityTypeConceptId: query.authorityTypeConceptId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): IdentityAuthorityItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        authorityCode: row.authorityCode,
        name: row.name,
        authorityTypeConceptId: row.authorityTypeConceptId,
        jurisdictionConceptId: row.jurisdictionConceptId ?? null,
        assuranceFrameworkConceptId: row.assuranceFrameworkConceptId ?? null,
        verificationStatusConceptId: row.verificationStatusConceptId,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
