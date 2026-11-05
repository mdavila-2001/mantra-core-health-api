import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Invoices, ServiceCatalog } from '../../../billing/entities';
import { BILL } from '../../../billing/billing.concepts';
import { fromCents, toCents } from '../../../billing/money.util';
import {
  InvoicesRepository,
  PaymentsReceivedRepository,
} from '../../../billing/repositories';
import type {
  BookingBillingPort,
  BookingInvoice,
  ConsultationPrice,
  NewBookingInvoice,
  NewBookingPayment,
} from '../../application/ports/booking-billing.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** El código del ítem que cobra una consulta (S-4); lo siembra el alta de la práctica. */
const CONSULTATION_CODE = 'CITA_MEDICA';

/**
 * Implementa facturación sobre los repositorios de `billing`, sin importar
 * `BillingModule` (no exporta sus servicios). Los servicios de `billing` abren
 * su propia transacción y exigen la organización del encabezado; acá todo corre
 * en la unidad de trabajo de la agenda, que ya autorizó la cita, así que se
 * escribe con los repositorios y con la misma aritmética en centavos
 * (`money.util`) que `PaymentsReceivedService.apply`.
 */
@Injectable()
export class BillingBookingAdapter implements BookingBillingPort {
  constructor(
    private readonly invoicesRepo: InvoicesRepository,
    private readonly paymentsRepo: PaymentsReceivedRepository,
  ) {}

  async findConsultationPrice(
    uow: UnitOfWork,
    practiceId: string,
  ): Promise<ConsultationPrice | null> {
    return (
      (await this.findConsultationPrices(uow, [practiceId])).get(practiceId) ??
      null
    );
  }

  async findConsultationPrices(
    uow: UnitOfWork,
    practiceIds: readonly string[],
  ): Promise<Map<string, ConsultationPrice>> {
    const prices = new Map<string, ConsultationPrice>();
    if (practiceIds.length === 0) return prices;
    const items = await uow.find(ServiceCatalog, {
      practiceId: { $in: [...new Set(practiceIds)] },
      code: CONSULTATION_CODE,
      isActive: true,
    });
    for (const item of items) {
      prices.set(item.practiceId, {
        serviceCatalogId: item.id,
        name: item.name,
        price: item.defaultPrice,
        currencyConceptId: item.currencyConceptId,
      });
    }
    return prices;
  }

  async findInvoice(
    uow: UnitOfWork,
    invoiceId: string,
  ): Promise<BookingInvoice | null> {
    const invoice = await this.invoicesRepo.findById(uow, invoiceId);
    return invoice ? toBookingInvoice(invoice) : null;
  }

  async findInvoices(
    uow: UnitOfWork,
    invoiceIds: readonly string[],
  ): Promise<Map<string, BookingInvoice>> {
    const found = new Map<string, BookingInvoice>();
    if (invoiceIds.length === 0) return found;
    const invoices = await uow.find(Invoices, {
      id: { $in: [...new Set(invoiceIds)] },
    });
    for (const invoice of invoices)
      found.set(invoice.id, toBookingInvoice(invoice));
    return found;
  }

  async issueInvoice(
    uow: UnitOfWork,
    data: NewBookingInvoice,
  ): Promise<BookingInvoice> {
    const total = fromCents(data.priceCents);
    const invoice = this.invoicesRepo.create(uow, {
      practiceId: data.practiceId,
      // Único por práctica: el prefijo dice de dónde salió y el resto no choca.
      invoiceNumber: `CITA-${randomUUID().slice(0, 8).toUpperCase()}`,
      patientProfileId: data.patientProfileId,
      encounterId: data.encounterId,
      issueDate: new Date(),
      statusConceptId: BILL.INVOICE_ISSUED,
      subtotal: total,
      taxTotal: '0.00',
      discountTotal: '0.00',
      total,
      paidTotal: '0.00',
      balance: total,
      currencyConceptId: data.currencyConceptId,
      actorUserId: data.actorUserId,
    });
    // FK planas: la factura existe antes que su línea.
    await uow.flush();
    this.invoicesRepo.createLine(uow, {
      invoiceId: invoice.id,
      serviceId: data.serviceCatalogId,
      description: data.description,
      quantity: '1',
      unitPrice: total,
      lineTotal: total,
      actorUserId: data.actorUserId,
    });
    return toBookingInvoice(invoice);
  }

  async receivePayment(
    uow: UnitOfWork,
    data: NewBookingPayment,
  ): Promise<BookingInvoice> {
    const invoice = await this.invoicesRepo.findById(uow, data.invoiceId);
    if (invoice === null) {
      throw new Error(
        `La factura ${data.invoiceId} de la cita ${data.bookingId} no existe`,
      );
    }
    const amount = fromCents(data.amountCents);
    const payment = this.paymentsRepo.create(uow, {
      practiceId: data.practiceId,
      patientProfileId: data.patientProfileId,
      invoiceId: invoice.id,
      amount,
      methodConceptId:
        data.method === 'TRANSFER' ? BILL.METHOD_TRANSFER : BILL.METHOD_CASH,
      receivedAt: new Date(),
      // La cita a la que corresponde, legible en el libro de cobros.
      reference: `BOOKING:${data.bookingId}`,
      statusConceptId: BILL.PAYMENT_CLEARED,
      actorUserId: data.actorUserId,
    });
    // FK planas: el pago existe antes que su asignación.
    await uow.flush();
    this.paymentsRepo.createAllocation(uow, {
      paymentReceivedId: payment.id,
      invoiceId: invoice.id,
      allocatedAmount: amount,
      currencyConceptId: invoice.currencyConceptId,
      actorUserId: data.actorUserId,
    });
    const paidCents = toCents(invoice.paidTotal ?? '0') + data.amountCents;
    const balanceCents = toCents(invoice.total ?? '0') - paidCents;
    invoice.paidTotal = fromCents(paidCents);
    invoice.balance = fromCents(balanceCents);
    invoice.statusConceptId =
      balanceCents <= 0 ? BILL.INVOICE_PAID : BILL.INVOICE_PARTIALLY_PAID;
    invoice.updatedAt = new Date();
    invoice.updatedByUserId = data.actorUserId;
    return toBookingInvoice(invoice);
  }
}

function toBookingInvoice(invoice: Invoices): BookingInvoice {
  return {
    invoiceId: invoice.id,
    totalCents: toCents(invoice.total ?? '0'),
    paidCents: toCents(invoice.paidTotal ?? '0'),
    balanceCents: toCents(invoice.balance ?? '0'),
  };
}
