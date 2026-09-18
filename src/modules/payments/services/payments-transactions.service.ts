import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  touch,
  verifySignature,
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
import { resolveGatewayWebhookSecrets } from './webhook-secret.resolver';

const OPERATION_CONCEPT: Readonly<Record<TransactionOperation, string>> = {
  AUTHORIZE: CONCEPTS.TXN_OP_AUTHORIZE,
  CAPTURE: CONCEPTS.TXN_OP_CAPTURE,
  SALE: CONCEPTS.TXN_OP_SALE,
};

/*
 * Contención MCH-003 (F01-T01). El módulo no tiene adaptador de gateway: ninguna
 * de estas rutas llama a un proveedor. Hasta que exista uno (F05), lo único
 * honesto es registrar la *solicitud* y dejar el resultado pendiente. El único
 * camino que puede afirmar que el dinero se movió es el callback firmado del
 * proveedor (`applyCallback`), que verifica el HMAC antes de tocar un estado.
 */

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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param intentsRepo - Valor de intents repo requerido por la operación.
   * @param flowRepo - Valor de flow repo requerido por la operación.
   * @param transactionsRepo - Valor de transactions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
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
   * UC-42-05: registra la operación solicitada al gateway.
   *
   * La transacción nace en PROCESSING sea cual sea la operación: sin adaptador no
   * hay respuesta del proveedor que permita afirmar autorización ni captura.
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

      // Una operación abierta impide otra que el proveedor pueda confirmar a la
      // vez: sería un segundo cobro. Sobre una autorización confirmada sólo cabe
      // capturarla; otra venta o autorización duplicaría el cargo.
      const open = await this.transactionsRepo.findPendingByIntent(
        tx,
        intentId,
      );
      if (
        open &&
        (open.statusConceptId === CONCEPTS.TXN_PROCESSING ||
          dto.operation !== 'CAPTURE')
      ) {
        throw new ConflictException(
          'La intención tiene una operación abierta en el gateway',
          {
            intentId,
            transactionId: open.id,
            statusConceptId: open.statusConceptId,
          },
        );
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
        statusConceptId: CONCEPTS.TXN_PROCESSING,
        authorizationCode: dto.authorizationCode,
        processedAt: new Date(),
        actorUserId: actor.id,
      });

      // El intent sólo se cierra cuando el proveedor confirma por callback.
      intent.statusConceptId = CONCEPTS.PI_PROCESSING;
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

      // Verificación de origen del webhook (fail-closed). Sin esto, cualquiera que
      // conozca una `gatewayTransactionRef` podía forzar `PI_SUCCEEDED` (pago
      // fraudulento). MCH-019: el HMAC se valida con el secreto de la conexión
      // configurada (`gateway_connections.webhook_secret_ref`); sin él, se rechaza.
      const { secrets, connectionId, reason } =
        await resolveGatewayWebhookSecrets(tx, transaction);
      const signedBody = canonicalJson({
        gatewayTransactionRef: dto.gatewayTransactionRef,
        outcome: dto.outcome,
        authorizationCode: dto.authorizationCode,
      });
      const signature = dto.signature;
      if (
        !signature ||
        !secrets.some((secret) =>
          verifySignature(secret, signedBody, signature),
        )
      ) {
        this.logger.warn(
          {
            operation: 'payments.callback.apply',
            gatewayTransactionRef: dto.gatewayTransactionRef,
            gatewayConnectionId: connectionId,
            reason: reason ?? 'invalid-signature',
          },
          'Rejected gateway callback with invalid signature',
        );
        throw new UnauthorizedException('Firma del webhook inválida');
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
   * llegó o discrepa. `reconciled` indica si la consulta cambió el estado local;
   * mientras no exista adaptador de gateway es siempre `false`.
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

      // Sin conector de gateway no hay a quién consultar: se devuelve el estado
      // conocido tal cual. Antes esto convertía PROCESSING en CAPTURED, es decir,
      // afirmaba un cobro que el proveedor nunca informó (MCH-003-AC01).
      this.logger.warn(
        {
          operation: 'payments.transaction.inquiry',
          transactionId,
          actorUserId: actor.id,
          reason: 'gateway-adapter-not-configured',
        },
        'Status inquiry answered from local state; no gateway adapter',
      );

      return {
        transactionId,
        statusConceptId: transaction.statusConceptId,
        reconciled: false,
      };
    });
  }

  /**
   * UC-42-08: solicita un reembolso total o parcial; queda pendiente del gateway.
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
      // Un reembolso fallido no devolvió dinero; uno pendiente sí lo compromete.
      const refunded = previous
        .filter((r) => r.statusConceptId !== CONCEPTS.REFUND_FAILED)
        .reduce((sum, r) => sum + Number(r.amount), 0);
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
        // Pendiente hasta que el proveedor confirme la devolución (MCH-003-AC03).
        statusConceptId: CONCEPTS.REFUND_PENDING,
        actorUserId: actor.id,
      });

      return {
        id: refund.id,
        paymentTransactionId: transactionId,
        amount: dto.amount,
        statusConceptId: CONCEPTS.REFUND_PENDING,
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

      // La transacción no cambia: anular es una decisión del proveedor, no de
      // quien la pide. CANCEL_REQUESTED no es VOIDED (MCH-003-AC03).

      return {
        id: request.id,
        requestNumber: dto.requestNumber,
        statusConceptId: CONCEPTS.CANCEL_REQUESTED,
      };
    });
  }

  /**
   * Ejecuta la operación callback status.
   *
   * @param outcome - Valor de outcome requerido por la operación.
   * @returns Resultado de callback status conforme al contrato `string`.
   */
  private callbackStatus(outcome: GatewayCallbackDto['outcome']): string {
    if (outcome === 'CAPTURED') return CONCEPTS.TXN_CAPTURED;
    if (outcome === 'AUTHORIZED') return CONCEPTS.TXN_AUTHORIZED;
    return CONCEPTS.TXN_FAILED;
  }
}
