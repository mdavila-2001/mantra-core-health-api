import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { BillingDocumentLinks } from '../entities';
import type { BillingDocumentLinkItemDto, ListDocumentsQueryDto } from '../dto';

/**
 * Lecturas de colección de `billing`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class BillingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar vínculos documentales de facturación del tenant (V17-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDocuments(
    query: ListDocumentsQueryDto,
  ): Promise<PageResponseDto<BillingDocumentLinkItemDto>> {
    return listTenantCollection(this.em.fork(), BillingDocumentLinks, {
      query,
      sortable: ['createdAt'],
      where: definedFilters({ invoiceId: query.invoiceId }),
      map: (row): BillingDocumentLinkItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        invoiceId: row.invoiceId ?? null,
        billId: row.billId ?? null,
        contractId: row.contractId ?? null,
        salesOrderId: row.salesOrderId ?? null,
        purchaseOrderId: row.purchaseOrderId ?? null,
        claimId: row.claimId ?? null,
        encounterId: row.encounterId ?? null,
        relationTypeConceptId: row.relationTypeConceptId,
        createdAt: row.createdAt,
      }),
    });
  }
}
