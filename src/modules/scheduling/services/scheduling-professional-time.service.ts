import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { SchedulingBookingsRepository } from '../repositories';
import { SCHED } from '../scheduling.concepts';

/**
 * Estados en los que una cita compromete el tiempo del profesional.
 *
 * Confirmada, con el paciente ya adentro, o en curso: la consulta en curso
 * también compromete —el médico la está atendiendo—. Lo pendiente NO
 * compromete —es una pregunta sin responder, y la política de #186 la
 * desplaza, no la protege—.
 */
const ESTADOS_QUE_COMPROMETEN: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
];

/** Un rato ya comprometido del profesional, con lo que hay que contar de él. */
export interface CompromisoDelProfesional {
  readonly id: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly resourceName: string | null;
  readonly timeZone: string | null;
  /**
   * Qué clase de compromiso es: una cita con paciente, o tiempo ocupado del
   * doctor (reunión, guardia — AG-3). Decide cómo se cuenta en el mensaje.
   */
  readonly kind: 'cita' | 'ocupado';
  /** El paciente, cuando es una cita. */
  readonly patientProfileId: string | null;
  /** El rótulo del tiempo ocupado, cuando lo es. */
  readonly reason: string | null;
}

/**
 * La regla madre de la agenda: el médico no puede estar en dos lugares a la vez.
 *
 * ## Por qué existe como servicio propio
 *
 * El sistema modela un recurso por (médico + sede): un doctor con consultorio
 * propio y hospital tiene DOS agendas. Cada validación miraba la suya — la de
 * plantillas cruza sedes al publicar, la de reservas miraba al PACIENTE — y
 * nadie miraba el tiempo concreto del profesional entre sedes. Se comprobó
 * ejecutando: dos pacientes reservaron 14:00–14:30 y 14:15–14:45 con el mismo
 * médico en dos agendas, y ambas quedaron confirmadas.
 *
 * Tres caras consumen la MISMA verificación: confirmar/aceptar una reserva,
 * la cita puntual del doctor (AG-2), y la generación de cupos (que saltea en
 * vez de rechazar). Por eso es un servicio y no un `if` en cada lado.
 *
 * ## Punto de extensión declarado
 *
 * El «tiempo ocupado» de AG-3 (reuniones, guardias — excepciones con rango
 * horario) entra acá cuando exista: {@link compromisos} es el único lugar que
 * habrá que tocar.
 */
