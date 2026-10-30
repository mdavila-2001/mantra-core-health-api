import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  touch,
} from '../../../common';
import {
  PaymentFlowRepository,
  PaymentIntentsRepository,
  PaymentTransactionsRepository,
} from '../repositories';
import { GatewayWebhookResultDto } from '../dto';
import { PaymentsErrorReason } from '../payments.error-reasons';
import {
  PAYMENTS_GATEWAY_CONFIG,
  type PaymentsGatewayConfig,
} from '../gateway/payments-gateway.env';
import {
  WEBHOOK_HEADER_ID,
  WEBHOOK_HEADER_SIGNATURE,
  WebhookVerificationError,
  verifyStandardWebhook,
} from '../gateway/standard-webhook-signature';
import {
  GATEWAY_PAYMENT_INTENT_STATUSES,
  type GatewayPaymentIntentStatus,
  type GatewayWebhookEvent,
} from '../gateway/payments-gateway.types';
import {
  LOCAL_INTENT_STATUS,
  decideGatewayEvent,
  isTerminalGatewayStatus,
} from '../gateway/payments-gateway-status';
import {
  GatewayAmountError,
  decimalToMinorUnits,
} from '../gateway/payments-gateway-amount';
import {
  compareAmounts,
  isPositiveAmount,
  subtractAmounts,
} from './payment-money';

/** Estado del cobro que implica cada tipo de evento `payment_intent.*`. */
const STATUS_BY_EVENT: Readonly<Record<string, GatewayPaymentIntentStatus>> = {
  'payment_intent.requires_action': 'requires_action',
  'payment_intent.processing': 'processing',
  'payment_intent.succeeded': 'succeeded',
  'payment_intent.failed': 'failed',
  'payment_intent.canceled': 'canceled',
  'payment_intent.expired': 'expired',
};

/** `payment_intent.created` trae el estado inicial en `data.object.status`. */
const CREATED_EVENT = 'payment_intent.created';

const PAYMENT_INTENT_ID = /^pi_[a-z0-9]{10,40}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/** Tipo de recurso de origen con el que se identifica una intención de deuda. */
const DEBT_SOURCE_REF_TYPE = 'payment_debt';

/** Resultado de intentar saldar la deuda de una intención cobrada. */
type DebtOutcome = { settled: true } | { settled: false; reason: string };

/** Entrada del receptor: las cabeceras y los bytes exactos del cuerpo. */
export interface GatewayWebhookInput {
  /** Cabeceras de la petición. */
  headers: Readonly<Record<string, string | string[] | undefined>>;
  /** Cuerpo crudo; sin él no hay firma que verificar. */
  rawBody?: Buffer;
}

/**
 * Receptor de webhooks de la pasarela (carril INT, REQ-INT-2).
 *
 * Orden de las defensas, de la más barata a la más cara y sin tocar la base
 * hasta haber verificado quién habla:
 *
 * 1. flag apagado → `503` sin efecto (no `410`: la pasarela deshabilitaría el endpoint);
 * 2. firma Standard Webhooks y ventana anti-replay sobre los bytes crudos;
 * 3. forma del evento y modo (`test`/`live`) de la clave configurada;
 * 4. inbox por `webhook-id` en `payment_webhook_events` (índice único), bajo
 *    `FOR UPDATE` de la intención: una reentrega no repite el efecto;
 * 5. máquina de estados: sólo un avance legítimo escribe; un hecho atrasado se
 *    ignora y una contradicción con un terminal queda archivada para conciliar.
 *
 * Responde `2xx` únicamente cuando el efecto quedó **persistido** (la respuesta
 * sale después del `COMMIT`). Cualquier otra cosa se reintenta desde la pasarela.
 *
 * La autoridad del estado de un cobro es la pasarela: el webhook lo informa y
 * esta clase no cobra ni mueve dinero, sólo registra lo ocurrido.
 */
