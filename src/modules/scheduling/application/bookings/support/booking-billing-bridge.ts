import { Inject, Injectable } from '@nestjs/common';
import { PreconditionFailedException } from '../../../../../common';
import type {
  AppointmentBookings,
  AppointmentPaymentStates,
} from '../../../entities';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import type { BookingBillingLinkDto } from '../../../presentation/dto';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  BOOKING_BILLING_PORT,
  type BookingBillingPort,
  type BookingInvoice,
} from '../../ports/booking-billing.port';
import {
  CLINICAL_APPOINTMENTS_PORT,
  type ClinicalAppointmentsPort,
} from '../../ports/clinical-appointments.port';
import type { UnitOfWork } from '../../ports/unit-of-work';

/** Importe en Bs con hasta dos decimales, mayor que 0 (S-11). */
const AMOUNT_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** Un pago a facturar: cuánto y cómo llegó. */
export interface BookingPaymentToBill {
  readonly amountCents: number;
  readonly method: 'CASH' | 'TRANSFER';
  /** Con comprobante, lo que pase del saldo se recorta en vez de rechazarse (R-01-5). */
  readonly capAtBalance: boolean;
}

/**
 * El pago de la agenda llega a facturación (FAC-01, CONTRATO §1).
 *
 * Corre dentro de la transacción del estado de pago: si facturación falla, la
 * cita tampoco queda «Pagada». Las reglas:
 *
 * - **S-2.** Sin monto no se toca facturación: `linked=false`, `NO_AMOUNT`
 *   (o el vínculo que ya hubiera, si la cita ya tiene factura).
 * - **S-5.** La práctica es la del recurso de la agenda; sin práctica,
 *   `NO_PRACTICE`. Sin precio mayor que 0, `NO_PRICE`. El estado se guarda igual.
 * - **S-4.** Una reserva de servicio factura el precio congelado en la reserva;
 *   una consulta, el ítem `CITA_MEDICA` de la práctica vigente al primer pago.
 * - **Idempotente por cita.** La primera vez crea la cuenta por cobrar y la deja
 *   en `appointment_payment_states.invoice_id`; los pagos siguientes se asignan
 *   a la misma. Nunca dos facturas para una cita.
 * - **S-3.** Si la cita ya tiene encuentro, la factura nace con él; si no, lo
 *   completa el check-in del encuentro.
 */
@Injectable()
export class BookingBillingBridge {
  constructor(
    @Inject(BOOKING_BILLING_PORT)
    private readonly billing: BookingBillingPort,
    private readonly catalogRepo: SchedulingCatalogRepository,
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly appointments: ClinicalAppointmentsPort,
  ) {}

  /**
   * Convierte el monto que llegó en el cuerpo en centavos, o 422 si no es un
   * importe en Bs mayor que 0 con hasta dos decimales.
   */
  static amountCents(amount: number): number {
    const text = String(amount);
    if (!Number.isFinite(amount) || amount <= 0 || !AMOUNT_PATTERN.test(text)) {
      throw new PreconditionFailedException(
        'El monto recibido tiene que ser mayor que 0, en bolivianos y con hasta dos decimales',
        { amountReceived: amount },
        SchedulingErrorReason.PAYMENT_AMOUNT_INVALID,
      );
    }
    const [whole, fraction = ''] = text.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  }

  /**
   * Factura el pago de la cita, o dice por qué no.
   *
   * @param uow - La transacción del estado de pago.
   * @param booking - La cita, ya cargada y autorizada.
   * @param row - Su fila de estado de pago, ya escrita; acá se le deja `invoiceId`.
   * @param payment - El pago, o `undefined` si la marca no trae monto.
   * @param actorUserId - Quien registra el pago.
   */
  async bill(
    uow: UnitOfWork,
    booking: AppointmentBookings,
    row: AppointmentPaymentStates,
    payment: BookingPaymentToBill | undefined,
    actorUserId: string,
  ): Promise<BookingBillingLinkDto> {
    if (payment === undefined) {
      return (await this.linkOf(uow, row)) ?? notLinked('NO_AMOUNT');
    }

    const resource = booking.resourceId
      ? await this.catalogRepo.findResourceById(uow, booking.resourceId)
      : null;
    const practiceId = resource?.practiceId;
    if (!practiceId) return notLinked('NO_PRACTICE');

    let invoice = row.invoiceId
      ? await this.billing.findInvoice(uow, row.invoiceId)
      : null;
    if (invoice === null) {
      const charge = await this.chargeOf(uow, booking, practiceId);
      if (charge === null) return notLinked('NO_PRICE');
      invoice = await this.billing.issueInvoice(uow, {
        bookingId: booking.id,
        practiceId,
        patientProfileId: booking.patientProfileId,
        encounterId: await this.encounterOf(uow, booking),
        serviceCatalogId: charge.serviceCatalogId,
        description: charge.description,
        priceCents: charge.priceCents,
        currencyConceptId: charge.currencyConceptId,
        actorUserId,
      });
      row.invoiceId = invoice.invoiceId;
    }

    const amountCents = payment.capAtBalance
      ? Math.min(payment.amountCents, invoice.balanceCents)
      : payment.amountCents;
    if (amountCents > invoice.balanceCents) {
      throw new PreconditionFailedException(
        `El monto pasa lo que falta pagar de la cita: ${formatBs(invoice.balanceCents)}`,
        { bookingId: booking.id, balance: invoice.balanceCents / 100 },
        SchedulingErrorReason.PAYMENT_AMOUNT_EXCEEDS_BALANCE,
      );
    }
    if (amountCents > 0) {
      invoice = await this.billing.receivePayment(uow, {
        bookingId: booking.id,
        invoiceId: invoice.invoiceId,
        practiceId,
        patientProfileId: booking.patientProfileId,
        amountCents,
        method: payment.method,
        actorUserId,
      });
    }
    return linked(invoice);
  }

