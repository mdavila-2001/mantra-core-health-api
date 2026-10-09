import { CONCEPTS } from '../../../../common/constants/concepts';
import { SCHED } from '../scheduling.concepts';

/**
 * Estados en los que una solicitud está esperando respuesta.
 *
 * Son las que una aceptación ajena puede desplazar: todavía no las comprometió
 * nadie. Una confirmada NO entra acá a propósito — ver
 * {@link SchedulingBookingsService.cancelConflictingPending}.
 */
export const PENDING_BOOKING_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
];

/** Estados en los que una cita sigue ocupando cupo. */
export const ACTIVE_BOOKING_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
];

/** Estados en los que la solicitud todavía espera la respuesta del prestador. */
export const PENDING_DECISION_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
];

/**
 * Estados que un listado muestra cuando no se piden las canceladas.
 *
 * **No es la misma lista que {@link ACTIVE_BOOKING_STATES}**, y confundirlas
 * tenía consecuencias visibles: «ocupa cupo» son dos estados, pero «hay que
 * mostrarla» son seis. Con la lista de cupo, una solicitud recién hecha no
 * aparecía en la cola del profesional —quedaba pedida y nadie la veía— y una
 * cita completada desaparecía del listado del paciente en cuanto se cerraba,
 * que es justo cuando la corrección #15 pide que la vea.
 *
 * Quedan fuera solo las dos terminales que el filtro nombra: cancelada y
 * ausencia.
 */
export const VISIBLE_BOOKING_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
  SCHED.BOOKING_COMPLETED,
];

/**
 * Los estados de cita que **no** admiten estado de pago.
 *
 * Es la mitad excluyente de la regla que dio el propietario: «no es excluyente
 * con pendiente, aceptada y realizada; **sí** lo es con rechazada y cancelada».
 *
 * Rechazar no es un estado propio en esta máquina —`reject()` cancela con el
 * motivo `CANCEL_REJECTED`—, así que las dos mitades del pedido caen en el
 * mismo concepto y la lista tiene un solo elemento. No es una simplificación:
 * es que el modelo ya las trataba como lo mismo.
 *
 * **`NO_SHOW` queda deliberadamente afuera de esta lista**, o sea que sí admite
 * pago. El propietario no lo nombró —enumeró tres que permiten y dos que
 * prohíben, y el ausente no está en ninguna—; se resolvió permitirlo porque el
 * modelo ya prevé que una inasistencia pueda deber dinero
 * (`booking_cancellations.fee_amount`), y prohibirlo impediría registrar un
 * cobro legítimo. Está anotado como pregunta abierta: si el propietario dice
 * que no, se agrega acá y las pruebas lo dicen enseguida.
 */
export const STATES_WITHOUT_PAYMENT: readonly string[] = [
  CONCEPTS.BOOKING_CANCELLED,
];
