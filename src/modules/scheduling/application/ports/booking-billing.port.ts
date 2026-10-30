import type { UnitOfWork } from './unit-of-work';

/** El precio con el que se factura una consulta: el ítem `CITA_MEDICA` de la práctica (S-4). */
export interface ConsultationPrice {
  readonly serviceCatalogId: string;
  readonly name: string;
  /** Decimal en texto, como lo guarda el catálogo. */
  readonly price: string;
  readonly currencyConceptId?: string;
}

/** La cuenta por cobrar de una cita, con lo que se lee de ella. */
export interface BookingInvoice {
  readonly invoiceId: string;
  readonly totalCents: number;
  readonly paidCents: number;
  readonly balanceCents: number;
}

/** Lo que hace falta para emitir la cuenta por cobrar de una cita. */
export interface NewBookingInvoice {
  readonly bookingId: string;
  readonly practiceId: string;
  readonly patientProfileId: string;
  /** El encuentro de la cita, si ya se abrió; si no, se completa al abrirlo (S-3). */
  readonly encounterId?: string;
  readonly serviceCatalogId?: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currencyConceptId?: string;
  readonly actorUserId: string;
}

/** Un pago recibido por la cita, que se asigna entero a su factura. */
export interface NewBookingPayment {
  readonly bookingId: string;
  readonly invoiceId: string;
  readonly practiceId: string;
  readonly patientProfileId: string;
  readonly amountCents: number;
  /** Transferencia si vino con comprobante; efectivo si se marcó a mano. */
  readonly method: 'CASH' | 'TRANSFER';
  readonly actorUserId: string;
}

/**
 * Facturación, vista desde la agenda (FAC-01). La agenda es donde se registra
 * el pago y facturación es su asiento (S-1): este puerto crea la cuenta por
 * cobrar de una cita y le asigna lo recibido, **dentro de la transacción de
 * quien llama**. Si falla, el estado de pago tampoco queda escrito.
 */
export interface BookingBillingPort {
  /** El ítem `CITA_MEDICA` activo de la práctica, o `null` si no lo tiene. */
  findConsultationPrice(
    uow: UnitOfWork,
    practiceId: string,
  ): Promise<ConsultationPrice | null>;

  /** Precios de consulta de varias prácticas a la vez (para listar turnos). */
  findConsultationPrices(
    uow: UnitOfWork,
    practiceIds: readonly string[],
  ): Promise<Map<string, ConsultationPrice>>;

  findInvoice(
    uow: UnitOfWork,
    invoiceId: string,
  ): Promise<BookingInvoice | null>;

  /** Las facturas de varias citas a la vez (para la lista de citas). */
  findInvoices(
    uow: UnitOfWork,
    invoiceIds: readonly string[],
  ): Promise<Map<string, BookingInvoice>>;

  issueInvoice(
    uow: UnitOfWork,
    data: NewBookingInvoice,
  ): Promise<BookingInvoice>;

  /** Registra el pago, lo asigna a la factura y deja su saldo y su estado al día. */
  receivePayment(
    uow: UnitOfWork,
    data: NewBookingPayment,
  ): Promise<BookingInvoice>;
}

/** Token de inyección de facturación. */
export const BOOKING_BILLING_PORT = Symbol('BOOKING_BILLING_PORT');
