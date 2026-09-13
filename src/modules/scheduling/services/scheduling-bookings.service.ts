import { randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../repositories';
import { PractitionerAffiliationGateService } from './practitioner-affiliation-gate.service';
import { SchedulingProfessionalTimeService } from './scheduling-professional-time.service';
import { SchedulingWaitlistService } from './scheduling-waitlist.service';
import {
  HistoryRepository,
  type HistoryRevision,
} from '../../audit/repositories';
// Escritura cross-dominio acotada a la confirmación, como la lectura de
// `directory` que hace `iam` al emitir un token: al confirmar una reserva nace
// su cita clínica, porque son la misma cosa vista desde dos módulos. Ver
// `crearCitaClinica`.
import type { Appointments } from '../../clinical/entities';
import {
  AppointmentsRepository,
  EncountersRepository,
} from '../../clinical/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import type {
  AppointmentBookings,
  BookableSlots,
  CancellationPolicySnapshot,
} from '../entities';
// Va en un import de valor y no de tipo: `tx.create()` necesita la clase, no su forma.
import { AppointmentPaymentStates } from '../entities';
import { CoverageRepository } from '../../insurance/repositories/coverage.repository';
import { ClaimReadRepository } from '../../insurance/repositories/claim-read.repository';
import { SCHED } from '../scheduling.concepts';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../ports/agenda-notice.port';
import {
  avisoDeCambioDeCita,
  avisoDeSolicitudAlPaciente,
  avisoDeSolicitudAlProfesional,
  type CambioDeCita,
} from '../notices/agenda-notices';
import { isValidBookingTransition } from '../state/booking-state-machine';
import {
  requireReason,
  type BookingActorKind,
  type BookingTransitionSnapshot,
} from '../state/booking-transition';
import {
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  RequestBookingDto,
  AcceptBookingDto,
  RejectBookingDto,
  SetPaymentStateDto,
  PaymentStateDto,
  type PaymentState,
  RequestBookingInfoDto,
  ProposeScheduleDto,
  ProposeScheduleResponseDto,
  BookingDecisionResponseDto,
  BookingResponseDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  WorkerBatchResultDto,
  BookingInsuranceClaimDto,
  BookingItemDto,
  BookingStatusReasonDto,
  BookingDelayNoticeDto,
  SearchBookingsResponseDto,
  type BookingChannel,
  CreateDirectAppointmentDto,
  DirectAppointmentResponseDto,
  type AppointmentChannel,
} from '../dto';

/**
 * Canal de reserva interno: además de los que el cliente puede elegir
 * (`BookingChannel`), el mostrador atómico usa `WALK_IN`, que no es una opción
 * del DTO público — lo decide el servidor, nunca el cuerpo del alta.
 */
type InternalBookingChannel = BookingChannel | 'WALK_IN';

const CHANNEL_CONCEPT: Readonly<Record<InternalBookingChannel, string>> = {
  PORTAL: CONCEPTS.CHANNEL_PORTAL,
  DESK: CONCEPTS.CHANNEL_DESK,
  PHONE: CONCEPTS.CHANNEL_PHONE,
  WALK_IN: CONCEPTS.CHANNEL_WALK_IN,
};

/**
 * La modalidad de la atención → su concepto de catálogo.
 *
 * Ojo con el vecino de arriba: `CHANNEL_CONCEPT` es cómo se **pidió** el turno
 * y va en la reserva; éste es por qué medio **ocurre** y va en la cita clínica
 * (`clinical.appointments.channel_concept_id`). Dos ejes, dos columnas.
 *
 * `PRESENCIAL` no se omite aunque sea el valor por defecto: cuando alguien lo
 * elige explícitamente, se guarda: «nadie lo dijo» y «dijeron que es
 * presencial» son cosas distintas, y sólo la primera puede cambiar de
 * significado si mañana el default cambia.
 */
const APPOINTMENT_CHANNEL_CONCEPT: Readonly<
  Record<AppointmentChannel, string>
> = {
  PRESENCIAL: CLIN.APPOINTMENT_CHANNEL_IN_PERSON,
  TELECONSULTA: CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
  DOMICILIO: CLIN.APPOINTMENT_CHANNEL_HOME_VISIT,
};

/**
 * El motivo con el que se cancela una solicitud desplazada.
 *
 * Queda en el historial y es lo que el paciente lee: una cita que desaparece
 * sin explicación se siente como un plantón, y acá la explicación existe —otro
 * médico le dijo que sí primero—.
 */
const MOTIVO_DESPLAZADA =
  'Se canceló automáticamente: te confirmaron otro turno a la misma hora.';

/**
 * Estados en los que una solicitud está esperando respuesta.
 *
 * Son las que una aceptación ajena puede desplazar: todavía no las comprometió
 * nadie. Una confirmada NO entra acá a propósito — ver
 * {@link SchedulingBookingsService.cancelarPendientesQueChocan}.
 */
const PENDING_BOOKING_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
];

/** Estados en los que una cita sigue ocupando cupo. */
const ACTIVE_BOOKING_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
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
/** Estados en los que la solicitud todavía espera la respuesta del prestador. */
const PENDING_DECISION_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
];

const VISIBLE_BOOKING_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
  SCHED.BOOKING_COMPLETED,
];

/**
 * Roles que actúan del lado del prestador.
 *
 * Son los mismos que los endpoints de operación de cita declaran en sus
 * `@Roles`, más `SUPERADMIN`, que el `RolesGuard` trata como comodín. Se usan
 * para decidir a quién atribuir un cambio (`actorKind`), no para autorizar: eso
 * ya lo hizo el guard antes de llegar acá.
 */
const ROLES_DEL_PRESTADOR: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPERADMIN',
];

/**
 * Roles que operan **cualquier** agenda, no solo la propia.
 *
 * Es el oficio de quien atiende el mostrador y de quien administra la agenda de
 * la organización: repartir turnos entre todos los consultorios. Un profesional
 * NO está acá a propósito — opera las citas de su recurso, y eso lo comprueba
 * `cargarParaOperar` contra el perfil de su token, no contra su rol.
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió.
 */
const ROLES_DE_AGENDA: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'SUPERADMIN',
];

/**
 * Antelación de los recordatorios que se programan al aceptar (P8).
 *
 * Víspera y dos horas antes: la primera sirve para reorganizar el día, la
 * segunda para salir a tiempo. Son las dos que el registro del cliente nombra.
 */
const DEFAULT_REMINDER_OFFSETS: readonly number[] = [24 * 60, 2 * 60];

const DEFAULT_HOLD_TTL_SECONDS = 300;
const DEFAULT_WORKER_BATCH = 100;

/**
 * CAN-APT-001: ventana de cancelación por defecto (24h) cuando la reserva no tiene
 * snapshot (citas antiguas) o la política no definía una ventana específica.
 */
const DEFAULT_CANCELLATION_WINDOW_MINUTES = 24 * 60;

/**
 * Cómo nombra un recurso a la tabla de perfiles profesionales.
 *
 * **Son dos porque el sistema dice las dos cosas.** El DTO de agenda ejemplifica
 * `health_practitioner_profiles` —el nombre real de la tabla— y los recursos
 * sembrados traen `practitioner_profiles`. Aceptar sólo uno dejaría la cita
 * clínica sin profesional contra la mitad de los datos, y en silencio.
 *
 * El fallo es benigno: si ninguno coincide, la cita queda sin profesional, que
 * es lo correcto para una sala o un equipo.
 */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/**
 * Flujo de reserva: holds anti-double-booking, confirmación, reprogramación,
 * cancelación, check-in y el worker de expiración (UC-41-05 … 10).
 */
/* -- El estado de pago de una cita (TAREA-13 punto 5) ----------------------- */

/** La clave estable de cada estado de pago, a su concepto. */
const PAYMENT_STATE_CONCEPT: Readonly<Record<PaymentState, string>> = {
  PENDING: SCHED.PAYMENT_PENDING,
  PARTIALLY_PAID: SCHED.PAYMENT_PARTIALLY_PAID,
  PAID: SCHED.PAYMENT_PAID,
};

