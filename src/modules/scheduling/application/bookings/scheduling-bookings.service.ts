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
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../infrastructure/repositories';
import { PractitionerAffiliationGateService } from '../affiliation/practitioner-affiliation-gate.service';
import { canSeeBookingReason } from '../../domain/booking/booking-reason-visibility.policy';
import { SchedulingProfessionalTimeService } from '../professional-time/scheduling-professional-time.service';
import { SchedulingWaitlistService } from '../waitlist/scheduling-waitlist.service';
import { SchedulingServiceAgendaService } from '../service-offerings/scheduling-service-agenda.service';
import {
  HistoryRepository,
  type HistoryRevision,
} from '../../../audit/repositories';
// Escritura cross-dominio acotada a la confirmación, como la lectura de
// `directory` que hace `iam` al emitir un token: al confirmar una reserva nace
// su cita clínica, porque son la misma cosa vista desde dos módulos. Ver
// `createClinicalAppointment`.
import type { Appointments } from '../../../clinical/entities';
import {
  AppointmentsRepository,
  EncountersRepository,
} from '../../../clinical/repositories';
import { CLIN } from '../../../clinical/clinical.concepts';
import type {
  AppointmentBookings,
  BookableSlots,
  CancellationPolicySnapshot,
} from '../../entities';
// Va en un import de valor y no de tipo: `tx.create()` necesita la clase, no su forma.
import { AppointmentPaymentStates } from '../../entities';
import { CoverageRepository } from '../../../insurance/repositories/coverage.repository';
import { ClaimReadRepository } from '../../../insurance/repositories/claim-read.repository';
import { PatientRepresentationService } from '../../../profiles/services/patient-representation.service';
// P43: la reconsulta puede declarar de qué formulario médico cerrado sale.
import { FormInstanceOriginValidator } from '../../../forms/services/form-instance-origin.validator';
import { SCHED } from '../../domain/scheduling.concepts';
import { SchedulingNoticeRepository } from '../../infrastructure/repositories/scheduling-notice.repository';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../ports/agenda-notice.port';
import {
  bookingChangeNotice,
  requestNoticeForPatient,
  requestNoticeForPractitioner,
  type BookingChange,
} from '../../domain/notices/agenda-notices';
import { isValidBookingTransition } from '../../domain/booking/booking-state-machine';
import {
  requireReason,
  type BookingActorKind,
  type BookingTransitionSnapshot,
} from '../../domain/booking/booking-transition';
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
  BookingFollowUpOriginDto,
  BookingInsuranceClaimDto,
  BookingItemDto,
  BookingServiceDto,
  BookingStatusReasonDto,
  BookingDelayNoticeDto,
  SearchBookingsResponseDto,
  type BookingChannel,
  CreateDirectAppointmentDto,
  DirectAppointmentResponseDto,
  type AppointmentChannel,
} from '../../presentation/dto';

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
const DISPLACED_REASON =
  'Se canceló automáticamente: le confirmaron otra cita a la misma hora.';

