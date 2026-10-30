import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
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
  canResendWithSameKey,
  classifyInFlight,
  dispatchLeaseMs,
  dispatchMarkAgeMs,
  dispatchMarkStamp,
  isDispatchMark,
  newDispatchMark,
} from '../gateway/payments-gateway-dispatch-mark';
import { gatewayMetrics } from '../gateway/payments-gateway-metrics';
import {
  DispatchSlots,
  dispatchConcurrencyLimit,
  readPoolMax,
} from '../gateway/payments-gateway-concurrency';
import { runCommitted } from './payments-committed-transaction';
import {
  PaymentsGatewayBusyException,
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

/**
 * `422 idempotency_key_reused`: la pasarela YA tiene una petición con esta clave y
 * otro cuerpo, o sea que un cobro de esta intención existe. No es un rechazo que
 * libere la reserva.
 */
const IDEMPOTENCY_KEY_REUSED = 'idempotency_key_reused';

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
  /** Referencia del cobro o marca de despacho que la intención lleva ahora. */
  gatewayIntentRef?: string | null;
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
  /** Concepto de estado local de la intención tras asociar el cobro. */
  localStatusConceptId: string;
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
 * pago y vida del cobro. Ni el id local va como metadato: el escáner de números
 * de tarjeta de la pasarela (`card_number_detected`, comprobado contra el stack
 * sandbox) rechaza cuerpos con corridas de dígitos válidas por Luhn y un UUID
 * puede producirlas. La correlación es por el `pi_…` que la pasarela devuelve.
 * Ningún dato del paciente, de la deuda ni de la factura.
 */
@Injectable()
export class PaymentsGatewayChargeService {
  private readonly client?: PaymentsGatewayClient;
  private readonly slots = new DispatchSlots(
    dispatchConcurrencyLimit(readPoolMax()),
  );

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
   * Cuánto bloquea la marca de despacho de una intención a las demás de la misma
   * deuda antes de darse por abandonada. Ver `dispatchLeaseMs`.
   */
  get dispatchLeaseMs(): number {
    return dispatchLeaseMs(this.config);
  }

  /**
   * Cupo de despacho para una petición que corre DENTRO de una transacción de
   * petición (`RLS_ENFORCE=true`): ver `dispatchConcurrencyLimit`. Sin cupo falla
   * al instante con `503 PAYMENT_GATEWAY_BUSY` (reintentable con la misma clave),
   * sin reservar ni llamar a nada.
   *
   * @returns La función que libera el cupo; hay que llamarla siempre (`finally`).
   */
  acquireDispatchSlot(intentId: string): () => void {
    const release = this.slots.tryAcquire();
    if (!release) {
      this.logger.warn(
        {
          operation: 'payments.gateway.create',
          intentId,
          limit: this.slots.limit,
        },
        'Too many gateway dispatches in flight inside request transactions; rejecting',
      );
      throw new PaymentsGatewayBusyException(intentId);
    }
    return release;
  }

  /**
   * Reserva el despacho: escribe la marca en `gateway_intent_ref`. Se llama DENTRO
   * de la transacción de la compuerta, con la deuda bloqueada, para que se confirme
   * junto con ella y antes de llamar a la pasarela. A partir de ese `COMMIT` las
   * demás intenciones de la deuda ven este cobro como «en vuelo» (`pi_…` todavía
   * desconocido incluido) y la propia intención puede repetir la operación con la
   * misma clave sin bloquearse.
   *
   * Si la intención YA tiene una marca (reintento tras un resultado ambiguo) la
   * nueva conserva su fecha original: de ella depende saber cuánto lleva la clave
   * en la pasarela, y renovarla ocultaría que pasó más de lo que la pasarela
   * recuerda. El valor, en cambio, es nuevo en cada petición: así una petición que
   * termina con un rechazo definitivo sólo libera su propia reserva y nunca la de
   * otra petición de la misma intención que sigue en vuelo.
   */
  reserveDispatch(intent: {
    gatewayIntentRef?: string;
    updatedAt: Date;
    updatedByUserId?: string;
  }): void {
    // Cada petición escribe SU marca (valor único) para poder liberar sólo la
    // suya (`releaseReservation`); si ya había una, la fecha es la original.
    const stamp = dispatchMarkStamp(intent.gatewayIntentRef);
    intent.gatewayIntentRef = newDispatchMark(stamp ?? Date.now());
    touch(intent, undefined);
  }

  /**
   * Intenciones del tenant con una reserva de despacho que ya no está en vuelo
   * (más vieja que `dispatchLeaseMs`, o con la fecha ilegible) y sigue sin `pi_…`:
   * son las que requieren conciliación. Bloquean la deuda hasta que alguien las
   * concilia (`PaymentsTransactionsService.reconcileGatewayDispatch`).
   */
  async listDispatchesRequiringReconciliation(
    tenantId: string,
  ): Promise<
    { intentId: string; ageMs: number | null; canReconcile: boolean }[]
  > {
    const nowMs = Date.now();
    const marked = await this.intentsRepo.findDispatchMarksByTenant(
      this.em,
      tenantId,
    );
    return marked
      .filter(
        (row) =>
          classifyInFlight(row, nowMs, this.dispatchLeaseMs) ===
          'reconciliation_required',
      )
      .map((row) => ({
        intentId: row.id,
        ageMs: dispatchMarkAgeMs(row.gatewayIntentRef, nowMs) ?? null,
        canReconcile: canResendWithSameKey(row.gatewayIntentRef, nowMs),
      }));
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
    if (!methodType) {
      throw new PreconditionFailedException(
        'Con la pasarela activa hay que indicar paymentMethodType (qr, card, bank_transfer o wallet)',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
      );
    }
    return {
      ...this.assertRoutable(intent),
      payment_method: { type: methodType },
    };
  }

  /**
   * Comprueba que la intención se pueda cobrar por la pasarela (moneda BOB,
   * importe en centavos enteros, vida de 60 s a 24 h) sin pedir todavía el medio
   * de pago. Se usa al crear la intención para no dejar filas que después no se
   * podrían cobrar.
   *
   * @returns El cuerpo del cobro, sin el medio de pago.
   */
  assertRoutable(
    intent: GatewayChargeable,
  ): Omit<GatewayPaymentIntentCreate, 'payment_method'> {
    if (intent.currencyConceptId !== CONCEPTS.CURRENCY_BOB) {
      throw new PreconditionFailedException(
        'La pasarela sólo cobra en bolivianos (BOB)',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
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

    const request: Omit<GatewayPaymentIntentCreate, 'payment_method'> = {
      amount_minor: amountMinor,
      currency: 'BOB',
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
   * La intención ya llega con su reserva (`reserveDispatch`, confirmada por la
   * compuerta antes de llamar). Acá se decide qué pasa con ella según el
   * resultado: éxito → el `pi_…` la reemplaza; respuesta definitiva de rechazo →
   * se libera; resultado ambiguo o cualquier otro fallo → se conserva, porque no
   * se puede afirmar que la pasarela no creó el cobro.
   *
   * @throws PaymentsGatewayResultAmbiguousException (504) si no se sabe si se creó.
   * @throws PaymentsGatewayUnavailableException (503) si la pasarela no atiende.
   * @throws PreconditionFailedException (422) si la pasarela la rechazó de forma definitiva.
   */
  async dispatch(
    intent: GatewayChargeable,
    methodType: GatewayPaymentMethodType | undefined,
  ): Promise<GatewayDispatchResult> {
    // La marca que escribió ESTA petición, leída antes de llamar: `releaseReservation`
    // sólo borra una marca con ese valor.
    const ownMark = intent.gatewayIntentRef;
    let request: GatewayPaymentIntentCreate;
    let idempotencyKey: string;
    let client: PaymentsGatewayClient;
    try {
      request = this.buildCreateRequest(intent, methodType);
      idempotencyKey = deriveGatewayIdempotencyKey({
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
      client = this.client;
    } catch (error) {
      // Nada salió hacia la pasarela: la reserva no tiene motivo para quedar.
      await this.releaseReservation(intent, ownMark);
      throw error;
    }

    this.logger.info(
      { operation: 'payments.gateway.create', intentId: intent.id },
      'Creating payment intent in gateway',
    );

    let created;
    try {
      created = await client.createPaymentIntent(request, idempotencyKey, {
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
      // Sólo una respuesta definitiva de la pasarela prueba que no creó nada y
      // libera la reserva. Un resultado ambiguo (504) la CONSERVA: el cobro pudo
      // haberse creado, y mientras tanto la deuda no se ofrece a otra intención.
      if (
        error instanceof PaymentsGatewayError &&
        !error.isAmbiguous &&
        error.code !== IDEMPOTENCY_KEY_REUSED
      ) {
        await this.releaseReservation(intent, ownMark);
      }
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

    const localStatusConceptId = await this.associate(
      intent.id,
      intent.tenantId,
      created.intent.id,
      created.intent.status,
    );

    return {
      gatewayIntentRef: created.intent.id,
      gatewayStatus: created.intent.status,
      localStatusConceptId,
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
    tenantId: string,
    gatewayIntentRef: string,
    gatewayStatus: GatewayPaymentIntentStatus,
  ): Promise<string> {
    // Confirmada al terminar, no con la petición: el `pi_…` ya existe en la
    // pasarela y no puede perderse si lo que sigue en la petición falla.
    return runCommitted(this.em, tenantId, async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) return LOCAL_INTENT_STATUS[gatewayStatus];
      // Defensa en profundidad: la intención ya se acotó al tenant en la
      // compuerta; una fila de otro tenant nunca se asocia a este cobro.
      if (intent.tenantId !== tenantId) {
        throw new ResourceNotFoundException(
          'Intención de pago no encontrada',
          undefined,
          PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
        );
      }
      // La marca de despacho es la reserva que este mismo cobro dejó antes de
      // llamar: el `pi_…` la reemplaza. Un `pi_…` DISTINTO ya asociado no se pisa.
      if (
        intent.gatewayIntentRef &&
        !isDispatchMark(intent.gatewayIntentRef) &&
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
      return intent.statusConceptId;
    });
  }

  /**
   * Libera la reserva de despacho de la intención, en su propia transacción
   * confirmada. Sólo toca una marca (`dispatching:…`): un `pi_…` real nunca se
   * borra. Si no se puede liberar no se enmascara el error que la motivó: la
   * marca vence sola (`dispatchLeaseMs`) y la propia intención puede repetir.
   */
  private async releaseReservation(
    intent: { id: string; tenantId: string },
    ownMark: string | null | undefined,
  ): Promise<void> {
    // Sólo la marca que escribió ESTA petición: si otra petición de la misma
    // intención la reemplazó, sigue en vuelo y su reserva no se toca.
    if (!isDispatchMark(ownMark)) return;
    try {
      await runCommitted(this.em, intent.tenantId, async (tx) => {
        const row = await this.intentsRepo.findByIdAndTenantForUpdate(
          tx,
          intent.id,
          intent.tenantId,
        );
        if (row && row.gatewayIntentRef === ownMark) {
          row.gatewayIntentRef = undefined;
          touch(row, undefined);
        }
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'payments.gateway.create',
          intentId: intent.id,
          reason: error instanceof Error ? error.name : 'unknown',
        },
        'Could not release the dispatch reservation; it expires on its own',
      );
    }
  }

  /**
   * Consulta autoritativa de un cobro ya asociado (`GET /payment_intents/{id}`):
   * es lo que se hace ante un reintento del cobro en vez de crear otro.
   *
   * @throws PaymentsGatewayResultAmbiguousException / PaymentsGatewayUnavailableException
   *   con la misma traducción que `dispatch`.
   */
  async consult(
    intentId: string,
    gatewayIntentRef: string,
    localStatusConceptId: string,
  ): Promise<GatewayDispatchResult> {
    if (!this.client) throw new PaymentsGatewayUnavailableException(intentId);
    try {
      const found = await this.client.getPaymentIntent(gatewayIntentRef, {
        requestId: `mantra-${intentId}`,
      });
      return {
        gatewayIntentRef,
        gatewayStatus: found.status,
        localStatusConceptId,
        nextAction: found.next_action,
        replayed: true,
      };
    } catch (error) {
      throw this.toDomainError(error, intentId);
    }
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

    // La clave ya existe en la pasarela con otro cuerpo (típicamente otro medio de
    // pago): un cobro de esta intención existe y la reserva se conserva. No se
    // reintenta con otro cuerpo; hay que conciliar contra la pasarela.
    if (error.code === IDEMPOTENCY_KEY_REUSED) {
      this.logger.error(
        { ...log, resolution: 'reconcile-against-gateway' },
        'Gateway already holds this idempotency key with a different body; a charge may exist',
      );
      gatewayMetrics.reconciliationRequired('key_reused');
      return new ConflictException(
        'La pasarela ya tiene un cobro con esta clave y otro cuerpo (¿otro medio de pago?). Reintentá con el mismo medio de pago de la primera vez o conciliá contra la pasarela',
        { intentId },
        PaymentsErrorReason.PAYMENT_GATEWAY_RECONCILIATION_REQUIRED,
      );
    }
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
