import { SCHED } from '../scheduling.concepts';

/** Cómo quedó la revisión de un comprobante de pago. */
export type PaymentReceiptStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

/** La clave estable de cada revisión, a su concepto. */
export const PAYMENT_RECEIPT_STATUS_CONCEPT: Readonly<
  Record<PaymentReceiptStatus, string>
> = {
  PENDING: SCHED.RECEIPT_PENDING,
  CONFIRMED: SCHED.RECEIPT_CONFIRMED,
  REJECTED: SCHED.RECEIPT_REJECTED,
};

/** El camino de vuelta, para proyectar lo que está guardado. */
export const PAYMENT_RECEIPT_CONCEPT_STATUS: Readonly<
  Record<string, PaymentReceiptStatus>
> = {
  [SCHED.RECEIPT_PENDING]: 'PENDING',
  [SCHED.RECEIPT_CONFIRMED]: 'CONFIRMED',
  [SCHED.RECEIPT_REJECTED]: 'REJECTED',
};

/**
 * Qué archivos acepta un comprobante.
 *
 * Una foto de la transferencia o el PDF que manda el banco. Nada más: un
 * comprobante que no se puede mirar en el navegador no le sirve al médico que
 * lo revisa.
 */
export const PAYMENT_RECEIPT_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];

/** El tope de un comprobante: 5 MB alcanza para una foto o un PDF bancario. */
export const PAYMENT_RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
