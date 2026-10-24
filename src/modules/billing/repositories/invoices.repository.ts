import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Invoices, InvoiceLines } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de factura a crear (los totales se calculan en el servicio). */
export interface CreateInvoiceData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de invoice number mantenido por la instancia.
   */
  invoiceNumber: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Valor de issue date mantenido por la instancia.
   */
  issueDate: Date;
  /**
   * Valor de due date mantenido por la instancia.
   */
  dueDate?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de subtotal mantenido por la instancia.
   */
  subtotal?: string;
  /**
   * Valor de tax total mantenido por la instancia.
   */
  taxTotal?: string;
  /**
   * Valor de discount total mantenido por la instancia.
   */
  discountTotal?: string;
  /**
   * Valor de total mantenido por la instancia.
   */
  total?: string;
  /**
   * Valor de paid total mantenido por la instancia.
   */
  paidTotal?: string;
  /**
   * Valor de balance mantenido por la instancia.
   */
  balance?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Línea de factura a crear. */
export interface CreateInvoiceLineData {
  /**
   * Identificador asociado a invoice.
   */
  invoiceId: string;
  /**
   * Identificador asociado a service.
   */
  serviceId?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de quantity mantenido por la instancia.
   */
  quantity: string;
  /**
   * Valor de unit price mantenido por la instancia.
   */
  unitPrice: string;
  /**
   * Valor de discount mantenido por la instancia.
   */
  discount?: string;
  /**
   * Identificador asociado a tax code.
   */
  taxCodeId?: string;
  /**
   * Valor de tax amount mantenido por la instancia.
   */
  taxAmount?: string;
  /**
   * Valor de line total mantenido por la instancia.
   */
  lineTotal?: string;
  /**
   * Identificador asociado a income account.
   */
  incomeAccountId?: string;
  /**
   * Identificador asociado a cost center.
   */
  costCenterId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `billing.invoices` y `billing.invoice_lines`. Stateless: cada
 * método recibe el `EntityManager` activo para que el servicio controle la
 * transacción y el orden de flush (las FK son columnas uuid planas).
 */
@Injectable()
export class InvoicesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Invoices | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Invoices | null> {
    return em.findOne(Invoices, { id });
  }

  /**
   * Obtiene find by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param invoiceNumber - Valor de invoice number requerido por la operación.
   * @returns Resultado de find by number conforme al contrato `Promise<Invoices | null>`.
   */
  findByNumber(
    em: EntityManager,
    practiceId: string,
    invoiceNumber: string,
  ): Promise<Invoices | null> {
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

  /**
   * Facturas vencidas con saldo pendiente, de las prácticas indicadas
   * (`practiceIds` ya resueltas al tenant por el llamante — `invoices` no
   * tiene `tenant_id` propio, solo `practice_id`). La usa el worker de
   * morosidad (Fase 4 del plan de corrección de workers) para descubrir qué
   * incluir en la corrida — sin esto, `dunning-runs:execute` no tenía forma
   * de saber qué facturas están en mora.
   */
  findOverdueByPractices(
    em: EntityManager,
    practiceIds: string[],
    eligibleStatusConceptIds: string[],
    now: Date,
    limit: number,
  ): Promise<Invoices[]> {
    return em.find(
      Invoices,
      {
        practiceId: { $in: practiceIds },
        statusConceptId: { $in: eligibleStatusConceptIds },
        dueDate: { $lt: now },
        balance: { $gt: '0' },
      },
      { orderBy: { dueDate: 'ASC' }, limit },
    );
  }

  /**
   * Página de facturas de una práctica, ordenada por `id` (keyset estable) —
   * CV-12: hasta ahora `billing` sólo tenía escrituras y el catálogo de
   * servicios; ningún `GET` de facturas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Práctica cuyas facturas se listan.
   * @param afterId - Cursor keyset: sólo filas con `id` mayor a éste.
   * @param limit - Tope de filas de la página.
   */
  findByPracticePage(
    em: EntityManager,
    practiceId: string,
    afterId: string | undefined,
    limit: number,
  ): Promise<Invoices[]> {
    const where: Record<string, unknown> = { practiceId };
    if (afterId !== undefined) where.id = { $gt: afterId };
    return em.find(Invoices, where, { orderBy: { id: 'ASC' }, limit });
  }

  /** Líneas de una factura, para el detalle (CV-12). */
  findLinesByInvoice(
    em: EntityManager,
    invoiceId: string,
  ): Promise<InvoiceLines[]> {
    return em.find(
      InvoiceLines,
      { invoiceId },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Invoices`.
   */
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

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `InvoiceLines`.
   */
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
