import { AppointmentPaymentStates } from '../../../entities';
import {
  PreconditionFailedException,
  createdBy,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import { BookingAccess } from '../support/booking-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_STATE_CONCEPT } from '../../../domain/booking/payment-state';
import { PaymentStateDto, SetPaymentStateDto } from '../../../presentation/dto';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import { STATES_WITHOUT_PAYMENT } from '../../../domain/booking/booking-states';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { projectPaymentState } from '../support/booking-projections';
import { randomUUID } from 'node:crypto';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** TAREA-13 punto 5: marca el estado de pago de una cita. */
@Injectable()
export class SetPaymentStateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly access: BookingAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SetPaymentStateUseCase.name);
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
  async execute(
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
      const booking = await this.access.loadForOperation(tx, bookingId, actor);

      if (STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)) {
        // El mensaje dice POR QUÉ y no sólo que no se puede: quien lo lee está
        // mirando una cita que alguien canceló y necesita entender que el
        // problema no es su permiso.
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar.',
          { bookingId, statusConceptId: booking.statusConceptId },
          SchedulingErrorReason.PAYMENT_STATE_NOT_APPLICABLE,
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
      await this.history.append(tx, booking.id, {
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
}
