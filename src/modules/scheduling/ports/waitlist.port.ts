import type { ReadContext, WriteContext } from '../../../persistence';

/**
 * Puertos de la lista de espera y los recordatorios de cita (UC-41-11 … 14).
 *
 * Son puertos **específicos del dominio**, no un repositorio genérico: sus
 * nombres dicen qué se quiere del negocio -«candidatos activos de un recurso»-
 * y no cómo se obtiene -«find con where y orderBy»-. Es lo que pide el §7, y la
 * razón práctica es que un puerto genérico obliga al criterio a viajar como un
 * objeto opaco que acaba siendo el `where` del ORM con otro nombre.
 *
 * Ningún tipo de este archivo procede de MikroORM. Los puertos devuelven
 * modelos de lectura propios (§34/§35), de forma que el servicio no manipula
 * entidades gestionadas y no puede provocar una escritura por asignar un campo.
 */

/** Cupo de un slot, lo único que la promoción necesita saber de él. */
export interface SlotCapacitySnapshot {
  readonly id: string;
  readonly resourceId: string;
  /** Plazas libres restantes. */
  readonly remainingCapacity: number;
}

/** Candidato de la lista de espera. */
export interface WaitlistCandidateSnapshot {
  readonly id: string;
  readonly priority: number;
}

/**
 * Una entrada de la lista de espera vista desde fuera (P8).
 *
 * Trae `resourceLabel` resuelto —el nombre del profesional o del recurso— y no
 * sólo su id: quien está esperando un turno necesita saber en qué agenda
 * espera, y un uuid no se lo dice. Resolverlo es trabajo del adaptador, que es
 * quien puede leer las tablas de perfiles.
 */
export interface WaitlistEntryView {
  readonly id: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly resourceLabel: string;
  readonly desiredFrom?: Date;
  readonly desiredTo?: Date;
  readonly priority: number;
  readonly statusConceptId: string;
  readonly createdAt: Date;
}

/** Cita y hora de inicio de su slot, para calcular los recordatorios. */
export interface BookingScheduleSnapshot {
  readonly bookingId: string;
  /** Inicio del slot reservado. */
  readonly slotStartAt: Date;
}

/** Recordatorio vencido pendiente de despacho. */
export interface DueReminderSnapshot {
  readonly id: string;
}

/** Datos de alta en la lista de espera. */
export interface EnrollWaitlistInput {
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly desiredFrom?: Date;
  readonly desiredTo?: Date;
  readonly priority: number;
  readonly statusConceptId: string;
  readonly actorUserId?: string;
}

/** Recordatorios a programar para una cita. */
export interface ScheduleRemindersInput {
  readonly bookingId: string;
  readonly channelConceptId: string;
  readonly offsetsMinutes: readonly number[];
  readonly slotStartAt: Date;
  readonly statusConceptId: string;
  readonly actorUserId?: string;
}

/**
 * Lecturas de la lista de espera.
 *
 * Su única operación se resuelve por la ruta de lectura: es un descubrimiento
 * de trabajo para un worker, tolera un retraso de réplica de segundos y no
 * decide nada que dependa de ver la última escritura.
 */
export interface WaitlistReadPort {
  /**
   * Slots con cupo libre cuyo recurso tiene candidatos activos esperando.
   *
   * @param statusConceptId estado que marca a un candidato como activo.
   * @param limit número máximo de slots a devolver.
   * @param now instante de corte: solo interesan los slots futuros.
   */
  findSlotsWithActiveCandidates(
    statusConceptId: string,
    limit: number,
    now: Date,
    context?: ReadContext,
  ): Promise<string[]>;

  /**
   * La lista de espera de un paciente (P8).
   *
   * El módulo no tenía **ninguna** lectura de la lista de espera: se podía
   * anotar a alguien y no había forma de decirle que estaba anotado. Sin esto,
   * el estado «en espera» de la pantalla de turnos sería una suposición del
   * cliente sobre un POST que ya devolvió.
   *
   * @param patientProfileId - Paciente titular.
   * @param statusConceptIds - Estados a incluir; `undefined` los trae todos.
   * @param limit - Tope de filas.
   */
  findEntriesForPatient(
    patientProfileId: string,
    statusConceptIds: readonly string[] | undefined,
    limit: number,
    context?: ReadContext,
  ): Promise<readonly WaitlistEntryView[]>;
}

/**
 * Escrituras de la lista de espera y los recordatorios.
 *
 * Todas reciben un `WriteContext` con la transacción activa. No la abren ellas:
 * la abre el caso de uso, que es quien sabe qué operaciones deben confirmarse
 * juntas.
 */
export interface WaitlistWritePort {
  /** Da de alta a un paciente en la lista de espera. */
  enroll(
    input: EnrollWaitlistInput,
    context: WriteContext,
  ): Promise<{ id: string }>;

  /** Cupo del slot, leído dentro de la transacción de escritura. */
  findSlotCapacity(
    slotId: string,
    context: WriteContext,
  ): Promise<SlotCapacitySnapshot | null>;

  /** Candidatos activos de un recurso, por prioridad y antigüedad. */
  findActiveCandidates(
    resourceId: string,
    statusConceptId: string,
    limit: number,
    context: WriteContext,
  ): Promise<WaitlistCandidateSnapshot[]>;

  /**
   * Marca candidatos como cubiertos.
   *
   * Recibe identificadores y no entidades: si el puerto devolviera entidades
   * gestionadas para que el servicio les asignara el estado, la escritura
   * ocurriría por un efecto secundario del `flush` y no por una llamada
   * explícita, que es exactamente lo que esta migración quiere quitar de en
   * medio.
   *
   * @returns cuántos candidatos se marcaron.
   */
  markCandidatesFulfilled(
    ids: readonly string[],
    statusConceptId: string,
    context: WriteContext,
  ): Promise<number>;

  /**
   * Cita y hora de su slot, con la cita bloqueada para actualización.
   *
   * El bloqueo pesimista es lo que impide que dos peticiones programen
   * recordatorios duplicados sobre la misma cita.
   */
  findBookingScheduleForUpdate(
    bookingId: string,
    context: WriteContext,
  ): Promise<BookingScheduleSnapshot | null>;

  /** Programa recordatorios. @returns cuántos se crearon. */
  scheduleReminders(
    input: ScheduleRemindersInput,
    context: WriteContext,
  ): Promise<number>;

  /** Recordatorios cuya hora ya llegó y siguen pendientes. */
  findDueReminders(
    statusConceptId: string,
    now: Date,
    limit: number,
    context: WriteContext,
  ): Promise<DueReminderSnapshot[]>;

  /** Marca recordatorios como enviados. @returns cuántos se marcaron. */
  markRemindersSent(
    ids: readonly string[],
    statusConceptId: string,
    sentAt: Date,
    context: WriteContext,
  ): Promise<number>;
}

/** Token de inyección del puerto de lectura. */
export const WAITLIST_READ_PORT = Symbol('WAITLIST_READ_PORT');

/** Token de inyección del puerto de escritura. */
export const WAITLIST_WRITE_PORT = Symbol('WAITLIST_WRITE_PORT');