/** El camino de vuelta, para proyectar lo que está guardado. */
const PAYMENT_CONCEPT_STATE: Readonly<Record<string, PaymentState>> = {
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
const PAYMENT_STATE_LABEL: Readonly<Record<PaymentState, string>> = {
  PENDING: 'Pendiente de pago',
  PARTIALLY_PAID: 'Parcialmente pagada',
  PAID: 'Pagada',
};

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
const ESTADOS_SIN_PAGO: readonly string[] = [CONCEPTS.BOOKING_CANCELLED];

/**
 * De la fila guardada a lo que ve el cliente.
 *
 * Traduce el concepto a su clave estable y le pone la etiqueta: el cliente no
 * tiene por qué conocer los uuid de terminología, y si los conociera acabaría
 * comparándolos a mano en el front.
 */
function proyectarEstadoDePago(
  fila: AppointmentPaymentStates,
): PaymentStateDto {
  const state = PAYMENT_CONCEPT_STATE[fila.statusConceptId];
  return {
    state,
    label: PAYMENT_STATE_LABEL[state],
    conceptId: fila.statusConceptId,
    insuranceUsed: fila.insuranceUsed,
    markedByUserId: fila.markedByUserId,
    markedAt: fila.markedAt.toISOString(),
  };
}

@Injectable()
export class SchedulingBookingsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param bookingsRepo - Valor de bookings repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param historyRepo - Valor de history repo requerido por la operación.
   * @param appointmentsRepo - Citas clínicas que respaldan las reservas.
   * @param logger - Valor de logger requerido por la operación.
   * @param encountersRepo - Encuentros clínicos de las citas que respaldan las reservas.
   * @param claimReadRepo - Solicitudes de seguro de esos encuentros, de sólo lectura.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly appointmentsRepo: AppointmentsRepository,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
    private readonly vinculos: PractitionerAffiliationGateService,
    private readonly tiempoProfesional: SchedulingProfessionalTimeService,
    private readonly coverageRepo: CoverageRepository,
    // La lista de espera del cupo que una cancelación libera. Se inyecta el
    // servicio y no su puerto: promover es un caso de uso completo —abre su
    // transacción, marca a los candidatos y les avisa— y reimplementarlo acá
    // sería tener dos dueños de la misma regla.
    private readonly waitlist: SchedulingWaitlistService,
    private readonly encountersRepo: EncountersRepository,
    // La solicitud de seguro de cada cita, en la agenda. Mismo patrón que
    // `coverageRepo`: repositorio de lectura que exporta `InsuranceModule`.
    private readonly claimReadRepo: ClaimReadRepository,
  ) {
    this.logger.setContext(SchedulingBookingsService.name);
  }

  /**
   * UC-41-05: reserva temporalmente un cupo del slot.
   *
   * Este es el punto donde se evita el doble booking: el slot se toma con
   * `SELECT ... FOR UPDATE`, de modo que dos peticiones simultáneas se serializan y
   * el decremento de `remaining_capacity` nunca puede bajar de cero. El hold caduca
   * solo (TTL de la política) y el worker UC-41-07 devuelve el cupo.
   */
  async placeHold(
    slotId: string,
    dto: CreateHoldDto,
    actor: AuthenticatedUser,
  ): Promise<HoldResponseDto> {
    this.logger.info(
      { operation: 'scheduling.hold.place', slotId },
      'Placing hold on bookable slot',
    );

    return this.em.transactional(async (tx) => {
      const slot = await this.bookingsRepo.findSlotForUpdate(tx, slotId);
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', { slotId });
      }
      if (slot.statusConceptId === CONCEPTS.SLOT_BLOCKED) {
        throw new PreconditionFailedException('El slot está bloqueado', {
          slotId,
        });
      }
      if (slot.remainingCapacity <= 0) {
        throw new ConflictException('El slot no tiene cupos disponibles', {
          slotId,
        });
      }

      const policy = slot.scheduleTemplateId
        ? await this.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;

      // Un turno que ya empezó no se puede pedir, aunque le quede capacidad: la
      // agenda dejó de ofrecerlos (A-03) y acá se cierra la puerta directa
      // (A-02). Es 422 y no 404 a propósito —el cupo existe, lo que no existe
      // es la posibilidad— y el mensaje lo dice en palabras, porque lo lee un
      // paciente.
      const ahora = Date.now();
      const minutosDeAviso = policy?.minNoticeMinutes ?? 0;
      const yaPaso = slot.startAt.getTime() <= ahora;
      const demasiadoSobreLaHora =
        slot.startAt.getTime() <= ahora + minutosDeAviso * 60_000;

      if (yaPaso || demasiadoSobreLaHora) {
        // Dos motivos distintos merecen dos frases distintas: a quien pide un
        // turno de la semana pasada no se le habla de anticipación mínima, y a
        // quien llega diez minutos tarde para una regla de treinta no se le
        // dice que «ya pasó» cuando todavía no pasó.
        throw new PreconditionFailedException(
          yaPaso
            ? 'Ese horario ya pasó.'
            : `Ese turno empieza demasiado pronto: hay que pedirlo con al menos ${minutosDeAviso} minutos de anticipación.`,
          { slotId, startAt: slot.startAt.toISOString(), minutosDeAviso },
        );
      }

      if (policy?.maxActivePerPatient && dto.patientProfileId) {
        const active = await this.bookingsRepo.countActiveBookingsForPatient(
          tx,
          dto.patientProfileId,
          [...ACTIVE_BOOKING_STATES],
        );
        if (active >= policy.maxActivePerPatient) {
          throw new ConflictException(
            'El paciente alcanzó el máximo de citas activas',
            {
              patientProfileId: dto.patientProfileId,
              maxActivePerPatient: policy.maxActivePerPatient,
            },
          );
        }
      }

      const ttlSeconds = policy?.holdTtlSeconds ?? DEFAULT_HOLD_TTL_SECONDS;
      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: slotId,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        actorUserId: actor.id,
      });

      slot.remainingCapacity -= 1;
      if (slot.remainingCapacity === 0)
        slot.statusConceptId = CONCEPTS.SLOT_HELD;
      touch(slot, actor.id);

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        remainingCapacity: slot.remainingCapacity,
      };
    });
  }

  /**
   * UC-41-06: convierte el hold en cita confirmada.
   *
   * Un hold vencido no se puede confirmar aunque el worker todavía no lo haya
   * reciclado: la comprobación por `expires_at` es lo que evita que una petición
   * tardía se cuele sobre un cupo que ya se considera libre.
   *
   * Es la entrada del mostrador y de quien ya tiene potestad para comprometer la
   * agenda. El paciente que pide un turno entra por {@link requestBooking}: el
   * cupo se toma igual, pero la cita nace pendiente de que el profesional la
   * acepte.
   */
  async confirmBooking(
    holdToken: string,
    dto: ConfirmBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.confirm',
        patientProfileId: dto.patientProfileId,
      },
      'Confirming booking from hold',
    );

    return this.materializarReserva(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
        confirmedAt: new Date(),
        reminderOffsetsMinutes: dto.reminderOffsetsMinutes ?? [],
      },
      actor,
    );
  }

  /**
   * El paciente **solicita** un turno: la cita nace pendiente de aceptación
   * (corrección #11, primer eslabón del P0).
   *
   * ## Qué cambia respecto de confirmar
   *
   * El cupo se toma igual —el hold ya lo descontó, y soltarlo mientras el
   * profesional decide dejaría que otra persona lo tomara y que la solicitud no
   * se pudiera aceptar nunca— pero la cita queda en `PENDING_CONFIRMATION`, sin
   * `confirmed_at` y con su cita clínica en `pending`. La confirmación es del
   * profesional (carril 07), no de quien pide.
   *
   * ## Por qué no se programan recordatorios
   *
   * Recordar un turno que todavía puede rechazarse es prometer algo que nadie
   * comprometió. Se programan al aceptar.
   */
  async requestBooking(
    holdToken: string,
    dto: RequestBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.request',
        patientProfileId: dto.patientProfileId,
      },
      'Requesting booking from hold',
    );

    const resultado = await this.materializarReserva(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        appointmentStatusConceptId: CLIN.APPOINTMENT_PENDING,
        reminderOffsetsMinutes: [],
      },
      actor,
    );

    // Fuera de la transacción, como todos los avisos: que no salga la campana
    // no puede deshacer una solicitud que ya existe.
    await this.avisarSolicitud(resultado.id);
    return resultado;
  }

  /**
   * Avisa que entró una solicitud de turno, **a las dos partes**.
   *
   * ## Por qué a las dos y no a la contraparte
   *
   * {@link avisarCambio} avisa a quien **no** actuó, y para aceptar, mover o
   * cancelar eso es correcto: quien lo hizo ya lo sabe. Pero pedir un turno no
   * es un cambio de estado que le ocurre a alguien: es el comienzo de una
   * espera. El profesional necesita enterarse de que hay algo que responder, y
   * el paciente necesita saber que su pedido entró — sin eso, pedir un turno se
   * siente como escribir a un buzón sin fondo, y vuelve a pedirlo.
   *
   * Es el punto 2 del pedido (AC-15-1 y AC-15-2), que pide explícitamente los
   * **dos** destinatarios.
   *
   * ## Por qué no lanza
   *
   * Igual que {@link avisarCambio}: corre después de que la transacción cerró.
   * Un fallo del canal se registra y se descarta; la reserva ya existe.
   *
   * @param bookingId - La cita recién solicitada.
   */
  private async avisarSolicitud(bookingId: string): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    // El del paciente sale siempre: su perfil es el dueño de la reserva, así
    // que siempre hay a quién dirigirlo.
    const avisos: AgendaNotice[] = [avisoDeSolicitudAlPaciente(booking)];

    const profesional = await this.noticeRepo.findResourceAccount(
      em,
      booking.resourceId,
    );
    if (profesional === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay segundo destinatario, y
      // el acuse del paciente sale igual.
      this.logger.info(
        { operation: 'scheduling.notice.requested', bookingId },
        'El recurso de la solicitud no tiene profesional al que avisar',
      );
    } else {
      const paciente = await this.noticeRepo.findDisplayNameForProfile(
        em,
        booking.patientProfileId,
      );
      avisos.push(
        avisoDeSolicitudAlProfesional(
          booking,
          paciente ?? undefined,
          profesional,
        ),
      );
    }

    await this.notices.emitMany(avisos);
  }

  /**
   * Convierte una retención viva en cita, en el estado que le corresponda.
   *
   * Es el cuerpo común de {@link confirmBooking} y {@link requestBooking}: las
   * dos consumen el mismo hold, congelan la misma política, crean la misma cita
   * clínica y liberan el mismo cupo si algo falla. Lo único que las distingue es
   * el estado con el que la cita nace y si ya hay compromiso (`confirmedAt`).
   */
  private async materializarReserva(
    holdToken: string,
    plan: {
      /** Organización dueña de la cita. */
      tenantId: string;
      /** Paciente titular. */
      patientProfileId: string;
      /** Canal por el que entró. */
      channel: BookingChannel;
      /** Motivo de consulta, si se declaró. */
      reasonText?: string;
      /** Estado con el que nace la reserva. */
      statusConceptId: string;
      /** Estado con el que nace la cita clínica que la respalda. */
      appointmentStatusConceptId: string;
      /** Instante del compromiso; ausente mientras nadie la aceptó. */
      confirmedAt?: Date;
      /** Recordatorios a programar junto con la cita. */
      reminderOffsetsMinutes: readonly number[];
    },
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.em.transactional(async (tx) => {
      const hold = await this.bookingsRepo.findHoldByTokenForUpdate(
        tx,
        holdToken,
      );
      if (!hold) {
        throw new ResourceNotFoundException(
          'Reserva temporal no encontrada',
          {},
        );
      }
      if (hold.statusConceptId !== CONCEPTS.HOLD_ACTIVE) {
        throw new ConflictException(
          'La reserva temporal ya fue consumida o liberada',
          {
            holdId: hold.id,
          },
        );
      }
      if (hold.expiresAt.getTime() <= Date.now()) {
        throw new ConflictException('La reserva temporal expiró', {
          holdId: hold.id,
        });
      }

      const slot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        hold.bookableSlotId,
      );
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', {
          slotId: hold.bookableSlotId,
        });
      }
      // Segundo cinturón de A-02: el hold ya no se puede tomar sobre un turno
      // vencido, pero uno tomado hace rato puede llegar acá con el horario
      // recién pasado. Cubre a la vez confirmar y solicitar, que es por lo que
      // vive acá y no en cada una.
      if (slot.startAt.getTime() <= Date.now()) {
        throw new PreconditionFailedException('Ese horario ya pasó.', {
          slotId: slot.id,
          startAt: slot.startAt.toISOString(),
        });
      }

      // REGLA 1: no se puede pedir un turno encima de uno YA ACEPTADO.
      //
      // Pedirle a varios médicos a la misma hora es legítimo mientras ninguno
      // haya dicho que sí —es cómo se consigue turno—, pero una vez que hay uno
      // confirmado, el paciente ya tiene dónde estar. Reservar otro encima es
      // comprometerse a estar en dos lugares a la vez, y el que se queda
      // esperando es el médico.
      const yaComprometido =
        await this.bookingsRepo.findPatientBookingsOverlapping(
          tx,
          plan.patientProfileId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
          ACTIVE_BOOKING_STATES,
        );
      if (yaComprometido.length > 0) {
        const choque = yaComprometido[0];
        throw new PreconditionFailedException(
          `Ya tenés un turno confirmado ese día a esa hora${
            choque.resourceName ? ` en «${choque.resourceName}»` : ''
          }. Cancelalo primero si querés cambiarlo por éste.`,
          {
            bookingId: choque.id,
            startAt: choque.startAt,
          },
        );
      }

      // CAN-APT-001: se congela la política de cancelación vigente en el momento
      // de tomar el cupo. La referencia `booking_policy_id` puede mutar de
      // versión después, pero el snapshot preserva las condiciones que el
      // paciente aceptó.
      const policy = slot.scheduleTemplateId
        ? await this.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;
      // CAN-TIME-001: la tz vive en el recurso; se congela para auditoría aunque el
      // plazo se evalúe sobre instantes UTC (`start_at` es timestamptz).
      const resource = slot.resourceId
        ? await this.catalogRepo.findResourceById(tx, slot.resourceId)
        : null;

      // REGLA MADRE (AG-1): el médico es el recurso escaso, no la sede. La
      // REGLA 1 protege el tiempo del paciente; ésta protege el del profesional
      // CRUZANDO todas sus agendas — un doctor con consultorio y hospital tiene
      // dos recursos, y confirmar acá sin mirar el otro lo dejaba citado en dos
      // lugares a la vez (comprobado ejecutando, no leyendo).
      if (
        resource &&
        TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)
      ) {
        await this.tiempoProfesional.assertRangoLibre(
          tx,
          resource.resourceRefId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
        );
      }

      const cancellationPolicySnapshot: CancellationPolicySnapshot = {
        policyId: policy?.id,
        policyRowVersion: policy?.rowVersion,
        cancellationWindowMinutes:
          policy?.cancellationWindowMinutes ??
          DEFAULT_CANCELLATION_WINDOW_MINUTES,
        noShowFeeAmount: policy?.noShowFeeAmount ?? undefined,
        currencyConceptId: policy?.currencyConceptId ?? undefined,
        timeZone: resource?.timeZone ?? undefined,
        capturedAt: new Date().toISOString(),
      };

      // La cita clínica que respalda la reserva. Se crea **antes** para poder
      // enlazarla: `appointment_id` es una columna uuid suelta, así que el orden
      // lo garantiza esto y no la unidad de trabajo.
      const appointment = this.crearCitaClinica(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        resourceRefType: resource?.resourceRefType,
        resourceRefId: resource?.resourceRefId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        reasonText: plan.reasonText,
        statusConceptId: plan.appointmentStatusConceptId,
        actorUserId: actor.id,
      });
      // **Persistir la cita antes de crear la reserva.** `appointment_id` es una
      // columna uuid plana con clave foránea, no una relación gestionada: sin
      // este `flush` la cita vive sólo en el mapa de identidad y el INSERT de la
      // reserva viola `fk_appointment_bookings_appointment_id`. Lo destapó la
      // verificación contra la base real; ninguna prueba con dobles lo veía.
      await tx.flush();

      const booking = this.bookingsRepo.createBooking(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        appointmentId: appointment.id,
        bookableSlotId: hold.bookableSlotId,
        resourceId: slot.resourceId,
        serviceConceptId: slot.serviceConceptId,
        bookingChannelConceptId: CHANNEL_CONCEPT[plan.channel],
        bookedByUserId: actor.id,
        statusConceptId: plan.statusConceptId,
        confirmedAt: plan.confirmedAt,
        bookingPolicyId: policy?.id,
        cancellationPolicySnapshot,
        reasonText: plan.reasonText,
        actorUserId: actor.id,
      });
      // Mismo caso que la plantilla y sus franjas: `booking_id` es una columna
      // uuid suelta en `appointment_reminders`, así que persistir la cita antes
      // de crear los recordatorios es lo único que garantiza el orden. Sólo se
      // manifiesta cuando la confirmación pide recordatorios, que es el camino
      // normal desde el portal.
      await tx.flush();

      hold.statusConceptId = CONCEPTS.HOLD_CONSUMED;
      touch(hold, actor.id);

      if (slot.remainingCapacity === 0)
        slot.statusConceptId = CONCEPTS.SLOT_BOOKED;
      touch(slot, actor.id);

      // Los recordatorios se programan junto con la cita (UC-41-13 va incluido aquí).
      const offsets = plan.reminderOffsetsMinutes;
      for (const offset of offsets) {
        this.bookingsRepo.createReminder(tx, {
          bookingId: booking.id,
          channelConceptId: CONCEPTS.REMINDER_CH_SMS,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      return {
        id: booking.id,
        bookableSlotId: hold.bookableSlotId,
        statusConceptId: plan.statusConceptId,
        remindersScheduled: offsets.length,
      };
    });
  }

  /**
   * AG-2 · La cita puntual: el doctor asigna, el paciente se entera.
   *
   * ## El diseño (decidido, no reabrir)
   *
   * **Cita puntual = un cupo de una sola vez + su reserva, en la MISMA
   * transacción.** Cero modelo nuevo: para el resto del sistema ES una reserva
   * más, así que hereda recordatorios, estados, check-in, demora, cancelación,
   * el archivo del paciente, la regla madre y el gating de sede — todo gratis.
   *
   * Nace CONFIRMADA: «volvé el jueves a las 10» ya se acordó en el consultorio.
   * El paciente recibe la campana con la salida de «pedir cambio» — salida, no
   * paso obligatorio.
   *
   * ## La retracción (decisión 8 del README de agenda)
   *
   * Si el rato pisa cupos ofrecidos NO tomados del mismo profesional —en
   * cualquiera de sus sedes— esos cupos se retiran acá mismo y la respuesta
   * informa cuántos. Informar, no pedir permiso. Sobre confirmadas → la regla
   * madre rechaza, como siempre.
   *
   * ## Anti-abuso mínimo, documentado
   *
   * El paciente tiene que existir. La relación previa (sus pacientes atendidos
   * primero) la gobierna el buscador del front — exigirla acá bloquearía el
   * caso legítimo del paciente nuevo que acaba de salir de la primera consulta.
   * Queda el registro estructurado de quién agendó a quién.
   *
   * @param dto - Paciente, agenda, inicio, duración y motivo.
   * @param actor - El doctor (su propia agenda) o quien administra agendas.
   * @returns La reserva confirmada y cuántos cupos ofrecidos retiró.
   */
  async createDirectAppointment(
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
  ): Promise<DirectAppointmentResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.appointment.direct',
        resourceId: dto.resourceId,
        patientProfileId: dto.patientProfileId,
        startAt: dto.startAt,
        durationMinutes: dto.durationMinutes,
      },
      'Creating direct appointment',
    );

    const { booking, slot, retractedSlots } = await this.em.transactional(
      (tx) => this.crearCitaDirectaEnTransaccion(tx, dto, actor),
    );
    const resultado: DirectAppointmentResponseDto = {
      bookingId: booking.id,
      bookableSlotId: slot.id,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      retractedSlots,
    };

    // Fuera de la transacción, como todos los avisos: que no salga la campana
    // no puede deshacer una cita que ya existe.
    await this.avisarCambio(
      resultado.bookingId,
      'ASSIGNED',
      dto.reasonText,
      'PROVIDER',
    );
    return resultado;
  }

  /**
   * El cuerpo transaccional de {@link createDirectAppointment}, para casos de
   * uso que ya abrieron su propia transacción (el mostrador atómico, AC-3.3).
   *
   * Mismo camino que la cita puntual: recurso, titularidad de agenda, vínculo
   * vigente, existencia del paciente, regla madre, solape del paciente,
   * retracción de cupos libres, cupo único, cita clínica y reserva
   * `BOOKING_CONFIRMED`. El canal de la reserva es parametrizable —por defecto
   * `DESK`, como la cita puntual de siempre— porque el mostrador lo abre como
   * `WALK_IN` sin que eso cambie ninguna otra regla.
   *
   * No dispara el aviso de campana: eso vive fuera de la transacción y es
   * responsabilidad de quien la abrió.
   *
   * @param tx - Contexto transaccional ya abierto por el llamador.
   * @param dto - Paciente, agenda, inicio, duración y motivo.
   * @param actor - El doctor (su propia agenda) o quien administra agendas.
   * @param opciones - Canal de reserva a grabar; por defecto `DESK`.
   * @returns La reserva confirmada, el cupo, la cita clínica y cuántos cupos
   *   ofrecidos retiró.
   */
  async crearCitaDirectaEnTransaccion(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
    opciones?: { bookingChannel?: 'DESK' | 'WALK_IN' },
  ): Promise<{
    booking: AppointmentBookings;
    slot: BookableSlots;
    appointment: Appointments;
    retractedSlots: number;
  }> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + dto.durationMinutes * 60_000);

    const resource = await this.catalogRepo.findResourceById(
      tx,
      dto.resourceId,
    );
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId: dto.resourceId,
      });
    }

    // La agenda tiene que ser SUYA (o el actor administra agendas por
    // oficio): mismo criterio de titularidad que operar una reserva.
    const esSuAgenda =
      actor.practitionerProfileId !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType);
    if (!this.operaCualquierAgenda(actor) && !esSuAgenda) {
      throw new ForbiddenException(
        'Un profesional solo puede asignar citas en su propia agenda.',
      );
    }

    // El gating del vínculo, heredado: comprometer un turno en una
    // organización exige que el vínculo siga vigente — misma regla que
    // aceptar.
    await this.assertVinculoVigente(resource.tenantId, actor);

    // Anti-abuso mínimo: el paciente tiene que existir.
    const nombres = await this.bookingsRepo.findPatientNames(tx, [
      dto.patientProfileId,
    ]);
    if (!nombres.has(dto.patientProfileId)) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId: dto.patientProfileId,
      });
    }

    // REGLA MADRE: nada se asigna sobre tiempo ya comprometido del
    // profesional, en ninguna de sus sedes.
    if (TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)) {
      await this.tiempoProfesional.assertRangoLibre(
        tx,
        resource.resourceRefId,
        startAt,
        endAt,
      );
    }

    // Y el tiempo del PACIENTE también: la regla 1 vale igual cuando quien
    // agenda es el doctor — el paciente tampoco puede estar en dos lugares.
    const yaComprometido =
      await this.bookingsRepo.findPatientBookingsOverlapping(
        tx,
        dto.patientProfileId,
        startAt,
        endAt,
        ACTIVE_BOOKING_STATES,
      );
    if (yaComprometido.length > 0) {
      const choque = yaComprometido[0];
      throw new PreconditionFailedException(
        `El paciente ya tiene un turno confirmado en ese rato${
          choque.resourceName ? ` en «${choque.resourceName}»` : ''
        }.`,
        { bookingId: choque.id, startAt: choque.startAt },
      );
    }

    // La retracción: los cupos libres del profesional que este rato pisa se
    // retiran acá mismo, en cualquiera de sus sedes.
    let retractedSlots = 0;
    if (TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)) {
      const libres = await this.catalogRepo.findOpenSlotsOfProfessionalInWindow(
        tx,
        resource.resourceRefId,
        startAt,
        endAt,
        CONCEPTS.SLOT_OPEN,
      );
      for (const libre of libres) {
        libre.statusConceptId = CONCEPTS.SLOT_BLOCKED;
        touch(libre, actor.id);
        retractedSlots += 1;
      }
    }

    // El cupo único: nace ya tomado (capacity 1, remaining 0) y SIN
    // plantilla — un cupo puntual no tiene patrón semanal. Nadie más puede
    // reservarlo porque nunca estuvo ofrecido.
    const slot = this.catalogRepo.createSlot(tx, {
      resourceId: resource.id,
      startAt,
      endAt,
      capacity: 1,
      remainingCapacity: 0,
      statusConceptId: CONCEPTS.SLOT_BOOKED,
      actorUserId: actor.id,
    });
    await tx.flush();

    // La cita clínica que la respalda, ya reservada.
    const appointment = this.crearCitaClinica(tx, {
      tenantId: resource.tenantId,
      patientProfileId: dto.patientProfileId,
      resourceRefType: resource.resourceRefType,
      resourceRefId: resource.resourceRefId,
      startAt,
      endAt,
      reasonText: dto.reasonText,
      statusConceptId: CLIN.APPOINTMENT_BOOKED,
      // Ausente = presencial: no se escribe un valor que nadie eligió.
      ...(dto.channel === undefined
        ? {}
        : { channelConceptId: APPOINTMENT_CHANNEL_CONCEPT[dto.channel] }),
      actorUserId: actor.id,
    });
    await tx.flush();

    const confirmedAt = new Date();
    const booking = this.bookingsRepo.createBooking(tx, {
      tenantId: resource.tenantId,
      patientProfileId: dto.patientProfileId,
      appointmentId: appointment.id,
      bookableSlotId: slot.id,
      resourceId: resource.id,
      bookingChannelConceptId:
        CHANNEL_CONCEPT[opciones?.bookingChannel ?? 'DESK'],
      bookedByUserId: actor.id,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      confirmedAt,
      // Sin política publicada que congelar: los defaults del módulo, con la
      // zona de la sede como dato de auditoría.
      cancellationPolicySnapshot: {
        cancellationWindowMinutes: DEFAULT_CANCELLATION_WINDOW_MINUTES,
        timeZone: resource.timeZone ?? undefined,
        capturedAt: new Date().toISOString(),
      },
      reasonText: dto.reasonText,
      actorUserId: actor.id,
    });
    await tx.flush();

    // Los recordatorios de siempre: la cita puntual es una reserva más.
    for (const offset of DEFAULT_REMINDER_OFFSETS) {
      this.bookingsRepo.createReminder(tx, {
        bookingId: booking.id,
        channelConceptId: CONCEPTS.REMINDER_CH_SMS,
        offsetMinutes: offset,
        scheduledAt: new Date(startAt.getTime() - offset * 60_000),
        statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
        actorUserId: actor.id,
      });
    }

    await this.recordTransition(tx, booking, actor, {
      bookingId: booking.id,
      fromStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
      toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
      reasonText: dto.reasonText,
      actorKind: 'PROVIDER',
    });

    return { booking, slot, appointment, retractedSlots };
  }

  /**
   * UC-41-07 (worker): recicla los holds vencidos y devuelve el cupo.
   *
   * Idempotente y seguro entre workers: el lote se toma con `SKIP LOCKED`, así que
   * dos instancias se reparten el trabajo en vez de bloquearse mutuamente.
   */
  async expireHolds(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    return this.em.transactional(async (tx) => {
      const expired = await this.bookingsRepo.findExpiredHolds(
        tx,
        CONCEPTS.HOLD_ACTIVE,
        new Date(),
        limit,
      );

      for (const hold of expired) {
        hold.statusConceptId = CONCEPTS.HOLD_EXPIRED;
        hold.releasedAt = new Date();
        touch(hold, undefined);

        const slot = await this.bookingsRepo.findSlotForUpdate(
          tx,
          hold.bookableSlotId,
        );
        if (!slot) continue;
        slot.remainingCapacity += 1;
        if (slot.statusConceptId === CONCEPTS.SLOT_HELD) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(slot, undefined);
      }

      if (expired.length > 0) {
        this.logger.info(
          { operation: 'scheduling.hold.expire', released: expired.length },
          'Released expired holds',
        );
      }

      return {
        processed: expired.length,
        detail: 'Holds vencidos liberados y cupo devuelto',
      };
    });
  }

  /**
   * UC-41-08: mueve la cita a otro slot, liberando el cupo del original.
   *
   * **Exige motivo** (corrección #14): mover un turno le cambia el día a
   * alguien. El motivo se valida en el servidor —no alcanza con que el
   * formulario lo pida— y queda en el historial de la cita, de donde lo lee la
   * otra parte.
   */
  async reschedule(
    bookingId: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    const motivo = requireReason(dto.reasonText, 'reprogramar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.reschedule',
        bookingId,
        toSlotId: dto.toSlotId,
      },
      'Rescheduling booking',
    );

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      if (!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se reprograma una cita vigente',
          {
            bookingId,
          },
        );
      }

      const fromSlotId = booking.bookableSlotId;
      if (fromSlotId === dto.toSlotId) {
        throw new PreconditionFailedException(
          'El slot destino es el mismo que el actual',
          {
            bookingId,
          },
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.toSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException('Slot destino no encontrado', {
          slotId: dto.toSlotId,
        });
      }
      if (target.remainingCapacity <= 0) {
        throw new ConflictException('El slot destino no tiene cupos', {
          slotId: dto.toSlotId,
        });
      }

      const origin = await this.bookingsRepo.findSlotForUpdate(tx, fromSlotId);
      if (origin) {
        origin.remainingCapacity += 1;
        if (origin.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          origin.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(origin, actor.id);
      }

      target.remainingCapacity -= 1;
      if (target.remainingCapacity === 0)
        target.statusConceptId = CONCEPTS.SLOT_BOOKED;
      touch(target, actor.id);

      booking.bookableSlotId = dto.toSlotId;
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId,
        toSlotId: dto.toSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });

      // El motivo va al historial y no a `booking_reschedules`: esa tabla solo
      // tiene `reason_concept_id` (de catálogo), y lo que la otra parte necesita
      // leer es el texto. Ver `state/booking-transition.ts`.
      await this.historyRepo.append(tx, 'appointment_bookings', bookingId, {
        operationConceptId: SCHED.HISTORY_OP_RESCHEDULE,
        dataSnapshot: {
          bookingId,
          fromSlotId,
          toSlotId: dto.toSlotId,
          reasonText: motivo,
          actorKind: this.actorKind(actor),
        } satisfies BookingTransitionSnapshot,
        changedByUserId: actor.id,
      });

      return { bookingId, fromSlotId, toSlotId: dto.toSlotId };
    });

    // Con el motivo (P8): el aviso dice el horario nuevo y por qué se movió.
    await this.avisarCambio(
      bookingId,
      'RESCHEDULED',
      motivo,
      this.actorKind(actor),
    );
    return resultado;
  }

  /**
   * UC-41-09: cancela la cita y libera el cupo.
   *
   * El cargo por inasistencia solo se aplica si la política lo define y la
   * cancelación se marca como no-show: cobrar por una cancelación avisada a tiempo
   * sería inconsistente con la ventana de cancelación de la política.
   *
   * **Exige motivo** (corrección #14). El `reason_concept_id` que ya se
   * persistía dice de qué clase es la cancelación —del paciente, del prestador,
   * inasistencia—, no por qué: eso queda en el historial y es lo que la otra
   * parte lee en el detalle de su cita.
   */
  async cancel(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.cancelarYAvisar(bookingId, dto, actor, 'CANCELLED');
  }

  /**
   * El cuerpo compartido por cancelar y rechazar, con el aviso que corresponde
   * a cada uno (P8).
   *
   * Existe porque los dos hacen exactamente lo mismo con la cita —liberan el
   * cupo, registran la cancelación con su motivo— y lo único que cambia es qué
   * se le dice al otro lado: «tu turno se canceló» no es «no se pudo tomar tu
   * solicitud». Compartir el camino y separar el aviso es lo que evita que un
   * rechazo llegue con el texto de una cancelación.
   */
  private async cancelarYAvisar(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
    cambio: CambioDeCita,
  ): Promise<CancelBookingResponseDto> {
    const motivo = requireReason(dto.reasonText, 'cancelar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.cancel',
        bookingId,
        isNoShow: dto.isNoShow === true,
      },
      'Cancelling booking',
    );

    // El cupo que la cancelación devuelve a la oferta, para promover la lista de
    // espera una vez confirmada. Se anota acá y no se devuelve en el DTO: es un
    // detalle interno del caso de uso, no algo que el cliente deba conocer.
    let cupoLiberado: string | null = null;

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      if (booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED) {
        throw new ConflictException('La cita ya está cancelada', { bookingId });
      }

      // C-10: sólo se cancela desde un estado que la máquina permite cancelar
      // (no desde COMPLETED ni NO_SHOW).
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CANCELLED);

      const isNoShow = dto.isNoShow ?? false;

      // CAN-APT-001: la ventana y el cargo salen del snapshot congelado de la
      // reserva, NUNCA de la política actual (que pudo cambiar tras la aceptación).
      // La columna es jsonb (`unknown` en la entidad generada); el contrato vive
      // en appointment_bookings.types.ts y quien escribió el snapshot lo honró.
      const snapshot = booking.cancellationPolicySnapshot as
        CancellationPolicySnapshot | undefined;
      const windowMinutes =
        snapshot?.cancellationWindowMinutes ??
        DEFAULT_CANCELLATION_WINDOW_MINUTES;

      // El cargo también se congela en el snapshot. Solo para reservas antiguas sin
      // snapshot se consulta la política actual como último recurso (compatibilidad).
      let feeSource = snapshot?.noShowFeeAmount;
      let currencyConceptId = snapshot?.currencyConceptId;
      if (feeSource === undefined && !snapshot && booking.bookingPolicyId) {
        const policy = await this.catalogRepo.findPolicyById(
          tx,
          booking.bookingPolicyId,
        );
        feeSource = policy?.noShowFeeAmount ?? undefined;
        currencyConceptId = policy?.currencyConceptId ?? undefined;
      }

      const slot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        booking.bookableSlotId,
      );

      // CAN-TIME-001: el plazo se mide sobre instantes absolutos (`start_at` es
      // timestamptz en UTC), por lo que es independiente de la zona horaria; la tz
      // congelada del snapshot queda solo como dato de auditoría.
      const withinWindow =
        slot != null &&
        Date.now() >= slot.startAt.getTime() - windowMinutes * 60_000;

      // TJ-2 · el paciente no cancela fuera de plazo; quien atiende, sí.
      //
      // La ventana ya se calculaba, pero sólo decidía si se COBRABA: el
      // paciente podía cancelar cinco minutos antes y el sistema se limitaba a
      // facturarlo. Para el consultorio eso es un hueco que no se puede
      // rellenar, que es justamente lo que la ventana existe para evitar.
      //
      // Se comprueba contra el perfil del token y no contra `dto.cancelledBy`:
      // ese campo lo manda el cliente, y una regla que se apaga cambiando el
      // cuerpo de la petición no es una regla.
      //
      // Quien atiende cancela siempre —una urgencia no espera a la ventana— y
      // su cancelación dispara el aviso al paciente (P8).
      const esElPacienteTitular =
        actor.patientProfileId !== undefined &&
        actor.patientProfileId === booking.patientProfileId;

      if (esElPacienteTitular && withinWindow && !isNoShow) {
        throw new PreconditionFailedException(
          `Podés cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio.`,
          {
            bookingId,
            cancellationWindowMinutes: windowMinutes,
            startAt: slot?.startAt.toISOString(),
          },
        );
      }

      // Se cobra si es inasistencia o si la cancelación cae dentro de la ventana
      // (tardía). Una cancelación avisada a tiempo no genera cargo.
      //
      // Tras la regla de arriba, la cancelación tardía sólo puede venir de quien
      // atiende o de una inasistencia: al paciente ya no se le cobra por algo
      // que no puede hacer.
      const chargeable = isNoShow || withinWindow;
      const feeAmount = chargeable ? (feeSource ?? undefined) : undefined;

      this.bookingsRepo.createCancellation(tx, {
        bookingId,
        reasonConceptId: isNoShow
          ? CONCEPTS.CANCEL_NO_SHOW
          : dto.cancelledBy === 'PATIENT'
            ? CONCEPTS.CANCEL_BY_PATIENT
            : CONCEPTS.CANCEL_BY_PROVIDER,
        cancelledByUserId: actor.id,
        isNoShow,
        feeAmount,
        currencyConceptId: feeAmount
          ? (currencyConceptId ?? CONCEPTS.CURRENCY_BOB)
          : undefined,
        cancelledAt: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      booking.statusConceptId = CONCEPTS.BOOKING_CANCELLED;
      touch(booking, actor.id);
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        reasonText: motivo,
        actorKind: dto.cancelledBy,
      });

      let capacityReleased = false;
      if (slot) {
        slot.remainingCapacity += 1;
        if (
          slot.scheduleTemplateId === undefined ||
          slot.scheduleTemplateId === null
        ) {
          // AG-2: el cupo de una cita puntual muere con ella. Nunca estuvo
          // ofrecido —nació para esa cita— y reabrirlo dejaría un horario
          // ofertándose que nadie pidió publicar: un cupo fantasma.
          slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
        } else if (slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
          // Sólo el cupo que vuelve a ofrecerse: el de una cita puntual queda
          // bloqueado arriba —nunca estuvo ofrecido— y promover sobre él le
          // avisaría a alguien de un horario que no puede reservar.
          cupoLiberado = slot.id;
        }
        touch(slot, actor.id);
        capacityReleased = true;
      }

      return { bookingId, feeAmount, capacityReleased };
    });

    await this.avisarCambio(bookingId, cambio, motivo, dto.cancelledBy);
    await this.promoverListaDeEspera(cupoLiberado);
    return resultado;
  }

  /**
   * Promueve la lista de espera del cupo que la cancelación acaba de liberar.
   *
   * ## Por qué acá y no sólo en el worker
   *
   * El barrido existe y sigue existiendo (`promote-waitlist.job`, cada 30 s),
   * pero es una red de seguridad, no el camino. El pedido del propietario es
   * que el aviso salga **cuando el paciente se desmarca** —«de manera
   * AUTOMÁTICA … a los pacientes que no consiguieron horario»—, y treinta
   * segundos de espera son treinta segundos en los que el cupo recuperado no
   * existe para nadie. Con esto el aviso sale con la cancelación; el worker
   * recoge lo que este camino no alcance (un proceso que muere entre el commit
   * y esta línea, o un cupo liberado por caducidad de un hold).
   *
   * ## Por qué fuera de la transacción, y por qué no puede lanzar
   *
   * Fuera, porque promover abre su propia transacción y emite avisos: hacerlo
   * dentro alargaría la ventana de bloqueo de la cita por trabajo que no es
   * suyo. Y sin lanzar, por la misma regla que ya gobierna los avisos de este
   * módulo: **la cancelación ya está confirmada**. Que la lista de espera falle
   * no puede convertir una cancelación exitosa en un error para quien canceló;
   * el cupo queda libre igual y el worker lo va a encontrar.
   */
  private async promoverListaDeEspera(slotId: string | null): Promise<void> {
    if (slotId === null) return;

    try {
      const resultado = await this.waitlist.promoteWaitlist(slotId);
      if (resultado.processed > 0) {
        this.logger.info(
          {
            operation: 'scheduling.booking.cancel.promote-waitlist',
            slotId,
            promoted: resultado.processed,
          },
          'Promoted waitlist candidates for the freed slot',
        );
      }
    } catch (error) {
      this.logger.warn(
        {
          operation: 'scheduling.booking.cancel.promote-waitlist',
          slotId,
          err: error,
        },
        'No se pudo promover la lista de espera del cupo liberado; queda para el worker',
      );
    }
  }

  /**
   * Marca el estado de pago de una cita — TAREA-13, punto 5.
   *
   * ## La regla de los dos ejes, que es lo que hace esto interesante
   *
   * El propietario la dio textual: el estado de pago **no es excluyente** con
   * pendiente, aceptada y realizada, pero **sí** lo es con rechazada y
   * cancelada. O sea que no es un estado más de la máquina de citas sino un
   * segundo eje que corre en paralelo, y por eso vive en su propia tabla.
   *
   * La mitad prohibitiva se comprueba **acá, en el servidor**, y responde 422.
   * Esconder el botón en la pantalla no es una regla: es una sugerencia que
   * cualquiera saltea con `curl`.
   *
   * ## Por qué es idempotente por reserva y no un registro por marca
   *
   * Hay **una fila por cita**, garantizada por el único de la base. Volver a
   * marcar la misma cita actualiza esa fila en vez de agregar otra: si hubiera
   * dos, no habría forma de decir cuál vale.
   *
   * Lo que **no** se pierde es la cadena de cambios: cada marca agrega una
   * revisión a `audit.appointment_bookings_history`, que es append-only. Pasar
   * de «pagada» a «pendiente» sobrescribe la fila pero deja la huella, y eso es
   * exactamente el «nada se pisa en silencio» de AC-13-10.
   *
   * ## El bloqueo
   *
   * La fila se carga con `FOR UPDATE`. Sin eso, dos peticiones simultáneas
   * leerían las dos «no hay fila», las dos intentarían insertar y la segunda
   * moriría contra el índice único con un 500 en vez de esperar su turno.
   *
   * @param bookingId - La cita que se marca.
   * @param dto - En qué estado queda y si se usó seguro.
   * @param actor - Quien marca; queda firmado en la fila.
   * @returns El estado de pago tal como quedó.
   * @throws PreconditionFailedException (422) si la cita está cancelada o rechazada.
   */
  async setPaymentState(
    bookingId: string,
    dto: SetPaymentStateDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentStateDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.set-payment-state',
        bookingId,
        state: dto.state,
      },
      'Marking booking payment state',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);

      if (ESTADOS_SIN_PAGO.includes(booking.statusConceptId)) {
        // El mensaje dice POR QUÉ y no sólo que no se puede: quien lo lee está
        // mirando una cita que alguien canceló y necesita entender que el
        // problema no es su permiso.
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar.',
          { bookingId, statusConceptId: booking.statusConceptId },
        );
      }

      const conceptoNuevo = PAYMENT_STATE_CONCEPT[dto.state];
      const usoSeguro = dto.insuranceUsed ?? false;
      const ahora = new Date();

      const existente = await this.bookingsRepo.findPaymentStateForUpdate(
        tx,
        bookingId,
      );
      const conceptoAnterior = existente?.statusConceptId ?? null;

      let fila: AppointmentPaymentStates;
      if (existente) {
        existente.statusConceptId = conceptoNuevo;
        existente.insuranceUsed = usoSeguro;
        existente.markedByUserId = actor.id;
        existente.markedAt = ahora;
        touch(existente, actor.id);
        fila = existente;
      } else {
        fila = tx.create(AppointmentPaymentStates, {
          id: randomUUID(),
          tenantId: booking.tenantId,
          appointmentBookingId: booking.id,
          statusConceptId: conceptoNuevo,
          insuranceUsed: usoSeguro,
          markedByUserId: actor.id,
          markedAt: ahora,
          // `createdBy` ya pone createdAt y updatedAt con el mismo instante.
          ...createdBy(actor.id, ahora),
          rowVersion: 1,
        });
        tx.persist(fila);
      }

      // La huella. Sin esto, volver a «pendiente» borraría que alguna vez
      // estuvo pagada, y marcar un pago es una afirmación sobre el dinero de
      // alguien.
      await this.historyRepo.append(tx, 'appointment_bookings', booking.id, {
        operationConceptId: SCHED.HISTORY_OP_PAYMENT_MARKED,
        dataSnapshot: {
          bookingId: booking.id,
          fromPaymentConceptId: conceptoAnterior,
          toPaymentConceptId: conceptoNuevo,
          insuranceUsed: usoSeguro,
        },
        changedByUserId: actor.id,
      });

      return proyectarEstadoDePago(fila);
    });
  }

  /**
   * El estado de pago de una cita, para leerlo.
   *
   * Devuelve `null` cuando **nadie lo marcó todavía**, que no es lo mismo que
   * «pendiente de pago»: pendiente es una afirmación que alguien firmó, y la
   * ausencia de fila es que del pago aún no se dijo nada.
   */
  async getPaymentState(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentStateDto | null> {
    const booking = await this.cargarParaOperar(this.em, bookingId, actor);
    const fila = await this.bookingsRepo.findPaymentState(this.em, booking.id);
    return fila ? proyectarEstadoDePago(fila) : null;
  }

  /**
   * El profesional **acepta** la solicitud: la cita queda confirmada
   * (corrección #11, segundo eslabón del P0).
   *
   * Es la contraparte de {@link requestBooking}. Recién acá hay compromiso, así
   * que recién acá se sella `confirmed_at`, la cita clínica pasa a `booked` y
   * se programan los recordatorios que la solicitud no programó.
   */
  async accept(
    bookingId: string,
    dto: AcceptBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.accept', bookingId },
      'Accepting booking request',
    );

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      await this.assertVinculoVigente(booking.tenantId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CONFIRMED);

      // REGLA MADRE (AG-1): decir «sí» acá compromete el tiempo del
      // profesional, así que hay que mirar TODAS sus agendas antes — no sólo
      // ésta. La propia reserva se excluye: aceptarse no es chocar consigo
      // misma.
      const recursoDeLaCita = booking.resourceId
        ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
        : null;
      if (
        recursoDeLaCita &&
        TABLAS_DE_PERFIL_PROFESIONAL.includes(recursoDeLaCita.resourceRefType)
      ) {
        const slotDeLaCita = await this.bookingsRepo.findSlotById(
          tx,
          booking.bookableSlotId,
        );
        if (slotDeLaCita) {
          await this.tiempoProfesional.assertRangoLibre(
            tx,
            recursoDeLaCita.resourceRefId,
            slotDeLaCita.startAt,
            slotDeLaCita.endAt ?? slotDeLaCita.startAt,
            booking.id,
          );
        }
      }

      const confirmedAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CONFIRMED;
      booking.confirmedAt = confirmedAt;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_BOOKED,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
        actorKind: 'PROVIDER',
      });

      // Los recordatorios se programan al aceptar y no al solicitar: recordar
      // un turno que todavía podía rechazarse sería prometer lo que nadie
      // comprometió.
      // P8: por omisión, víspera y dos horas antes. Aceptar sin recordatorios
      // dejaba el UC-41-13 dependiendo de que alguien los pidiera a mano, y el
      // registro del cliente pide el recordatorio como comportamiento, no como
      // opción. Un `[]` explícito sigue significando «ninguno».
      const offsets = dto.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS;
      const slot =
        offsets.length === 0
          ? null
          : await this.bookingsRepo.findSlotById(tx, booking.bookableSlotId);
      for (const offset of offsets) {
        if (!slot) break;
        this.bookingsRepo.createReminder(tx, {
          bookingId: booking.id,
          channelConceptId: CONCEPTS.REMINDER_CH_SMS,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      // REGLA 2: aceptar una desplaza a las otras que chocan.
      const desplazadas = await this.cancelarPendientesQueChocan(
        tx,
        booking,
        actor,
      );

      return {
        bookingId: booking.id,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        occurredAt: confirmedAt.toISOString(),
        desplazadas,
      };
    });

    // Fuera de la transacción a propósito (P8): un aviso que falla no puede
    // deshacer una cita que ya se confirmó. Ver `ports/agenda-notice.port.ts`.
    await this.avisarCambio(bookingId, 'ACCEPTED', undefined, 'PROVIDER');
    // Y un aviso por cada solicitud que este «sí» dejó sin efecto: el
    // paciente las pidió y tiene que enterarse de que ya no van, aunque él
    // no haya hecho nada. Uno por uno, porque cada una es de otro médico.
    for (const id of resultado.desplazadas) {
      await this.avisarCambio(id, 'CANCELLED', MOTIVO_DESPLAZADA, 'PROVIDER');
    }
    return resultado;
  }

  /**
   * Cancela las solicitudes del paciente que chocan con la que se acaba de
   * aceptar.
   *
   * ## Por qué existe
   *
   * Pedirle turno a varios médicos para la misma hora es cómo se consigue
   * turno: nadie sabe cuál va a decir que sí. Pero en cuanto uno acepta, las
   * demás dejaron de ser posibles —el paciente no puede estar en dos lados— y
   * si nadie las cierra quedan pendientes ocupando cupo, esperando una
   * respuesta que ya no importa, y bloqueando esos huecos para otra persona.
   *
   * ## Por qué sólo las PENDIENTES
   *
   * Una confirmada no se toca jamás desde acá: si el paciente ya tenía un
   * turno aceptado a esa hora, esta aceptación no debería haber ocurrido —la
   * regla 1 lo impide al pedir—, y cancelar automáticamente algo que otro
   * médico ya comprometió sería decidir por él. Ese caso se resuelve hablando,
   * no con una regla.
   *
   * ## Por qué el cupo se libera
   *
   * Porque la solicitud lo estaba reteniendo. Dejarlo tomado castigaría al
   * siguiente paciente por una cita que ya no va a existir.
   *
   * @param tx - Transacción en curso; va dentro de la misma que confirma.
   * @param aceptada - La cita que se acaba de confirmar.
   * @param actor - Quien aceptó.
   * @returns Los identificadores de las que se cancelaron.
   */
  private async cancelarPendientesQueChocan(
    tx: EntityManager,
    aceptada: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const slot = await this.bookingsRepo.findSlotById(
      tx,
      aceptada.bookableSlotId,
    );
    if (!slot) return [];

    const chocan = await this.bookingsRepo.findPatientBookingsOverlapping(
      tx,
      aceptada.patientProfileId,
      slot.startAt,
      slot.endAt ?? slot.startAt,
      PENDING_BOOKING_STATES,
      aceptada.id,
    );

    const canceladas: string[] = [];
    for (const otra of chocan) {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        otra.id,
      );
      if (!booking) continue;

      const previo = booking.statusConceptId;
      this.bookingsRepo.createCancellation(tx, {
        bookingId: booking.id,
        reasonConceptId: CONCEPTS.CANCEL_BY_PROVIDER,
        cancelledByUserId: actor.id,
        isNoShow: false,
        cancelledAt: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      booking.statusConceptId = CONCEPTS.BOOKING_CANCELLED;
      touch(booking, actor.id);
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: previo,
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        reasonText: MOTIVO_DESPLAZADA,
        actorKind: 'PROVIDER',
      });

      // El cupo vuelve a estar libre: lo retenía una solicitud que ya no va.
      const suSlot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        booking.bookableSlotId,
      );
      if (suSlot) {
        suSlot.remainingCapacity += 1;
        if (suSlot.statusConceptId === CONCEPTS.SLOT_HELD) {
          suSlot.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(suSlot, actor.id);
      }

      canceladas.push(booking.id);
    }

    return canceladas;
  }

  /**
   * El profesional **rechaza** la solicitud, con motivo (correcciones #11 y #14).
   *
   * Rechazar es cancelar desde el otro lado del mostrador, así que reusa el
   * mismo camino: libera el cupo, registra la cancelación con
   * `CANCEL_BY_PROVIDER` y deja el motivo en el historial, de donde el paciente
   * lo lee. Existe como acto propio porque en la agenda **es** otro acto —se
   * rechaza lo que todavía no se aceptó— y darle su nombre evita que la pantalla
   * tenga que explicar por qué «cancelar» aparece sobre una solicitud.
   */
  async reject(
    bookingId: string,
    dto: RejectBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.reject', bookingId },
      'Rejecting booking request',
    );

    return this.cancelarYAvisar(
      bookingId,
      { cancelledBy: 'PROVIDER', reasonText: dto.reasonText },
      actor,
      'REJECTED',
    );
  }

  /**
   * El centro **pide algo** antes de aceptar la solicitud — CARRIL 11.
   *
   * La especificación de centros de diagnóstico enumera tres cosas que un
   * centro puede pedir antes de confirmar: documentación adicional, una orden
   * médica, o avisar cómo hay que prepararse. Las tres son la misma situación
   * —falta algo— así que son una sola operación con un motivo tipado, y no tres
   * estados que después nadie sabe distinguir.
   *
   * **No cambia de estado si ya estaba pendiente.** La solicitud nace en
   * `PENDING_CONFIRMATION` y pedir un segundo papel no la mueve a ningún lado:
   * lo que cambia es el mensaje. La máquina rechaza `X → X` con razón, así que
   * la transición sólo se valida cuando de verdad la hay.
   *
   * **El cupo se mantiene tomado.** Pedirle un papel a alguien no es motivo
   * para regalarle su horario a otra persona mientras lo consigue.
   *
   * @param bookingId - Solicitud sobre la que se pide.
   * @param dto - Qué falta y el mensaje para la persona.
   * @param actor - Quien pide, del lado del prestador.
   * @returns El estado en el que quedó la solicitud.
   */
  async requestInfo(
    bookingId: string,
    dto: RequestBookingInfoDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    const motivo = requireReason(dto.reasonText, 'pedir documentación');

    this.logger.info(
      {
        operation: 'scheduling.booking.request-info',
        bookingId,
        infoRequested: dto.infoRequested,
      },
      'Requesting information before accepting',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.asegurarPendiente(fromState, bookingId);

      const ocurrioEn = new Date();
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.assertTransition(fromState, SCHED.BOOKING_PENDING_CONFIRMATION);
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
        touch(booking, actor.id);
      }

      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        reasonText: motivo,
        actorKind: 'PROVIDER',
        infoRequested: dto.infoRequested,
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        occurredAt: ocurrioEn.toISOString(),
        // Pedir documentación no acepta la solicitud, así que no puede chocar
        // con ninguna otra ni desplazarla: la lista va vacía a propósito, igual
        // que en las demás operaciones que dejan la cita pendiente.
        desplazadas: [],
      };
    });
  }

  /**
   * El centro **propone otro horario** para la solicitud — CARRIL 11.
   *
   * Mueve el cupo tomado al propuesto y deja la solicitud pendiente: proponer
   * no es acordar, y la persona todavía tiene que poder mirar el horario nuevo.
   * Por eso no confirma nada y el cupo queda tomado, no reservado.
   *
   * Se distingue de `reschedule` en quién y desde dónde: aquélla mueve una cita
   * **vigente** a pedido de quien la tiene, ésta contrapropone sobre una
   * solicitud que todavía no se aceptó.
   *
   * @param bookingId - Solicitud sobre la que se propone.
   * @param dto - El cupo propuesto y por qué.
   * @param actor - Quien propone, del lado del prestador.
   * @returns El cupo en el que quedó la solicitud.
   */
  async proposeSchedule(
    bookingId: string,
    dto: ProposeScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<ProposeScheduleResponseDto> {
    const motivo = requireReason(dto.reasonText, 'proponer otro horario');

    this.logger.info(
      {
        operation: 'scheduling.booking.propose-schedule',
        bookingId,
        toSlotId: dto.proposedSlotId,
      },
      'Proposing another slot for the request',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.asegurarPendiente(fromState, bookingId);

      const origenId = booking.bookableSlotId;
      if (dto.proposedSlotId === origenId) {
        throw new PreconditionFailedException(
          'El horario propuesto es el que ya tiene la solicitud',
          { bookingId },
        );
      }

      const destino = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.proposedSlotId,
      );
      if (!destino) {
        throw new ResourceNotFoundException('Cupo propuesto no encontrado', {
          slotId: dto.proposedSlotId,
        });
      }
      if (destino.remainingCapacity <= 0) {
        throw new ConflictException('El cupo propuesto no tiene lugar', {
          slotId: dto.proposedSlotId,
        });
      }

      const origen = await this.bookingsRepo.findSlotForUpdate(tx, origenId);
      if (origen) {
        origen.remainingCapacity += 1;
        if (origen.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          origen.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(origen, actor.id);
      }
      destino.remainingCapacity -= 1;
      if (destino.remainingCapacity === 0) {
        destino.statusConceptId = CONCEPTS.SLOT_HELD;
      }
      touch(destino, actor.id);

      booking.bookableSlotId = dto.proposedSlotId;
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.assertTransition(fromState, SCHED.BOOKING_PENDING_CONFIRMATION);
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
      }
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId: origenId,
        toSlotId: dto.proposedSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: origenId,
        toSlotId: dto.proposedSlotId,
        reasonText: motivo,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: origenId,
        toSlotId: dto.proposedSlotId,
      };
    });
  }

  /**
   * Exige que la solicitud siga esperando una respuesta del prestador.
   *
   * Pedir documentación o proponer otro horario sobre una cita ya aceptada, ya
   * rechazada o ya atendida no es una operación tardía: es otra cosa, y tiene
   * sus propios caminos (`reschedule`, `cancel`).
   *
   * @param fromState - Estado en el que está la reserva.
   * @param bookingId - Reserva evaluada, para el detalle del error.
   */
  private asegurarPendiente(fromState: string, bookingId: string): void {
    if (!PENDING_DECISION_STATES.includes(fromState)) {
      throw new PreconditionFailedException(
        'Sólo se opera así sobre una solicitud pendiente',
        { bookingId, statusConceptId: fromState },
      );
    }
  }

  /**
   * El profesional **inicia** la atención (corrección #15).
   *
   * **Sin validación de reloj, y es lo importante**: una cita confirmada se
   * puede empezar en cualquier momento. Las únicas comprobaciones son de estado
   * —solo se inicia una confirmada o con llegada registrada— y de actor —solo
   * quien atiende esa agenda—. Nunca de fecha.
   */
  async start(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.start', bookingId },
      'Starting appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

      booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_CHECKED_IN,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_IN_PROGRESS,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_IN_PROGRESS,
        occurredAt: new Date().toISOString(),
        // Empezar la atención no desplaza nada: la regla 2 es de `accept`.
        desplazadas: [],
      };
    });
  }

  /**
   * El cuerpo transaccional de {@link start}, para casos de uso que ya
   * cargaron la reserva y abrieron su propia transacción — el paso final del
   * mostrador atómico (AC-3.3), que confirma y arranca en el mismo `tx`.
   *
   * No vuelve a cargar la reserva: el llamador ya la tiene (acaba de
   * confirmarla), así que evita un `SELECT` redundante.
   *
   * @param tx - Contexto transaccional ya abierto por el llamador.
   * @param booking - La reserva recién confirmada, en estado `CONFIRMED`.
   * @param actor - Quien opera.
   */
  async iniciarEnTransaccion(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const fromState = booking.statusConceptId;
    this.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

    booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
    touch(booking, actor.id);
    await this.sincronizarCitaClinica(
      tx,
      booking,
      CLIN.APPOINTMENT_CHECKED_IN,
      actor,
    );
    await this.recordTransition(tx, booking, actor, {
      bookingId: booking.id,
      fromStateConceptId: fromState,
      toStateConceptId: SCHED.BOOKING_IN_PROGRESS,
      actorKind: 'PROVIDER',
    });
  }

  /**
   * El profesional **completa** la atención (corrección #15).
   *
   * Tampoco valida el reloj: se cierra la que está en curso, sin importar si
   * llegó o no el día agendado. El paciente ve «completada» apenas ocurre —el
   * listado por omisión incluye ese estado, ver {@link VISIBLE_BOOKING_STATES}—
   * sin re-seed ni refresco artificial.
   */
  async complete(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.complete', bookingId },
      'Completing appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_COMPLETED);

      booking.statusConceptId = SCHED.BOOKING_COMPLETED;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_FULFILLED,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_COMPLETED,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_COMPLETED,
        occurredAt: new Date().toISOString(),
        // Ídem: completar tampoco desplaza. Ver `accept`.
        desplazadas: [],
      };
    });
  }

  /** UC-41-10: registra la llegada del paciente. */
  async checkIn(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.check-in', bookingId },
      'Checking in',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      // C-10: la máquina de estados sólo admite check-in desde CONFIRMED.
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CHECKED_IN);

      const checkedInAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CHECKED_IN;
      booking.checkedInAt = checkedInAt;
      touch(booking, actor.id);
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CHECKED_IN,
      });

      return { bookingId, checkedInAt: checkedInAt.toISOString() };
    });
  }

  /**
   * Guarda de la máquina de estados de cita (C-10): rechaza cualquier transición
   * que la máquina no declara con `PreconditionFailedException`
   * (INVALID_STATE_TRANSITION). Es lo que impide, por ejemplo, hacer check-in de
   * una cita cancelada o completar una que nunca empezó.
   */
  private assertTransition(from: string, to: string): void {
    if (!isValidBookingTransition(from, to)) {
      throw new PreconditionFailedException(
        'Transición de estado de cita no permitida',
        {
          failureCode: 'INVALID_STATE_TRANSITION',
          fromStateConceptId: from,
          toStateConceptId: to,
        },
      );
    }
  }

  /**
   * Registra la transición en el historial existente
   * (`audit.appointment_bookings_history`). Se llama tras validar la transición y
   * aplicar el nuevo estado, con el estado de origen capturado antes de mutar.
   *
   * El snapshot va tipado (`BookingTransitionSnapshot`) porque desde la
   * corrección #14 no lleva solo los dos estados: lleva también el motivo y
   * desde qué lado se hizo el cambio, y la lectura los busca por nombre.
   */
  private async recordTransition(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
    snapshot: BookingTransitionSnapshot,
  ): Promise<void> {
    // C-10: versiona la transición vía el historial del módulo audit (contrato de
    // dominio), no escribiendo su tabla directamente (evita DIRECT_CROSS_DOMAIN).
    await this.historyRepo.append(tx, 'appointment_bookings', booking.id, {
      operationConceptId: SCHED.HISTORY_OP_STATE_TRANSITION,
      dataSnapshot: snapshot,
      changedByUserId: actor.id,
    });
  }

  /**
   * Carga la cita para operarla y comprueba **quién** puede hacerlo.
   *
   * ## Por qué el actor se valida acá y no solo en el `@Roles`
   *
   * El guard de roles responde «¿es un profesional?», no «¿es *el* profesional
   * de esta cita?». Sin esta comprobación, cualquier cuenta con rol clínico
   * podría aceptar, iniciar o cerrar el turno de un colega, que es exactamente
   * la clase de cosa que el rol solo no alcanza a impedir.
   *
   * Quien administra la agenda (`SCHEDULING_ADMIN`/`SCHEDULING_AGENT`) sí opera
   * cualquier cita: ese **es** su trabajo. Un profesional, solo las de su
   * recurso; y si su cuenta no declara perfil profesional, ninguna.
   *
   * @throws ResourceNotFoundException si la cita no existe.
   * @throws ForbiddenActionException si la cita no es de quien la opera.
   */
  private async cargarParaOperar(
    tx: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    const booking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      bookingId,
    );
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }

    if (this.operaCualquierAgenda(actor)) {
      return booking;
    }

    const recurso = booking.resourceId
      ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
      : null;
    const esSuAgenda =
      actor.practitionerProfileId !== undefined &&
      recurso !== null &&
      recurso.resourceRefId === actor.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(recurso.resourceRefType);

    if (!esSuAgenda) {
      // Mismo mecanismo que usa `community` para «este perfil no es tuyo»: el
      // `ForbiddenException` de Nest, que el filtro traduce a 403 FORBIDDEN.
      throw new ForbiddenException(
        'Esta cita es de otra agenda: solo la opera quien atiende en ella.',
      );
    }
    return booking;
  }

  /**
   * Avisa del cambio de estado a quien no lo provocó (P8, tareas 4 y 5).
   *
   * ## A quién
   *
   * Al paciente, salvo cuando fue él quien canceló o reprogramó: en ese caso el
   * que necesita enterarse es el profesional. Avisarle al paciente de su propia
   * cancelación sería ruido, y no avisarle al profesional lo dejaría con un
   * hueco en la agenda que nadie le anunció.
   *
   * ## Por qué no lanza
   *
   * Porque se invoca **después** de que la transacción cerró y el estado ya es
   * el nuevo. Un fallo del canal se registra y se descarta: la regla del README
   * es que emitir jamás rompa una reserva. Ver `ports/agenda-notice.port.ts`.
   */
  private async avisarCambio(
    bookingId: string,
    cambio: CambioDeCita,
    motivo: string | undefined,
    actorKind: BookingActorKind,
  ): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    const alProfesional = actorKind === 'PATIENT';
    const destinatario = alProfesional
      ? await this.noticeRepo.findResourceAccount(em, booking.resourceId)
      : null;

    if (alProfesional && destinatario === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay destinatario.
      this.logger.info(
        { operation: 'scheduling.notice.change', bookingId, cambio },
        'El recurso de la cita no tiene profesional al que avisar',
      );
      return;
    }

    await this.notices.emit(
      avisoDeCambioDeCita(
        booking,
        cambio,
        motivo,
        alProfesional
          ? { userId: destinatario as string }
          : { patientProfileId: booking.patientProfileId },
      ),
    );
  }

  /** Si el actor administra agendas ajenas por oficio. */
  /**
   * Exige que el vínculo con la organización siga vigente para comprometer un
   * turno suyo.
   *
   * ## Por qué hace falta si publicar ya estaba bloqueado
   *
   * Publicar y aceptar ocurren en momentos distintos. Un médico publica su
   * agenda con el vínculo aprobado y meses después la organización se lo
   * revoca: la agenda ya está publicada y los pedidos siguen entrando. Sin esta
   * comprobación seguiría comprometiendo turnos en nombre de una institución
   * que ya no lo reconoce.
   *
   * ## Las citas ya confirmadas no se caen solas
   *
   * Esto bloquea aceptar de acá en adelante; **no toca** las que ya estaban
   * confirmadas. Cancelarlas en bloque al revocar un vínculo dejaría plantados a
   * pacientes que tenían un turno prometido, por un trámite entre el médico y la
   * organización del que no fueron parte. Avisarles es responsabilidad de la
   * organización y del médico.
   *
   * Por lo mismo **no se instrumentan `start` ni `check-in`**: llegado ese
   * momento el paciente ya está en la puerta, y negarle la atención por un
   * vínculo administrativo lo castiga a él, no a quien corresponde.
   *
   * @param tenantId - La organización dueña de la reserva.
   * @param actor - Quien acepta.
   * @throws PreconditionFailedException si el vínculo no está vigente.
   */
  private async assertVinculoVigente(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.operaCualquierAgenda(actor)) return;

    const veredicto = await this.vinculos.evaluar(tenantId, actor);
    if (veredicto === 'sin-vinculos' || veredicto === 'aprobado') return;

    throw new PreconditionFailedException(
      veredicto === 'pendiente'
        ? 'Tu vínculo con esta organización todavía está pendiente de ' +
            'aprobación, así que todavía no podés comprometer turnos suyos.'
        : 'Tu vínculo con esta organización ya no está vigente, así que no ' +
            'podés aceptar turnos suyos. Las citas que ya confirmaste siguen ' +
            'en pie: hablá con la organización para reactivarlo.',
      { tenantId, vinculo: veredicto },
    );
  }

  private operaCualquierAgenda(actor: AuthenticatedUser): boolean {
    return actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol));
  }

  /**
   * Mantiene la cita clínica al día con el estado de la reserva.
   *
   * Son dos filas que cuentan lo mismo desde dos módulos, y desincronizarlas
   * tiene consecuencias visibles: el archivo del paciente (carril 09) lee
   * `clinical.appointments`, así que una cita atendida que allí siguiera
   * diciendo `booked` se leería como un turno al que nadie fue.
   *
   * Si la reserva no tiene cita clínica detrás no hace nada: pasa con las
   * reservas anteriores a que existiera ese vínculo, y no es un error.
   */
  private async sincronizarCitaClinica(
    tx: EntityManager,
    booking: AppointmentBookings,
    statusConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (booking.appointmentId === undefined) {
      return;
    }
    const cita = await this.appointmentsRepo.findById(
      tx,
      booking.appointmentId,
    );
    if (!cita) {
      return;
    }
    cita.statusConceptId = statusConceptId;
    touch(cita, actor.id);
  }

  /**
   * Desde qué lado del mostrador actúa quien hace el cambio.
   *
   * Se decide por rol y no por la pantalla que llamó: un paciente que cancela su
   * propio turno tiene el rol `PATIENT` y nada más, mientras que quien atiende
   * —profesional, agente de agenda, administración— siempre trae alguno de los
   * roles del prestador. La duda se resuelve del lado del prestador: decirle al
   * paciente «lo cancelaste vos» cuando no fue así es peor que lo contrario.
   */
  private actorKind(actor: AuthenticatedUser): BookingActorKind {
    const esDelPrestador = actor.roles.some((rol) =>
      ROLES_DEL_PRESTADOR.includes(rol),
    );
    return esDelPrestador ? 'PROVIDER' : 'PATIENT';
  }

  /**
   * UC-41-15: listado de citas por paciente, recurso y/o ventana temporal.
   *
   * Es la lectura complementaria de la agenda: sin ella una pantalla podía
   * crear una cita pero no volver a encontrarla, y el paciente no tenía forma
   * de ver "mis próximas citas".
   *
   * Exige al menos un filtro a propósito: una consulta sin acotar devolvería
   * las citas de todos los pacientes de todos los tenants, que es justo lo que
   * un listado de PHI no debe hacer por descuido.
   *
   * @param filters - Paciente, recurso, ventana y si se incluyen las canceladas.
   * @param limit - Tope de filas.
   * @returns Citas que casan, con el instante resuelto desde su slot.
   * @throws PreconditionFailedException si no se acota o la ventana es inválida.
   */
  async searchBookings(
    filters: {
      /** Paciente titular. */
      patientProfileId?: string;
      /** Recurso (agenda). */
      resourceId?: string;
      /** Inicio de la ventana. */
      from?: Date;
      /** Fin de la ventana. */
      to?: Date;
      /** Incluir también las canceladas; por defecto no. */
      includeCancelled: boolean;
    },
    limit: number,
    actor?: AuthenticatedUser,
  ): Promise<SearchBookingsResponseDto> {
    if (!filters.patientProfileId && !filters.resourceId) {
      throw new PreconditionFailedException(
        'Indique al menos patientProfileId o resourceId para listar citas',
      );
    }
    if (filters.from && filters.to && !(filters.from < filters.to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
        },
      );
    }

    const em = this.em.fork();
    const { rows, fetchCapReached } = await this.bookingsRepo.findBookings(
      em,
      {
        patientProfileId: filters.patientProfileId,
        resourceId: filters.resourceId,
        from: filters.from,
        to: filters.to,
        // Sin esto una agenda mostraría como ocupados los huecos de citas que
        // ya se cancelaron.
        statusConceptIds: filters.includeCancelled
          ? undefined
          : [...VISIBLE_BOOKING_STATES],
      },
      limit + 1,
    );
    // Dos formas de quedarse corto, y las dos se declaran: sobrar filas para
    // esta página, o que la lectura previa al filtro por ventana agotara su
    // tope. La segunda no se ve en `rows.length` —el filtro pudo dejar menos de
    // `limit`— y callarla devolvería una agenda incompleta como si fuera toda.
    const truncated = rows.length > limit || fetchCapReached;
    const page = rows.length > limit ? rows.slice(0, limit) : rows;

    // Los motivos de la página, en **una** consulta (corrección #14): pedir el
    // historial cita por cita convertiría un listado de 100 en 101 consultas.
    const motivos = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      tieneMotivo,
    );
    // Segunda pasada sobre el mismo historial, con otro predicado: la demora
    // (P8) no es un motivo de cambio de estado y `latestBySource` devuelve una
    // revisión por agregado, así que pedir las dos cosas juntas dejaría fuera
    // la que llegó antes.
    const demoras = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      esDemora,
    );

    const origenes = await this.bookingsRepo.latestRescheduleOrigins(
      em,
      page.map(({ booking }) => booking.id),
    );

    // Los recursos de la página, en lote y sólo si el actor es un profesional:
    // es lo único que puede convertir «esta cita es de alguien» en «esta cita
    // es MÍA» para decidir el motivo. Un paciente no los necesita.
    const duenosDeAgenda = new Map<string, string>();
    if (actor?.practitionerProfileId !== undefined) {
      const ids = [
        ...new Set(
          page
            .map(({ booking }) => booking.resourceId)
            .filter((id): id is string => id !== undefined),
        ),
      ];
      for (const id of ids) {
        const recurso = await this.catalogRepo.findResourceById(em, id);
        if (recurso) duenosDeAgenda.set(id, recurso.resourceRefId);
      }
    }

    // La tipología de la página, en lote. Sólo las citas que llegaron a tener
    // contraparte clínica la tienen: una reserva sin confirmar no crea
    // `clinical.appointments`, así que su id no entra en la consulta.
    const idsDeCitas = [
      ...new Set(
        page
          .map(({ booking }) => booking.appointmentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const tipos = await this.appointmentsRepo.findTypesByIds(em, idsDeCitas);

    // El encuentro clínico de cada cita, en lote (subtarea 4.3): mismos ids
    // que la tipología, misma razón — cien consultas más por página, no.
    const encuentros = await this.encountersRepo.findLatestIdsByAppointmentIds(
      em,
      idsDeCitas,
    );

    // Los nombres, en lote y sólo cuando alguien va a poder verlos: si el actor
    // no es profesional ni titular, la proyección los descartaría igual y la
    // consulta sería trabajo tirado.
    const nombres =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.bookingsRepo.findPatientNames(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // El estado de pago de la página, en lote (TAREA-13 punto 5). Una consulta
    // para toda la página, no una por fila.
    const pagos = await this.bookingsRepo.findPaymentStatesForBookings(
      em,
      page.map(({ booking }) => booking.id),
    );

    // La aseguradora de cada paciente, en lote (ALV-021). Sólo se pide para
    // quien de todos modos va a poder ver el nombre del paciente: es el mismo
    // dato de privacidad, y pedirla para el resto sería trabajo tirado.
    const aseguradoras =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.coverageRepo.findActiveCarriersByPatients(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // La solicitud de seguro de cada cita, en lote y con la misma compuerta
    // que la aseguradora: es otro dato del paciente, y pedirlo para quien no lo
    // va a ver sería trabajo tirado. Tres consultas fijas por página.
    const solicitudes =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.solicitudesDeSeguroPorCita(em, idsDeCitas)
        : new Map<string, BookingInsuranceClaimDto>();

    return {
      items: page.map(({ booking, slot }) =>
        this.aBookingItem(
          booking,
          slot,
          motivos.get(booking.id),
          demoras.get(booking.id),
          actor,
          booking.resourceId
            ? duenosDeAgenda.get(booking.resourceId)
            : undefined,
          origenes.get(booking.id),
          nombres.get(booking.patientProfileId),
          booking.appointmentId == null
            ? undefined
            : tipos.get(booking.appointmentId),
          pagos.get(booking.id),
          aseguradoras,
          booking.appointmentId == null
            ? undefined
            : encuentros.get(booking.appointmentId),
          solicitudes,
        ),
      ),
      count: page.length,
      limit,
      truncated,
    };
  }

  /**
   * UC-41-15: una cita concreta.
   *
   * @param bookingId - Cita a leer.
   * @returns La cita con su instante resuelto desde el slot.
   * @throws ResourceNotFoundException si no existe.
   */
  async getBookingById(
    bookingId: string,
    actor?: AuthenticatedUser,
  ): Promise<BookingItemDto> {
    const em = this.em.fork();
    const booking = await this.bookingsRepo.findBookingById(em, bookingId);
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }
    const slot = booking.bookableSlotId
      ? await this.bookingsRepo.findSlotById(em, booking.bookableSlotId)
      : null;
    const motivos = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      tieneMotivo,
    );
    const demoras = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      esDemora,
    );

    const origenes = await this.bookingsRepo.latestRescheduleOrigins(em, [
      booking.id,
    ]);

    // Sólo se busca el recurso si hace falta para decidir el motivo: un
    // paciente titular ya tiene permiso sin mirar la agenda.
    const recurso =
      booking.resourceId && actor?.practitionerProfileId !== undefined
        ? await this.catalogRepo.findResourceById(em, booking.resourceId)
        : null;

    // El detalle tiene que decir exactamente lo mismo que el listado, así que
    // la tipología también se resuelve acá. Una sola cita: el lote de uno es la
    // misma consulta.
    const tipos =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.appointmentsRepo.findTypesByIds(em, [
            booking.appointmentId,
          ]);

    // El encuentro de la cita, mismo criterio (subtarea 4.3): lote de uno.
    const encuentros =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.encountersRepo.findLatestIdsByAppointmentIds(em, [
            booking.appointmentId,
          ]);

    return this.aBookingItem(
      booking,
      slot,
      motivos.get(booking.id),
      demoras.get(booking.id),
      actor,
      recurso?.resourceRefId,
      origenes.get(booking.id),
      undefined,
      booking.appointmentId == null
        ? undefined
        : tipos.get(booking.appointmentId),
      undefined,
      undefined,
      booking.appointmentId == null
        ? undefined
        : encuentros.get(booking.appointmentId),
    );
  }

  /**
   * Una cita como la devuelven las dos lecturas.
   *
   * Está en un solo lugar porque el listado y el detalle tienen que decir
   * exactamente lo mismo: cuando el mapeo estaba duplicado, agregar un campo en
   * uno y olvidarlo en el otro hacía que el detalle contradijera a la fila que
   * lo abrió.
   */
  /**
   * ¿Puede este actor leer el **motivo de consulta** de esta cita?
   *
   * Sólo el paciente titular y el profesional que la atiende. Ni la
   * organización, ni otro médico, ni un administrador: por qué alguien pide un
   * turno es un dato clínico, y una agenda de organización que lo muestre
   * convierte un listado operativo en una lista de diagnósticos presuntos.
   *
   * **No** es lo mismo que el motivo de CANCELACIÓN (`statusReason`), que sí es
   * visible para las dos partes: ahí el interés es saber por qué se cayó el
   * turno, y quien lo escribió sabía que el otro lado lo iba a leer.
   *
   * Vive acá —en la proyección, un solo lugar— para que cualquier lectura
   * futura lo herede sin acordarse. Es lo que hace que la agenda de la
   * organización (TP-5) nazca sin la fuga.
   */
  private puedeVerElMotivo(
    booking: AppointmentBookings,
    actor?: AuthenticatedUser,
    profesionalDeLaAgenda?: string,
  ): boolean {
    if (!actor) return false;
    if (
      actor.patientProfileId !== undefined &&
      actor.patientProfileId === booking.patientProfileId
    ) {
      return true;
    }
    // El profesional que atiende. La cita no lo guarda: cuelga del recurso
    // (`resource_ref_id`), así que lo aporta quien proyecta — que es el único
    // que sabe si ya lo tenía cargado o no vale la pena buscarlo.
    return (
      actor.practitionerProfileId !== undefined &&
      profesionalDeLaAgenda !== undefined &&
      actor.practitionerProfileId === profesionalDeLaAgenda
    );
  }

  /**
   * La solicitud de seguro más reciente de cada cita, indexada por `appointmentId`.
   *
   * El camino es cita → encuentros → solicitudes, y se recorre en lote: una
   * consulta por salto, no una por fila. Se miran **todos** los encuentros de
   * la cita y no sólo el último, porque la solicitud puede colgar de
   * cualquiera. El repositorio ya devuelve las solicitudes ordenadas de la más
   * reciente a la más vieja, así que la primera que aparece por cita es la que
   * gana.
   *
   * Una cita sin solicitud no entra en el mapa: quien proyecta traduce esa
   * ausencia a `null`.
   *
   * @param em - Contexto de persistencia.
   * @param idsDeCitas - Citas clínicas de la página, sin repetidos.
   * @returns Mapa `appointmentId` → resumen de la solicitud.
   */
  private async solicitudesDeSeguroPorCita(
    em: EntityManager,
    idsDeCitas: readonly string[],
  ): Promise<Map<string, BookingInsuranceClaimDto>> {
    const porCita = new Map<string, BookingInsuranceClaimDto>();
    if (idsDeCitas.length === 0) return porCita;

    const encuentrosPorCita = await this.encountersRepo.findIdsByAppointmentIds(
      em,
      idsDeCitas,
    );
    const citaPorEncuentro = new Map<string, string>();
    for (const [cita, encuentros] of encuentrosPorCita) {
      for (const encuentro of encuentros) {
        citaPorEncuentro.set(encuentro, cita);
      }
    }
    if (citaPorEncuentro.size === 0) return porCita;

    const resumenes = await this.claimReadRepo.findSummariesByEncounterIds(em, [
      ...citaPorEncuentro.keys(),
    ]);
    for (const resumen of resumenes) {
      const cita = citaPorEncuentro.get(resumen.encounterId);
      if (cita === undefined || porCita.has(cita)) continue;
      porCita.set(cita, {
        id: resumen.id,
        claimIdentifier: resumen.claimIdentifier,
        statusCode: resumen.statusCode,
        statusDisplay: resumen.statusDisplay,
        submittedAt: resumen.submittedAt?.toISOString() ?? null,
      });
    }
    return porCita;
  }

  private aBookingItem(
    booking: AppointmentBookings,
    slot: { startAt: Date; endAt?: Date } | null,
    motivo: HistoryRevision | undefined,
    demora?: HistoryRevision,
    actor?: AuthenticatedUser,
    profesionalDeLaAgenda?: string,
    reprogramadaDesde?: Date,
    nombreDelPaciente?: string,
    tipoDeLaCita?: string,
    estadoDePago?: AppointmentPaymentStates,
    aseguradoraPorPaciente?: Map<string, string>,
    encuentroDeLaCita?: string,
    solicitudPorCita?: Map<string, BookingInsuranceClaimDto>,
  ): BookingItemDto {
    return {
      id: booking.id,
      patientProfileId: booking.patientProfileId,
      resourceId: booking.resourceId,
      bookableSlotId: booking.bookableSlotId,
      // El puente hacia `clinical`: es lo que el check-in de un encuentro
      // acepta como `appointmentId`. `?? null` y no la ausencia, porque el
      // contrato lo declara nullable y omitirlo obligaría a distinguir «no
      // hay cita» de «no me lo dijeron», que acá son lo mismo.
      appointmentId: booking.appointmentId ?? null,
      // Siempre presente, igual que `appointmentId`: `null` es «sin cita» o
      // «cita sin encuentro» — el frente cruza este id con
      // `ChartNote.encounterId` sin estimar por fecha.
      encounterId: encuentroDeLaCita ?? null,
      // Se OMITE cuando nadie lo marcó, y no viaja como «pendiente»: pendiente
      // de pago es una afirmación que alguien firmó, y la ausencia es que del
      // pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`.
      ...(estadoDePago
        ? { paymentState: proyectarEstadoDePago(estadoDePago) }
        : {}),
      startAt: slot?.startAt ?? null,
      endAt: slot?.endAt ?? null,
      statusConceptId: booking.statusConceptId,
      serviceConceptId: booking.serviceConceptId,
      bookingChannelConceptId: booking.bookingChannelConceptId,
      confirmedAt: booking.confirmedAt,
      checkedInAt: booking.checkedInAt,
      // El motivo de consulta se omite salvo para el titular y su médico. Se
      // omite, no se vacía: un `''` diría «no escribió motivo», que es una
      // afirmación distinta y falsa.
      ...(this.puedeVerElMotivo(booking, actor, profesionalDeLaAgenda)
        ? { reasonText: booking.reasonText }
        : {}),
      // El nombre viaja con la MISMA regla que el motivo: lo ve el titular y el
      // profesional que atiende, no la vista de la organización. El médico
      // necesita saber a quién espera —es el pedido explícito del registro del
      // cliente— y la organización ya opera con el identificador.
      ...(nombreDelPaciente !== undefined &&
      this.puedeVerElMotivo(booking, actor, profesionalDeLaAgenda)
        ? { patientName: nombreDelPaciente }
        : {}),
      // ALV-021: misma compuerta que el nombre. `null` es «se buscó y no
      // tiene» —Particular—; el campo entero se omite cuando quien mira no
      // puede ver al paciente, que es una pregunta distinta.
      ...(aseguradoraPorPaciente !== undefined &&
      this.puedeVerElMotivo(booking, actor, profesionalDeLaAgenda)
        ? {
            insuranceCarrierName:
              aseguradoraPorPaciente.get(booking.patientProfileId) ?? null,
          }
        : {}),
      // La solicitud de seguro de la cita, con la misma compuerta y el mismo
      // trato del `null` que la aseguradora: `null` es «se buscó y no hay»
      // —también cuando la reserva todavía no tiene cita clínica, que no puede
      // tener solicitud—; ausente es «quien mira no puede verlo».
      ...(solicitudPorCita !== undefined &&
      this.puedeVerElMotivo(booking, actor, profesionalDeLaAgenda)
        ? {
            insuranceClaim:
              booking.appointmentId == null
                ? null
                : (solicitudPorCita.get(booking.appointmentId) ?? null),
          }
        : {}),
      // La tipología viaja siempre que exista: no es dato clínico —es qué
      // clase de actividad ocupa el rato, lo mismo que ya dice la duración del
      // bloque— y sin ella la agenda del día no puede pintar una operación
      // distinto de una consulta. El motivo de consulta, que sí lo es, sigue
      // con su regla de arriba.
      ...(tipoDeLaCita === undefined ? {} : { typeConceptId: tipoDeLaCita }),
      ...(reprogramadaDesde ? { rescheduledFrom: reprogramadaDesde } : {}),
      statusReason: aStatusReason(motivo),
      delayNotice: aDelayNotice(demora),
      createdAt: booking.createdAt,
    };
  }

  /**
   * Crea la cita clínica que respalda una reserva confirmada.
   *
   * ## Por qué existe
   *
   * `clinical.appointments` era una tabla **que nadie escribía**: 0 filas, y
   * ninguna reserva con `appointment_id`. Eso dejaba rota una cadena entera —el
   * check-in de un encuentro declara `appointmentId` hacia esta tabla— así que
   * un encuentro nunca podía decir de qué turno venía. La columna existía, el
   * contrato la pedía, y no había forma de llenarla.
   *
   * ## Por qué al confirmar, y no en el check-in
   *
   * Porque una cita **es** el turno visto desde lo clínico, no el registro de
   * que alguien llegó — eso es el encuentro, que es otra tabla. Crearla en el
   * check-in la haría nacer *después* del encuentro que la referencia, que es el
   * vínculo al revés. El costo aceptado es que una reserva que nadie atienda
   * deja su cita en `APPT_BOOKED`, que es exactamente lo que pasó: un turno
   * agendado al que no se presentaron.
   *
   * ## El profesional sale del recurso, si el recurso es de uno
   *
   * Un recurso puede ser una sala o un equipo. Sólo se copia el profesional
   * cuando el recurso declara apuntar a un perfil profesional; si no, la cita
   * queda sin él en vez de con el uuid de una sala, que sería una clave foránea
   * rota y un dato falso.
   *
   * @param tx - Transacción de la confirmación; la cita nace o no nace con ella.
   * @param datos - Lo que la reserva sabe del turno.
   * @returns La cita creada, para enlazarla desde la reserva.
   */
  private crearCitaClinica(
    tx: EntityManager,
    datos: {
      tenantId: string;
      patientProfileId: string;
      resourceRefType?: string;
      resourceRefId?: string;
      startAt: Date;
      endAt?: Date;
      reasonText?: string;
      /** Estado clínico con el que nace: pendiente si se solicitó, reservada si se confirmó. */
      statusConceptId: string;
      /**
       * Por qué medio ocurre la atención. Ausente = presencial, que es lo que
       * fueron todas las citas hasta que existió este conjunto: no se escribe
       * un valor que nadie eligió.
       */
      channelConceptId?: string;
      actorUserId?: string;
    },
  ): Appointments {
    const esDeProfesional =
      datos.resourceRefType !== undefined &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(datos.resourceRefType);

    return this.appointmentsRepo.create(tx, {
      patientProfileId: datos.patientProfileId,
      tenantId: datos.tenantId,
      ...(esDeProfesional && datos.resourceRefId !== undefined
        ? { practitionerProfileId: datos.resourceRefId }
        : {}),
      statusConceptId: datos.statusConceptId,
      startAt: datos.startAt,
      ...(datos.endAt === undefined ? {} : { endAt: datos.endAt }),
      ...(datos.reasonText === undefined
        ? {}
        : { reasonText: datos.reasonText }),
      ...(datos.channelConceptId === undefined
        ? {}
        : { channelConceptId: datos.channelConceptId }),
      ...(datos.actorUserId === undefined
        ? {}
        : { actorUserId: datos.actorUserId }),
    });
  }

  /** Política efectiva del slot, heredada de su plantilla. */
  private async resolvePolicy(tx: EntityManager, templateId: string) {
    const template = await this.catalogRepo.findTemplateById(tx, templateId);
    if (!template?.bookingPolicyId) return null;
    return this.catalogRepo.findPolicyById(tx, template.bookingPolicyId);
  }
}

