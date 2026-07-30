import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo Scheduling que NO viven en el catálogo central
 * (`src/common/constants/concepts.ts`). Se declaran aquí para no tocar el archivo
 * compartido: cubren los estados de la máquina de citas que faltaban (C-10) y las
 * decisiones/alcances del motor de confirmación automática (C-11).
 *
 * El prefijo `scheduling` espacia las claves para derivar UUIDv5 sin colisionar
 * con otros módulos. `SCHEDULING_CONCEPT_SEEDS` lo consume el agregador central
 * `module-concepts.ts`; `SCHED` lo consumen servicios, máquina de estados y specs.
 */
export const { seeds: SCHEDULING_CONCEPT_SEEDS, ids: SCHED } =
  defineModuleConcepts('scheduling', {
    // --- Estados de cita que faltaban en la máquina (C-10) -------------------
    // CONFIRMED, CHECKED_IN, CANCELLED y RESCHEDULED ya existen en el catálogo
    // central; aquí se añaden los eslabones que no estaban modelados.
    BOOKING_REQUESTED: {
      code: 'BOOKING_REQUESTED',
      display: 'Booking requested',
    },
    BOOKING_PENDING_CONFIRMATION: {
      code: 'BOOKING_PENDING_CONFIRM',
      display: 'Booking pending confirmation',
    },
    BOOKING_IN_PROGRESS: {
      code: 'BOOKING_IN_PROGRESS',
      display: 'Booking in progress',
    },
    BOOKING_COMPLETED: {
      code: 'BOOKING_COMPLETED',
      display: 'Booking completed',
    },
    BOOKING_NO_SHOW: {
      code: 'BOOKING_NO_SHOW',
      display: 'Booking no-show',
    },

    // --- Decisiones del motor de confirmación automática (C-11) --------------
    // decision_concept_id de scheduling.booking_confirmation_rules y resultado
    // de evaluateBookingRequest.
    DECISION_AUTO_CONFIRM: {
      code: 'AUTO_CONFIRM',
      display: 'Auto-confirm booking request',
    },
    DECISION_AUTO_REJECT: {
      code: 'AUTO_REJECT',
      display: 'Auto-reject booking request',
    },
    DECISION_MANUAL_REVIEW: {
      code: 'MANUAL_REVIEW',
      display: 'Route booking request to manual review',
    },

    // --- Tipos de alcance de una regla (scope_type_concept_id) ---------------
    RULE_SCOPE_TENANT: {
      code: 'RULE_SCOPE_TENANT',
      display: 'Confirmation rule scope: tenant',
    },
    RULE_SCOPE_PRACTICE: {
      code: 'RULE_SCOPE_PRACTICE',
      display: 'Confirmation rule scope: practice',
    },
    RULE_SCOPE_RESOURCE: {
      code: 'RULE_SCOPE_RESOURCE',
      display: 'Confirmation rule scope: resource',
    },
    RULE_SCOPE_SERVICE: {
      code: 'RULE_SCOPE_SERVICE',
      display: 'Confirmation rule scope: service',
    },

    // --- Operación de historial para transiciones de cita (C-10) -------------
    // operation_concept_id de audit.appointment_bookings_history.
    HISTORY_OP_STATE_TRANSITION: {
      code: 'BOOKING_STATE_TRANSITION',
      display: 'Appointment booking state transition',
    },
  });
