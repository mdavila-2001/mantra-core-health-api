import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  touch,
} from '../../../common';
import { PaymentIntentsRepository } from '../repositories';
import { PaymentsErrorReason } from '../payments.error-reasons';
import {
  PAYMENTS_GATEWAY_CONFIG,
  type PaymentsGatewayConfig,
} from '../gateway/payments-gateway.env';
import { PaymentsGatewayClient } from '../gateway/payments-gateway.client';
import {
  PaymentsGatewayError,
  PaymentsGatewayResultAmbiguousException,
  PaymentsGatewayUnavailableException,
} from '../gateway/payments-gateway.errors';
import {
  GatewayAmountError,
  decimalToMinorUnits,
} from '../gateway/payments-gateway-amount';
import { deriveGatewayIdempotencyKey } from '../gateway/payments-gateway-idempotency';
import {
  decideGatewayEvent,
  isTerminalGatewayStatus,
  LOCAL_INTENT_STATUS,
} from '../gateway/payments-gateway-status';
import type {
  GatewayNextAction,
  GatewayPaymentIntentCreate,
  GatewayPaymentIntentStatus,
  GatewayPaymentMethodType,
} from '../gateway/payments-gateway.types';

/** Vida mínima y máxima de un cobro que admite la pasarela (`expires_in_seconds`). */
const MIN_EXPIRES_IN_SECONDS = 60;
const MAX_EXPIRES_IN_SECONDS = 86_400;

/** Lo que se necesita de la intención local para cobrarla por la pasarela. */
export interface GatewayChargeable {
  /** Id local de la intención. */
  id: string;
  /** Tenant propietario. */
  tenantId: string;
  /** Importe decimal como lo guarda la base. */
  amount: string;
  /** Concepto de moneda. */
  currencyConceptId: string;
  /** Clave de idempotencia local. */
  idempotencyKey: string;
  /** Tipo del recurso de origen, si lo hay. */
  sourceRefType?: string | null;
  /** Id del recurso de origen (deuda u orden), si lo hay. */
  sourceRefId?: string | null;
  /** Factura que se cobra, si lo hay. */
  invoiceId?: string | null;
  /** Alta de la intención (persistida): ancla determinista del vencimiento. */
  createdAt: Date;
  /** Vencimiento pedido para la intención, si lo hay. */
  expiresAt?: Date | null;
}

/** Resultado de haber creado el cobro en la pasarela. */
export interface GatewayDispatchResult {
  /** `pi_…`. */
  gatewayIntentRef: string;
  /** Estado del cobro en la pasarela. */
  gatewayStatus: GatewayPaymentIntentStatus;
  /** Qué tiene que hacer el pagador (QR, instrucciones, redirección). */
  nextAction?: GatewayNextAction;
  /** `true` si la pasarela devolvió la respuesta guardada de un intento anterior. */
  replayed: boolean;
}

/**
 * Cobro de una intención del módulo 42 a través de la pasarela (carril INT,
 * `payments.via_gateway`). Reemplaza al camino «M42 → proveedor» **sólo** cuando
 * el flag está encendido; con el flag apagado nadie lo invoca.
 *
 * El flujo respeta la regla 11 de la pasarela: la intención local se persiste
 * **antes** de llamar, la `Idempotency-Key` sale de datos ya persistidos, y un
 * resultado ambiguo (timeout, 5xx, 409 en curso) nunca se trata como fallo: el
 * cobro local queda pendiente y se reintenta con la MISMA clave.
 *
 * Lo mínimo que viaja: importe en unidades menores, moneda, tipo de medio de
 * pago, vida del cobro y el id local de la intención como metadato. Ningún dato
 * del paciente, de la deuda ni de la factura.
 */
@Injectable()
export class PaymentsGatewayChargeService {
  private readonly client?: PaymentsGatewayClient;

