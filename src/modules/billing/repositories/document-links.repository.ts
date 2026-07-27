import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BillingDocumentLinks } from '../entities';

/** Vínculo entre documentos de facturación (factura ↔ encuentro/NC/reembolso/…). */
export interface CreateDocumentLinkData {
  tenantId: string;
  relationTypeConceptId: string;
  invoiceId?: string;
  billId?: string;
  contractId?: string;
  salesOrderId?: string;
  purchaseOrderId?: string;
  claimId?: string;
  encounterId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `billing.billing_document_links` (tabla de solo-inserción, sin
 * `updated_at`/`row_version`).
 */
@Injectable()
export class BillingDocumentLinksRepository {
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
