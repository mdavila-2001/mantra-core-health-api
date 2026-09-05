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

    // --- Estado de pago de una cita (TAREA-13 punto 5) ----------------------
    // Los tres que pidió el propietario, y sólo esos: «reembolsada» quedó
    // expresamente fuera. Viven acá y no en el catálogo central porque son del
    // módulo, igual que los estados de cita de arriba.
    //
    // Ojo con la tentación de agregar un cuarto valor «pagada con seguro»: el
    // propietario pidió que el seguro fuera una marca SEPARADA, y por eso es la
    // columna booleana `insurance_used` y no un estado. Mezclarlos daría seis
    // valores para responder dos preguntas distintas.
    PAYMENT_PENDING: {
      code: 'PAYMENT_PENDING',
      display: 'Payment pending',
    },
    PAYMENT_PARTIALLY_PAID: {
      code: 'PAYMENT_PARTIAL',
      display: 'Partially paid',
    },
    PAYMENT_PAID: {
      code: 'PAYMENT_PAID',
      display: 'Paid',
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

    /**
     * Reprogramación registrada en el historial.
     *
     * Es una operación aparte y no una transición de estado porque mover una
     * cita **no** la cambia de estado: sigue confirmada, en otro horario. Sin
     * esta clave el motivo de la reprogramación (corrección #14) tendría que
     * viajar bajo la operación de transición, que diría algo falso del cambio.
     */
    HISTORY_OP_RESCHEDULE: {
      code: 'BOOKING_RESCHEDULE',
      display: 'Appointment booking rescheduled',
    },

    /**
     * Demora del profesional anotada en el historial de la cita (P8).
     *
     * Es una operación propia y no una transición: informar una demora **no**
     * cambia el estado de la cita —sigue confirmada, más tarde— y persistirla
     * como columna exigiría el ciclo completo del modelo, que este carril no
     * puede hacer (ver `reports/P8.md`). El historial ya es append-only, guarda
     * quién y cuándo, y su `data_snapshot` es `jsonb`: es donde el modelo ya
     * declara que vive la razón de un cambio. Gracias a eso el paciente ve la
     * demora en el detalle de su turno aunque el aviso in-app se pierda.
     */
    HISTORY_OP_DELAY: {
      code: 'BOOKING_DELAY_ANNOUNCED',
      display: 'Practitioner announced a delay',
    },

    /**
     * Alguien marcó el estado de pago de la cita (TAREA-13 punto 5).
     *
     * `scheduling.appointment_payment_states` guarda el estado **actual** y
     * quién lo dejó así, pero se sobrescribe: sin esta operación, cambiar «pagada»
     * de vuelta a «pendiente» borraría que alguna vez estuvo pagada. El historial
     * es append-only y su `data_snapshot` es `jsonb`, así que ahí queda la cadena
     * completa —de qué estado a cuál, y si se usó seguro—.
     *
     * Es lo que hace falsable el «nada se pisa en silencio» de AC-13-10.
     */
    HISTORY_OP_PAYMENT_MARKED: {
      code: 'BOOKING_PAYMENT_MARKED',
      display: 'Booking payment state marked',
    },

    // --- Categorías de los cuatro avisos de agenda (P8) ---------------------
    // Son el `category_concept_id` de `messaging.notification_requests` y de la
    // bandeja in-app. Existen como conceptos propios —y no como un texto en el
    // payload— porque la preferencia por categoría (P9) se declara contra un
    // concepto: sin él, «no quiero recordatorios» no se puede expresar.
    NOTICE_SLOT_RELEASED: {
      code: 'AGENDA_NOTICE_SLOT_RELEASED',
      display: 'Agenda notice: a slot was released',
    },
    NOTICE_PRACTITIONER_DELAY: {
      code: 'AGENDA_NOTICE_PRACTITIONER_DELAY',
      display: 'Agenda notice: the practitioner is running late',
    },
    NOTICE_APPOINTMENT_REMINDER: {
      code: 'AGENDA_NOTICE_APPOINTMENT_REMINDER',
      display: 'Agenda notice: appointment reminder',
    },
    NOTICE_BOOKING_STATE_CHANGED: {
      code: 'AGENDA_NOTICE_BOOKING_STATE',
      display: 'Agenda notice: the appointment changed state',
    },
  });