  /**
   * @param config - Configuración validada al arrancar.
   * @param em - Contexto de persistencia.
   * @param intentsRepo - Repositorio de intenciones.
   * @param logger - Logger estructurado (sólo ids y estados).
   * @param client - Cliente inyectable; las pruebas pasan uno propio.
   */
  constructor(
    @Inject(PAYMENTS_GATEWAY_CONFIG)
    private readonly config: PaymentsGatewayConfig,
    private readonly em: EntityManager,
    private readonly intentsRepo: PaymentIntentsRepository,
    private readonly logger: PinoLogger,
    @Optional() client?: PaymentsGatewayClient,
  ) {
    this.logger.setContext(PaymentsGatewayChargeService.name);
    this.client =
      client ??
      (config.viaGateway ? new PaymentsGatewayClient(config) : undefined);
  }

  /** `payments.via_gateway`: los cobros nuevos van a la pasarela. */
  get enabled(): boolean {
    return this.config.viaGateway;
  }

  /**
   * Arma el cuerpo de `POST /payment_intents` desde la intención **persistida**.
   *
   * Es una función pura de campos guardados: una intención reintentada produce
   * el mismo cuerpo, que es lo que exige la pasarela para devolver el cobro
   * original (otro cuerpo con la misma clave es `422 idempotency_key_reused`).
   *
   * @throws PreconditionFailedException si la intención no se puede cobrar por la
   *   pasarela (moneda distinta de BOB, sin medio de pago, importe con más
   *   decimales que la moneda o vencimiento fuera de 60 s a 24 h).
   */
  buildCreateRequest(
    intent: GatewayChargeable,
    methodType: GatewayPaymentMethodType | undefined,
  ): GatewayPaymentIntentCreate {
    if (intent.currencyConceptId !== CONCEPTS.CURRENCY_BOB) {
      throw new PreconditionFailedException(
        'La pasarela sólo cobra en bolivianos (BOB)',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
      );
    }
    if (!methodType) {
      throw new PreconditionFailedException(
        'Con la pasarela activa hay que indicar paymentMethodType (qr, card, bank_transfer o wallet)',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
      );
    }
    let amountMinor: number;
    try {
      amountMinor = decimalToMinorUnits(intent.amount);
    } catch (error) {
      throw new PreconditionFailedException(
        'El importe no se puede expresar en centavos enteros positivos',
        {
          intentId: intent.id,
          cause: error instanceof GatewayAmountError ? error.reason : 'invalid',
        },
        PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE,
      );
    }

    const request: GatewayPaymentIntentCreate = {
      amount_minor: amountMinor,
      currency: 'BOB',
      payment_method: { type: methodType },
      metadata: { mantra_intent_id: intent.id },
    };
    if (intent.expiresAt) {
      // Relativo al alta persistida y no a «ahora»: así el reintento manda el
      // mismo número y no cambia el cuerpo bajo la misma clave.
      const seconds = Math.round(
        (intent.expiresAt.getTime() - intent.createdAt.getTime()) / 1000,
      );
      if (
        seconds < MIN_EXPIRES_IN_SECONDS ||
        seconds > MAX_EXPIRES_IN_SECONDS
      ) {
        throw new PreconditionFailedException(
          'La pasarela admite cobros que vencen entre 60 segundos y 24 horas',
          { intentId: intent.id, expiresInSeconds: seconds },
          PaymentsErrorReason.PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE,
        );
      }
      request.expires_in_seconds = seconds;
    }
    return request;
  }