/**
 * Estados en los que una solicitud está esperando respuesta.
 *
 * Son las que una aceptación ajena puede desplazar: todavía no las comprometió
 * nadie. Una confirmada NO entra acá a propósito — ver
 * {@link SchedulingBookingsService.cancelConflictingPending}.
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

/** P42: cómo se proyectan los dos lados del vínculo de reconsulta de una cita. */
interface FollowUpLinks {
  /** La consulta de origen, o `null` si la cita no es una reconsulta. */
  followUpOf: (booking: AppointmentBookings) => BookingFollowUpOriginDto | null;
  /** La reconsulta viva que salió de la cita, o `null`. */
  followUpBookingId: (booking: AppointmentBookings) => string | null;
}

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
const PROVIDER_ROLES: readonly string[] = [
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
 * `loadForOperation` contra el perfil de su token, no contra su rol.
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió.
 */
export const AGENDA_OPERATOR_ROLES: readonly string[] = [
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
const PRACTITIONER_PROFILE_TABLES: readonly string[] = [
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
const STATES_WITHOUT_PAYMENT: readonly string[] = [CONCEPTS.BOOKING_CANCELLED];

/**
 * La copia congelada de un servicio reservado, a lo que ve el cliente.
 *
 * El snapshot es `jsonb` libre: se proyecta campo a campo y nunca se devuelve
 * tal cual, para que una clave que mañana se agregue al snapshot no salga por
 * la API sin que nadie lo haya decidido.
 */
function projectBookedService(snapshot: unknown): BookingServiceDto {
  const s = snapshot as Partial<{
    offeringId: string;
    serviceName: string;
    price: string;
    currencyConceptId: string;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    requiresApproval: boolean;
  }>;
  return {
    offeringId: s.offeringId ?? '',
    name: s.serviceName ?? '',
    price: s.price ?? '0.00',
    ...(s.currencyConceptId === undefined
      ? {}
      : { currencyConceptId: s.currencyConceptId }),
    minDurationMinutes: s.minDurationMinutes ?? 0,
    maxDurationMinutes: s.maxDurationMinutes ?? 0,
    requiresApproval: s.requiresApproval === true,
  };
}

/**
 * De la fila guardada a lo que ve el cliente.
 *
 * Traduce el concepto a su clave estable y le pone la etiqueta: el cliente no
 * tiene por qué conocer los uuid de terminología, y si los conociera acabaría
 * comparándolos a mano en el front.
 */
function projectPaymentState(
  row: AppointmentPaymentStates,
): PaymentStateDto {
  const state = PAYMENT_CONCEPT_STATE[row.statusConceptId];
  return {
    state,
    label: PAYMENT_STATE_LABEL[state],
    conceptId: row.statusConceptId,
    insuranceUsed: row.insuranceUsed,
    markedByUserId: row.markedByUserId,
    markedAt: row.markedAt.toISOString(),
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
    private readonly affiliations: PractitionerAffiliationGateService,
    private readonly professionalTime: SchedulingProfessionalTimeService,
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
    // B.1 — quién puede actuar por un paciente. Hasta acá la agenda no lo
    // preguntaba: cualquier cuenta con rol `PATIENT` podía retener un cupo y
    // confirmar una cita a nombre de un perfil ajeno con sólo escribir su uuid
    // en el cuerpo. La regla vive en `profiles` porque la representación es un
    // dato de perfiles, y este módulo ya importa ese módulo.
    private readonly representation: PatientRepresentationService,
    // P43 — valida la instancia de formulario de origen de una reconsulta.
    // Clase sin estado de `forms`, provista suelta en `SchedulingModule`.
    private readonly formOrigin: FormInstanceOriginValidator,
    // v4.2.40 — los servicios con duración dinámica retraen cupos de consulta y,
    // cuando dejan de ocupar tiempo, los devuelven. Va al FINAL: los specs arman
    // este servicio con argumentos posicionales.
    private readonly serviceAgenda: SchedulingServiceAgendaService,
  ) {
    this.logger.setContext(SchedulingBookingsService.name);
  }

  /**
   * ¿Este actor tiene forma de paciente?
   *
   * Es quien no opera cualquier agenda —mostrador, administración de agenda,
   * `SUPERADMIN`— y tampoco atiende. La distinción importa porque el candado
   * de abajo no puede alcanzar a quien atiende: la agenda del médico y el
   * formulario de cotización listan las citas de sus pacientes por
   * `patientProfileId`, y exigirles apoderamiento rompería las dos pantallas.
   *
   * Que un profesional pueda listar las citas de cualquier paciente es un hueco
   * anterior a esto y sigue abierto; cerrarlo exige decidir contra qué se acota
   * —organización, relación asistencial— y no se resuelve de paso.
   *
   * @param actor - Quien pide, si hay sesión.
   * @returns `true` si es una cuenta de paciente sin más oficio.
   */
  private isPatientActor(actor?: AuthenticatedUser): boolean {
    if (!actor) return false;
    if (actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role))) return false;
    return actor.practitionerProfileId === undefined;
  }

  /**
   * Exige que el actor pueda actuar por ese paciente, si es una cuenta de paciente.
   *
   * El mostrador y la administración de agenda pasan sin preguntar: su oficio es
   * repartir turnos entre pacientes que no son ellos. A quien entra como
   * paciente se le exige ser el titular o tener apoderamiento vigente.
   *
   * @param patientProfileId - El paciente sobre el que se quiere actuar.
   * @param actor - Quien pide.
   * @param em - Transacción activa, si la hay.
   * @throws ForbiddenException si es una cuenta de paciente sin título sobre él.
   */
  private async assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    em?: EntityManager,
  ): Promise<void> {
    if (!this.isPatientActor(actor)) return;
    await this.representation.assertMayActForPatient(
      patientProfileId,
      actor,
      em,
    );
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

    // Antes de abrir la transacción: la comprobación lee de otra tabla y
    // sostener el `FOR UPDATE` del cupo mientras tanto serializaría a todos los
    // que piden ese mismo horario detrás de una consulta que no es del cupo.
    if (dto.patientProfileId !== undefined) {
      await this.assertMayActForPatient(dto.patientProfileId, actor);
    }

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
      // Un cupo retraído lo pisa un servicio que el profesional ya comprometió: se
      // dejó de ofrecer, pero un id leído hace rato todavía puede llegar acá.
      if (slot.statusConceptId === SCHED.SLOT_RETRACTED) {
        throw new PreconditionFailedException(
          'Ese horario ya no está disponible.',
          { slotId },
        );
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
      const now = Date.now();
      const noticeMinutes = policy?.minNoticeMinutes ?? 0;
      const alreadyPassed = slot.startAt.getTime() <= now;
      const tooCloseToStart =
        slot.startAt.getTime() <= now + noticeMinutes * 60_000;

      if (alreadyPassed || tooCloseToStart) {
        // Dos motivos distintos merecen dos frases distintas: a quien pide un
        // turno de la semana pasada no se le habla de anticipación mínima, y a
        // quien llega diez minutos tarde para una regla de treinta no se le
        // dice que «ya pasó» cuando todavía no pasó.
        throw new PreconditionFailedException(
          alreadyPassed
            ? 'Ese horario ya pasó.'
            : `Esa cita empieza demasiado pronto: hay que pedirla con al menos ${noticeMinutes} minutos de anticipación.`,
          { slotId, startAt: slot.startAt.toISOString(), minutosDeAviso: noticeMinutes },
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

    return this.materializeBooking(
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

    const result = await this.materializeBooking(
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
    await this.notifyRequest(result.id);
    return result;
  }

  /**
   * Avisa que entró una solicitud de turno, **a las dos partes**.
   *
   * ## Por qué a las dos y no a la contraparte
   *
   * {@link notifyChange} avisa a quien **no** actuó, y para aceptar, mover o
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
   * Igual que {@link notifyChange}: corre después de que la transacción cerró.
   * Un fallo del canal se registra y se descarta; la reserva ya existe.
   *
   * @param bookingId - La cita recién solicitada.
   */
  private async notifyRequest(bookingId: string): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    // El del paciente sale siempre: su perfil es el dueño de la reserva, así
    // que siempre hay a quién dirigirlo.
    const notices: AgendaNotice[] = [requestNoticeForPatient(booking)];

    const practitioner = await this.noticeRepo.findResourceAccount(
      em,
      booking.resourceId,
    );
    if (practitioner === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay segundo destinatario, y
      // el acuse del paciente sale igual.
      this.logger.info(
        { operation: 'scheduling.notice.requested', bookingId },
        'El recurso de la solicitud no tiene profesional al que avisar',
      );
    } else {
      const patient = await this.noticeRepo.findDisplayNameForProfile(
        em,
        booking.patientProfileId,
      );
      notices.push(
        requestNoticeForPractitioner(
          booking,
          patient ?? undefined,
          practitioner,
        ),
      );
    }

    await this.notices.emitMany(notices);
  }

  /**
   * Convierte una retención viva en cita, en el estado que le corresponda.
   *
   * Es el cuerpo común de {@link confirmBooking} y {@link requestBooking}: las
   * dos consumen el mismo hold, congelan la misma política, crean la misma cita
   * clínica y liberan el mismo cupo si algo falla. Lo único que las distingue es
   * el estado con el que la cita nace y si ya hay compromiso (`confirmedAt`).
   */
  private async materializeBooking(
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
    // Segundo cinturón del candado de B.1, y el que de verdad importa: el hold
    // puede haberse tomado sin declarar paciente —el cuerpo lo trae recién
    // acá—, así que comprobarlo sólo al retener dejaría la puerta abierta.
    // Cubre a la vez confirmar y solicitar, que es por lo que vive acá.
    await this.assertMayActForPatient(plan.patientProfileId, actor);

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
      const alreadyCommitted =
        await this.bookingsRepo.findPatientBookingsOverlapping(
          tx,
          plan.patientProfileId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
          ACTIVE_BOOKING_STATES,
        );
      if (alreadyCommitted.length > 0) {
        const clash = alreadyCommitted[0];
        throw new PreconditionFailedException(
          `Ya tiene una cita confirmada ese día a esa hora${
            clash.resourceName ? ` en «${clash.resourceName}»` : ''
          }. Cancélelo primero si quiere cambiarlo por éste.`,
          {
            bookingId: clash.id,
            startAt: clash.startAt,
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
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
      ) {
        await this.professionalTime.assertRangeFree(
          tx,
          resource.resourceRefId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
        );
      }

      // v4.2.40 — si el cupo es de un servicio, la oferta manda: de ella salen la
      // modalidad, lo que el paciente aceptó y si la reserva espera aprobación. Se
      // lee del CUPO y no del pedido del cliente: el navegador no decide el precio.
      const ofService = slot.practitionerServiceOfferingId
        ? await this.serviceAgenda.offeringOfSlot(
            tx,
            slot.practitionerServiceOfferingId,
          )
        : null;
      const effective = ofService
        ? this.planForService(plan, ofService.offering.requiresApproval)
        : plan;

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
      const appointment = this.createClinicalAppointment(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        resourceRefType: resource?.resourceRefType,
        resourceRefId: resource?.resourceRefId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        reasonText: plan.reasonText,
        statusConceptId: effective.appointmentStatusConceptId,
        ...(ofService
          ? {
              typeConceptId: CLIN.ACTIVITY_PROCEDURE,
              ...(ofService.offering.channelConceptId === undefined
                ? {}
                : { channelConceptId: ofService.offering.channelConceptId }),
            }
          : {}),
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
        statusConceptId: effective.statusConceptId,
        confirmedAt: effective.confirmedAt,
        bookingPolicyId: policy?.id,
        cancellationPolicySnapshot,
        ...(ofService
          ? {
              practitionerServiceOfferingId: ofService.offering.id,
              serviceSnapshot: this.freezeService(ofService, slot),
            }
          : {}),
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
      const offsets = effective.reminderOffsetsMinutes;
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
        statusConceptId: effective.statusConceptId,
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
      (tx) => this.createDirectAppointmentInTransaction(tx, dto, actor),
    );
    const result: DirectAppointmentResponseDto = {
      bookingId: booking.id,
      bookableSlotId: slot.id,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      retractedSlots,
    };

    // Fuera de la transacción, como todos los avisos: que no salga la campana
    // no puede deshacer una cita que ya existe.
    await this.notifyChange(
      result.bookingId,
      'ASSIGNED',
      dto.reasonText,
      'PROVIDER',
    );
    return result;
  }

  /**
   * P42 · Las cuatro reglas de la reconsulta, en el orden del contrato, más la
   * del formulario de origen (P43).
   *
   * 1. **403** — la agenda no es del profesional de la sesión. Vale también
   *    para quien administra agendas: la reconsulta la agenda quien atendió.
   * 2. **404** — la cita de origen no existe.
   * 3. **422** — el paciente no es el de esa cita, o `startAt` no es futuro.
   * 4. **409** — esa consulta ya tiene una reconsulta por venir y no
   *    cancelada. Una ya pasada no bloquea.
   * 5. **422** (P43) — `formInstanceId` no existe, no está cerrada o es de
   *    otro encuentro que el de la consulta de origen.
   *
   * La unicidad es de la escritura, no de un `if` previo: la cita de origen se
   * lee con `SELECT … FOR UPDATE`, así que dos peticiones simultáneas con el
   * mismo origen se serializan y la segunda ya ve la reconsulta de la primera.
   *
   * @param tx - Transacción de la cita directa.
   * @param dto - Cuerpo con `followUpOf`.
   * @param startAt - Inicio pedido, ya parseado.
   * @param isOwnAgenda - Si el recurso es la agenda del profesional de la sesión.
   * @returns La cita de origen (bloqueada) y el encuentro que la atendió.
   */
  private async validateFollowUp(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    startAt: Date,
    isOwnAgenda: boolean,
  ): Promise<{
    origin: AppointmentBookings;
    originEncounterId: string | null;
  }> {
    const requested = dto.followUpOf!;
    if (!isOwnAgenda) {
      throw new ForbiddenException(
        'La reconsulta se agenda en su propia agenda, no en la de otro profesional.',
      );
    }

    const originBooking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      requested.bookingId,
    );
    if (!originBooking) {
      throw new ResourceNotFoundException(
        'La cita de la que sale esta reconsulta no existe',
        { bookingId: requested.bookingId },
      );
    }
    if (originBooking.patientProfileId !== dto.patientProfileId) {
      throw new PreconditionFailedException(
        'La reconsulta es para el paciente de la cita de origen',
        { bookingId: originBooking.id, reason: 'FOLLOW_UP_PATIENT_MISMATCH' },
      );
    }
    const now = new Date();
    if (startAt.getTime() <= now.getTime()) {
      throw new PreconditionFailedException(
        'Una reconsulta se agenda para más adelante',
        { startAt: dto.startAt, reason: 'FOLLOW_UP_NOT_FUTURE' },
      );
    }

    const live = await this.bookingsRepo.findFollowUpsOf(
      tx,
      [originBooking.id],
      VISIBLE_BOOKING_STATES,
    );
    const upcoming = live.find(
      ({ slot }) => slot !== null && slot.startAt.getTime() > now.getTime(),
    );
    if (upcoming) {
      throw new ConflictException(
        'Esta consulta ya tiene una reconsulta agendada',
        {
          bookingId: upcoming.booking.id,
          startAt: upcoming.slot!.startAt.toISOString(),
        },
      );
    }

    // El encuentro de origen lo dice la base (cita → encuentro), no el
    // cliente: es contra él que se valida el formulario (P43).
    const originEncounterId =
      originBooking.appointmentId == null
        ? null
        : ((
            await this.encountersRepo.findLatestIdsByAppointmentIds(tx, [
              originBooking.appointmentId,
            ])
          ).get(originBooking.appointmentId) ?? null);

    if (requested.formInstanceId !== undefined) {
      await this.formOrigin.assertUsableOrigin(
        tx,
        requested.formInstanceId,
        originEncounterId,
      );
    }
    return { origin: originBooking, originEncounterId: originEncounterId };
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
   * @param options - Canal de reserva a grabar; por defecto `DESK`.
   * @returns La reserva confirmada, el cupo, la cita clínica y cuántos cupos
   *   ofrecidos retiró.
   */
  async createDirectAppointmentInTransaction(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
    options?: { bookingChannel?: 'DESK' | 'WALK_IN' },
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

    this.assertResourceInActiveTenant(resource.tenantId, actor);

    // La agenda tiene que ser SUYA (o el actor administra agendas por
    // oficio): mismo criterio de titularidad que operar una reserva.
    const isOwnAgenda =
      actor.practitionerProfileId !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);
    if (!this.operatesAnyAgenda(actor) && !isOwnAgenda) {
      throw new ForbiddenException(
        'Un profesional solo puede asignar citas en su propia agenda.',
      );
    }

    // P42 · La reconsulta: sus cuatro rechazos corren SÓLO cuando viene
    // `followUpOf`; sin él la cita puntual sigue exactamente como antes.
    const followUp =
      dto.followUpOf === undefined
        ? undefined
        : await this.validateFollowUp(tx, dto, startAt, isOwnAgenda);

    // El gating del vínculo, heredado: comprometer un turno en una
    // organización exige que el vínculo siga vigente — misma regla que
    // aceptar.
    await this.assertAffiliationCurrent(resource.tenantId, actor);

    // Anti-abuso mínimo: el paciente tiene que existir.
    const names = await this.bookingsRepo.findPatientNames(tx, [
      dto.patientProfileId,
    ]);
    if (!names.has(dto.patientProfileId)) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId: dto.patientProfileId,
      });
    }

    // REGLA MADRE: nada se asigna sobre tiempo ya comprometido del
    // profesional, en ninguna de sus sedes.
    if (PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)) {
      await this.professionalTime.assertRangeFree(
        tx,
        resource.resourceRefId,
        startAt,
        endAt,
      );
    }

    // Y el tiempo del PACIENTE también: la regla 1 vale igual cuando quien
    // agenda es el doctor — el paciente tampoco puede estar en dos lugares.
    const alreadyCommitted =
      await this.bookingsRepo.findPatientBookingsOverlapping(
        tx,
        dto.patientProfileId,
        startAt,
        endAt,
        ACTIVE_BOOKING_STATES,
      );
    if (alreadyCommitted.length > 0) {
      const clash = alreadyCommitted[0];
      throw new PreconditionFailedException(
        `El paciente ya tiene una cita confirmada en ese rato${
          clash.resourceName ? ` en «${clash.resourceName}»` : ''
        }.`,
        { bookingId: clash.id, startAt: clash.startAt },
      );
    }

    // La retracción: los cupos libres del profesional que este rato pisa se
    // retiran acá mismo, en cualquiera de sus sedes.
    let retractedSlots = 0;
    if (PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)) {
      const freeOnes = await this.catalogRepo.findOpenSlotsOfProfessionalInWindow(
        tx,
        resource.resourceRefId,
        startAt,
        endAt,
        CONCEPTS.SLOT_OPEN,
      );
      for (const free of freeOnes) {
        // Retraído y no bloqueado: al bloqueado nadie lo devuelve, y al retraído sí
        // cuando esta cita se cancela (ver `discardOneOffSlot`).
        free.statusConceptId = SCHED.SLOT_RETRACTED;
        touch(free, actor.id);
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
    const appointment = this.createClinicalAppointment(tx, {
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
      // P42: la reconsulta se clasifica como tal; el resto, como hasta hoy.
      ...(followUp === undefined
        ? {}
        : { typeConceptId: CLIN.ACTIVITY_FOLLOW_UP }),
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
        CHANNEL_CONCEPT[options?.bookingChannel ?? 'DESK'],
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
      ...(followUp === undefined
        ? {}
        : {
            followUpOfBookingId: followUp.origin.id,
            formInstanceId: dto.followUpOf?.formInstanceId,
          }),
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
        if (slot.practitionerServiceOfferingId) {
          // El cupo de un servicio nació para esta retención: no se reofrece, muere
          // con ella y devuelve las consultas que había retraído.
          await this.discardOneOffSlot(tx, slot, undefined);
          continue;
        }
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
    const reason = requireReason(dto.reasonText, 'reprogramar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.reschedule',
        bookingId,
        toSlotId: dto.toSlotId,
      },
      'Rescheduling booking',
    );

    const result = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }

      // H3.S1.M2 (BOLA/IDOR de escritura): mismo hueco que `cancelAndNotify` —
      // reprogramar no comprobaba que el actor fuera el paciente titular.
      await this.assertMayActForPatient(
        booking.patientProfileId,
        actor,
        tx,
      );

      if (!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se reprograma una cita vigente',
          {
            bookingId,
          },
        );
      }

      const fromSlotId = booking.bookableSlotId;
      await this.assertNotAService(tx, fromSlotId, 'reprogramar');
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

      // M4 · H1.S1: reprogramar es ocupar un rango nuevo, y era el único
      // camino que lo hacía sin preguntar. Que el cupo destino tenga lugar no
      // dice nada de OTRO cupo cuyo horario se pisa con éste: se corren las
      // mismas dos reglas que al confirmar (`materializeBooking`), sin que la
      // cita se compare consigo misma.
      const targetEnd = target.endAt ?? target.startAt;
      const patientClash =
        await this.bookingsRepo.findPatientBookingsOverlapping(
          tx,
          booking.patientProfileId,
          target.startAt,
          targetEnd,
          ACTIVE_BOOKING_STATES,
          booking.id,
        );
      if (patientClash.length > 0) {
        const clash = patientClash[0];
        throw new PreconditionFailedException(
          `El paciente ya tiene una cita confirmada a esa hora${
            clash.resourceName ? ` en «${clash.resourceName}»` : ''
          }.`,
          {
            bookingId: clash.id,
            startAt: clash.startAt,
          },
        );
      }
      const targetResource = await this.catalogRepo.findResourceById(
        tx,
        target.resourceId,
      );
      if (
        targetResource &&
        PRACTITIONER_PROFILE_TABLES.includes(targetResource.resourceRefType)
      ) {
        await this.professionalTime.assertRangeFree(
          tx,
          targetResource.resourceRefId,
          target.startAt,
          targetEnd,
          booking.id,
        );
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
      // La cita queda en el recurso de su cupo nuevo: si no, la regla madre
      // la seguía atribuyendo al recurso viejo (y a su profesional).
      booking.resourceId = target.resourceId;
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
          reasonText: reason,
          actorKind: this.actorKind(actor),
        } satisfies BookingTransitionSnapshot,
        changedByUserId: actor.id,
      });

      return { bookingId, fromSlotId, toSlotId: dto.toSlotId };
    });

    // Con el motivo (P8): el aviso dice el horario nuevo y por qué se movió.
    await this.notifyChange(
      bookingId,
      'RESCHEDULED',
      reason,
      this.actorKind(actor),
    );
    return result;
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
    return this.cancelAndNotify(bookingId, dto, actor, 'CANCELLED');
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
  private async cancelAndNotify(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
    change: BookingChange,
  ): Promise<CancelBookingResponseDto> {
    const reason = requireReason(dto.reasonText, 'cancelar la cita');

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
    let releasedSlotId: string | null = null;

    const result = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }

      // H3.S1.M2 (BOLA/IDOR de escritura): cancelar/rechazar no comprobaba de
      // quién era la cita — el único control era `@Roles(...,'PATIENT')`, que
      // autoriza a cualquier cuenta de paciente, no sólo a la titular. Mismo
      // método que ya usan `placeHold`, la confirmación del hold y `enroll` de
      // la lista de espera: es un no-op para quien opera la agenda.
      await this.assertMayActForPatient(
        booking.patientProfileId,
        actor,
        tx,
      );

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
      // Quien pide el turno de su hijo también lo cancela, y le toca la misma
      // ventana: la regla protege el hueco del consultorio, y el hueco es el
      // mismo lo pida quien lo pida. Se pregunta por el apoderamiento sólo si no
      // es el titular, para no pagar una consulta en el caso normal.
      const isHolderPatient =
        (actor.patientProfileId !== undefined &&
          actor.patientProfileId === booking.patientProfileId) ||
        (this.isPatientActor(actor) &&
          (await this.representation.representsPatient(
            booking.patientProfileId,
            actor,
            tx,
          )));

      if (isHolderPatient && withinWindow && !isNoShow) {
        throw new PreconditionFailedException(
          `Puede cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio.`,
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
        reasonText: reason,
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
          //
          // Y se devuelven las consultas que retrajo: antes quedaban bloqueadas
          // para siempre, aunque el rato que las pisaba ya estuviera libre.
          await this.discardOneOffSlot(tx, slot, actor.id);
        } else if (slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
          // Sólo el cupo que vuelve a ofrecerse: el de una cita puntual queda
          // bloqueado arriba —nunca estuvo ofrecido— y promover sobre él le
          // avisaría a alguien de un horario que no puede reservar.
          releasedSlotId = slot.id;
        }
        touch(slot, actor.id);
        capacityReleased = true;
      }

      return { bookingId, feeAmount, capacityReleased };
    });

    await this.notifyChange(bookingId, change, reason, dto.cancelledBy);
    await this.promoteWaitlistFor(releasedSlotId);
    return result;
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
  private async promoteWaitlistFor(slotId: string | null): Promise<void> {
    if (slotId === null) return;

    try {
      const result = await this.waitlist.promoteWaitlist(slotId);
      if (result.processed > 0) {
        this.logger.info(
          {
            operation: 'scheduling.booking.cancel.promote-waitlist',
            slotId,
            promoted: result.processed,
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
      const booking = await this.loadForOperation(tx, bookingId, actor);

      if (STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)) {
        // El mensaje dice POR QUÉ y no sólo que no se puede: quien lo lee está
        // mirando una cita que alguien canceló y necesita entender que el
        // problema no es su permiso.
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar.',
          { bookingId, statusConceptId: booking.statusConceptId },
        );
      }

      const newConcept = PAYMENT_STATE_CONCEPT[dto.state];
      const insuranceUsed = dto.insuranceUsed ?? false;
      const now = new Date();

      const existing = await this.bookingsRepo.findPaymentStateForUpdate(
        tx,
        bookingId,
      );
      const previousConcept = existing?.statusConceptId ?? null;

      let row: AppointmentPaymentStates;
      if (existing) {
        existing.statusConceptId = newConcept;
        existing.insuranceUsed = insuranceUsed;
        existing.markedByUserId = actor.id;
        existing.markedAt = now;
        touch(existing, actor.id);
        row = existing;
      } else {
        row = tx.create(AppointmentPaymentStates, {
          id: randomUUID(),
          tenantId: booking.tenantId,
          appointmentBookingId: booking.id,
          statusConceptId: newConcept,
          insuranceUsed: insuranceUsed,
          markedByUserId: actor.id,
          markedAt: now,
          // `createdBy` ya pone createdAt y updatedAt con el mismo instante.
          ...createdBy(actor.id, now),
          rowVersion: 1,
        });
        tx.persist(row);
      }

      // La huella. Sin esto, volver a «pendiente» borraría que alguna vez
      // estuvo pagada, y marcar un pago es una afirmación sobre el dinero de
      // alguien.
      await this.historyRepo.append(tx, 'appointment_bookings', booking.id, {
        operationConceptId: SCHED.HISTORY_OP_PAYMENT_MARKED,
        dataSnapshot: {
          bookingId: booking.id,
          fromPaymentConceptId: previousConcept,
          toPaymentConceptId: newConcept,
          insuranceUsed: insuranceUsed,
        },
        changedByUserId: actor.id,
      });

      return projectPaymentState(row);
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
    const booking = await this.loadForOperation(this.em, bookingId, actor);
    const row = await this.bookingsRepo.findPaymentState(this.em, booking.id);
    return row ? projectPaymentState(row) : null;
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

    const result = await this.em.transactional(async (tx) => {
      const booking = await this.loadForOperation(tx, bookingId, actor);
      await this.assertAffiliationCurrent(booking.tenantId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CONFIRMED);

      // REGLA MADRE (AG-1): decir «sí» acá compromete el tiempo del
      // profesional, así que hay que mirar TODAS sus agendas antes — no sólo
      // ésta. La propia reserva se excluye: aceptarse no es chocar consigo
      // misma.
      const bookingResource = booking.resourceId
        ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
        : null;
      if (
        bookingResource &&
        PRACTITIONER_PROFILE_TABLES.includes(bookingResource.resourceRefType)
      ) {
        const bookingSlot = await this.bookingsRepo.findSlotById(
          tx,
          booking.bookableSlotId,
        );
        if (bookingSlot) {
          await this.professionalTime.assertRangeFree(
            tx,
            bookingResource.resourceRefId,
            bookingSlot.startAt,
            bookingSlot.endAt ?? bookingSlot.startAt,
            booking.id,
          );
        }
      }

      const confirmedAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CONFIRMED;
      booking.confirmedAt = confirmedAt;
      touch(booking, actor.id);
      await this.syncClinicalAppointment(
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
      const desplazadas = await this.cancelConflictingPending(
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
    await this.notifyChange(bookingId, 'ACCEPTED', undefined, 'PROVIDER');
    // Y un aviso por cada solicitud que este «sí» dejó sin efecto: el
    // paciente las pidió y tiene que enterarse de que ya no van, aunque él
    // no haya hecho nada. Uno por uno, porque cada una es de otro médico.
    for (const id of result.desplazadas) {
      await this.notifyChange(id, 'CANCELLED', DISPLACED_REASON, 'PROVIDER');
    }
    return result;
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
   * @param accepted - La cita que se acaba de confirmar.
   * @param actor - Quien aceptó.
   * @returns Los identificadores de las que se cancelaron.
   */
  private async cancelConflictingPending(
    tx: EntityManager,
    accepted: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const slot = await this.bookingsRepo.findSlotById(
      tx,
      accepted.bookableSlotId,
    );
    if (!slot) return [];

    const clashing = await this.bookingsRepo.findPatientBookingsOverlapping(
      tx,
      accepted.patientProfileId,
      slot.startAt,
      slot.endAt ?? slot.startAt,
      PENDING_BOOKING_STATES,
      accepted.id,
    );

    const cancelled: string[] = [];
    for (const other of clashing) {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        other.id,
      );
      if (!booking) continue;

      const previous = booking.statusConceptId;
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
        fromStateConceptId: previous,
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        reasonText: DISPLACED_REASON,
        actorKind: 'PROVIDER',
      });

      // El cupo vuelve a estar libre: lo retenía una solicitud que ya no va.
      const ownSlot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        booking.bookableSlotId,
      );
      if (ownSlot) {
        ownSlot.remainingCapacity += 1;
        if (ownSlot.practitionerServiceOfferingId) {
          await this.discardOneOffSlot(tx, ownSlot, actor.id);
        } else {
          if (ownSlot.statusConceptId === CONCEPTS.SLOT_HELD) {
            ownSlot.statusConceptId = CONCEPTS.SLOT_OPEN;
          }
          touch(ownSlot, actor.id);
        }
      }

      cancelled.push(booking.id);
    }

    return cancelled;
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

    return this.cancelAndNotify(
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
    const reason = requireReason(dto.reasonText, 'pedir documentación');

    this.logger.info(
      {
        operation: 'scheduling.booking.request-info',
        bookingId,
        infoRequested: dto.infoRequested,
      },
      'Requesting information before accepting',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertPending(fromState, bookingId);

      const occurredAt = new Date();
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.assertTransition(fromState, SCHED.BOOKING_PENDING_CONFIRMATION);
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
        touch(booking, actor.id);
      }

      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        reasonText: reason,
        actorKind: 'PROVIDER',
        infoRequested: dto.infoRequested,
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        occurredAt: occurredAt.toISOString(),
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
    const reason = requireReason(dto.reasonText, 'proponer otro horario');

    this.logger.info(
      {
        operation: 'scheduling.booking.propose-schedule',
        bookingId,
        toSlotId: dto.proposedSlotId,
      },
      'Proposing another slot for the request',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertPending(fromState, bookingId);

      const originId = booking.bookableSlotId;
      await this.assertNotAService(
        tx,
        originId,
        'proponer otro horario para',
      );
      if (dto.proposedSlotId === originId) {
        throw new PreconditionFailedException(
          'El horario propuesto es el que ya tiene la solicitud',
          { bookingId },
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.proposedSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException('Cupo propuesto no encontrado', {
          slotId: dto.proposedSlotId,
        });
      }
      if (target.remainingCapacity <= 0) {
        throw new ConflictException('El cupo propuesto no tiene lugar', {
          slotId: dto.proposedSlotId,
        });
      }

      const originBooking = await this.bookingsRepo.findSlotForUpdate(tx, originId);
      if (originBooking) {
        originBooking.remainingCapacity += 1;
        if (originBooking.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          originBooking.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(originBooking, actor.id);
      }
      target.remainingCapacity -= 1;
      if (target.remainingCapacity === 0) {
        target.statusConceptId = CONCEPTS.SLOT_HELD;
      }
      touch(target, actor.id);

      booking.bookableSlotId = dto.proposedSlotId;
      if (fromState !== SCHED.BOOKING_PENDING_CONFIRMATION) {
        this.assertTransition(fromState, SCHED.BOOKING_PENDING_CONFIRMATION);
        booking.statusConceptId = SCHED.BOOKING_PENDING_CONFIRMATION;
      }
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId: originId,
        toSlotId: dto.proposedSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: originId,
        toSlotId: dto.proposedSlotId,
        reasonText: reason,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        fromSlotId: originId,
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
  private assertPending(fromState: string, bookingId: string): void {
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
      const booking = await this.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

      booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
      touch(booking, actor.id);
      await this.syncClinicalAppointment(
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
  async startInTransaction(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const fromState = booking.statusConceptId;
    this.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

    booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
    touch(booking, actor.id);
    await this.syncClinicalAppointment(
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
      const booking = await this.loadForOperation(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_COMPLETED);

      booking.statusConceptId = SCHED.BOOKING_COMPLETED;
      touch(booking, actor.id);
      await this.releaseServiceLeftover(tx, booking, actor.id);
      await this.syncClinicalAppointment(
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
  private async loadForOperation(
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

    if (this.operatesAnyAgenda(actor)) {
      return booking;
    }

    const resource = booking.resourceId
      ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
      : null;
    const isOwnAgenda =
      actor.practitionerProfileId !== undefined &&
      resource !== null &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);

    if (!isOwnAgenda) {
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
  private async notifyChange(
    bookingId: string,
    change: BookingChange,
    reason: string | undefined,
    actorKind: BookingActorKind,
  ): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    const toPractitioner = actorKind === 'PATIENT';
    const recipient = toPractitioner
      ? await this.noticeRepo.findResourceAccount(em, booking.resourceId)
      : null;

    if (toPractitioner && recipient === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay destinatario.
      this.logger.info(
        { operation: 'scheduling.notice.change', bookingId, cambio: change },
        'El recurso de la cita no tiene profesional al que avisar',
      );
      return;
    }

    await this.notices.emit(
      bookingChangeNotice(
        booking,
        change,
        reason,
        toPractitioner
          ? { userId: recipient as string }
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
  private async assertAffiliationCurrent(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (this.operatesAnyAgenda(actor)) return;

    const verdict = await this.affiliations.evaluate(tenantId, actor);
    if (verdict === 'sin-vinculos' || verdict === 'aprobado') return;

    throw new PreconditionFailedException(
      verdict === 'pendiente'
        ? 'Su vínculo con esta organización todavía está pendiente de ' +
            'aprobación, así que todavía no puede comprometer citas suyas.'
        : 'Su vínculo con esta organización ya no está vigente, así que no ' +
            'puede aceptar citas suyas. Las citas que ya confirmó siguen ' +
            'en pie: hable con la organización para reactivarlo.',
      { tenantId, vinculo: verdict },
    );
  }

  /**
   * Impide que un UUID conocido salte el tenant activo del request.
   *
   * El `RolesGuard` limita el rol al tenant resuelto, pero el recurso llega por
   * id y su repositorio no agrega `tenant_id` al predicado. Cuando RLS no está
   * activo, un agente de agenda podía usar el recurso de otra organización y
   * su rol de mostrador evitaba las comprobaciones de titularidad posteriores.
   *
   * `tenantIds` es el respaldo para invocaciones internas sin contexto HTTP.
   * Sin contexto ni membresía comprobable se rechaza; `SUPERADMIN` mantiene su
   * alcance de plataforma.
   */
  private assertResourceInActiveTenant(
    resourceTenantId: string,
    actor: AuthenticatedUser,
  ): void {
    if (actor.roles.includes('SUPERADMIN')) return;

    const activeTenantId = getCurrentTenantId();
    const withinScope = activeTenantId
      ? activeTenantId === resourceTenantId
      : actor.tenantIds?.includes(resourceTenantId) === true;

    if (!withinScope) {
      throw new ForbiddenException(
        'La agenda indicada pertenece a otra organización.',
      );
    }
  }

  /**
   * El plan de una reserva de servicio.
   *
   * Pedir un turno nace pendiente de aceptación, y para una consulta eso es
   * siempre así. Un servicio lo decide su oferta: si **no** requiere aprobación,
   * la reserva nace confirmada —con los recordatorios de una cita confirmada—,
   * porque obligar al profesional a aceptar una nebulización es fricción sin
   * criterio clínico. Si la requiere, o si quien reserva ya traía un plan
   * confirmado (el mostrador), se respeta lo que había.
   */
  private planForService<
    P extends {
      statusConceptId: string;
      appointmentStatusConceptId: string;
      confirmedAt?: Date;
      reminderOffsetsMinutes: readonly number[];
    },
  >(plan: P, requiresApproval: boolean): P {
    const isRequest =
      plan.statusConceptId === SCHED.BOOKING_PENDING_CONFIRMATION;
    if (!isRequest || requiresApproval) return plan;
    return {
      ...plan,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
      confirmedAt: new Date(),
      reminderOffsetsMinutes: DEFAULT_REMINDER_OFFSETS,
    };
  }

  /** Lo que el paciente aceptó, congelado: un cambio posterior de la oferta no lo reescribe. */
  private freezeService(
    ofService: NonNullable<
      Awaited<ReturnType<SchedulingServiceAgendaService['offeringOfSlot']>>
    >,
    slot: BookableSlots,
  ): Record<string, unknown> {
    const { offering: offering, catalog: catalog } = ofService;
    return {
      offeringId: offering.id,
      serviceCatalogId: offering.serviceCatalogId,
      serviceCode: catalog?.code,
      serviceName: catalog?.name,
      price: catalog?.defaultPrice,
      currencyConceptId: catalog?.currencyConceptId,
      minDurationMinutes: offering.minDurationMinutes,
      maxDurationMinutes: offering.maxDurationMinutes,
      prepMinutes: offering.prepMinutes ?? 0,
      cleanupMinutes: offering.cleanupMinutes ?? 0,
      requiresApproval: offering.requiresApproval,
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt?.toISOString(),
      capturedAt: new Date().toISOString(),
    };
  }

  /**
   * El cupo puntual —el de un servicio o el de una cita que el doctor asignó— que
   * deja de ocupar tiempo.
   *
   * Nació para una sola reserva y nunca estuvo ofrecido, así que **no se reabre**
   * (sería un cupo fantasma): queda bloqueado. Lo que sí se hace es devolver las
   * consultas que había retraído y que ya no chocan con nada.
   *
   * El `flush` va antes de reabrir porque la lectura de lo ocupado es SQL: si la
   * cancelación sigue sólo en la unidad de trabajo, esa lectura todavía vería la
   * reserva viva y no reabriría nada.
   */
  private async discardOneOffSlot(
    tx: EntityManager,
    slot: BookableSlots,
    actorUserId: string | undefined,
  ): Promise<void> {
    slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
    touch(slot, actorUserId);
    await tx.flush();
    await this.reopenRetractedConsultationsOf(tx, slot, actorUserId);
  }

  /** Devuelve las consultas retraídas que el rango de este cupo ya no pisa. */
  private async reopenRetractedConsultationsOf(
    tx: EntityManager,
    slot: BookableSlots,
    actorUserId: string | undefined,
  ): Promise<void> {
    await this.serviceAgenda.reopenSpan(
      tx,
      slot,
      slot.startAt,
      slot.endAt ?? slot.startAt,
      actorUserId,
    );
  }

  /**
   * Terminar antes de lo reservado libera el sobrante.
   *
   * Un servicio se reserva por su duración **máxima**; si el profesional lo da por
   * cumplido antes, el cupo se recorta a ese instante y el tiempo que sobraba vuelve
   * a estar disponible —y las consultas que ese tiempo pisaba, a ofrecerse—. Sólo
   * aplica a cupos de servicio: el de una consulta mide lo que la plantilla dijo.
   */
  private async releaseServiceLeftover(
    tx: EntityManager,
    booking: AppointmentBookings,
    actorUserId: string | undefined,
  ): Promise<void> {
    const slot = await this.bookingsRepo.findSlotForUpdate(
      tx,
      booking.bookableSlotId,
    );
    if (!slot?.practitionerServiceOfferingId || !slot.endAt) return;

    const now = new Date();
    const endsEarly =
      now.getTime() > slot.startAt.getTime() &&
      now.getTime() < slot.endAt.getTime();
    if (!endsEarly) return;

    const reservedEnd = slot.endAt;
    slot.endAt = now;
    touch(slot, actorUserId);
    await tx.flush();
    await this.serviceAgenda.reopenSpan(
      tx,
      slot,
      now,
      reservedEnd,
      actorUserId,
    );
  }

  /** Un servicio no se mueve de horario: se cancela y se pide otro. */
  private async assertNotAService(
    tx: EntityManager,
    slotId: string,
    action: string,
  ): Promise<void> {
    const slot = await this.bookingsRepo.findSlotById(tx, slotId);
    if (slot?.practitionerServiceOfferingId) {
      throw new PreconditionFailedException(
        `Todavía no se puede ${action} un servicio: cancele la reserva y pida otro horario.`,
        { slotId },
      );
    }
  }

  private operatesAnyAgenda(actor: AuthenticatedUser): boolean {
    return actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role));
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
  private async syncClinicalAppointment(
    tx: EntityManager,
    booking: AppointmentBookings,
    statusConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (booking.appointmentId === undefined) {
      return;
    }
    const clinicalAppointment = await this.appointmentsRepo.findById(
      tx,
      booking.appointmentId,
    );
    if (!clinicalAppointment) {
      return;
    }
    clinicalAppointment.statusConceptId = statusConceptId;
    touch(clinicalAppointment, actor.id);
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
    const isProviderSide = actor.roles.some((role) =>
      PROVIDER_ROLES.includes(role),
    );
    return isProviderSide ? 'PROVIDER' : 'PATIENT';
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
    // Una cuenta de paciente sólo lista lo suyo y lo de quienes representa. Sin
    // esto, el filtro por paciente era una enumeración de la agenda ajena a
    // quien supiera un uuid: los turnos de alguien dicen a qué médico va y por
    // qué. No alcanza a quien atiende ni al mostrador — ver `isPatientActor`.
    if (filters.patientProfileId && actor) {
      await this.assertMayActForPatient(
        filters.patientProfileId,
        actor,
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
    const reasons = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      hasReason,
    );
    // Segunda pasada sobre el mismo historial, con otro predicado: la demora
    // (P8) no es un motivo de cambio de estado y `latestBySource` devuelve una
    // revisión por agregado, así que pedir las dos cosas juntas dejaría fuera
    // la que llegó antes.
    const delays = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      isDelay,
    );

    const origins = await this.bookingsRepo.latestRescheduleOrigins(
      em,
      page.map(({ booking }) => booking.id),
    );

    // Los recursos de la página, en lote y sólo si el actor es un profesional:
    // es lo único que puede convertir «esta cita es de alguien» en «esta cita
    // es MÍA» para decidir el motivo. Un paciente no los necesita.
    const agendaOwners = new Map<string, string>();
    if (actor?.practitionerProfileId !== undefined) {
      const ids = [
        ...new Set(
          page
            .map(({ booking }) => booking.resourceId)
            .filter((id): id is string => id !== undefined),
        ),
      ];
      for (const id of ids) {
        const resource = await this.catalogRepo.findResourceById(em, id);
        if (resource) agendaOwners.set(id, resource.resourceRefId);
      }
    }

    // La tipología de la página, en lote. Sólo las citas que llegaron a tener
    // contraparte clínica la tienen: una reserva sin confirmar no crea
    // `clinical.appointments`, así que su id no entra en la consulta.
    const appointmentIds = [
      ...new Set(
        page
          .map(({ booking }) => booking.appointmentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const types = await this.appointmentsRepo.findTypesByIds(em, appointmentIds);

    // El encuentro clínico de cada cita, en lote (subtarea 4.3): mismos ids
    // que la tipología, misma razón — cien consultas más por página, no.
    const encounters = await this.encountersRepo.findLatestIdsByAppointmentIds(
      em,
      appointmentIds,
    );

    // A quiénes representa el actor, una vez para toda la página (B.1). Decide
    // si el motivo de consulta de la cita de un dependiente se le muestra a
    // quien lo pidió. Sólo se pregunta a una cuenta de paciente: al mostrador y
    // a quien atiende el motivo ya se les decide por otro camino.
    const representedPatients = this.isPatientActor(actor)
      ? await this.representation.findActiveProxiedPatientIds(actor!.id, em)
      : undefined;

    // Los nombres, en lote y sólo cuando alguien va a poder verlos: si el actor
    // no es profesional ni titular, la proyección los descartaría igual y la
    // consulta sería trabajo tirado.
    const names =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.bookingsRepo.findPatientNames(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // El estado de pago de la página, en lote (TAREA-13 punto 5). Una consulta
    // para toda la página, no una por fila.
    const payments = await this.bookingsRepo.findPaymentStatesForBookings(
      em,
      page.map(({ booking }) => booking.id),
    );

    // La aseguradora de cada paciente, en lote (ALV-021). Sólo se pide para
    // quien de todos modos va a poder ver el nombre del paciente: es el mismo
    // dato de privacidad, y pedirla para el resto sería trabajo tirado.
    const carriers =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.coverageRepo.findActiveCarriersByPatients(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // La solicitud de seguro de cada cita, en lote y con la misma compuerta
    // que la aseguradora: es otro dato del paciente, y pedirlo para quien no lo
    // va a ver sería trabajo tirado. Tres consultas fijas por página.
    const requests =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.insuranceClaimsByAppointment(em, appointmentIds)
        : new Map<string, BookingInsuranceClaimDto>();

    // P42: los dos lados del vínculo de reconsulta, en lote para la página.
    const followUps = await this.followUpLinks(
      em,
      page.map(({ booking }) => booking),
    );

    return {
      items: page.map(({ booking, slot }) =>
        this.aBookingItem(
          booking,
          slot,
          reasons.get(booking.id),
          delays.get(booking.id),
          actor,
          booking.resourceId
            ? agendaOwners.get(booking.resourceId)
            : undefined,
          origins.get(booking.id),
          names.get(booking.patientProfileId),
          booking.appointmentId == null
            ? undefined
            : types.get(booking.appointmentId),
          payments.get(booking.id),
          carriers,
          booking.appointmentId == null
            ? undefined
            : encounters.get(booking.appointmentId),
          requests,
          representedPatients,
          followUps,
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
    const reasons = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      hasReason,
    );
    const delays = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      isDelay,
    );

    const origins = await this.bookingsRepo.latestRescheduleOrigins(em, [
      booking.id,
    ]);

    // Sólo se busca el recurso si hace falta para decidir el motivo: un
    // paciente titular ya tiene permiso sin mirar la agenda.
    const resource =
      booking.resourceId && actor?.practitionerProfileId !== undefined
        ? await this.catalogRepo.findResourceById(em, booking.resourceId)
        : null;

    // H3.S1.M1 (BOLA/IDOR de lectura): el detalle no comprobaba de quién era
    // la cita — devolvía nombre, motivo y horario a cualquier cuenta con rol
    // de agenda. Mismo criterio que `loadForOperation`: el paciente titular o
    // su representante, quien opera cualquier agenda (`SCHEDULING_ADMIN`,
    // `SCHEDULING_AGENT`, `SUPERADMIN`), o quien atiende exactamente en ese
    // recurso. Reusa el `recurso` de arriba: no agrega una consulta nueva.
    if (this.isPatientActor(actor)) {
      await this.assertMayActForPatient(
        booking.patientProfileId,
        actor!,
        em,
      );
    } else if (actor && !this.operatesAnyAgenda(actor)) {
      const isOwnAgenda =
        actor.practitionerProfileId !== undefined &&
        resource !== null &&
        resource.resourceRefId === actor.practitionerProfileId &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);
      if (!isOwnAgenda) {
        throw new ForbiddenException(
          'Esta cita es de otra agenda: solo la opera quien atiende en ella.',
        );
      }
    }

    // El detalle tiene que decir exactamente lo mismo que el listado, así que
    // la tipología también se resuelve acá. Una sola cita: el lote de uno es la
    // misma consulta.
    const types =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.appointmentsRepo.findTypesByIds(em, [
            booking.appointmentId,
          ]);

    // El encuentro de la cita, mismo criterio (subtarea 4.3): lote de uno.
    const encounters =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.encountersRepo.findLatestIdsByAppointmentIds(em, [
            booking.appointmentId,
          ]);

    // El detalle dice lo mismo que el listado también en esto: quien representa
    // al paciente ve el motivo que él mismo escribió al pedir el turno.
    const representedPatients = this.isPatientActor(actor)
      ? await this.representation.findActiveProxiedPatientIds(actor!.id, em)
      : undefined;

    return this.aBookingItem(
      booking,
      slot,
      reasons.get(booking.id),
      delays.get(booking.id),
      actor,
      resource?.resourceRefId,
      origins.get(booking.id),
      undefined,
      booking.appointmentId == null
        ? undefined
        : types.get(booking.appointmentId),
      undefined,
      undefined,
      booking.appointmentId == null
        ? undefined
        : encounters.get(booking.appointmentId),
      undefined,
      representedPatients,
      // P42: el detalle dice lo mismo que el listado; lote de uno.
      await this.followUpLinks(em, [booking]),
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
   * P42 · Los dos lados del vínculo de reconsulta de un lote de citas.
   *
   * `followUpOf` sale de la columna de la propia cita, con el instante del
   * origen y su encuentro resueltos acá —una consulta por salto, no una por
   * fila—. `followUpBookingId` se DERIVA: la reconsulta viva (estados
   * visibles: ni cancelada ni ausente) más reciente que apunta a la cita. El
   * vínculo se guarda en un solo lado para que no haya dos verdades.
   *
   * @param em - Contexto de persistencia.
   * @param bookings - Citas a proyectar.
   * @returns Dos funciones de proyección por cita.
   */
  private async followUpLinks(
    em: EntityManager,
    bookings: readonly AppointmentBookings[],
  ): Promise<FollowUpLinks> {
    const originIds = [
      ...new Set(
        bookings
          .map((b) => b.followUpOfBookingId)
          .filter((id): id is string => id != null),
      ),
    ];
    const origins = await this.bookingsRepo.findBookingsWithSlotsByIds(
      em,
      originIds,
    );
    const originById = new Map(origins.map((o) => [o.booking.id, o]));
    const originAppointments = [
      ...new Set(
        origins
          .map(({ booking }) => booking.appointmentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const encounters = await this.encountersRepo.findLatestIdsByAppointmentIds(
      em,
      originAppointments,
    );

    const children = await this.bookingsRepo.findFollowUpsOf(
      em,
      bookings.map((b) => b.id),
      VISIBLE_BOOKING_STATES,
    );
    // Vienen de la más reciente a la más antigua: la primera por origen gana.
    const followUpByOrigin = new Map<string, string>();
    for (const { booking } of children) {
      const originBooking = booking.followUpOfBookingId;
      if (originBooking != null && !followUpByOrigin.has(originBooking)) {
        followUpByOrigin.set(originBooking, booking.id);
      }
    }

    return {
      followUpOf: (booking) => {
        if (booking.followUpOfBookingId == null) return null;
        const originBooking = originById.get(booking.followUpOfBookingId);
        const originAppointmentId = originBooking?.booking.appointmentId;
        return {
          bookingId: booking.followUpOfBookingId,
          encounterId: originAppointmentId == null ? null : (encounters.get(originAppointmentId) ?? null),
          startAt: originBooking?.slot?.startAt ?? null,
          ...(booking.formInstanceId == null
            ? {}
            : { formInstanceId: booking.formInstanceId }),
        };
      },
      followUpBookingId: (booking) =>
        followUpByOrigin.get(booking.id) ?? null,
    };
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
   * @param appointmentIds - Citas clínicas de la página, sin repetidos.
   * @returns Mapa `appointmentId` → resumen de la solicitud.
   */
  private async insuranceClaimsByAppointment(
    em: EntityManager,
    appointmentIds: readonly string[],
  ): Promise<Map<string, BookingInsuranceClaimDto>> {
    const byAppointment = new Map<string, BookingInsuranceClaimDto>();
    if (appointmentIds.length === 0) return byAppointment;

    const encountersByAppointment = await this.encountersRepo.findIdsByAppointmentIds(
      em,
      appointmentIds,
    );
    const appointmentByEncounter = new Map<string, string>();
    for (const [booking, encounters] of encountersByAppointment) {
      for (const encounter of encounters) {
        appointmentByEncounter.set(encounter, booking);
      }
    }
    if (appointmentByEncounter.size === 0) return byAppointment;

    const summaries = await this.claimReadRepo.findSummariesByEncounterIds(em, [
      ...appointmentByEncounter.keys(),
    ]);
    for (const summary of summaries) {
      const booking = appointmentByEncounter.get(summary.encounterId);
      if (booking === undefined || byAppointment.has(booking)) continue;
      byAppointment.set(booking, {
        id: summary.id,
        claimIdentifier: summary.claimIdentifier,
        statusCode: summary.statusCode,
        statusDisplay: summary.statusDisplay,
        submittedAt: summary.submittedAt?.toISOString() ?? null,
      });
    }
    return byAppointment;
  }

  private aBookingItem(
    booking: AppointmentBookings,
    slot: { startAt: Date; endAt?: Date } | null,
    reason: HistoryRevision | undefined,
    delay?: HistoryRevision,
    actor?: AuthenticatedUser,
    agendaPractitioner?: string,
    rescheduledFrom?: Date,
    patientName?: string,
    appointmentType?: string,
    paymentState?: AppointmentPaymentStates,
    carrierByPatient?: Map<string, string>,
    appointmentEncounter?: string,
    claimByAppointment?: Map<string, BookingInsuranceClaimDto>,
    representedPatients?: ReadonlySet<string>,
    followUps?: FollowUpLinks,
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
      encounterId: appointmentEncounter ?? null,
      // Se OMITE cuando nadie lo marcó, y no viaja como «pendiente»: pendiente
      // de pago es una afirmación que alguien firmó, y la ausencia es que del
      // pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`.
      ...(paymentState
        ? { paymentState: projectPaymentState(paymentState) }
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
      ...(canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? { reasonText: booking.reasonText }
        : {}),
      // El nombre viaja con la MISMA regla que el motivo: lo ve el titular y el
      // profesional que atiende, no la vista de la organización. El médico
      // necesita saber a quién espera —es el pedido explícito del registro del
      // cliente— y la organización ya opera con el identificador.
      ...(patientName !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? { patientName: patientName }
        : {}),
      // ALV-021: misma compuerta que el nombre. `null` es «se buscó y no
      // tiene» —Particular—; el campo entero se omite cuando quien mira no
      // puede ver al paciente, que es una pregunta distinta.
      ...(carrierByPatient !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            insuranceCarrierName:
              carrierByPatient.get(booking.patientProfileId) ?? null,
          }
        : {}),
      // La solicitud de seguro de la cita, con la misma compuerta y el mismo
      // trato del `null` que la aseguradora: `null` es «se buscó y no hay»
      // —también cuando la reserva todavía no tiene cita clínica, que no puede
      // tener solicitud—; ausente es «quien mira no puede verlo».
      ...(claimByAppointment !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            insuranceClaim:
              booking.appointmentId == null
                ? null
                : (claimByAppointment.get(booking.appointmentId) ?? null),
          }
        : {}),
      // La tipología viaja siempre que exista: no es dato clínico —es qué
      // clase de actividad ocupa el rato, lo mismo que ya dice la duración del
      // bloque— y sin ella la agenda del día no puede pintar una operación
      // distinto de una consulta. El motivo de consulta, que sí lo es, sigue
      // con su regla de arriba.
      // P42: el vínculo de reconsulta, con la misma compuerta que el nombre y
      // el motivo. Ausente = «no te corresponde verlo»; `null` = «se buscó y
      // no hay».
      ...(followUps !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            followUpOf: followUps.followUpOf(booking),
            followUpBookingId: followUps.followUpBookingId(booking),
          }
        : {}),
      // v4.2.40: el servicio que se reservó, de la copia congelada. Misma compuerta
      // que el motivo: el nombre de un servicio puede revelar un dato de salud.
      ...(booking.serviceSnapshot != null &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? { service: projectBookedService(booking.serviceSnapshot) }
        : {}),
      ...(appointmentType === undefined ? {} : { typeConceptId: appointmentType }),
      ...(rescheduledFrom ? { rescheduledFrom: rescheduledFrom } : {}),
      statusReason: aStatusReason(reason),
      delayNotice: aDelayNotice(delay),
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
   * @param data - Lo que la reserva sabe del turno.
   * @returns La cita creada, para enlazarla desde la reserva.
   */
  private createClinicalAppointment(
    tx: EntityManager,
    data: {
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
      /** Tipología (P42: la reconsulta nace `ACT_FOLLOW_UP`). Ausente = NULL. */
      typeConceptId?: string;
      actorUserId?: string;
    },
  ): Appointments {
    const isPractitionerResource =
      data.resourceRefType !== undefined &&
      PRACTITIONER_PROFILE_TABLES.includes(data.resourceRefType);

    return this.appointmentsRepo.create(tx, {
      patientProfileId: data.patientProfileId,
      tenantId: data.tenantId,
      ...(isPractitionerResource && data.resourceRefId !== undefined
        ? { practitionerProfileId: data.resourceRefId }
        : {}),
      statusConceptId: data.statusConceptId,
      startAt: data.startAt,
      ...(data.endAt === undefined ? {} : { endAt: data.endAt }),
      ...(data.reasonText === undefined
        ? {}
        : { reasonText: data.reasonText }),
      ...(data.channelConceptId === undefined
        ? {}
        : { channelConceptId: data.channelConceptId }),
      ...(data.typeConceptId === undefined
        ? {}
        : { typeConceptId: data.typeConceptId }),
      ...(data.actorUserId === undefined
        ? {}
        : { actorUserId: data.actorUserId }),
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
function readSnapshot(
  revision: HistoryRevision,
): BookingTransitionSnapshot | null {
  const snapshot: unknown = revision.dataSnapshot;
  if (typeof snapshot !== 'object' || snapshot === null) {
    return null;
  }
  return snapshot as BookingTransitionSnapshot;
}

/** Si la revisión explica el cambio: es la que se le muestra a la otra parte. */
function hasReason(revision: HistoryRevision): boolean {
  const reason = readSnapshot(revision)?.reasonText;
  return typeof reason === 'string' && reason.trim().length > 0;
}

/**
 * Si la revisión es una demora informada (P8).
 *
 * Se reconoce por sus minutos y no por el concepto de operación porque el
 * predicado sólo ve el snapshot; los minutos son, además, lo único sin lo cual
 * la demora no se puede mostrar.
 */
function isDelay(revision: HistoryRevision): boolean {
  const minutes = readSnapshot(revision)?.delayMinutes;
  return typeof minutes === 'number' && minutes > 0;
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
  const snapshot = readSnapshot(revision);
  const minutes = snapshot?.delayMinutes;
  if (typeof minutes !== 'number' || minutes <= 0) return undefined;

  const message = snapshot?.reasonText;
  return {
    delayMinutes: minutes,
    ...(typeof message === 'string' && message.trim().length > 0
      ? { message: message }
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
  const snapshot = readSnapshot(revision);
  const reason = snapshot?.reasonText;
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return undefined;
  }

  return {
    reasonText: reason,
    ...(snapshot?.actorKind === undefined
      ? {}
      : { actorKind: snapshot.actorKind }),
    ...(snapshot?.toStateConceptId === undefined
      ? {}
      : { toStateConceptId: snapshot.toStateConceptId }),
    changedAt: revision.recordedAt,
  };
}
