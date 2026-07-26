import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Invoices, InvoiceLines } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de factura a crear (los totales se calculan en el servicio). */
export interface CreateInvoiceData {
  practiceId: string;
  invoiceNumber: string;
  patientProfileId: string;
  encounterId?: string;
  issueDate: Date;
  dueDate?: Date;
  statusConceptId: string;
  subtotal?: string;
  taxTotal?: string;
  discountTotal?: string;
  total?: string;
  paidTotal?: string;
  balance?: string;
  currencyConceptId?: string;
  actorUserId?: string;
}

/** Línea de factura a crear. */
export interface CreateInvoiceLineData {
  invoiceId: string;
  serviceId?: string;
  description?: string;
  quantity: string;
  unitPrice: string;
  discount?: string;
  taxCodeId?: string;
  taxAmount?: string;
  lineTotal?: string;
  incomeAccountId?: string;
  costCenterId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `billing.invoices` y `billing.invoice_lines`. Stateless: cada
 * método recibe el `EntityManager` activo para que el servicio controle la
 * transacción y el orden de flush (las FK son columnas uuid planas).
 */
@Injectable()
export class InvoicesRepository {
  findById(em: EntityManager, id: string): Promise<Invoices | null> {
    return em.findOne(Invoices, { id });
  }

  findByNumber(em: EntityManager, practiceId: string, invoiceNumber: string): Promise<Invoices | null> {
    return em.findOne(Invoices, { practiceId, invoiceNumber });
  }

  /** Facturas del paciente con fecha de emisión dentro del rango [start, end]. */
  findByPatientInRange(
    em: EntityManager,
    practiceId: string,
    patientProfileId: string,
    start: Date,
    end: Date,
  ): Promise<Invoices[]> {
    return em.find(Invoices, {
      practiceId,
      patientProfileId,
      issueDate: { $gte: start, $lte: end },
    });
  }

  create(em: EntityManager, data: CreateInvoiceData): Invoices {
    return em.create(
      Invoices,
      {
        practiceId: data.practiceId,
        invoiceNumber: data.invoiceNumber,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        statusConceptId: data.statusConceptId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discountTotal: data.discountTotal,
        total: data.total,
        paidTotal: data.paidTotal,
        balance: data.balance,
        currencyConceptId: data.currencyConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(em: EntityManager, data: CreateInvoiceLineData): InvoiceLines {
    return em.create(
      InvoiceLines,
      {
        invoiceId: data.invoiceId,
        serviceId: data.serviceId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount,
        taxCodeId: data.taxCodeId,
        taxAmount: data.taxAmount,
        lineTotal: data.lineTotal,
        incomeAccountId: data.incomeAccountId,
        costCenterId: data.costCenterId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
