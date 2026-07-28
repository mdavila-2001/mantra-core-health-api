import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BillingDocumentLinks } from '../entities';

/** Vínculo entre documentos de facturación (factura ↔ encuentro/NC/reembolso/…). */
export interface CreateDocumentLinkData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a relation type concept.
   */
  relationTypeConceptId: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId?: string;
  /**
   * Identificador asociado a bill.
   */
  billId?: string;
  /**
   * Identificador asociado a contract.
   */
  contractId?: string;
  /**
   * Identificador asociado a sales order.
   */
  salesOrderId?: string;
  /**
   * Identificador asociado a purchase order.
   */
  purchaseOrderId?: string;
  /**
   * Identificador asociado a claim.
   */
  claimId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `billing.billing_document_links` (tabla de solo-inserción, sin
 * `updated_at`/`row_version`).
 */
@Injectable()
export class BillingDocumentLinksRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `BillingDocumentLinks`.
   */
  create(
    em: EntityManager,
    data: CreateDocumentLinkData,
  ): BillingDocumentLinks {
    return em.create(
      BillingDocumentLinks,
      {
        tenantId: data.tenantId,
        relationTypeConceptId: data.relationTypeConceptId,
        invoiceId: data.invoiceId,
        billId: data.billId,
        contractId: data.contractId,
        salesOrderId: data.salesOrderId,
        purchaseOrderId: data.purchaseOrderId,
        claimId: data.claimId,
        encounterId: data.encounterId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
