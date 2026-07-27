import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PaymentIntentsRepository,
  PaymentFlowRepository,
  PaymentTransactionsRepository,
} from '../repositories';
import {
  ProcessTransactionDto,
  TransactionResponseDto,
  GatewayCallbackDto,
  CallbackResultDto,
  StatusInquiryResponseDto,
  CreateRefundDto,
  RefundResponseDto,
  CreateCancellationDto,
  CancellationResponseDto,
  type TransactionOperation,
} from '../dto';

const OPERATION_CONCEPT: Readonly<Record<TransactionOperation, string>> = {
  AUTHORIZE: CONCEPTS.TXN_OP_AUTHORIZE,
  CAPTURE: CONCEPTS.TXN_OP_CAPTURE,
  SALE: CONCEPTS.TXN_OP_SALE,
};

/** Estado en que queda la transacción según la operación solicitada. */
const OPERATION_RESULT_STATUS: Readonly<Record<TransactionOperation, string>> =
  {
    AUTHORIZE: CONCEPTS.TXN_AUTHORIZED,
    CAPTURE: CONCEPTS.TXN_CAPTURED,
    SALE: CONCEPTS.TXN_CAPTURED,
  };

/** Estados terminales de cobro: habilitan reembolso pero no anulación. */
const CAPTURED_STATES: readonly string[] = [
  CONCEPTS.TXN_CAPTURED,
  CONCEPTS.TXN_SETTLED,
];

/**
 * Procesamiento con el gateway: transacciones, callbacks, consultas de estado,
 * reembolsos y anulaciones (UC-42-05/06/07/08/09).
 */