@Injectable()
export class SchedulingProfessionalTimeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param bookingsRepo - Consultas de reservas y compromisos.
   */
  constructor(private readonly bookingsRepo: SchedulingBookingsRepository) {}

  /**
   * Serializa las decisiones que comprometen el calendario de un profesional.
   *
   * Debe llamarse desde una transacción activa antes de leer si un rango está
   * libre. El lock advisory pertenece a PostgreSQL, se comparte entre instancias
   * del servicio y se libera al confirmar o revertir la transacción; así dos
   * solicitudes concurrentes no pueden validar ambas contra la misma lectura
   * vacía. La llave es global al profesional, no a una sede, porque puede
   * atender en varias.
   *
   * @param em - Contexto transaccional activo.
   * @param practitionerProfileId - Profesional cuyo calendario se bloqueará.
   */
  async bloquearAgendaDeProfesional(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<void> {
    // `EntityManager.execute` propaga el contexto transaccional activo al
    // driver. Llamar `getConnection().execute()` usaría el pool directamente y
    // liberaría el advisory lock al terminar esa sentencia.
    await em.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `scheduling.professional.calendar:${practitionerProfileId}`,
    ]);
  }

  /**
   * Los compromisos del profesional que pisan un rango, cruzando sus sedes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional.
   * @param desde - Inicio del rango.
   * @param hasta - Fin del rango.
   * @param excepto - Reserva que no se compara consigo misma (reprogramación).
   * @returns Los compromisos que se cruzan, del más próximo al más lejano.
   */
  async compromisos(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    excepto?: string,
  ): Promise<CompromisoDelProfesional[]> {
    const [citas, ocupados] = await Promise.all([
      this.citasConfirmadas(em, practitionerProfileId, desde, hasta, excepto),
      this.tiempoOcupado(em, practitionerProfileId, desde, hasta),
    ]);
    return [...citas, ...ocupados].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );
  }

  /**
   * Sólo las citas confirmadas, sin el tiempo ocupado.
   *
   * Lo usa la creación del tiempo ocupado (AG-3): una reunión que pisa OTRA
   * reunión es inofensiva —dos rótulos del mismo doctor—, pero una que pisa a
   * un paciente confirmado no se crea en silencio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional.
   * @param desde - Inicio del rango.
   * @param hasta - Fin del rango.
   * @param excepto - Reserva que no se compara consigo misma.
   * @returns Las citas que se cruzan.
   */
  async citasConfirmadas(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    excepto?: string,
  ): Promise<CompromisoDelProfesional[]> {
    const filas =
      await this.bookingsRepo.findProfessionalCommitmentsOverlapping(
        em,
        practitionerProfileId,
        desde,
        hasta,
        ESTADOS_QUE_COMPROMETEN,
        excepto,
      );
    return filas.map((fila) => ({
      id: fila.id,
      startAt: fila.startAt,
      endAt: fila.endAt,
      resourceName: fila.resourceName,
      timeZone: fila.timeZone,
      kind: 'cita' as const,
      patientProfileId: fila.patientProfileId,
      reason: null,
    }));
  }

  /**
   * El tiempo ocupado del profesional: reuniones, guardias, recesos (AG-3).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional.
   * @param desde - Inicio del rango.
   * @param hasta - Fin del rango.
   * @param excepto - Excepción que no se compara consigo misma.
   * @returns Los ratos ocupados que se cruzan.
   */
  async tiempoOcupado(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    excepto?: string,
  ): Promise<CompromisoDelProfesional[]> {
    const filas =
      await this.bookingsRepo.findProfessionalBusyExceptionsOverlapping(
        em,
        practitionerProfileId,
        desde,
        hasta,
        excepto,
      );
    return filas.map((fila) => ({
      id: fila.id,
      startAt: fila.startAt,
      endAt: fila.endAt,
      resourceName: fila.resourceName,
      timeZone: fila.timeZone,
      kind: 'ocupado' as const,
      patientProfileId: null,
      reason: fila.reason,
    }));
  }

  /**
   * Exige que el rango esté libre en TODAS las agendas del profesional.
   *
   * El mensaje dice qué, cuándo y DÓNDE: con multi-sede, el dónde es la mitad
   * de la información — «ya tenés algo a las 10» no le sirve a quien tiene dos
   * consultorios y necesita saber en cuál.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - El profesional.
   * @param desde - Inicio del rango que se quiere ocupar.
   * @param hasta - Fin del rango.
   * @param excepto - Reserva que no se compara consigo misma, si aplica.
   * @throws PreconditionFailedException si hay un compromiso en el medio.
   */
  async assertRangoLibre(
    em: EntityManager,
    practitionerProfileId: string,
    desde: Date,
    hasta: Date,
    excepto?: string,
  ): Promise<void> {
    // El lock y la lectura pertenecen a la misma transacción. Sin él dos
    // aceptaciones simultáneas pueden ver el mismo calendario libre y ambas
    // insertar, incluso cuando cada una hace la validación correcta.
    await this.bloquearAgendaDeProfesional(em, practitionerProfileId);

    const ocupado = await this.compromisos(
      em,
      practitionerProfileId,
      desde,
      hasta,
      excepto,
    );
    if (ocupado.length === 0) return;

    const primero = ocupado[0];
    let quien = 'una cita';
    if (primero.kind === 'ocupado') {
      // El tiempo ocupado se cuenta por su rótulo: «Reunión de equipo» le dice
      // al doctor exactamente contra qué chocó.
      quien = primero.reason ? `«${primero.reason}»` : 'un rato ocupado';
    } else if (primero.patientProfileId) {
      const nombres = await this.bookingsRepo.findPatientNames(em, [
        primero.patientProfileId,
      ]);
      const paciente = nombres.get(primero.patientProfileId);
      if (paciente) quien = `a ${paciente}`;
    }

    throw new PreconditionFailedException(
      `El profesional ya tiene ${quien} de ${horaLocal(
        primero.startAt,
        primero.timeZone,
      )} a ${horaLocal(
        primero.endAt,
        primero.timeZone,
      )}${primero.resourceName ? ` en «${primero.resourceName}»` : ''}. No puede estar en dos lugares a la vez.`,
      {
        bookingId: primero.id,
        startAt: primero.startAt,
        endAt: primero.endAt,
        resourceName: primero.resourceName,
      },
    );
  }
}

/**
 * La hora del compromiso en la zona de SU sede.
 *
 * El instante es UTC en la base; mostrarlo crudo diría «18:00» por una consulta
 * de las 14:00 en La Paz, y el médico buscaría un choque que no ve. Sin zona
 * declarada se cae a UTC, que es lo que el resto del módulo hace.
 *
 * @param instante - El momento, como está guardado.
 * @param timeZone - La zona de la sede, si la declaró.
 * @returns `HH:mm` en la zona de la sede.
 */
function horaLocal(instante: Date, timeZone: string | null): string {
  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timeZone ?? 'UTC',
  }).format(instante);
}