  /** El vínculo que ya tiene la cita, o `null` si no tiene factura. */
  async linkOf(
    uow: UnitOfWork,
    row: AppointmentPaymentStates | null | undefined,
  ): Promise<BookingBillingLinkDto | null> {
    if (!row?.invoiceId) return null;
    const invoice = await this.billing.findInvoice(uow, row.invoiceId);
    return invoice ? linked(invoice) : null;
  }

  /** Lo recibido por cada factura, para la lista de citas (CONTRATO §2). */
  async paidByInvoice(
    uow: UnitOfWork,
    rows: Iterable<AppointmentPaymentStates>,
  ): Promise<Map<string, number>> {
    const ids = [...rows]
      .map((r) => r.invoiceId)
      .filter((id): id is string => Boolean(id));
    const invoices = await this.billing.findInvoices(uow, ids);
    return new Map([...invoices].map(([id, inv]) => [id, inv.paidCents / 100]));
  }

  /** S-4: el precio de la reserva de servicio, o el de la consulta de la práctica. */
  private async chargeOf(
    uow: UnitOfWork,
    booking: AppointmentBookings,
    practiceId: string,
  ): Promise<{
    serviceCatalogId?: string;
    description: string;
    priceCents: number;
    currencyConceptId?: string;
  } | null> {
    const service = booking.serviceSnapshot as
      | Partial<{
          serviceCatalogId: string;
          serviceName: string;
          price: string;
          currencyConceptId: string;
        }>
      | undefined
      | null;
    if (service) {
      const priceCents = centsOf(service.price);
      if (priceCents === null) return null;
      return {
        serviceCatalogId: service.serviceCatalogId,
        description: service.serviceName ?? 'Servicio',
        priceCents,
        currencyConceptId: service.currencyConceptId,
      };
    }
    const consultation = await this.billing.findConsultationPrice(
      uow,
      practiceId,
    );
    const priceCents = centsOf(consultation?.price);
    if (consultation === null || priceCents === null) return null;
    return {
      serviceCatalogId: consultation.serviceCatalogId,
      description: consultation.name,
      priceCents,
      currencyConceptId: consultation.currencyConceptId,
    };
  }

  private async encounterOf(
    uow: UnitOfWork,
    booking: AppointmentBookings,
  ): Promise<string | undefined> {
    if (!booking.appointmentId) return undefined;
    const encounters = await this.appointments.findLatestEncounterIds(uow, [
      booking.appointmentId,
    ]);
    return encounters.get(booking.appointmentId);
  }
}

/** Un precio en centavos mayor que 0, o `null`: un 0 no se factura (S-5). */
function centsOf(price: string | undefined): number | null {
  if (price === undefined || !AMOUNT_PATTERN.test(price)) return null;
  const [whole, fraction = ''] = price.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents > 0 ? cents : null;
}

function linked(invoice: BookingInvoice): BookingBillingLinkDto {
  return {
    linked: true,
    invoiceId: invoice.invoiceId,
    amountBilled: invoice.totalCents / 100,
    amountPaid: invoice.paidCents / 100,
    currencyCode: 'BOB',
    reason: null,
  };
}

function notLinked(
  reason: 'NO_PRACTICE' | 'NO_PRICE' | 'NO_AMOUNT',
): BookingBillingLinkDto {
  return {
    linked: false,
    invoiceId: null,
    amountBilled: null,
    amountPaid: null,
    currencyCode: null,
    reason,
  };
}

/** «150,00 Bs», como el resto de los textos de dinero (CONTRATO §4). */
function formatBs(cents: number): string {
  const [whole, fraction] = (cents / 100).toFixed(2).split('.');
  return `${whole},${fraction} Bs`;
}

/** Lo cobrado, tal como lo muestra la insignia de la cita (CONTRATO §2). */
export function amountsOf(billing: BookingBillingLinkDto): {
  amountPaid?: number;
  currencyCode?: 'BOB';
} {
  return billing.linked && billing.amountPaid !== null
    ? { amountPaid: billing.amountPaid, currencyCode: 'BOB' }
    : {};
}