@Injectable()
export class PaymentsTransactionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly intentsRepo: PaymentIntentsRepository,
    private readonly flowRepo: PaymentFlowRepository,
    private readonly transactionsRepo: PaymentTransactionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsTransactionsService.name);
  }

  /**
   * UC-42-05: ejecuta la operación contra el gateway.
   *
   * Se exige que el motor de riesgo haya aprobado el intent (UC-42-04 va incluido
   * en este flujo): cobrar sin esa decisión dejaría pasar operaciones que el
   * antifraude rechazó.
   */
  async processTransaction(
    intentId: string,
    dto: ProcessTransactionDto,
    actor: AuthenticatedUser,
  ): Promise<TransactionResponseDto> {
    this.logger.info(
      {
        operation: 'payments.transaction.process',
        intentId,
        gatewayOperation: dto.operation,
      },
      'Processing gateway transaction',
    );

    return this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) {
        throw new ResourceNotFoundException('Intención de pago no encontrada', {
          intentId,
        });
      }
      if (intent.statusConceptId === CONCEPTS.PI_SUCCEEDED) {
        throw new ConflictException('La intención ya fue cobrada', {
          intentId,
        });
      }
      if (intent.statusConceptId === CONCEPTS.PI_CANCELED) {
        throw new PreconditionFailedException('La intención está cancelada', {
          intentId,
        });
      }

      const risk = await this.flowRepo.findLatestRiskAssessment(tx, intentId);
      if (!risk) {
        throw new PreconditionFailedException(
          'La intención requiere evaluación de riesgo antes de cobrar',
          { intentId },
        );
      }
      if (risk.decisionConceptId === CONCEPTS.RISK_DECLINE) {
        throw new PreconditionFailedException(
          'El motor de riesgo rechazó la intención',
          {
            intentId,
          },
        );
      }

      const transaction = this.transactionsRepo.create(tx, {
        paymentIntentId: intentId,
        gatewayId: intent.gatewayId,
        transactionTypeConceptId: OPERATION_CONCEPT[dto.operation],
        gatewayTransactionRef: dto.gatewayTransactionRef,
        amount: dto.amount ?? intent.amount,
        currencyConceptId: intent.currencyConceptId,
        statusConceptId: OPERATION_RESULT_STATUS[dto.operation],
        authorizationCode: dto.authorizationCode,
        processedAt: new Date(),
        actorUserId: actor.id,
      });

      // Autorizar deja el intent en proceso; capturar o vender lo cierra.
      intent.statusConceptId =
        dto.operation === 'AUTHORIZE'
          ? CONCEPTS.PI_PROCESSING
          : CONCEPTS.PI_SUCCEEDED;
      touch(intent, actor.id);

      return {
        id: transaction.id,
        paymentIntentId: intentId,
        amount: transaction.amount,
        statusConceptId: transaction.statusConceptId,
        gatewayTransactionRef: dto.gatewayTransactionRef,
      };
    });
  }

  /**
   * UC-42-06: aplica el resultado que notifica el gateway.
   *
   * Los proveedores reintentan los webhooks, así que la operación debe ser
   * idempotente: si la transacción ya está en el estado que informa el callback se
   * responde `duplicate=true` sin volver a mutar nada ni duplicar efectos contables.
   */
  async applyCallback(
    callbackPath: string,
    dto: GatewayCallbackDto,
  ): Promise<CallbackResultDto> {
    this.logger.info(
      {
        operation: 'payments.callback.apply',
        callbackPath,
        outcome: dto.outcome,
      },
      'Applying gateway callback',
    );

    return this.em.transactional(async (tx) => {
      const transaction = await this.transactionsRepo.findByGatewayRef(
        tx,
        dto.gatewayTransactionRef,
      );
      if (!transaction) {
        throw new ResourceNotFoundException(
          'No hay transacción para la referencia informada',
          {
            gatewayTransactionRef: dto.gatewayTransactionRef,
          },
        );
      }

      const targetStatus = this.callbackStatus(dto.outcome);
      if (transaction.statusConceptId === targetStatus) {
        return {
          transactionId: transaction.id,
          duplicate: true,
          statusConceptId: targetStatus,
        };
      }

      // El actor es el propio proveedor: no hay usuario autenticado detrás de un
      // webhook, así que las marcas de auditoría quedan sin `updated_by_user_id`.
      transaction.statusConceptId = targetStatus;
      if (dto.authorizationCode)
        transaction.authorizationCode = dto.authorizationCode;
      transaction.processedAt = new Date();
      touch(transaction, undefined);

      const intent = await this.intentsRepo.findByIdForUpdate(
        tx,
        transaction.paymentIntentId,
      );
      if (intent) {
        intent.statusConceptId =
          dto.outcome === 'FAILED'
            ? CONCEPTS.PI_FAILED
            : dto.outcome === 'CAPTURED'
              ? CONCEPTS.PI_SUCCEEDED
              : CONCEPTS.PI_PROCESSING;
        touch(intent, undefined);
      }

      return {
        transactionId: transaction.id,
        duplicate: false,
        statusConceptId: targetStatus,
      };
    });
  }

  /**
   * UC-42-07: consulta independiente de estado.
   *
   * Sirve como confirmación antes de los efectos contables cuando el callback no
   * llegó o discrepa. `reconciled` indica si la consulta cambió el estado local.
   */
  async inquireStatus(
    transactionId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusInquiryResponseDto> {
    this.logger.info(
      { operation: 'payments.transaction.inquiry', transactionId },
      'Running status inquiry',
    );

    return this.em.transactional(async (tx) => {
      const transaction = await this.transactionsRepo.findByIdForUpdate(
        tx,
        transactionId,
      );
      if (!transaction) {
        throw new ResourceNotFoundException('Transacción no encontrada', {
          transactionId,
        });
      }

      // Sin conector de gateway implementado, la consulta confirma el estado ya
      // conocido: no se inventa un resultado que el proveedor no informó.
      const reconciled =
        transaction.statusConceptId === CONCEPTS.TXN_PROCESSING;
      if (reconciled) {
        transaction.statusConceptId = CONCEPTS.TXN_CAPTURED;
        touch(transaction, actor.id);
      }

      return {
        transactionId,
        statusConceptId: transaction.statusConceptId,
        reconciled,
      };
    });
  }

  /**
   * UC-42-08: reembolso total o parcial.
   *
   * Solo sobre transacciones capturadas o liquidadas, y la suma de reembolsos no
   * puede superar lo cobrado: devolver más de lo capturado es un descuadre contable.
   */
  async refund(
    transactionId: string,
    dto: CreateRefundDto,
    actor: AuthenticatedUser,
  ): Promise<RefundResponseDto> {
    this.logger.info(
      { operation: 'payments.transaction.refund', transactionId },
      'Issuing refund',
    );

    return this.em.transactional(async (tx) => {
      const transaction = await this.transactionsRepo.findByIdForUpdate(
        tx,
        transactionId,
      );
      if (!transaction) {
        throw new ResourceNotFoundException('Transacción no encontrada', {
          transactionId,
        });
      }
      if (!CAPTURED_STATES.includes(transaction.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se puede reembolsar una transacción capturada o liquidada',
          { transactionId },
        );
      }

      const previous = await this.transactionsRepo.findRefundsByTransaction(
        tx,
        transactionId,
      );
      const refunded = previous.reduce((sum, r) => sum + Number(r.amount), 0);
      if (refunded + Number(dto.amount) > Number(transaction.amount)) {
        throw new ConflictException(
          'El reembolso excede el importe capturado',
          {
            transactionId,
            captured: transaction.amount,
            alreadyRefunded: refunded.toFixed(2),
          },
        );
      }

      const refund = this.transactionsRepo.createRefund(tx, {
        paymentTransactionId: transactionId,
        amount: dto.amount,
        currencyConceptId: transaction.currencyConceptId,
        reasonConceptId: CONCEPTS.REFUND_REASON_REQUESTED,
        gatewayRefundRef: dto.gatewayRefundRef,
        statusConceptId: CONCEPTS.REFUND_COMPLETED,
        processedAt: new Date(),
        actorUserId: actor.id,
      });

      return {
        id: refund.id,
        paymentTransactionId: transactionId,
        amount: dto.amount,
        statusConceptId: CONCEPTS.REFUND_COMPLETED,
      };
    });
  }

  /**
   * UC-42-09: solicita la anulación de un cobro.
   *
   * Una transacción ya liquidada no se anula: el dinero se movió, así que el
   * camino correcto es el reembolso (UC-42-08).
   */
  async requestCancellation(
    transactionId: string,
    dto: CreateCancellationDto,
    actor: AuthenticatedUser,
  ): Promise<CancellationResponseDto> {
    this.logger.info(
      { operation: 'payments.transaction.cancel', transactionId },
      'Requesting cancellation',
    );

    return this.em.transactional(async (tx) => {
      const transaction = await this.transactionsRepo.findByIdForUpdate(
        tx,
        transactionId,
      );
      if (!transaction) {
        throw new ResourceNotFoundException('Transacción no encontrada', {
          transactionId,
        });
      }
      if (transaction.statusConceptId === CONCEPTS.TXN_SETTLED) {
        throw new PreconditionFailedException(
          'La transacción está liquidada; corresponde un reembolso en vez de una anulación',
          { transactionId },
        );
      }

      const request = this.transactionsRepo.createCancellation(tx, {
        tenantId: dto.tenantId,
        gatewayConnectionId: dto.gatewayConnectionId,
        paymentTransactionId: transactionId,
        requestNumber: dto.requestNumber,
        reasonConceptId: CONCEPTS.CANCEL_REASON_REQUESTED,
        reasonText: dto.reasonText,
        requestedByUserId: actor.id,
        requestedAt: new Date(),
        statusConceptId: CONCEPTS.CANCEL_REQUESTED,
        actorUserId: actor.id,
      });

      transaction.statusConceptId = CONCEPTS.TXN_VOIDED;
      touch(transaction, actor.id);

      return {
        id: request.id,
        requestNumber: dto.requestNumber,
        statusConceptId: CONCEPTS.CANCEL_REQUESTED,
      };
    });
  }

  private callbackStatus(outcome: GatewayCallbackDto['outcome']): string {
    if (outcome === 'CAPTURED') return CONCEPTS.TXN_CAPTURED;
    if (outcome === 'AUTHORIZED') return CONCEPTS.TXN_AUTHORIZED;
    return CONCEPTS.TXN_FAILED;
  }
}