/**
 * El snapshot de una revisión, si tiene la forma que este módulo escribe.
 *
 * La columna es `jsonb` y llega como `unknown`: puede traer lo que haya escrito
 * cualquier versión anterior. Se comprueba en vez de castear, porque una cita de
 * antes de la corrección #14 tiene snapshot sin motivo y eso es normal, no un
 * error.
 */
function leerSnapshot(
  revision: HistoryRevision,
): BookingTransitionSnapshot | null {
  const snapshot: unknown = revision.dataSnapshot;
  if (typeof snapshot !== 'object' || snapshot === null) {
    return null;
  }
  return snapshot as BookingTransitionSnapshot;
}

/** Si la revisión explica el cambio: es la que se le muestra a la otra parte. */
function tieneMotivo(revision: HistoryRevision): boolean {
  const motivo = leerSnapshot(revision)?.reasonText;
  return typeof motivo === 'string' && motivo.trim().length > 0;
}

/**
 * Si la revisión es una demora informada (P8).
 *
 * Se reconoce por sus minutos y no por el concepto de operación porque el
 * predicado sólo ve el snapshot; los minutos son, además, lo único sin lo cual
 * la demora no se puede mostrar.
 */
function esDemora(revision: HistoryRevision): boolean {
  const minutos = leerSnapshot(revision)?.delayMinutes;
  return typeof minutos === 'number' && minutos > 0;
}

