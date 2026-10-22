import { SCHED } from '../scheduling.concepts';

/** Los tres estados de pago que el cliente puede marcar. */
export type PaymentState = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

/** La clave estable de cada estado de pago, a su concepto. */
export const PAYMENT_STATE_CONCEPT: Readonly<Record<PaymentState, string>> = {
  PENDING: SCHED.PAYMENT_PENDING,
  PARTIALLY_PAID: SCHED.PAYMENT_PARTIALLY_PAID,
  PAID: SCHED.PAYMENT_PAID,
};

/** El camino de vuelta, para proyectar lo que está guardado. */
export const PAYMENT_CONCEPT_STATE: Readonly<Record<string, PaymentState>> = {
  [SCHED.PAYMENT_PENDING]: 'PENDING',
  [SCHED.PAYMENT_PARTIALLY_PAID]: 'PARTIALLY_PAID',
  [SCHED.PAYMENT_PAID]: 'PAID',
};

/**
 * Cómo se llama cada estado en pantalla.
 *
 * En castellano y acá —no en el front— por lo mismo que las etiquetas de los
 * motivos de bloqueo: el catálogo es del servidor, y una lista que crece no
 * puede exigir un despliegue del front para mostrarse.
 */
export const PAYMENT_STATE_LABEL: Readonly<Record<PaymentState, string>> = {
  PENDING: 'Pendiente de pago',
  PARTIALLY_PAID: 'Parcialmente pagada',
  PAID: 'Pagada',
};
