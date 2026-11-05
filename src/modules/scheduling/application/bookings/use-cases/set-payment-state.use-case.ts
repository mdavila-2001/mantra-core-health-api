import {
  PreconditionFailedException,
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
import {
  SetPaymentStateDto,
  SetPaymentStateResponseDto,
} from '../../../presentation/dto';
import { PinoLogger } from 'nestjs-pino';
import { STATES_WITHOUT_PAYMENT } from '../../../domain/booking/booking-states';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  BookingBillingBridge,
  amountsOf,
} from '../support/booking-billing-bridge';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { projectPaymentState } from '../support/booking-projections';
import { writePaymentState } from '../support/payment-state-writer';

/** TAREA-13 punto 5: marca el estado de pago de una cita. */
@Injectable()
export class SetPaymentStateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly access: BookingAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    private readonly billing: BookingBillingBridge,
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
   * ## El monto llega a facturación (FAC-01)
   *
   * Si la marca trae `amountReceived`, en la misma transacción se crea (la
   * primera vez) la cuenta por cobrar de la cita y se le asigna lo recibido.
   * Si facturación falla, la marca tampoco queda. Sin monto, la marca se
   * guarda como siempre y `billing` dice por qué no se facturó.
   *
   * @returns El estado de pago tal como quedó, con su facturación.
   * @throws PreconditionFailedException (422) si la cita está cancelada o
   *   rechazada, si el monto no es válido, si viene con «pendiente» o si pasa
   *   lo que falta pagar.
   */
  async execute(
    bookingId: string,
    dto: SetPaymentStateDto,
    actor: AuthenticatedUser,
  ): Promise<SetPaymentStateResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.set-payment-state',
        bookingId,
        state: dto.state,
        withAmount: dto.amountReceived !== undefined,
      },
      'Marking booking payment state',
    );

    // El monto se valida antes de abrir la transacción: un importe mal escrito
    // no tiene por qué bloquear la fila de pago de nadie.
    const amountCents =
      dto.amountReceived === undefined
        ? undefined
        : BookingBillingBridge.amountCents(dto.amountReceived);
    if (amountCents !== undefined && dto.state === 'PENDING') {
      throw new PreconditionFailedException(
        'Un monto recibido solo va con «pagada» o «pago parcial»: «pendiente» dice que todavía no se cobró.',
        { bookingId, state: dto.state },
        SchedulingErrorReason.PAYMENT_AMOUNT_WITHOUT_PAYMENT,
      );
    }

    return this.em.transactional(async (tx) => {
      const booking = await this.access.loadForOperation(tx, bookingId, actor);

      if (STATES_WITHOUT_PAYMENT.includes(booking.statusConceptId)) {
        // El mensaje dice POR QUÉ y no sólo que no se puede: quien lo lee está
        // mirando una cita que alguien canceló y necesita entender que el
        // problema no es su permiso.
        throw new PreconditionFailedException(
          'Una cita cancelada o rechazada no lleva estado de pago: no hubo atención que cobrar.',
          { bookingId, statusConceptId: booking.statusConceptId },
        );
      }

      const row = await writePaymentState(
        tx,
        this.bookingsRepo,
        this.history,
        booking,
        {
          statusConceptId: PAYMENT_STATE_CONCEPT[dto.state],
          insuranceUsed: dto.insuranceUsed ?? false,
        },
        actor,
      );

      const billing = await this.billing.bill(
        tx,
        booking,
        row,
        amountCents === undefined
          ? undefined
          : { amountCents, method: 'CASH', capAtBalance: false },
        actor.id,
      );
      await tx.flush();

      return { ...projectPaymentState(row), ...amountsOf(billing), billing };
    });
  }
}