@Injectable()
export class PaymentsGatewayWebhookService {
  /**
   * @param config - Configuración validada al arrancar.
   * @param em - Contexto de persistencia.
   * @param intentsRepo - Repositorio de intenciones.
   * @param flowRepo - Repositorio de deudas y sesiones de checkout.
   * @param transactionsRepo - Repositorio de la bandeja de eventos.
   * @param logger - Logger estructurado (sólo ids y estados).
   */
  constructor(
    @Inject(PAYMENTS_GATEWAY_CONFIG)
    private readonly config: PaymentsGatewayConfig,
    private readonly em: EntityManager,
    private readonly intentsRepo: PaymentIntentsRepository,
    private readonly flowRepo: PaymentFlowRepository,
    private readonly transactionsRepo: PaymentTransactionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsGatewayWebhookService.name);
  }

  /**
   * Verifica y aplica un webhook de la pasarela.
   *
   * @throws DomainException `503` flag apagado; `401` firma o marca de tiempo
   *   inválidas; `422` evento malformado o de otro modo; `404` cobro terminal
   *   desconocido (se reintenta: puede ser una carrera con el alta).
   */
  async receive(input: GatewayWebhookInput): Promise<GatewayWebhookResultDto> {
    if (!this.config.viaGateway) {
      this.logger.warn(
        { operation: 'payments.gateway.webhook' },
        'Gateway webhook rejected: payments.via_gateway is off',
      );
      throw new DomainException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.DEPENDENCY_UNAVAILABLE,
        'La recepción de webhooks de la pasarela está desactivada',
        undefined,
        PaymentsErrorReason.GATEWAY_WEBHOOKS_DISABLED,
      );
    }
    if (!input.rawBody || input.rawBody.length === 0) {
      // Sin los bytes originales no hay firma que verificar, y reconstruirlos
      // desde el JSON ya interpretado sería verificar otra cosa. Lo único que
      // llega aquí sin credenciales es una petición vacía o que no es JSON
      // (`Content-Type` distinto): es un rechazo del cliente, determinista y de
      // nivel `warn`, no un fallo del servidor que cualquiera pueda provocar.
      this.logger.warn(
        { operation: 'payments.gateway.webhook' },
        'Gateway webhook rejected: empty body or not JSON, so there is no raw body to verify',
      );
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'El webhook debe llegar con un cuerpo JSON',
        undefined,
        PaymentsErrorReason.GATEWAY_WEBHOOK_RAW_BODY_MISSING,
      );
    }

    this.verify(input.headers, input.rawBody);
    const event = this.parse(input.rawBody, input.headers);

    if (this.config.mode && event.mode !== this.config.mode) {
      this.logger.warn(
        {
          operation: 'payments.gateway.webhook',
          eventId: event.id,
          eventMode: event.mode,
        },
        'Gateway webhook rejected: mode does not match the configured key',
      );
      throw new PreconditionFailedException(
        'El evento es de otro modo (test/live) que la clave configurada',
        { eventId: event.id },
        PaymentsErrorReason.GATEWAY_WEBHOOK_MODE_MISMATCH,
      );
    }

    const status = this.reportedStatus(event);
    if (!status) {
      // Otro tipo de evento (reembolsos, contracargos, pagos programados…) o uno
      // que la pasarela agregue mañana: se confirma para no agotar sus reintentos
      // ni dejar que deshabilite el endpoint. No hay efecto que persistir.
      this.logger.info(
        {
          operation: 'payments.gateway.webhook',
          eventId: event.id,
          eventType: event.type,
        },
        'Gateway webhook ignored: event type not handled by the API',
      );
      return this.result(event.id, { ignored: true });
    }

    const paymentIntentId = this.paymentIntentId(event);
    return this.em.transactional((tx) =>
      this.applyIntentEvent(
        tx,
        event,
        status,
        paymentIntentId,
        String(input.headers[WEBHOOK_HEADER_SIGNATURE] ?? ''),
      ),
    );
  }

  /** Firma y ventana anti-replay; ningún rechazo revela claves ni cuerpo. */
  private verify(
    headers: GatewayWebhookInput['headers'],
    rawBody: Buffer,
  ): void {
    try {
      verifyStandardWebhook({
        headers,
        payload: rawBody,
        secrets: this.config.webhookSecrets,
        publicKeys: this.config.webhookPublicKeys,
        toleranceSeconds: this.config.webhookToleranceSeconds,
      });
    } catch (error) {
      if (!(error instanceof WebhookVerificationError)) throw error;
      this.logger.warn(
        { operation: 'payments.gateway.webhook', reason: error.reason },
        'Rejected gateway webhook',
      );
      const outsideWindow = error.reason === 'timestamp_outside_tolerance';
      throw new UnauthorizedException(
        outsideWindow
          ? 'La marca de tiempo del webhook está fuera de la ventana permitida'
          : 'Firma del webhook inválida',
        { code: error.reason },
        outsideWindow
          ? PaymentsErrorReason.GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW
          : PaymentsErrorReason.GATEWAY_WEBHOOK_SIGNATURE_INVALID,
      );
    }
  }

  /** Interpreta el cuerpo ya autenticado; si no cumple el contrato, 422. */
  private parse(
    rawBody: Buffer,
    headers: GatewayWebhookInput['headers'],
  ): GatewayWebhookEvent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw this.malformed('json');
    }
    const event = parsed as Partial<GatewayWebhookEvent> | null;
    const headerId = this.headerValue(headers, WEBHOOK_HEADER_ID);
    const data = event?.data?.object;
    if (
      !event ||
      typeof event !== 'object' ||
      event.object !== 'event' ||
      typeof event.id !== 'string' ||
      !UUID.test(event.id) ||
      typeof event.type !== 'string' ||
      (event.mode !== 'test' && event.mode !== 'live') ||
      typeof data !== 'object' ||
      data === null ||
      Array.isArray(data)
    ) {
      throw this.malformed('shape');
    }
    // El id firmado en la cabecera y el del cuerpo son el mismo evento.
    if (headerId !== event.id) throw this.malformed('id_mismatch');
    return event as GatewayWebhookEvent;
  }

  /** Estado que informa el evento, o `undefined` si no es de cobros. */
  private reportedStatus(
    event: GatewayWebhookEvent,
  ): GatewayPaymentIntentStatus | undefined {
    const data = event.data.object;
    if (event.type === CREATED_EVENT) {
      const status = data.status;
      if (
        typeof status !== 'string' ||
        !GATEWAY_PAYMENT_INTENT_STATUSES.includes(
          status as GatewayPaymentIntentStatus,
        )
      ) {
        throw this.malformed('status');
      }
      return status as GatewayPaymentIntentStatus;
    }
    const status = STATUS_BY_EVENT[event.type];
    if (!status) return undefined;
    // Si el evento repite el estado en `data`, tiene que coincidir con su tipo.
    if (data.status !== undefined && data.status !== status) {
      throw this.malformed('status');
    }
    return status;
  }

  private paymentIntentId(event: GatewayWebhookEvent): string {
    const id = event.data.object.payment_intent_id;
    if (typeof id !== 'string' || !PAYMENT_INTENT_ID.test(id)) {
      throw this.malformed('payment_intent_id');
    }
    return id;
  }

  /** Efecto sobre la intención, la deuda y la bandeja, todo en una transacción. */
  private async applyIntentEvent(
    tx: EntityManager,
    event: GatewayWebhookEvent,
    status: GatewayPaymentIntentStatus,
    paymentIntentId: string,
    signature: string,
  ): Promise<GatewayWebhookResultDto> {
    const intent = await this.intentsRepo.findByGatewayIntentRefForUpdate(
      tx,
      paymentIntentId,
    );
    if (!intent) {
      // Un evento no terminal de un cobro que todavía no asociamos (el webhook
      // pudo adelantarse a la respuesta de creación) se confirma: el terminal
      // trae el estado final. Un terminal sí se rechaza para que se reintente.
      if (!isTerminalGatewayStatus(status)) {
        this.logger.info(
          { operation: 'payments.gateway.webhook', eventId: event.id },
          'Gateway webhook ignored: payment intent not associated yet',
        );
        return this.result(event.id, { ignored: true });
      }
      this.logger.warn(
        { operation: 'payments.gateway.webhook', eventId: event.id },
        'Gateway terminal webhook for an unknown payment intent; the gateway will retry',
      );
      throw new ResourceNotFoundException(
        'No hay una intención asociada al cobro informado',
        undefined,
        PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
      );
    }

    const eventRef = `pay-gateway:${event.id}`;
    const archived = await this.transactionsRepo.findWebhookEventByRef(
      tx,
      eventRef,
    );
    if (archived) {
      return this.result(event.id, {
        duplicate: true,
        decision: 'duplicado',
        reconciliationRequired: archived.processed === false,
      });
    }

    let decision = decideGatewayEvent(intent.statusConceptId, status);
    let reconciliationReason: string | undefined;
    if (decision === 'contradiccion') {
      reconciliationReason = 'terminal_state_contradiction';
    }
    if (decision === 'aplicar' && status === 'succeeded') {
      // El importe que informa la pasarela tiene que ser el cobrado localmente:
      // si no, no se asienta nada y se concilia.
      if (!this.amountMatches(event, intent.amount)) {
        decision = 'contradiccion';
        reconciliationReason = 'amount_or_currency_mismatch';
        this.logger.error(
          {
            operation: 'payments.gateway.webhook',
            eventId: event.id,
            intentId: intent.id,
          },
          'Gateway succeeded event does not match the local amount or currency',
        );
      }
    }

    let reconciliationRequired = decision === 'contradiccion';
    if (decision === 'aplicar') {
      intent.statusConceptId = LOCAL_INTENT_STATUS[status];
      touch(intent, undefined);
      if (status === 'succeeded') {
        const outcome = await this.settleDebt(tx, intent);
        if (!outcome.settled) {
          reconciliationRequired = true;
          reconciliationReason = outcome.reason;
        }
      } else if (isTerminalGatewayStatus(status)) {
        await this.releaseDebt(tx, intent);
      }
    }
    if (decision === 'obsoleto' || reconciliationRequired) {
      this.logger.warn(
        {
          operation: 'payments.gateway.webhook',
          eventId: event.id,
          intentId: intent.id,
          decision,
          reconciliationRequired,
          reconciliationReason,
        },
        decision === 'obsoleto'
          ? 'Ignored out-of-order gateway event'
          : 'Gateway event needs reconciliation; archived unprocessed',
      );
    }

    this.transactionsRepo.recordWebhookEvent(tx, {
      gatewayId: intent.gatewayId,
      eventType: event.type,
      gatewayEventRef: eventRef,
      payloadJson: {
        id: event.id,
        type: event.type,
        created_at: event.created_at,
        mode: event.mode,
        data: event.data,
        // Por qué quedó sin procesar: lo que necesita quien concilia.
        ...(reconciliationRequired && reconciliationReason
          ? { reconciliation: { reason: reconciliationReason } }
          : {}),
      },
      signature,
      isVerified: true,
      // `processed=false` es la cola de conciliación: un hecho atrasado ya está
      // resuelto (se ignoró a propósito); una contradicción no.
      processed: !reconciliationRequired,
      relatedIntentId: intent.id,
    });

    return this.result(event.id, {
      applied: decision === 'aplicar',
      decision,
      reconciliationRequired,
    });
  }

  /** El evento `succeeded` cobra el mismo importe y moneda que la intención. */
  private amountMatches(event: GatewayWebhookEvent, amount: string): boolean {
    const reported = event.data.object.amount_minor;
    const currency = event.data.object.currency;
    if (currency !== undefined && currency !== 'BOB') return false;
    if (typeof reported !== 'number') return false;
    try {
      return decimalToMinorUnits(amount) === reported;
    } catch (error) {
      if (error instanceof GatewayAmountError) return false;
      throw error;
    }
  }

  /**
   * Salda la deuda ligada a la intención por su sesión de checkout.
   *
   * Descuenta lo cobrado del saldo con aritmética decimal exacta: saldo en cero
   * → `DEBT_SETTLED`; saldo positivo → vuelve a `DEBT_PENDING`. Si algo no
   * cuadra (varias deudas, deuda ajena o ya saldada, moneda distinta, cobro que
   * excede el saldo) **no toca la deuda** y devuelve el motivo para conciliar: el
   * dinero se movió y eso queda asentado en la intención, pero sobrepagar o
   * saldar dos veces no se resuelve por inferencia.
   *
   * Una intención de deuda (`sourceRefType = payment_debt` o propósito `DEBT`)
   * sin ninguna sesión de checkout que la ligue tampoco se da por aplicada: no
   * hay con qué saber qué deuda descontar, el cobro ocurrió y la deuda sigue
   * intacta, así que se concilia. Sólo una intención que no es de deuda y no
   * tiene sesión no tiene nada que saldar.
   *
   * La factura (`billing`) no se toca desde este módulo: la deuda la referencia
   * por `invoiceId` y ese dominio la consume.
   */
  private async settleDebt(
    tx: EntityManager,
    intent: {
      id: string;
      tenantId: string;
      amount: string;
      sourceRefType?: string | null;
      purposeConceptId?: string | null;
    },
  ): Promise<DebtOutcome> {
    const sessions = await this.flowRepo.findCheckoutSessionsByIntentForUpdate(
      tx,
      intent.id,
    );
    if (sessions.length === 0) {
      const isDebtIntent =
        intent.sourceRefType === DEBT_SOURCE_REF_TYPE ||
        intent.purposeConceptId === CONCEPTS.PAY_PURPOSE_DEBT;
      return isDebtIntent
        ? { settled: false, reason: 'debt_without_checkout_session' }
        : { settled: true };
    }

    const debtIds = [...new Set(sessions.map((s) => s.paymentDebtId))];
    if (debtIds.length !== 1) return { settled: false, reason: 'several_debts' };

    const debt = await this.flowRepo.findDebtByIdForUpdate(tx, debtIds[0]);
    if (
      !debt ||
      debt.tenantId !== intent.tenantId ||
      debt.currencyCode !== 'BOB' ||
      debt.statusConceptId === CONCEPTS.DEBT_SETTLED ||
      !isPositiveAmount(intent.amount)
    ) {
      return { settled: false, reason: 'debt_unavailable' };
    }
    const remaining = subtractAmounts(debt.outstandingAmount, intent.amount);
    if (compareAmounts(remaining, '0') < 0) {
      return { settled: false, reason: 'amount_exceeds_outstanding' };
    }

    const now = new Date();
    debt.outstandingAmount = remaining;
    if (compareAmounts(remaining, '0') === 0) {
      debt.statusConceptId = CONCEPTS.DEBT_SETTLED;
      debt.settledAt = now;
    } else {
      debt.statusConceptId = CONCEPTS.DEBT_PENDING;
    }
    touch(debt, undefined, now);

    for (const session of sessions) {
      if (session.statusConceptId === CONCEPTS.CHECKOUT_OPEN) {
        session.statusConceptId = CONCEPTS.CHECKOUT_COMPLETED;
        session.completedAt = now;
        touch(session, undefined, now);
      }
    }
    return { settled: true };
  }

  /**
   * Un cobro que terminó sin pagarse libera el checkout: la sesión se cierra y la
   * deuda vuelve a `DEBT_PENDING` para poder abrir otra. Sin esto una deuda
   * quedaría en `DEBT_IN_CHECKOUT` para siempre.
   *
   * Si otra intención conserva una sesión abierta sobre la misma deuda, la deuda
   * **sigue en checkout**: liberarla dejaría abrir un tercer checkout encima de
   * un cobro todavía vivo.
   */
  private async releaseDebt(
    tx: EntityManager,
    intent: { id: string; tenantId: string },
  ): Promise<void> {
    const sessions = await this.flowRepo.findCheckoutSessionsByIntentForUpdate(
      tx,
      intent.id,
    );
    const now = new Date();
    const closing = new Set<string>();
    for (const session of sessions) {
      if (session.statusConceptId !== CONCEPTS.CHECKOUT_OPEN) continue;
      session.statusConceptId = CONCEPTS.CHECKOUT_EXPIRED;
      touch(session, undefined, now);
      closing.add(session.id);
      const debt = await this.flowRepo.findDebtByIdForUpdate(
        tx,
        session.paymentDebtId,
      );
      if (
        debt &&
        debt.tenantId === intent.tenantId &&
        debt.statusConceptId === CONCEPTS.DEBT_IN_CHECKOUT
      ) {
        // Las sesiones que se cierran acá todavía figuran abiertas en la base
        // (no se hizo flush): se excluyen por id.
        const stillOpen = (
          await this.flowRepo.findOpenCheckoutSessionsByDebt(tx, debt.id)
        ).filter((other) => !closing.has(other.id));
        if (stillOpen.length > 0) continue;
        debt.statusConceptId = CONCEPTS.DEBT_PENDING;
        touch(debt, undefined, now);
      }
    }
  }

  private result(
    eventId: string,
    fields: Partial<Omit<GatewayWebhookResultDto, 'received' | 'eventId'>>,
  ): GatewayWebhookResultDto {
    return {
      received: true,
      eventId,
      applied: false,
      duplicate: false,
      ignored: false,
      reconciliationRequired: false,
      ...fields,
    };
  }

  private malformed(field: string): PreconditionFailedException {
    this.logger.warn(
      { operation: 'payments.gateway.webhook', field },
      'Gateway webhook body does not match the contract',
    );
    return new PreconditionFailedException(
      'El cuerpo del webhook no cumple el contrato',
      { field },
      PaymentsErrorReason.GATEWAY_WEBHOOK_MALFORMED,
    );
  }

  private headerValue(
    headers: GatewayWebhookInput['headers'],
    name: string,
  ): string | undefined {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === name) {
        return Array.isArray(value) ? value[0] : value;
      }
    }
    return undefined;
  }
}
