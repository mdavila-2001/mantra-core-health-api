import type {
  BookingBillingPort,
  BookingInvoice,
  ConsultationPrice,
  NewBookingInvoice,
  NewBookingPayment,
} from '../ports/booking-billing.port';

/** Una factura del doble, con lo que la emitió y los pagos que recibió. */
export interface FakeInvoice extends BookingInvoice {
  readonly issued: NewBookingInvoice;
  readonly payments: NewBookingPayment[];
}

/**
 * Facturación en memoria, para probar el puente sin base de datos.
 *
 * Guarda las facturas y los pagos como los dejaría el adaptador real: total
 * fijo al emitir, lo pagado acumulado y el saldo como la diferencia. Vive en un
 * `.testing.ts` para que el build de producción lo excluya.
 */
export function createFakeBookingBilling(
  prices: Record<string, ConsultationPrice> = {},
): BookingBillingPort & { invoices: Map<string, FakeInvoice> } {
  const invoices = new Map<string, FakeInvoice>();
  let seq = 0;
  const view = (inv: FakeInvoice): BookingInvoice => ({
    invoiceId: inv.invoiceId,
    totalCents: inv.totalCents,
    paidCents: inv.paidCents,
    balanceCents: inv.balanceCents,
  });
  return {
    invoices,
    async findConsultationPrice(_uow, practiceId) {
      return prices[practiceId] ?? null;
    },
    async findConsultationPrices(_uow, practiceIds) {
      return new Map(
        practiceIds.filter((id) => prices[id]).map((id) => [id, prices[id]]),
      );
    },
    async findInvoice(_uow, invoiceId) {
      const inv = invoices.get(invoiceId);
      return inv ? view(inv) : null;
    },
    async findInvoices(_uow, invoiceIds) {
      return new Map(
        invoiceIds
          .filter((id) => invoices.has(id))
          .map((id) => [id, view(invoices.get(id)!)]),
      );
    },
    async issueInvoice(_uow, data) {
      seq += 1;
      const inv: FakeInvoice = {
        invoiceId: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
        totalCents: data.priceCents,
        paidCents: 0,
        balanceCents: data.priceCents,
        issued: data,
        payments: [],
      };
      invoices.set(inv.invoiceId, inv);
      return view(inv);
    },
    async receivePayment(_uow, data) {
      const inv = invoices.get(data.invoiceId)!;
      const paidCents = inv.paidCents + data.amountCents;
      const next: FakeInvoice = {
        ...inv,
        paidCents,
        balanceCents: inv.totalCents - paidCents,
        payments: [...inv.payments, data],
      };
      invoices.set(inv.invoiceId, next);
      return view(next);
    },
  };
}
