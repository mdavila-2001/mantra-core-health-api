import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { ClearingDocuments } from '../entities';
import type {
  ClearingDocumentItemDto,
  ListClearingDocumentsQueryDto,
} from '../dto';

/**
 * Lecturas de colección de `accounting`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class AccountingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar documentos de compensación del tenant (V16-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listClearingDocuments(
    query: ListClearingDocumentsQueryDto,
  ): Promise<PageResponseDto<ClearingDocumentItemDto>> {
    return listTenantCollection(this.em.fork(), ClearingDocuments, {
      query,
      sortable: ['createdAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): ClearingDocumentItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        clearingNumber: row.clearingNumber,
        transactionId: row.transactionId,
        clearingDate: row.clearingDate ?? null,
        companyBankAccountId: row.companyBankAccountId ?? null,
        paymentTransactionId: row.paymentTransactionId ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
      }),
    });
  }
}
