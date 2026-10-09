import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import type { BookingChange } from '../../../domain/notices/agenda-notices';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import {
  CancelBookingDto,
  CancelBookingResponseDto,
} from '../../../presentation/dto';
import type { CancellationPolicySnapshot } from '../../../entities';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_REPRESENTATION_PORT,
  type PatientRepresentationPort,
} from '../../ports/patient-representation.port';
import { PinoLogger } from 'nestjs-pino';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingWaitlistService } from '../../waitlist/scheduling-waitlist.service';
import { isPatientActor } from '../../../domain/booking/agenda-actors';
import { requireReason } from '../support/require-reason';
import {
  blocksHolderCancellation,
  cancellationWindowMinutes,
  isChargeableCancellation,
  isWithinCancellationWindow,
} from '../../../domain/booking/cancellation-policy';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** UC-41-09: cancela la cita y libera el cupo (también lo usa el rechazo). */
@Injectable()
export class CancelBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: BookingAccess,
    @Inject(PATIENT_REPRESENTATION_PORT)
    private readonly representation: PatientRepresentationPort,
    private readonly transitions: BookingTransitionRecorder,
    private readonly notifier: BookingChangeNotifier,
    private readonly waitlist: SchedulingWaitlistService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CancelBookingUseCase.name);
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
  async execute(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
    change: BookingChange = 'CANCELLED',
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
        throw new ResourceNotFoundException(
          'Cita no encontrada',
          {
            bookingId,
          },
          SchedulingErrorReason.BOOKING_NOT_FOUND,
        );
      }

      // H3.S1.M2 (BOLA/IDOR de escritura): cancelar/rechazar no comprobaba de
      // quién era la cita — el único control era `@Roles(...,'PATIENT')`, que
      // autoriza a cualquier cuenta de paciente, no sólo a la titular. Mismo
      // método que ya usan `placeHold`, la confirmación del hold y `enroll` de
      // la lista de espera: es un no-op para quien opera la agenda.
      await this.access.assertMayActForPatient(
        booking.patientProfileId,
        actor,
        tx,
      );

      if (booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED) {
        throw new ConflictException(
          'La cita ya está cancelada',
          { bookingId },
          SchedulingErrorReason.BOOKING_ALREADY_CANCELLED,
        );
      }

      // C-10: sólo se cancela desde un estado que la máquina permite cancelar
      // (no desde COMPLETED ni NO_SHOW).
      const fromState = booking.statusConceptId;
      this.transitions.assertTransition(fromState, CONCEPTS.BOOKING_CANCELLED);

      const isNoShow = dto.isNoShow ?? false;

      // CAN-APT-001: la ventana y el cargo salen del snapshot congelado de la
      // reserva, NUNCA de la política actual (que pudo cambiar tras la aceptación).
      // La columna es jsonb (`unknown` en la entidad generada); el contrato vive
      // en appointment_bookings.types.ts y quien escribió el snapshot lo honró.
      const snapshot = booking.cancellationPolicySnapshot as
        CancellationPolicySnapshot | undefined;
      const windowMinutes = cancellationWindowMinutes(snapshot);

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
      const withinWindow = isWithinCancellationWindow(
        slot?.startAt,
        Date.now(),
        windowMinutes,
      );

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
        (isPatientActor(actor) &&
          (await this.representation.representsPatient(
            booking.patientProfileId,
            actor,
            tx,
          )));

      if (blocksHolderCancellation(isHolderPatient, withinWindow, isNoShow)) {
        throw new PreconditionFailedException(
          `Puede cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no puede asistir, comuníquese con el consultorio.`,
          {
            bookingId,
            cancellationWindowMinutes: windowMinutes,
            startAt: slot?.startAt.toISOString(),
          },
          SchedulingErrorReason.CANCELLATION_WINDOW_NOT_MET,
        );
      }

      // Se cobra si es inasistencia o si la cancelación cae dentro de la ventana
      // (tardía). Una cancelación avisada a tiempo no genera cargo.
      //
      // Tras la regla de arriba, la cancelación tardía sólo puede venir de quien
      // atiende o de una inasistencia: al paciente ya no se le cobra por algo
      // que no puede hacer.
      const chargeable = isChargeableCancellation(isNoShow, withinWindow);
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
      await this.transitions.recordTransition(tx, booking, actor, {
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
          slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
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

    await this.notifier.notifyChange(
      bookingId,
      change,
      reason,
      dto.cancelledBy,
    );
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
}
