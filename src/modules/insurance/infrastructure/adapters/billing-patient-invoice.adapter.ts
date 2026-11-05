import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BILL } from '../../../billing/billing.concepts';
import { InvoiceLines } from '../../../billing/entities';
import { InvoicesRepository } from '../../../billing/repositories';
import type {
  IssuedPatientInvoice,
  IssuePatientInvoiceInput,
  LinkedInvoiceLine,
  PatientBillingPort,
} from '../../application/ports/patient-billing.port';

/**
 * Factura al paciente de un servicio reclamado, sobre el repositorio de
 * `billing` (carril 16, REQ-16-028 y 029).
 *
 * Es el único punto de `insurance` que conoce las entidades de facturación: el
 * caso de uso habla con `PatientBillingPort` y no sabe cómo se persiste una
 * factura. La unicidad por línea del reclamo la garantiza la base
 * (`uq_invoice_lines_insurance_claim_line_id`); el caso de uso la comprueba antes
 * bajo el bloqueo del reclamo y esa restricción queda como red de seguridad.
 */
@Injectable()
export class BillingPatientInvoiceAdapter implements PatientBillingPort {
  constructor(private readonly invoices: InvoicesRepository) {}

  async findInvoiceLineByClaimLine(
    tx: EntityManager,
    claimLineId: string,
  ): Promise<LinkedInvoiceLine | null> {
    const line = await tx.findOne(InvoiceLines, {
      insuranceClaimLineId: claimLineId,
    });
    return line ? { invoiceId: line.invoiceId, invoiceLineId: line.id } : null;
  }

  async issuePatientInvoice(
    tx: EntityManager,
    input: IssuePatientInvoiceInput,
  ): Promise<IssuedPatientInvoice> {
    const invoiceNumber = `INV-${Date.now()}-${randomUUID().slice(0, 8)}`;
    // Una sola línea, sin impuestos ni descuentos: el importe ya es la parte del
    // paciente calculada por el servidor, así que cabecera y línea coinciden.
    const invoice = this.invoices.create(tx, {
      practiceId: input.practiceId,
      invoiceNumber,
      patientProfileId: input.patientProfileId,
      issueDate: new Date(),
      statusConceptId: BILL.INVOICE_ISSUED,
      subtotal: input.amount,
      taxTotal: '0.00',
      discountTotal: '0.00',
      total: input.amount,
      paidTotal: '0.00',
      balance: input.amount,
      currencyConceptId: input.currencyConceptId ?? undefined,
      actorUserId: input.actorUserId,
    });
    // FK planas: la cabecera se persiste antes que su línea.
    await tx.flush();
    const line = this.invoices.createLine(tx, {
      invoiceId: invoice.id,
      insuranceClaimLineId: input.insuranceClaimLineId,
      description: input.description,
      quantity: '1',
      unitPrice: input.amount,
      lineTotal: input.amount,
      actorUserId: input.actorUserId,
    });
    return { invoiceId: invoice.id, invoiceLineId: line.id, invoiceNumber };
  }
}
