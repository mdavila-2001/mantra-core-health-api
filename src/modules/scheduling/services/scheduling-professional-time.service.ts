import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { SchedulingBookingsRepository } from '../repositories';

/**
 * Estados en los que una cita compromete el tiempo del profesional.
 *
 * Confirmada o con el paciente ya adentro: es la misma lista que «sigue ocupando
 * cupo» en las reservas. Lo pendiente NO compromete —es una pregunta sin
 * responder, y la política de #186 la desplaza, no la protege—.
 */
const ESTADOS_QUE_COMPROMETEN: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
];

/** Un rato ya comprometido del profesional, con lo que hay que contar de él. */
export interface CompromisoDelProfesional {
  readonly id: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly resourceName: string | null;
  readonly timeZone: string | null;
  readonly patientProfileId: string;
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
    return this.bookingsRepo.findProfessionalCommitmentsOverlapping(
      em,
      practitionerProfileId,
      desde,
      hasta,
      ESTADOS_QUE_COMPROMETEN,
      excepto,
    );
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
    const ocupado = await this.compromisos(
      em,
      practitionerProfileId,
      desde,
      hasta,
      excepto,
    );
    if (ocupado.length === 0) return;

    const primero = ocupado[0];
    const nombres = await this.bookingsRepo.findPatientNames(em, [
      primero.patientProfileId,
    ]);
    const paciente = nombres.get(primero.patientProfileId);

    throw new PreconditionFailedException(
      `El profesional ya tiene ${
        paciente ? `a ${paciente}` : 'una cita'
      } de ${horaLocal(primero.startAt, primero.timeZone)} a ${horaLocal(
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