/**
 * La demora tal como sale por la API.
 *
 * `undefined` cuando no hay ninguna: quien la consuma tiene que poder preguntar
 * «¿se demora?» sin inspeccionar campos vacíos, igual que con el motivo.
 */
function aDelayNotice(
  revision: HistoryRevision | undefined,
): BookingDelayNoticeDto | undefined {
  if (!revision) return undefined;
  const snapshot = leerSnapshot(revision);
  const minutos = snapshot?.delayMinutes;
  if (typeof minutos !== 'number' || minutos <= 0) return undefined;

  const mensaje = snapshot?.reasonText;
  return {
    delayMinutes: minutos,
    ...(typeof mensaje === 'string' && mensaje.trim().length > 0
      ? { message: mensaje }
      : {}),
    announcedAt: revision.recordedAt,
  };
}

/**
 * El motivo tal como sale por la API.
 *
 * `undefined` —y no un objeto con campos vacíos— cuando no hay ninguno: quien
 * lo consuma tiene que poder preguntar «¿hay motivo?» sin inspeccionar el
 * contenido.
 */
function aStatusReason(
  revision: HistoryRevision | undefined,
): BookingStatusReasonDto | undefined {
  if (!revision) return undefined;
  const snapshot = leerSnapshot(revision);
  const motivo = snapshot?.reasonText;
  if (typeof motivo !== 'string' || motivo.trim().length === 0) {
    return undefined;
  }

  return {
    reasonText: motivo,
    ...(snapshot?.actorKind === undefined
      ? {}
      : { actorKind: snapshot.actorKind }),
    ...(snapshot?.toStateConceptId === undefined
      ? {}
      : { toStateConceptId: snapshot.toStateConceptId }),
    changedAt: revision.recordedAt,
  };
}
