import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  BookableSlots,
  SlotHolds,
  AppointmentBookings,
  AppointmentPaymentStates,
  BookingReschedules,
  BookingCancellations,
  WaitlistEntries,
  AppointmentReminders,
  type CancellationPolicySnapshot,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create hold data.
 */
export interface CreateHoldData {
  /**
   * Identificador asociado a bookable slot.
   */
  bookableSlotId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a held by user.
   */
  heldByUserId: string;
  /**
   * Valor de hold token mantenido por la instancia.
   */
  holdToken: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create booking data.
 */
export interface CreateBookingData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a bookable slot.
   */
  bookableSlotId: string;
  /**
   * Cita clínica que respalda la reserva (`clinical.appointments`).
   *
   * Es lo que ata el turno con el encuentro que se abra al atenderlo. Opcional
   * en el tipo porque la columna lo es, pero la confirmación siempre la crea.
   */
  appointmentId?: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Identificador asociado a booking channel concept.
   */
  bookingChannelConceptId: string;
  /**
   * Identificador asociado a booked by user.
   */
  bookedByUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de confirmed at mantenido por la instancia.
   */
  confirmedAt?: Date;
  /**
   * Identificador asociado a booking policy.
   */
  bookingPolicyId?: string;
  /**
   * Valor de cancellation policy snapshot mantenido por la instancia.
   */
  cancellationPolicySnapshot?: CancellationPolicySnapshot;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create waitlist data.
 */
export interface CreateWaitlistData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de desired from mantenido por la instancia.
   */
  desiredFrom?: Date;
  /**
   * Valor de desired to mantenido por la instancia.
   */
  desiredTo?: Date;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reminder data.
 */
export interface CreateReminderData {
  /**
   * Identificador asociado a booking.
   */
  bookingId: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId: string;
  /**
   * Valor de offset minutes mantenido por la instancia.
   */
  offsetMinutes: number;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos del flujo de reserva: holds, citas, cambios, lista de espera y recordatorios. */
@Injectable()
export class SchedulingBookingsRepository {
  /**
   * `SELECT ... FOR UPDATE` sobre el slot. Es la pieza central del anti-double-booking:
   * serializa el decremento de `remaining_capacity` entre peticiones concurrentes.
   */
  findSlotForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<BookableSlots | null> {
    return em.findOne(
      BookableSlots,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find slot by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find slot by id conforme al contrato `Promise<BookableSlots | null>`.
   */
  findSlotById(em: EntityManager, id: string): Promise<BookableSlots | null> {
    return em.findOne(BookableSlots, { id });
  }

  /**
   * Crea create hold.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create hold conforme al contrato `SlotHolds`.
   */
  createHold(em: EntityManager, data: CreateHoldData): SlotHolds {
    return em.create(
      SlotHolds,
      {
        bookableSlotId: data.bookableSlotId,
        patientProfileId: data.patientProfileId,
        heldByUserId: data.heldByUserId,
        holdToken: data.holdToken,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** El token es la clave pública del hold; su UNIQUE evita confirmar dos veces. */
  findHoldByTokenForUpdate(
    em: EntityManager,
    holdToken: string,
  ): Promise<SlotHolds | null> {
    return em.findOne(
      SlotHolds,
      { holdToken },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Lote de holds vencidos para el worker. `SKIP LOCKED` evita que dos workers
   * compitan por las mismas filas en vez de repartirse el trabajo.
   */
  findExpiredHolds(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<SlotHolds[]> {
    return em.find(
      SlotHolds,
      { statusConceptId: activeStatusConceptId, expiresAt: { $lte: now } },
      { limit, lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  /**
   * Crea create booking.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create booking conforme al contrato `AppointmentBookings`.
   */
  createBooking(
    em: EntityManager,
    data: CreateBookingData,
  ): AppointmentBookings {
    return em.create(
      AppointmentBookings,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        appointmentId: data.appointmentId,
        bookableSlotId: data.bookableSlotId,
        resourceId: data.resourceId,
        serviceConceptId: data.serviceConceptId,
        bookingChannelConceptId: data.bookingChannelConceptId,
        bookedByUserId: data.bookedByUserId,
        statusConceptId: data.statusConceptId,
        confirmedAt: data.confirmedAt,
        bookingPolicyId: data.bookingPolicyId,
        cancellationPolicySnapshot: data.cancellationPolicySnapshot,
        reasonText: data.reasonText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find booking by id for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find booking by id for update conforme al contrato `Promise<AppointmentBookings | null>`.
   */
  findBookingByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AppointmentBookings | null> {
    return em.findOne(
      AppointmentBookings,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * El estado de pago de una cita, bloqueado para escribir (TAREA-13 punto 5).
   *
   * Se bloquea porque marcar el pago es leer-decidir-escribir: sin el lock, dos
   * peticiones simultáneas leerían las dos «no hay fila» y la segunda moriría
   * contra `ux_appointment_payment_states_booking` con un 500 en vez de
   * serializarse.
   */
  findPaymentStateForUpdate(
    em: EntityManager,
    bookingId: string,
  ): Promise<AppointmentPaymentStates | null> {
    return em.findOne(
      AppointmentPaymentStates,
      { appointmentBookingId: bookingId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Los estados de pago de VARIAS citas, en una sola consulta.
   *
   * Existe para que la columna de pago de la tabla de citas sea posible. La
   * alternativa —pedir el estado de cada fila— no es una ineficiencia sino una
   * columna que no se puede construir: es el mismo defecto que Itzan levantó
   * como B-1 en la TAREA-22, y no vale la pena volver a cometerlo sabiendo.
   *
   * Las citas sin marca simplemente no aparecen en el mapa. Ausencia y
   * «pendiente de pago» son cosas distintas, y esa diferencia tiene que
   * sobrevivir hasta la pantalla.
   */
  async findPaymentStatesForBookings(
    em: EntityManager,
    bookingIds: readonly string[],
  ): Promise<Map<string, AppointmentPaymentStates>> {
    const porCita = new Map<string, AppointmentPaymentStates>();
    if (bookingIds.length === 0) return porCita;

    const filas = await em.find(AppointmentPaymentStates, {
      appointmentBookingId: { $in: [...bookingIds] },
    });
    for (const fila of filas) {
      porCita.set(fila.appointmentBookingId, fila);
    }
    return porCita;
  }

  /** El estado de pago, sin bloquear: es la cara de lectura. */
  findPaymentState(
    em: EntityManager,
    bookingId: string,
  ): Promise<AppointmentPaymentStates | null> {
    return em.findOne(AppointmentPaymentStates, {
      appointmentBookingId: bookingId,
    });
  }

  /** Cita concreta, sin bloquear: es la cara de lectura de UC-41-15. */
  findBookingById(
    em: EntityManager,
    id: string,
  ): Promise<AppointmentBookings | null> {
    return em.findOne(AppointmentBookings, { id });
  }

  /**
   * Citas que casan con los filtros del listado (UC-41-15).
   *
   * **Siempre se consulta desde `appointment_bookings`**, que es el lado
   * selectivo: el servicio garantiza que viene `patientProfileId` o
   * `resourceId`, y ambos acotan la consulta a un índice. La ventana temporal se
   * aplica después, sobre los slots ya resueltos.
   *
   * Se hizo así tras descartar lo contrario. Resolver primero los slots de la
   * ventana y buscar las citas de esos slots parece más directo, pero con una
   * ventana amplia y sin `resourceId` —«mis citas de este año»— esa consulta
   * barre los slots de TODOS los recursos del tenant. Acotarla con un tope
   * dejaba fuera, en silencio, las citas de los slots que no entraran: el
   * paciente recibía una lista incompleta que se declaraba completa. Un listado
   * de citas que se calla las que faltan es peor que uno que no existe.
   *
   * El orden cronológico se aplica en memoria porque el instante vive en
   * `bookable_slots` y no en la cita; sobre una página acotada es irrelevante y
   * evita salir del `em.find` a SQL crudo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Paciente, recurso y ventana temporal.
   * @param limit - Tope de filas a devolver.
   * @returns Las citas que casan y si la lectura previa al filtro tocó su tope
   *   —lo segundo es lo que permite al servicio declarar el recorte en vez de
   *   devolver una lista incompleta con aspecto de completa.
   */
  async findBookings(
    em: EntityManager,
    filters: {
      /** Paciente titular de la cita. */
      patientProfileId?: string;
      /** Recurso (agenda) al que pertenece. */
      resourceId?: string;
      /** Inicio de la ventana sobre el instante del slot. */
      from?: Date;
      /** Fin de la ventana sobre el instante del slot. */
      to?: Date;
      /** Estados a incluir; sin esto entran también las canceladas. */
      statusConceptIds?: string[];
    },
    limit: number,
  ): Promise<{
    /** Citas que casan, con su slot resuelto. */
    rows: { booking: AppointmentBookings; slot: BookableSlots | null }[];
    /** `true` si la lectura previa al filtro por ventana agotó su tope. */
    fetchCapReached: boolean;
  }> {
    const where: Record<string, unknown> = {};
    if (filters.patientProfileId) {
      where.patientProfileId = filters.patientProfileId;
    }
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.statusConceptIds && filters.statusConceptIds.length > 0) {
      where.statusConceptId = { $in: filters.statusConceptIds };
    }

    const hasWindow = Boolean(filters.from || filters.to);

    // Con ventana hay que traer más de `limit` antes de filtrar, porque no se
    // sabe cuántas de las citas del paciente o del recurso caen dentro. El
    // margen es amplio y, si aun así se agota, el recorte se DECLARA con el
    // elemento sobrante que el servicio usa para marcar `truncated`.
    const fetchLimit = hasWindow ? Math.max(limit * 20, 500) : limit;

    const bookings = await em.find(AppointmentBookings, where, {
      orderBy: { createdAt: 'DESC' },
      limit: fetchLimit,
    });

    const slotIds = bookings
      .map((booking) => booking.bookableSlotId)
      .filter((id): id is string => Boolean(id));
    const slots =
      slotIds.length > 0
        ? await em.find(BookableSlots, { id: { $in: slotIds } })
        : [];
    const slotById = new Map(slots.map((slot) => [slot.id, slot]));

    const rows = bookings.map((booking) => ({
      booking,
      slot: booking.bookableSlotId
        ? (slotById.get(booking.bookableSlotId) ?? null)
        : null,
    }));

    const fetchCapReached = bookings.length >= fetchLimit;

    if (!hasWindow) return { rows, fetchCapReached };

    // Una cita sin slot no tiene instante contra el que comparar: queda fuera
    // de una consulta por ventana en vez de colarse con fecha desconocida.
    const inWindow = rows
      .filter(({ slot }) => {
        if (!slot) return false;
        if (filters.from && slot.startAt < filters.from) return false;
        if (filters.to && slot.startAt >= filters.to) return false;
        return true;
      })
      .sort((a, b) => a.slot!.startAt.getTime() - b.slot!.startAt.getTime());

    return { rows: inWindow, fetchCapReached };
  }

  /**
   * La agenda de una organización: las citas de sus recursos en una ventana.
   *
   * ## El filtro de tenant va acá, no en el servicio
   *
   * `tenantId` entra en el `where` de la consulta y no se comprueba después
   * sobre las filas devueltas. Es la lección del #156 —la cola de moderación se
   * armaba sin filtro y un moderador veía las denuncias de todas las clínicas—
   * y es también lo que exige el guardrail que hoy es gate duro del CI.
   *
   * La diferencia no es de estilo. Filtrar después significa que la base ya
   * leyó las filas ajenas y que **cualquier camino que se saltee ese paso las
   * expone**: un `map` antes del filtro, un log que imprima el resultado
   * crudo, un `catch` que devuelva lo que había. Filtrando en la consulta esas
   * filas nunca existieron.
   *
   * ## Por qué recibe los recursos ya resueltos
   *
   * El filtro por profesional se traduce a «los recursos de este profesional en
   * esta organización», y esa resolución es del servicio. Acá llegan ids que ya
   * fueron acotados al tenant, así que la consulta es doblemente estrecha: por
   * `tenant_id` y por recurso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filters - Organización, ventana y recursos a los que acotar.
   * @param limit - Tope de filas.
   * @returns Las citas con su cupo, en orden cronológico.
   */
  async findTenantAgenda(
    em: EntityManager,
    filters: {
      /** La organización dueña de la agenda. Obligatoria: es el perímetro. */
      tenantId: string;
      /** Inicio de la ventana. */
      from: Date;
      /** Fin de la ventana. */
      to: Date;
      /** Recursos a los que acotar; vacío = todos los de la organización. */
      resourceIds?: readonly string[];
      /** Estados a incluir. */
      statusConceptIds?: readonly string[];
    },
    limit: number,
  ): Promise<{ booking: AppointmentBookings; slot: BookableSlots | null }[]> {
    // Un filtro por recursos vacío no es «todos»: es «ninguno». Pasa cuando se
    // pide la agenda de un profesional que no tiene recursos en esta
    // organización, y devolver todo sería exactamente la fuga que este método
    // existe para evitar.
    if (filters.resourceIds?.length === 0) return [];

    const where: Record<string, unknown> = {
      tenantId: filters.tenantId,
    };
    if (filters.resourceIds && filters.resourceIds.length > 0) {
      where.resourceId = { $in: [...filters.resourceIds] };
    }
    if (filters.statusConceptIds && filters.statusConceptIds.length > 0) {
      where.statusConceptId = { $in: [...filters.statusConceptIds] };
    }

    // Se traen más de `limit` porque el instante vive en el cupo y no en la
    // cita: no se sabe cuántas caen en la ventana hasta resolverlos. El mismo
    // criterio que `findBookings`, con el mismo motivo.
    const bookings = await em.find(AppointmentBookings, where, {
      orderBy: { createdAt: 'DESC' },
      limit: Math.max(limit * 20, 500),
    });

    const slotIds = bookings
      .map((booking) => booking.bookableSlotId)
      .filter((id): id is string => Boolean(id));
    const slots =
      slotIds.length > 0
        ? await em.find(BookableSlots, { id: { $in: slotIds } })
        : [];
    const slotById = new Map(slots.map((slot) => [slot.id, slot]));

    return (
      bookings
        .map((booking) => ({
          booking,
          slot: booking.bookableSlotId
            ? (slotById.get(booking.bookableSlotId) ?? null)
            : null,
        }))
        // Sin cupo no hay instante contra el que comparar: queda fuera en vez de
        // colarse con fecha desconocida.
        .filter(
          (
            fila,
          ): fila is { booking: AppointmentBookings; slot: BookableSlots } =>
            fila.slot !== null &&
            fila.slot.startAt >= filters.from &&
            fila.slot.startAt < filters.to,
        )
        .sort((a, b) => a.slot.startAt.getTime() - b.slot.startAt.getTime())
        .slice(0, limit)
    );
  }

  /** Citas vigentes del paciente: la política limita cuántas puede tener a la vez. */
  countActiveBookingsForPatient(
    em: EntityManager,
    patientProfileId: string,
    activeStatuses: string[],
  ): Promise<number> {
    return em.count(AppointmentBookings, {
      patientProfileId,
      statusConceptId: { $in: activeStatuses },
    });
  }

  /**
   * Ejecuta la operación record reschedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record reschedule conforme al contrato `BookingReschedules`.
   */
  recordReschedule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a booking.
       */
      bookingId: string;
      /**
       * Identificador asociado a from slot.
       */
      fromSlotId: string;
      /**
       * Identificador asociado a to slot.
       */
      toSlotId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId?: string;
      /**
       * Identificador asociado a rescheduled by user.
       */
      rescheduledByUserId?: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
    },
  ): BookingReschedules {
    return em.create(
      BookingReschedules,
      {
        bookingId: data.bookingId,
        fromSlotId: data.fromSlotId,
        toSlotId: data.toSlotId,
        reasonConceptId: data.reasonConceptId,
        rescheduledByUserId: data.rescheduledByUserId,
        occurredAt: data.occurredAt,
        recordedAt: new Date(),
        recordedByUserId: data.rescheduledByUserId,
      },
      { partial: true },
    );
  }

  /**
   * La última reprogramación de cada cita, con el instante del que se movió.
   *
   * Devuelve el **instante original**, no el id del cupo: la tarjeta dice
   * «reprogramada desde el 20/08 a las 15:30», y resolver ese cupo desde el
   * front obligaría a una petición por cita para pintar una línea de texto.
   *
   * Sólo la última: una cita movida tres veces le interesa a la auditoría, no
   * a quien mira su turno — ahí la pregunta es «¿esto cambió?», y la respuesta
   * útil es de dónde viene ahora.
   *
   * @param em - Contexto de persistencia.
   * @param bookingIds - Citas de la página.
   * @returns Cita → instante del que se movió.
   */
  /**
   * Los nombres de varios pacientes, en una consulta.
   *
   * En lote y con SQL directo: el nombre vive en la **persona** y no en el
   * perfil —la misma persona puede ser paciente y profesional, y duplicarlo
   * sería tener dos verdades—, y resolverlo por cita sería una consulta por
   * fila para pintar una lista.
   *
   * `patient_profiles.profile_id` apunta **directo a `persons.id`**, sin tabla
   * puente: verificado contra la base, porque la cadena que parecía natural
   * —pasar por `person_profiles`— devuelve cero filas.
   *
   * **Este método no decide quién puede ver un nombre**, sólo lo busca. La
   * regla vive en la proyección, junto a la del motivo de consulta.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileIds - Perfiles cuyos nombres se buscan.
   * @returns Los nombres hallados, por perfil; los que no tienen no aparecen.
   */
  /**
   * Las citas del paciente que **pisan** una franja, con su horario.
   *
   * Cruza por solape y no por igualdad: dos turnos de médicos distintos no
   * empiezan a la misma hora, se montan. Tocarse en el extremo no cuenta
   * —salir de uno a las 10:00 y entrar al otro a las 10:00 es apretado pero
   * posible—, mismo criterio que la validación de agendas del profesional.
   *
   * Va con SQL directo porque el horario vive en el cupo y no en la cita: son
   * dos tablas, y resolverlo con el ORM traería todas las citas del paciente
   * para filtrarlas en memoria.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyas citas se miran.
   * @param desde - Inicio de la franja que se quiere ocupar.
   * @param hasta - Fin de la franja.
   * @param estados - Estados que cuentan como choque.
   * @param excepto - Cita que no se compara consigo misma, si aplica.
   * @returns Las citas que se cruzan, de la más próxima a la más lejana.
   */
  async findPatientBookingsOverlapping(
    em: EntityManager,
    patientProfileId: string,
    desde: Date,
    hasta: Date,
    estados: readonly string[],
    excepto?: string,
  ): Promise<
    {
      id: string;
      startAt: Date;
      endAt: Date;
      statusConceptId: string;
      resourceName: string | null;
    }[]
  > {
    if (estados.length === 0) return [];

    return em.getConnection().execute(
      `SELECT b.id,
              s.start_at        AS "startAt",
              s.end_at          AS "endAt",
              b.status_concept_id AS "statusConceptId",
              r.name            AS "resourceName"
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
    LEFT JOIN scheduling.schedulable_resources r ON r.id = b.resource_id
        WHERE b.patient_profile_id = ?
          AND b.status_concept_id IN (?)
          AND s.start_at < ?
          AND s.end_at   > ?
          AND (? IS NULL OR b.id <> ?)
        ORDER BY s.start_at ASC`,
      [
        patientProfileId,
        [...estados],
        hasta,
        desde,
        excepto ?? null,
        excepto ?? null,
      ],
    );
  }

  /**
   * Los compromisos del PROFESIONAL que pisan una franja, cruzando TODAS sus
   * agendas.
   *
   * Es la consulta de la regla madre (AG-1): el médico es el recurso escaso, no
   * la sede. Un doctor con consultorio propio y hospital tiene DOS recursos, y
   * hasta esta consulta nada miraba los dos juntos: se comprobó reservándole a
   * dos pacientes 14:00–14:30 y 14:15–14:45 en sus dos agendas — ambas quedaron
   * confirmadas, y el médico citado en dos lugares a la vez.
   *
   * Se busca por `resource_ref_id` —el vínculo del recurso con el perfil— y no
   * por tenant, con el mismo argumento que la validación de plantillas: el que
   * no puede estar en dos lugares es él, publique donde publique.
   *
   * Tocarse en el borde no cuenta (`<` y `>` estrictos): terminar 10:30 acá y
   * empezar 10:30 allá es apretado pero posible — mismo criterio que la
   * validación del paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional cuyos compromisos se miran.
   * @param desde - Inicio de la franja que se quiere ocupar.
   * @param hasta - Fin de la franja.
   * @param estados - Estados que cuentan como compromiso.
   * @param excepto - Reserva que no se compara consigo misma, si aplica.
   * @returns Los compromisos que se cruzan, del más próximo al más lejano.
   */
  async findProfessionalCommitmentsOverlapping(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    estados: readonly string[],
    excepto?: string,
  ): Promise<
    {
      id: string;
      startAt: Date;
      endAt: Date;
      statusConceptId: string;
      resourceName: string | null;
      timeZone: string | null;
      patientProfileId: string;
    }[]
  > {
    if (estados.length === 0) return [];

    const filas: {
      id: string;
      startAt: Date | string;
      endAt: Date | string;
      statusConceptId: string;
      resourceName: string | null;
      timeZone: string | null;
      patientProfileId: string;
    }[] = await em.getConnection().execute(
      `SELECT b.id,
              s.start_at          AS "startAt",
              s.end_at            AS "endAt",
              b.status_concept_id AS "statusConceptId",
              r.name              AS "resourceName",
              r.time_zone         AS "timeZone",
              b.patient_profile_id AS "patientProfileId"
         FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
         JOIN scheduling.schedulable_resources r ON r.id = b.resource_id
        WHERE r.resource_ref_id = ?
          AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
          AND b.status_concept_id IN (?)
          AND s.start_at < ?
          AND s.end_at   > ?
          AND (? IS NULL OR b.id <> ?)
        ORDER BY s.start_at ASC`,
      [
        practitionerProfileId,
        [...estados],
        hasta,
        desde,
        excepto ?? null,
        excepto ?? null,
      ],
    );

    // El driver devuelve los timestamptz del SQL crudo como texto, no como
    // `Date`; quien formatee la hora con eso revienta con «Invalid time value».
    // Se normaliza acá, que es la frontera con la base — apareció ejecutando el
    // experimento de la regla madre, no leyendo.
    return filas.map((fila) => ({
      ...fila,
      startAt: new Date(fila.startAt),
      endAt: new Date(fila.endAt),
    }));
  }

  /**
   * Las reservas vivas de un profesional CON un paciente concreto, en una ventana.
   *
   * La usa el permiso de lectura de la historia clínica (v4.2.2): quien atiende abre
   * el resumen de alguien sólo si hoy lo tiene citado. Devuelve la zona horaria del
   * recurso junto a cada fila porque «hoy» es el día de la SEDE, no el del servidor:
   * un turno de las 23:30 en La Paz ya es «mañana» en UTC, y decidir con la fecha del
   * servidor le cerraría la historia al profesional que lo está atendiendo.
   *
   * Mira `appointment_bookings` y no `clinical.appointments` a propósito: la cita
   * clínica NO refleja las cancelaciones —`APPT_CANCELLED` no se escribe en ningún
   * lado— así que un turno cancelado seguiría abriendo la historia todo el día.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional que quiere leer.
   * @param patientProfileId - El paciente cuya historia se pide.
   * @param desde - Inicio de la ventana a mirar.
   * @param hasta - Fin de la ventana.
   * @param estados - Estados de reserva que cuentan como turno vivo.
   * @returns Las reservas del par, con la zona de su sede, de la más próxima en adelante.
   */
  /**
   * ¿Hay una consulta **ya iniciada** entre ese profesional y ese paciente?
   *
   * Sin ventana de fechas, y ésa es toda la diferencia con
   * {@link findConfirmadasConPacienteEntre}. Una consulta en curso no se
   * pregunta por el calendario: el estado dice que **está pasando ahora**, y el
   * cupo sólo dice cuándo se pensaba que iba a pasar.
   *
   * Existe porque las dos reglas del producto se contradecían. La agenda deja
   * empezar una cita confirmada **cuando el profesional decide, no cuando el
   * reloj lo permite** (corrección #15, instrucción del propietario), y el
   * expediente exigía que el cupo fuera de hoy. Resultado medido en un
   * recorrido real: el profesional inicia la consulta y no puede abrir la
   * historia de la persona que tiene enfrente.
   *
   * @param practitionerProfileId - El profesional que pide.
   * @param patientProfileId - El paciente cuya historia se pide.
   * @returns `true` si hay al menos una consulta en curso entre los dos.
   */
  async tieneConsultaEnCurso(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
    estadoEnCurso: string,
  ): Promise<boolean> {
    const filas: { existe: number }[] = await em.getConnection().execute(
      `SELECT 1 AS "existe"
         FROM scheduling.appointment_bookings b
         JOIN scheduling.schedulable_resources r ON r.id = b.resource_id
        WHERE r.resource_ref_id = ?
          AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
          AND b.patient_profile_id = ?
          AND b.status_concept_id = ?
        LIMIT 1`,
      [practitionerProfileId, patientProfileId, estadoEnCurso],
    );
    return filas.length > 0;
  }

  async findConfirmadasConPacienteEntre(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
    desde: Date,
    hasta: Date,
    estados: readonly string[],
  ): Promise<{ startAt: Date; timeZone: string | null }[]> {
    if (estados.length === 0) return [];

    const filas: { startAt: Date | string; timeZone: string | null }[] =
      await em.getConnection().execute(
        `SELECT s.start_at AS "startAt",
                r.time_zone AS "timeZone"
           FROM scheduling.appointment_bookings b
           JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
           JOIN scheduling.schedulable_resources r ON r.id = b.resource_id
          WHERE r.resource_ref_id = ?
            AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
            AND b.patient_profile_id = ?
            AND b.status_concept_id IN (?)
            AND s.start_at >= ?
            AND s.start_at <  ?
          ORDER BY s.start_at ASC`,
        [practitionerProfileId, patientProfileId, [...estados], desde, hasta],
      );

    // Mismo cuidado que arriba: el driver devuelve los timestamptz como texto.
    return filas.map((fila) => ({
      ...fila,
      startAt: new Date(fila.startAt),
    }));
  }

  /**
   * El tiempo ocupado del profesional que pisa una franja, cruzando sus sedes.
   *
   * Son las excepciones de NO disponibilidad con rango horario — la reunión de
   * 13:15, la guardia del martes— de cualquiera de sus recursos (AG-3). El
   * paciente nunca las ve; para la regla madre cuentan igual que una cita:
   * nada se reserva ni se genera encima.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional.
   * @param desde - Inicio de la franja.
   * @param hasta - Fin de la franja.
   * @param excepto - Excepción que no se compara consigo misma, si aplica.
   * @returns Los ratos ocupados que se cruzan, del más próximo al más lejano.
   */
  async findProfessionalBusyExceptionsOverlapping(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    excepto?: string,
  ): Promise<
    {
      id: string;
      startAt: Date;
      endAt: Date;
      reason: string | null;
      resourceName: string | null;
      timeZone: string | null;
    }[]
  > {
    const filas: {
      id: string;
      startAt: Date | string;
      endAt: Date | string;
      reason: string | null;
      resourceName: string | null;
      timeZone: string | null;
    }[] = await em.getConnection().execute(
      `SELECT e.id,
              e.start_at  AS "startAt",
              e.end_at    AS "endAt",
              e.reason    AS "reason",
              r.name      AS "resourceName",
              r.time_zone AS "timeZone"
         FROM scheduling.availability_exceptions e
         JOIN scheduling.schedulable_resources r ON r.id = e.resource_id
        WHERE r.resource_ref_id = ?
          AND r.resource_ref_type IN ('practitioner_profiles', 'health_practitioner_profiles')
          AND e.is_available = false
          AND e.start_at < ?
          AND e.end_at   > ?
          AND (? IS NULL OR e.id <> ?)
        ORDER BY e.start_at ASC`,
      [practitionerProfileId, hasta, desde, excepto ?? null, excepto ?? null],
    );

    // Misma frontera que los compromisos: el SQL crudo trae timestamptz como
    // texto y quien formatee la hora con eso revienta.
    return filas.map((fila) => ({
      ...fila,
      startAt: new Date(fila.startAt),
      endAt: new Date(fila.endAt),
    }));
  }

  async findPatientNames(
    em: EntityManager,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, string>> {
    const nombres = new Map<string, string>();
    if (patientProfileIds.length === 0) return nombres;

    // Pasamos el contexto de transacción: el turno de mostrador crea al paciente
    // y la cita en la misma transacción, así que esta consulta debe ver esas filas.
    const filas = await em
      .getConnection()
      .execute<{ profileId: string; displayName: string }[]>(
        `SELECT pp.profile_id AS "profileId", pe.display_name AS "displayName"
           FROM profiles.patient_profiles pp
           JOIN profiles.persons pe ON pe.id = pp.profile_id
          WHERE pp.profile_id IN (?)
            AND pe.display_name IS NOT NULL`,
        [[...patientProfileIds]],
        'all',
        em.getTransactionContext(),
      );

    for (const fila of filas) {
      nombres.set(fila.profileId, fila.displayName);
    }
    return nombres;
  }

  async latestRescheduleOrigins(
    em: EntityManager,
    bookingIds: readonly string[],
  ): Promise<Map<string, Date>> {
    if (bookingIds.length === 0) return new Map();

    const filas = await em.find(
      BookingReschedules,
      { bookingId: { $in: [...bookingIds] } },
      { orderBy: { recordedAt: 'DESC' } },
    );
    if (filas.length === 0) return new Map();

    // La primera de cada cita es la más reciente: vienen ordenadas.
    const ultimaPorCita = new Map<string, BookingReschedules>();
    for (const fila of filas) {
      if (!ultimaPorCita.has(fila.bookingId)) {
        ultimaPorCita.set(fila.bookingId, fila);
      }
    }

    const cupos = await em.find(BookableSlots, {
      id: {
        $in: [...new Set([...ultimaPorCita.values()].map((f) => f.fromSlotId))],
      },
    });
    const inicioPorCupo = new Map(cupos.map((cupo) => [cupo.id, cupo.startAt]));

    const salida = new Map<string, Date>();
    for (const [bookingId, fila] of ultimaPorCita) {
      const inicio = inicioPorCupo.get(fila.fromSlotId);
      // Sin el cupo original no se afirma nada: mejor no decir «reprogramada»
      // que decirlo sin poder decir desde cuándo.
      if (inicio) salida.set(bookingId, inicio);
    }
    return salida;
  }

  /**
   * Crea create cancellation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cancellation conforme al contrato `BookingCancellations`.
   */
  createCancellation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a booking.
       */
      bookingId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId: string;
      /**
       * Identificador asociado a cancelled by user.
       */
      cancelledByUserId?: string;
      /**
       * Valor de is no show mantenido por la instancia.
       */
      isNoShow: boolean;
      /**
       * Valor de fee amount mantenido por la instancia.
       */
      feeAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de cancelled at mantenido por la instancia.
       */
      cancelledAt: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): BookingCancellations {
    return em.create(
      BookingCancellations,
      {
        bookingId: data.bookingId,
        reasonConceptId: data.reasonConceptId,
        cancelledByUserId: data.cancelledByUserId,
        isNoShow: data.isNoShow,
        feeAmount: data.feeAmount,
        currencyConceptId: data.currencyConceptId,
        cancelledAt: data.cancelledAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create waitlist entry.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create waitlist entry conforme al contrato `WaitlistEntries`.
   */
  createWaitlistEntry(
    em: EntityManager,
    data: CreateWaitlistData,
  ): WaitlistEntries {
    return em.create(
      WaitlistEntries,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        resourceId: data.resourceId,
        serviceConceptId: data.serviceConceptId,
        desiredFrom: data.desiredFrom,
        desiredTo: data.desiredTo,
        priority: data.priority,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Candidatos de la lista de espera para un slot liberado, por prioridad y
   * antigüedad: a igual prioridad, primero quien esperaba hace más tiempo.
   */
  /**
   * Candidatos activos de un recurso cuya ventana deseada contiene el turno.
   *
   * `desired_from` y `desired_to` son `timestamptz` —no fechas sueltas—, así
   * que comparar contra el `start_at` del cupo es exacto y no hay que decidir
   * en qué zona empieza el día.
   *
   * **Una ventana sin declarar no excluye.** Los dos extremos son `nullable`, y
   * un nulo significa «por ese lado no puse límite»: anotarse sin decir cuándo
   * es decir «cualquier turno me sirve». Filtrar con un `$lte` a secas dejaría
   * fuera justo a quien no puso condiciones, que es el caso más frecuente.
   */
  findWaitlistCandidates(
    em: EntityManager,
    resourceId: string,
    activeStatusConceptId: string,
    slotStartAt: Date,
    limit: number,
  ): Promise<WaitlistEntries[]> {
    return em.find(
      WaitlistEntries,
      {
        resourceId,
        statusConceptId: activeStatusConceptId,
        $and: [
          {
            $or: [
              { desiredFrom: null },
              { desiredFrom: { $lte: slotStartAt } },
            ],
          },
          { $or: [{ desiredTo: null }, { desiredTo: { $gte: slotStartAt } }] },
        ],
      },
      { orderBy: { priority: 'DESC', createdAt: 'ASC' }, limit },
    );
  }

  /**
   * Crea create reminder.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reminder conforme al contrato `AppointmentReminders`.
   */
  createReminder(
    em: EntityManager,
    data: CreateReminderData,
  ): AppointmentReminders {
    return em.create(
      AppointmentReminders,
      {
        bookingId: data.bookingId,
        channelConceptId: data.channelConceptId,
        offsetMinutes: data.offsetMinutes,
        scheduledAt: data.scheduledAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Recordatorios cuya hora ya llegó y siguen pendientes de envío. */
  findDueReminders(
    em: EntityManager,
    scheduledStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<AppointmentReminders[]> {
    return em.find(
      AppointmentReminders,
      { statusConceptId: scheduledStatusConceptId, scheduledAt: { $lte: now } },
      { limit },
    );
  }

  /**
   * Descubrimiento para el worker de UC-41-12: `promoteWaitlist` recibe un
   * `slotId` puntual y su resultado no trae ids, así que no hay forma de saber
   * qué slot promover sin esta consulta. Un slot es candidato cuando le queda
   * cupo libre y su recurso tiene al menos una entrada activa en la lista de
   * espera; se resuelve en dos pasos con `em.find` (sin SQL crudo) porque
   * `WaitlistEntries` no referencia el slot, sólo el recurso.
   */
  async findSlotsWithWaitlistCandidates(
    em: EntityManager,
    activeWaitlistStatusConceptId: string,
    limit: number,
    now: Date,
  ): Promise<string[]> {
    const entries = await em.find(
      WaitlistEntries,
      {
        statusConceptId: activeWaitlistStatusConceptId,
        resourceId: { $ne: null },
      },
      { limit: limit * 20 },
    );
    const resourceIds = [
      ...new Set(
        entries
          .map((entry) => entry.resourceId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (resourceIds.length === 0) return [];

    const slots = await em.find(
      BookableSlots,
      {
        resourceId: { $in: resourceIds },
        remainingCapacity: { $gt: 0 },
        startAt: { $gt: now },
      },
      { orderBy: { startAt: 'ASC' }, limit },
    );
    return slots.map((slot) => slot.id);
  }
}