  /**
   * Crea el cobro en la pasarela y asocia su `pi_…` a la intención local.
   *
   * Reintentable de punta a punta: si el proceso muere entre la respuesta de la
   * pasarela y el guardado de la referencia, repetir la operación manda la misma
   * `Idempotency-Key` y recibe el mismo cobro.
   *
   * @throws PaymentsGatewayResultAmbiguousException (504) si no se sabe si se creó.
   * @throws PaymentsGatewayUnavailableException (503) si la pasarela no atiende.
   * @throws PreconditionFailedException (422) si la pasarela la rechazó de forma definitiva.
   */
  async dispatch(
    intent: GatewayChargeable,
    methodType: GatewayPaymentMethodType | undefined,
  ): Promise<GatewayDispatchResult> {
    const request = this.buildCreateRequest(intent, methodType);
    const idempotencyKey = deriveGatewayIdempotencyKey({
      tenantId: intent.tenantId,
      sourceRefType: intent.sourceRefType,
      sourceRefId: intent.sourceRefId,
      invoiceId: intent.invoiceId,
      localIdempotencyKey: intent.idempotencyKey,
    });
    if (!this.client) {
      // Inalcanzable con `enabled`; falla cerrado si alguien lo invoca igual.
      throw new PaymentsGatewayUnavailableException(intent.id);
    }

    this.logger.info(
      { operation: 'payments.gateway.create', intentId: intent.id },
      'Creating payment intent in gateway',
    );

    let created;
    try {
      created = await this.client.createPaymentIntent(request, idempotencyKey, {
        requestId: `mantra-${intent.id}`,
        onRetry: (info) =>
          this.logger.warn(
            {
              operation: 'payments.gateway.create',
              intentId: intent.id,
              attempt: info.attempt,
              delayMs: info.delayMs,
              reason: info.reason,
            },
            'Gateway call not conclusive; retrying with the same idempotency key',
          ),
      });
    } catch (error) {
      throw this.toDomainError(error, intent.id);
    }

    if (created.intent.amount_minor !== request.amount_minor) {
      // No debería ocurrir con la misma clave y cuerpo; si ocurre no se asocia
      // un cobro por otro importe a esta intención.
      this.logger.error(
        {
          operation: 'payments.gateway.create',
          intentId: intent.id,
          gatewayIntentRef: created.intent.id,
        },
        'Gateway returned an amount different from the requested one',
      );
      throw new ConflictException(
        'La pasarela devolvió un importe distinto del pedido',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_RESPONSE_MISMATCH,
      );
    }

    await this.associate(intent.id, created.intent.id, created.intent.status);

    return {
      gatewayIntentRef: created.intent.id,
      gatewayStatus: created.intent.status,
      nextAction: created.intent.next_action,
      replayed: created.replayed,
    };
  }

  /**
   * Guarda el `pi_…` en la intención y adelanta su estado si corresponde.
   *
   * Sólo avanza hacia un estado no terminal: un terminal en la respuesta de
   * creación lo aplica el webhook (con su inbox y su efecto sobre la deuda), no
   * esta ruta.
   */
  private async associate(
    intentId: string,
    gatewayIntentRef: string,
    gatewayStatus: GatewayPaymentIntentStatus,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) return;
      if (
        intent.gatewayIntentRef &&
        intent.gatewayIntentRef !== gatewayIntentRef
      ) {
        throw new ConflictException(
          'La intención ya está asociada a otro cobro de la pasarela',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_RESPONSE_MISMATCH,
        );
      }
      intent.gatewayIntentRef = gatewayIntentRef;
      if (
        !isTerminalGatewayStatus(gatewayStatus) &&
        decideGatewayEvent(intent.statusConceptId, gatewayStatus) === 'aplicar'
      ) {
        intent.statusConceptId = LOCAL_INTENT_STATUS[gatewayStatus];
      }
      touch(intent, undefined);
    });
  }

  /** Traduce el error del cliente al contrato HTTP de la API, sin filtrar el de la pasarela. */
  private toDomainError(error: unknown, intentId: string): Error {
    if (!(error instanceof PaymentsGatewayError)) return error as Error;
    const log = {
      operation: 'payments.gateway.create',
      intentId,
      status: error.status,
      gatewayCode: error.code,
      requestId: error.details.requestId,
    };

    // Ambiguo: el cobro local se conserva; nada se anula ni se borra (regla 11).
    if (error.isAmbiguous) {
      this.logger.warn(
        { ...log, resolution: 'retry-same-key-or-escalate' },
        'Gateway result is ambiguous; local intent kept pending',
      );
      return new PaymentsGatewayResultAmbiguousException(intentId);
    }
    // 401/403/429 agotado: es de la conexión o de la carga, no del cobro.
    if (
      error.retryable ||
      error.status === 401 ||
      error.status === 403 ||
      error.status === 404
    ) {
      this.logger.error(
        log,
        'Gateway unavailable or rejecting API credentials',
      );
      return new PaymentsGatewayUnavailableException(intentId);
    }
    this.logger.warn(log, 'Gateway rejected the payment intent');
    return new PreconditionFailedException(
      'La pasarela rechazó el cobro',
      { intentId, gatewayCode: error.code },
      PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
    );
  }
}
