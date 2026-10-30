import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  requireTenantId,
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
  PendingGatewayDispatchDto,
  ClosedGatewayDispatchDto,
  type TransactionOperation,
} from '../dto';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { resolveGatewayWebhookSecrets } from './webhook-secret.resolver';
import {
  compareAmounts,
  isPositiveAmount,
  subtractAmounts,
  addAmounts,
} from './payment-money';
import { decideCallback, eventReference } from './payment-callback-machine';
import { evaluateCallbackEndpoint } from './callback-endpoint.policy';
import { PaymentsErrorReason } from '../payments.error-reasons';
import {
  PaymentsGatewayChargeService,
  type GatewayChargeable,
} from './payments-gateway-charge.service';
import { runCommitted } from './payments-committed-transaction';
import {
  MIN_DISPATCH_LEASE_MS,
  canResendWithSameKey,
  classifyInFlight,
  isDispatchMark,
} from '../gateway/payments-gateway-dispatch-mark';
import { gatewayMetrics } from '../gateway/payments-gateway-metrics';
import {
  PaymentsGatewayError,
  PaymentsGatewayResultAmbiguousException,
} from '../gateway/payments-gateway.errors';
import { DEBT_SOURCE_REF_TYPE, mayChargeADebt } from '../payments.source-refs';

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
    @Optional() private readonly gatewayCharge?: PaymentsGatewayChargeService,
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
   *
   * MCH-036: el importe se valida contra el saldo pendiente de la intención
   * —lo debido menos lo efectivamente capturado— con aritmética exacta, de modo
   * que un cobro parcial es legítimo pero la suma nunca excede lo debido.
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

    // `payments.via_gateway`: el cobro lo despacha la pasarela, pero detrás de la
    // misma compuerta de estado y de riesgo que el camino de siempre.
    if (this.gatewayCharge?.enabled) {
      return this.processViaGateway(intentId, dto, this.gatewayCharge);
    }

    return this.em.transactional(async (tx) => {
      const intent = await this.intentsRepo.findByIdForUpdate(tx, intentId);
      if (!intent) {
        throw new ResourceNotFoundException(
          'Intención de pago no encontrada',
          {
            intentId,
          },
          PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
        );
      }
      this.assertIntentOpen(intent, intentId);
      // Una intención cobrada por la pasarela (`payments.via_gateway`) no abre un
      // segundo camino contra el proveedor: su resultado llega por webhook firmado.
      if (intent.gatewayIntentRef) {
        throw new ConflictException(
          'La intención se cobra a través de la pasarela; no admite una operación directa contra el proveedor',
          { intentId },
          PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
        );
      }

      const open = await this.assertNoBlockingOpenOperation(
        tx,
        intentId,
        dto.operation,
      );

      await this.assertRiskCleared(tx, intentId, false);

      const { requested } = await this.assertWithinBalance(
        tx,
        intent,
        intentId,
        dto.amount,
      );
      // Capturar más de lo autorizado es un cobro sin autorización del emisor.
      if (
        dto.operation === 'CAPTURE' &&
        open?.statusConceptId === CONCEPTS.TXN_AUTHORIZED &&
        compareAmounts(requested, open.amount) > 0
      ) {
        throw new ConflictException('La captura excede el importe autorizado', {
          intentId,
          transactionId: open.id,
          amount: requested,
          authorized: open.amount,
        });
      }

      const transaction = this.transactionsRepo.create(tx, {
        paymentIntentId: intentId,
        gatewayId: intent.gatewayId,
        transactionTypeConceptId: OPERATION_CONCEPT[dto.operation],
        gatewayTransactionRef: dto.gatewayTransactionRef,
        amount: requested,
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
   * Una operación abierta impide otra que el proveedor pueda confirmar a la vez:
   * sería un segundo cobro. Sobre una autorización confirmada sólo cabe
   * capturarla; otra venta o autorización duplicaría el cargo. La usan el camino
   * de siempre y el de la pasarela.
   *
   * @returns La operación abierta que no bloquea (una autorización a capturar), si hay.
   */
  private async assertNoBlockingOpenOperation(
    tx: EntityManager,
    intentId: string,
    operation: TransactionOperation,
  ) {
    const open = await this.transactionsRepo.findPendingByIntent(tx, intentId);
    if (
      open &&
      (open.statusConceptId === CONCEPTS.TXN_PROCESSING ||
        operation !== 'CAPTURE')
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
    return open;
  }

  /**
   * MCH-036: el importe de la operación se mide contra lo que todavía se debe, no
   * contra el de la intención. Antes se admitía cualquier importe y el saldo nunca
   * se calculaba, así que una captura parcial podía cerrar la intención completa
   * y una segunda podía cobrar de más. La usan el camino de siempre y el de la
   * pasarela (que cobra el importe completo: con algo ya capturado, excede el saldo).
   *
   * @param explicitAmount - Importe pedido; sin él se toma el saldo pendiente, que
   *   en una intención intacta es el total.
   */
  private async assertWithinBalance(
    tx: EntityManager,
    intent: { amount: string },
    intentId: string,
    explicitAmount: string | undefined,
  ): Promise<{ requested: string; captured: string; balance: string }> {
    const captured = await this.intentCaptured(tx, intentId);
    const balance = subtractAmounts(intent.amount, captured);
    const requested = explicitAmount ?? balance;
    if (!isPositiveAmount(requested)) {
      throw new PreconditionFailedException(
        'El importe a procesar debe ser mayor que cero',
        { intentId, amount: requested },
      );
    }
    if (compareAmounts(requested, balance) > 0) {
      throw new ConflictException(
        'El importe excede el saldo pendiente de la intención',
        { intentId, amount: requested, captured: captured, balance: balance },
      );
    }
    return { requested, captured, balance };
  }

  /** La intención no está cobrada ni cancelada: es lo primero que exige cualquier cobro. */
  private assertIntentOpen(
    intent: { statusConceptId: string },
    intentId: string,
  ): void {
    if (intent.statusConceptId === CONCEPTS.PI_SUCCEEDED) {
      throw new ConflictException(
        'La intención ya fue cobrada',
        {
          intentId,
        },
        PaymentsErrorReason.PAYMENT_INTENT_ALREADY_SUCCEEDED,
      );
    }
    if (intent.statusConceptId === CONCEPTS.PI_CANCELED) {
      throw new PreconditionFailedException(
        'La intención está cancelada',
        {
          intentId,
        },
        PaymentsErrorReason.PAYMENT_INTENT_CANCELED,
      );
    }
  }

  /**
   * Compuerta de riesgo previa a cobrar: debe existir una evaluación y no puede
   * ser `DECLINE`. Es la ÚNICA implementación: la usan el camino de siempre y el
   * de la pasarela, para que ninguno cobre lo que el otro no cobraría.
   *
   * @param blockOnReview - Con `true`, una última evaluación `REVIEW` (pide
   *   revisión humana) tampoco deja cobrar. El camino de siempre la deja pasar
   *   (comportamiento previo, sin tocar); en el de la pasarela, donde el cobro
   *   lo puede completar el pagador sin que nadie intervenga, se toma el
   *   supuesto conservador. Ver la ambigüedad registrada en el informe del carril.
   */
  private async assertRiskCleared(
    tx: EntityManager,
    intentId: string,
    blockOnReview: boolean,
  ): Promise<void> {
    const risk = await this.flowRepo.findLatestRiskAssessment(tx, intentId);
    if (!risk) {
      throw new PreconditionFailedException(
        'La intención requiere evaluación de riesgo antes de cobrar',
        { intentId },
        PaymentsErrorReason.PAYMENT_INTENT_RISK_ASSESSMENT_MISSING,
      );
    }
    if (risk.decisionConceptId === CONCEPTS.RISK_DECLINE) {
      throw new PreconditionFailedException(
        'El motor de riesgo rechazó la intención',
        {
          intentId,
        },
        PaymentsErrorReason.PAYMENT_INTENT_RISK_DECLINED,
      );
    }
    if (blockOnReview && risk.decisionConceptId === CONCEPTS.RISK_REVIEW) {
      throw new PreconditionFailedException(
        'La evaluación de riesgo pide revisión humana antes de cobrar',
        { intentId },
        PaymentsErrorReason.PAYMENT_INTENT_RISK_REVIEW_PENDING,
      );
    }
  }

  /**
   * Reservas de despacho del tenant de la petición que requieren conciliación
   * (más viejas que el plazo, o con la fecha ilegible). El tenant sale SIEMPRE del
   * contexto verificado, nunca de un parámetro.
   */
  async listGatewayDispatchesRequiringReconciliation(): Promise<
    PendingGatewayDispatchDto[]
  > {
    const tenantId = requireTenantId();
    const pending =
      (await this.gatewayCharge?.listDispatchesRequiringReconciliation(
        tenantId,
      )) ?? [];
    return pending.map((row) => ({
      paymentIntentId: row.intentId,
      ageMs: row.ageMs,
      canReconcile: row.canReconcile,
    }));
  }

  /**
   * Cierre manual de una reserva de despacho que ya no se puede (o no se debe)
   * conciliar reenviando: pasadas las 23 h, con la fecha ilegible, o cuando quien
   * opera comprobó contra la pasarela que no hay nada que asociar.
   *
   * **No reenvía nada a la pasarela.** Pasa la intención a `PI_CANCELED` —no se
   * reutiliza— y conserva la marca como rastro, con lo que la deuda deja de estar
   * bloqueada por ella. Si la pasarela SÍ había creado el cobro, queda huérfano
   * (expira solo) y su webhook terminal no encontrará intención: quien cierra se
   * hace cargo de haberlo comprobado, y por eso el motivo es obligatorio. Queda el
   * sello de auditoría de la ruta (quién, cuándo, qué intención), el historial de
   * la fila y el motivo en el log estructurado.
   *
   * Sólo cierra una reserva que ya requiere conciliación: cerrar una que puede
   * seguir en vuelo crearía el doble cobro que la reserva evita.
   *
   * @throws ConflictException si no hay reserva, o si todavía puede estar en vuelo.
   */
  async closeGatewayDispatch(
    intentId: string,
    reason: string,
    actor: AuthenticatedUser,
  ): Promise<ClosedGatewayDispatchDto> {
    const tenantId = requireTenantId();
    const leaseMs =
      this.gatewayCharge?.dispatchLeaseMs ?? MIN_DISPATCH_LEASE_MS;
    const closed = await runCommitted(this.em, tenantId, async (tx) => {
      const loaded = await this.intentsRepo.findByIdAndTenantForUpdate(
        tx,
        intentId,
        tenantId,
      );
      const found = assertResourceInTenant(loaded, loaded?.tenantId, tenantId, {
        message: 'Intención de pago no encontrada',
        reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
      });
      if (!isDispatchMark(found.gatewayIntentRef)) {
        throw new ConflictException(
          'La intención no tiene una reserva de despacho que cerrar',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_NOTHING_TO_RECONCILE,
        );
      }
      if (
        classifyInFlight(found, Date.now(), leaseMs) !==
        'reconciliation_required'
      ) {
        throw new ConflictException(
          'La reserva puede seguir en vuelo: cerrarla ahora podría permitir un segundo cobro. Esperá a que requiera conciliación',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_DISPATCH_IN_FLIGHT,
        );
      }
      found.statusConceptId = CONCEPTS.PI_CANCELED;
      touch(found, actor.id);
      return {
        paymentIntentId: found.id,
        statusConceptId: found.statusConceptId,
      };
    });
    gatewayMetrics.reconciled('closed_manually');
    this.logger.warn(
      {
        operation: 'payments.gateway.dispatch-closed',
        intentId,
        actorUserId: actor.id,
        reason,
      },
      'Gateway dispatch reservation closed manually without contacting the gateway',
    );
    return closed;
  }

  /**
   * Conciliación explícita de una reserva de despacho sin `pi_…` (la llamada anterior
   * terminó ambigua, o el proceso murió antes de asociar).
   *
   * Reenvía a la pasarela la MISMA creación con la MISMA `Idempotency-Key` (se
   * deriva de campos persistidos): si la pasarela ya tenía el cobro, devuelve el
   * mismo (`replayed`) y se asocia a la intención; si nunca llegó, lo crea una sola
   * vez y es el cobro legítimo de ESTA intención. Sólo así la reserva se resuelve y
   * se consulta el estado vigente del cobro. Mientras no se concilia, ninguna otra
   * intención cobra la deuda.
   *
   * Pasado lo que la pasarela recuerda la clave (23 h desde la marca, 1 h de
   * margen sobre las 24 h de retención) **no reenvía**: pide conciliación manual
   * (`409 PAYMENT_GATEWAY_RECONCILIATION_REQUIRED`), porque repetir la clave podría
   * crear un segundo cobro. Con la fecha de la marca ilegible, igual.
   *
   * Pasa por las mismas compuertas que un cobro (estado, riesgo, saldo, deuda) y
   * necesita el mismo `paymentMethodType` de la primera vez (no se persiste): con
   * otro, la pasarela contesta `idempotency_key_reused` y la reserva se conserva.
   *
   * @throws ConflictException `PAYMENT_GATEWAY_NOTHING_TO_RECONCILE` si la intención no
   *   tiene una reserva pendiente.
   */
  async reconcileGatewayDispatch(
    intentId: string,
    dto: Pick<ProcessTransactionDto, 'paymentMethodType'>,
  ): Promise<TransactionResponseDto> {
    if (!this.gatewayCharge?.enabled) {
      throw new ConflictException(
        'La pasarela no está activa: no hay despachos que conciliar',
        { intentId },
        PaymentsErrorReason.PAYMENT_GATEWAY_NOTHING_TO_RECONCILE,
      );
    }
    this.logger.info(
      { operation: 'payments.gateway.reconcile', intentId },
      'Reconciling gateway dispatch reservation',
    );
    return this.processViaGateway(
      intentId,
      { operation: 'SALE', paymentMethodType: dto.paymentMethodType },
      this.gatewayCharge,
      'reconcile',
    );
  }

  /**
   * Reenvío de una conciliación: despacha con la misma clave, deja constancia del
   * resultado y, si la pasarela ya tenía el cobro (`replayed`), lee su estado
   * vigente (la respuesta repetida trae el del momento de crearlo).
   */
  private async resendReservedDispatch(
    intent: GatewayChargeable,
    dto: ProcessTransactionDto,
    gateway: PaymentsGatewayChargeService,
  ) {
    let charged: Awaited<ReturnType<PaymentsGatewayChargeService['dispatch']>>;
    try {
      charged = await gateway.dispatch(intent, dto.paymentMethodType);
    } catch (error) {
      gatewayMetrics.reconciled(
        error instanceof PaymentsGatewayResultAmbiguousException ||
          (error instanceof PaymentsGatewayError && error.isAmbiguous)
          ? 'ambiguous'
          : 'rejected',
      );
      throw error;
    }
    gatewayMetrics.reconciled(charged.replayed ? 'replayed' : 'created');
    this.logger.info(
      {
        operation: 'payments.gateway.reconcile',
        intentId: intent.id,
        outcome: charged.replayed ? 'replayed' : 'created',
      },
      'Gateway dispatch reservation reconciled',
    );
    return charged.replayed
      ? gateway.consult(
          intent.id,
          charged.gatewayIntentRef,
          charged.localStatusConceptId,
        )
      : charged;
  }

  /**
   * UC-42-05 con `payments.via_gateway=on` (REQ-INT-1): crea el cobro en la pasarela.
   *
   * Tres tiempos. La llamada HTTP no sostiene ningún bloqueo de fila: la compuerta y
   * la asociación son transacciones cortas que se confirman solas (`runCommitted`).
   *
   * 1. **Compuerta + reserva** (transacción propia, confirmada). La misma compuerta
   *    de estado y de riesgo que el camino de siempre, más la medición contra la
   *    deuda (`assertDebtAllowsCharge`, con la deuda bloqueada). Si pasa, deja
   *    escrita la MARCA DE DESPACHO en la intención y confirma: desde ese `COMMIT`
   *    cualquier otra intención de la deuda ve este cobro como «en vuelo» aunque
   *    todavía no tenga `pi_…`. Es la reserva que antes no existía (N2/N4).
   * 2. **Llamada HTTP**, sin transacción propia. Si la compuerta no pasó, la
   *    pasarela no recibe ninguna llamada.
   * 3. **Asociación** (`PaymentsGatewayChargeService.associate`, transacción propia):
   *    el `pi_…` reemplaza la marca. Una respuesta definitiva de rechazo libera la
   *    marca; un resultado ambiguo (504) la conserva.
   *
   * Qué NO se evita: con `RLS_ENFORCE=true` el `TenantContextInterceptor` ya abrió
   * una transacción para toda la petición y esa conexión permanece tomada («idle in
   * transaction») durante la llamada HTTP, hasta 3 × 10 s más las esperas con los
   * valores por defecto. Es propio del interceptor y alcanza a todas las rutas de la
   * API: no retiene bloqueos de las filas de la compuerta (se soltaron al confirmar)
   * pero sí una conexión del pool, que con muchas llamadas lentas simultáneas se
   * puede agotar. Con `RLS_ENFORCE=false` no queda ninguna conexión tomada.
   *
   * La pasarela cobra el importe completo con un solo paso (`SALE`); no hay
   * autorización/captura separadas ni importes parciales. Repetir la operación
   * sobre una intención que ya tiene su cobro NO crea otro: lo consulta. Repetirla
   * sobre una que sólo tiene la marca (la llamada anterior terminó ambigua o el
   * proceso murió) vuelve a despachar con la MISMA `Idempotency-Key`: la pasarela
   * devuelve el cobro original o lo crea una sola vez (regla 11).
   */
  private async processViaGateway(
    intentId: string,
    dto: ProcessTransactionDto,
    gateway: PaymentsGatewayChargeService,
    mode: 'dispatch' | 'reconcile' = 'dispatch',
  ): Promise<TransactionResponseDto> {
    // Dentro de la transacción de la petición (`RLS_ENFORCE=true`) cada despacho
    // retiene la conexión del interceptor y necesita otra: se limita cuántos a la
    // vez para que nunca se agote el pool por espera circular. Sin esa transacción
    // cada sección usa una sola conexión a la vez y no hace falta.
    const release = this.em.isInTransaction()
      ? gateway.acquireDispatchSlot(intentId)
      : undefined;
    try {
      return await this.processViaGatewayWithSlot(intentId, dto, gateway, mode);
    } finally {
      release?.();
    }
  }

  private async processViaGatewayWithSlot(
    intentId: string,
    dto: ProcessTransactionDto,
    gateway: PaymentsGatewayChargeService,
    mode: 'dispatch' | 'reconcile',
  ): Promise<TransactionResponseDto> {
    // El tenant sale del contexto verificado por el interceptor, nunca del
    // cuerpo ni de la ruta: el UUID de la intención no prueba que sea del actor.
    const tenantId = requireTenantId();
    if (dto.operation !== 'SALE') {
      throw new PreconditionFailedException(
        'La pasarela cobra en un solo paso: sólo admite la operación SALE',
        { intentId, operation: dto.operation },
        PaymentsErrorReason.PAYMENT_GATEWAY_OPERATION_NOT_SUPPORTED,
      );
    }

    const intent = await runCommitted(this.em, tenantId, async (tx) => {
      // El tenant va en el mismo `WHERE` que el bloqueo: una intención ajena no se
      // espera ni se bloquea, y responde igual y a la misma velocidad que un UUID
      // inexistente (mismo 404, mismo mensaje, sin `details`). El servicio no se
      // apoya en RLS, que con `RLS_ENFORCE=false` no existe. Ver `assertResourceInTenant`.
      const loaded = await this.intentsRepo.findByIdAndTenantForUpdate(
        tx,
        intentId,
        tenantId,
      );
      const found = assertResourceInTenant(loaded, loaded?.tenantId, tenantId, {
        message: 'Intención de pago no encontrada',
        reason: PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
      });
      this.assertIntentOpen(found, intentId);
      if (dto.amount && compareAmounts(dto.amount, found.amount) !== 0) {
        throw new PreconditionFailedException(
          'La pasarela cobra el importe completo de la intención',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_MUST_MATCH_INTENT,
        );
      }
      // Ya despachada antes: es el reintento con la MISMA clave (regla 11); no
      // se vuelve a evaluar ni a crear, se consulta. Una MARCA de despacho no es
      // un cobro: la llamada anterior no llegó a asociar su `pi_…`, así que sigue
      // un despacho normal (mismas compuertas, misma clave) que lo retoma.
      if (found.gatewayIntentRef && !isDispatchMark(found.gatewayIntentRef)) {
        return found;
      }
      if (mode === 'reconcile' && !isDispatchMark(found.gatewayIntentRef)) {
        throw new ConflictException(
          'La intención no tiene un despacho pendiente de conciliar',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_NOTHING_TO_RECONCILE,
        );
      }
      // Reenviar con la misma clave sólo mientras la pasarela la recuerde (24 h). Pasado
      // ese plazo —o con la fecha de la marca ilegible— repetir podría crear un
      // SEGUNDO cobro: no se reenvía, la marca sigue bloqueando la deuda y la
      // conciliación es manual contra la pasarela.
      if (
        isDispatchMark(found.gatewayIntentRef) &&
        !canResendWithSameKey(found.gatewayIntentRef, Date.now())
      ) {
        this.logger.error(
          {
            operation: 'payments.gateway.reconcile',
            intentId,
            reason: 'too_old_to_resend',
          },
          'Dispatch reservation is older than the gateway idempotency retention; not resending, manual reconciliation required',
        );
        gatewayMetrics.reconciliationRequired('too_old_to_resend');
        throw new ConflictException(
          'La reserva de este cobro es más vieja que la memoria de la clave en la pasarela: reenviar podría crear un segundo cobro. Concilialo a mano contra la pasarela',
          { intentId },
          PaymentsErrorReason.PAYMENT_GATEWAY_RECONCILIATION_REQUIRED,
        );
      }

      // Sin cobro en la pasarela, una intención `PI_PROCESSING` tiene una
      // operación del camino de siempre en marcha: cobrarla otra vez duplicaría
      // el cargo. Mismas compuertas que el camino de siempre, en su mismo orden:
      // operación abierta, riesgo y saldo.
      if (found.statusConceptId === CONCEPTS.PI_PROCESSING) {
        throw new ConflictException(
          'La intención ya está en proceso y no tiene un cobro en la pasarela',
          { intentId },
          PaymentsErrorReason.PAYMENT_INTENT_ALREADY_PROCESSING,
        );
      }
      await this.assertNoBlockingOpenOperation(tx, intentId, dto.operation);
      // También con reserva: si el primer envío NUNCA llegó, el reintento crea el
      // cobro por primera vez (con su QR) y no puede hacerlo bajo una revisión de
      // riesgo pendiente. Bloquear el reintento no expone dinero —el QR sólo viaja
      // en la respuesta de creación—; a lo sumo queda un cobro huérfano que se
      // concilia. Un `APPROVE` posterior lo destraba; si no, se cierra a mano.
      await this.assertRiskCleared(tx, intentId, true);
      // La pasarela cobra el importe completo: si ya hay algo capturado por el
      // camino de siempre, excede el saldo y no se despacha (sobrecobro).
      await this.assertWithinBalance(tx, found, intentId, found.amount);
      await this.assertDebtAllowsCharge(tx, found, gateway.dispatchLeaseMs);
      // Una solicitud que la pasarela no podría cobrar (sin medio de pago, otra
      // moneda, vencimiento fuera de rango) falla ANTES de reservar.
      gateway.buildCreateRequest(found, dto.paymentMethodType);
      gateway.reserveDispatch(found);
      return found;
    });

    let charged: Awaited<ReturnType<PaymentsGatewayChargeService['dispatch']>>;
    if (intent.gatewayIntentRef && !isDispatchMark(intent.gatewayIntentRef)) {
      charged = await gateway.consult(
        intent.id,
        intent.gatewayIntentRef,
        intent.statusConceptId,
      );
    } else if (mode === 'reconcile') {
      charged = await this.resendReservedDispatch(intent, dto, gateway);
    } else {
      charged = await gateway.dispatch(intent, dto.paymentMethodType);
    }

    return {
      id: intent.id,
      paymentIntentId: intent.id,
      amount: intent.amount,
      statusConceptId: charged.localStatusConceptId,
      gatewayTransactionRef: charged.gatewayIntentRef,
      gateway: {
        paymentIntentId: charged.gatewayIntentRef,
        status: charged.gatewayStatus,
        ...(charged.nextAction ? { nextAction: charged.nextAction } : {}),
      },
    };
  }

  /**
   * Compuerta previa contra la deuda que la intención va a cobrar (M2). Sin ella
   * dos intenciones con claves locales distintas sobre la misma deuda daban dos
   * cobros (dos QR) y el sobrepago sólo se detectaba cuando el webhook ya había
   * llegado, con el dinero movido.
   *
   * La deuda de la intención es la de su `sourceRef` (`payment_debt`) y las de
   * sus sesiones de checkout. Para cada una, con la deuda bloqueada `FOR UPDATE`
   * (serializa las compuertas concurrentes) y en aritmética decimal exacta:
   *
   * 1. tiene que existir, ser del mismo tenant y no estar saldada, en BOB;
   * 2. ninguna OTRA intención del tenant puede tener un cobro en vuelo sobre ella:
   *    con `pi_…`, o con la marca de despacho vigente (`PI_PENDING`/`PI_PROCESSING`);
   * 3. el importe de la intención no puede exceder el saldo pendiente de la deuda.
   *
   * **Falla cerrado si no puede saber qué deuda es.** Una intención que no declara
   * `source_ref_type = payment_debt` ni tiene sesión de checkout, pero tiene
   * propósito `DEBT` o una referencia de origen de un tipo que no se reconoce como
   * ajeno a las deudas (`mayChargeADebt`), se rechaza con `422
   * PAYMENT_GATEWAY_DEBT_UNRESOLVED`: saltarse la compuerta por una diferencia de
   * mayúsculas en un texto libre dejaba despachar el cobro doble (N3).
   *
   * No se aplica a la intención que ya tiene su `pi_…`: esa es el reintento con la
   * misma clave (regla 11) y sale antes, hacia la consulta. La marca de despacho de
   * la PROPIA intención no cuenta contra ella (`excludeIntentId`). La de otra
   * intención bloquea SIEMPRE, sea cual sea su antigüedad: pasado `dispatchLeaseMs`
   * sólo pasa de «en vuelo» a «requiere conciliación» (log, contador y
   * `listDispatchesRequiringReconciliation`) y la deuda no se ofrece a nadie hasta
   * que `reconcileGatewayDispatch` la resuelve.
   */
  private async assertDebtAllowsCharge(
    tx: EntityManager,
    intent: {
      id: string;
      tenantId: string;
      amount: string;
      purposeConceptId?: string | null;
      sourceRefType?: string | null;
      sourceRefId?: string | null;
    },
    leaseMs: number,
  ): Promise<void> {
    const debtIds = new Set<string>();
    if (intent.sourceRefType === DEBT_SOURCE_REF_TYPE && intent.sourceRefId) {
      debtIds.add(intent.sourceRefId);
    }
    const sessions = await this.flowRepo.findCheckoutSessionsByIntentForUpdate(
      tx,
      intent.id,
    );
    for (const session of sessions) debtIds.add(session.paymentDebtId);

    if (
      debtIds.size === 0 &&
      mayChargeADebt({
        purposeIsDebt: intent.purposeConceptId === CONCEPTS.PAY_PURPOSE_DEBT,
        sourceRefType: intent.sourceRefType,
        sourceRefId: intent.sourceRefId,
      })
    ) {
      throw new PreconditionFailedException(
        'La intención parece cobrar una deuda pero no se puede saber cuál: indicá sourceRefType "payment_debt" con el id de la deuda, o abrí una sesión de checkout',
        { intentId: intent.id },
        PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_UNRESOLVED,
      );
    }

    for (const paymentDebtId of debtIds) {
      const debt = await this.flowRepo.findDebtByIdForUpdate(tx, paymentDebtId);
      if (!debt || debt.tenantId !== intent.tenantId) {
        throw new PreconditionFailedException(
          'La deuda de la intención no existe',
          { intentId: intent.id },
          PaymentsErrorReason.PAYMENT_DEBT_NOT_FOUND,
        );
      }
      if (debt.statusConceptId === CONCEPTS.DEBT_SETTLED) {
        throw new PreconditionFailedException(
          'La deuda ya está saldada',
          { intentId: intent.id, paymentDebtId },
          PaymentsErrorReason.PAYMENT_DEBT_ALREADY_SETTLED,
        );
      }
      if (debt.currencyCode !== 'BOB') {
        throw new PreconditionFailedException(
          'La pasarela sólo cobra deudas en bolivianos (BOB)',
          { intentId: intent.id, paymentDebtId },
          PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
        );
      }
      const candidates = await this.flowRepo.findInFlightGatewayIntentsOnDebt(
        tx,
        {
          tenantId: intent.tenantId,
          paymentDebtId,
          excludeIntentId: intent.id,
        },
      );
      const nowMs = Date.now();
      const blocking = candidates.filter(
        (other) => classifyInFlight(other, nowMs, leaseMs) !== 'none',
      );
      if (blocking.length > 0) {
        // Una reserva sin `pi_` que ya no está en vuelo sigue BLOQUEANDO (la
        // ambigüedad no prueba que la pasarela no creó el cobro): sólo se deja
        // constancia de que requiere conciliación.
        const unreconciled = blocking.filter(
          (other) =>
            classifyInFlight(other, nowMs, leaseMs) ===
            'reconciliation_required',
        );
        if (unreconciled.length > 0) {
          this.logger.error(
            {
              operation: 'payments.gateway.debt-gate',
              intentId: intent.id,
              paymentDebtId,
              reconciliationRequiredIntentIds: unreconciled.map(
                (other) => other.id,
              ),
            },
            'Debt is blocked by a dispatch reservation without a gateway charge reference; it may have created a charge and needs reconciliation',
          );
          gatewayMetrics.reconciliationRequired('stale_blocks_debt');
        }
        throw new ConflictException(
          'La deuda ya tiene otro cobro en curso en la pasarela',
          {
            intentId: intent.id,
            paymentDebtId,
            ...(unreconciled.length > 0
              ? { reconciliationRequired: true }
              : {}),
          },
          PaymentsErrorReason.PAYMENT_GATEWAY_DEBT_HAS_OPEN_CHARGE,
        );
      }
      if (compareAmounts(intent.amount, debt.outstandingAmount) > 0) {
        throw new ConflictException(
          'El importe excede el saldo pendiente de la deuda',
          {
            intentId: intent.id,
            paymentDebtId,
            amount: intent.amount,
            outstanding: debt.outstandingAmount,
          },
          PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_EXCEEDS_DEBT,
        );
      }
    }
  }

  /**
   * UC-42-06: aplica el resultado que notifica el gateway.
   *
   * Los proveedores reintentan los webhooks, así que la operación debe ser
   * idempotente: si la transacción ya está en el estado que informa el callback se
   * responde `duplicate=true` sin volver a mutar nada ni duplicar efectos contables.
   *
   * MCH-011: también reordenan. El evento verificado se archiva en
   * `payment_webhook_events` y se interpreta con la máquina de estados
   * (`decidirCallback`): sólo un avance legítimo escribe. Una entrega atrasada se
   * ignora sin retroceder y una contradicción con un estado terminal queda sin
   * procesar para conciliación, en vez de sobreescribir un cobro confirmado.
   */
  async applyCallback(
    callbackPath: string,
    dto: GatewayCallbackDto,
    sourceIp?: string,
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
          PaymentsErrorReason.GATEWAY_TRANSACTION_REF_NOT_FOUND,
        );
      }

      // Verificación de origen del webhook (fail-closed). Sin esto, cualquiera que
      // conozca una `gatewayTransactionRef` podía forzar `PI_SUCCEEDED` (pago
      // fraudulento). MCH-019: el HMAC se valida con el secreto de la conexión
      // configurada (`gateway_connections.webhook_secret_ref`); sin él, se rechaza.
      const { secrets, connectionId, reason } =
        await resolveGatewayWebhookSecrets(tx, transaction);
      // `timestamp` entra en los bytes firmados sólo cuando el proveedor lo
      // envía (JSON.stringify omite el `undefined`): el contrato previo sigue
      // verificándose igual, y quien declara ventana de repetición lo exige.
      const signedBody = canonicalJson({
        gatewayTransactionRef: dto.gatewayTransactionRef,
        outcome: dto.outcome,
        authorizationCode: dto.authorizationCode,
        timestamp: dto.timestamp,
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
        throw new UnauthorizedException(
          'Firma del webhook inválida',
          undefined,
          PaymentsErrorReason.GATEWAY_WEBHOOK_SIGNATURE_INVALID,
        );
      }

      // El endpoint por el que llegó se contrasta con la configuración de la
      // conexión de la transacción ANTES de decidir o mutar nada: ruta activa de
      // esa conexión, red de origen y ventana de repetición.
      const endpoints = connectionId
        ? await this.transactionsRepo.findCallbackEndpoints(tx, connectionId)
        : [];
      const endpointDecision = evaluateCallbackEndpoint(endpoints, {
        callbackPath,
        sourceIp,
        timestamp: dto.timestamp,
        now: new Date(),
        activeStateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      if (!endpointDecision.allowed) {
        this.logger.warn(
          {
            operation: 'payments.callback.apply',
            gatewayTransactionRef: dto.gatewayTransactionRef,
            gatewayConnectionId: connectionId,
            reason: endpointDecision.reason,
          },
          'Rejected gateway callback by endpoint configuration',
        );
        throw new UnauthorizedException(
          'Callback no autorizado para este endpoint',
          undefined,
          endpointDecision.reason,
        );
      }

      const targetStatus = this.callbackStatus(dto.outcome);
      // MCH-011: el evento se interpreta contra el estado ya conocido. Antes
      // sólo coincidencia exacta contaba como duplicado y cualquier otro caso
      // sobreescribía, así que un AUTHORIZED atrasado hacía retroceder un cobro
      // ya confirmado.
      const decision = decideCallback(
        transaction.statusConceptId,
        targetStatus,
      );

      // Bandeja de entrada: el hecho verificado se archiva con su firma antes de
      // decidir nada. La referencia es determinista, así que su índice único
      // reconoce la reentrega aunque el estado local ya haya avanzado.
      const eventRef = eventReference(dto);
      const archived = await this.transactionsRepo.findWebhookEventByRef(
        tx,
        eventRef,
      );
      if (!archived) {
        this.transactionsRepo.recordWebhookEvent(tx, {
          gatewayId: transaction.gatewayId,
          eventType: `payments.callback.${dto.outcome}`,
          gatewayEventRef: eventRef,
          payloadJson: {
            callbackPath,
            gatewayTransactionRef: dto.gatewayTransactionRef,
            outcome: dto.outcome,
            authorizationCode: dto.authorizationCode,
          },
          signature: dto.signature,
          isVerified: true,
          processed: decision === 'aplicar',
          relatedIntentId: transaction.paymentIntentId,
        });
      }

      if (decision !== 'aplicar') {
        if (decision !== 'duplicado') {
          this.logger.warn(
            {
              operation: 'payments.callback.apply',
              transactionId: transaction.id,
              gatewayTransactionRef: dto.gatewayTransactionRef,
              currentStatusConceptId: transaction.statusConceptId,
              reportedStatusConceptId: targetStatus,
              decision,
            },
            decision === 'obsoleto'
              ? 'Ignored out-of-order gateway callback'
              : 'Gateway callback contradicts a terminal state; needs reconciliation',
          );
        }
        // No se toca ni la transacción ni la intención: retroceder un estado
        // confirmado es peor que perder el evento, y la contradicción queda
        // archivada sin procesar para que alguien la concilie.
        return {
          transactionId: transaction.id,
          duplicate: decision === 'duplicado',
          applied: false,
          decision,
          reconciliationRequired: decision === 'contradiccion',
          statusConceptId: transaction.statusConceptId,
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
        // MCH-036: el estado de la intención se deriva de lo efectivamente
        // capturado y confirmado, no de la operación que informa este callback.
        // Antes un CAPTURED de 40 sobre una intención de 100 la dejaba
        // PI_SUCCEEDED, es decir, la obligación aparecía satisfecha por completo.
        const captured = await this.intentCaptured(
          tx,
          transaction.paymentIntentId,
          { id: transaction.id, statusConceptId: targetStatus },
        );
        intent.statusConceptId = this.intentState(
          dto.outcome,
          captured,
          intent.amount,
        );
        touch(intent, undefined);
      }

      return {
        transactionId: transaction.id,
        duplicate: false,
        applied: true,
        decision,
        reconciliationRequired: false,
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
        throw new ResourceNotFoundException(
          'Transacción no encontrada',
          {
            transactionId,
          },
          PaymentsErrorReason.PAYMENT_TRANSACTION_NOT_FOUND,
        );
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
        throw new ResourceNotFoundException(
          'Transacción no encontrada',
          {
            transactionId,
          },
          PaymentsErrorReason.PAYMENT_TRANSACTION_NOT_FOUND,
        );
      }
      if (!CAPTURED_STATES.includes(transaction.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se puede reembolsar una transacción capturada o liquidada',
          { transactionId },
          PaymentsErrorReason.REFUND_TRANSACTION_NOT_CAPTURED,
        );
      }

      // El DTO ya lo valida; se repite acá porque el tope de abajo supone
      // importes positivos y el servicio también se llama sin pasar por HTTP.
      if (!isPositiveAmount(dto.amount)) {
        throw new PreconditionFailedException(
          'El importe del reembolso debe ser mayor que cero',
          { transactionId, amount: dto.amount },
        );
      }

      const previous = await this.transactionsRepo.findRefundsByTransaction(
        tx,
        transactionId,
      );
      // Un reembolso fallido no devolvió dinero; uno pendiente sí lo compromete.
      // Suma y comparación exactas (MCH-017): con `Number`, 0.10 + 0.20 superaba
      // 0.30 y se rechazaba un reembolso válido.
      const refunded = addAmounts(
        previous
          .filter((r) => r.statusConceptId !== CONCEPTS.REFUND_FAILED)
          .map((r) => r.amount),
      );
      if (
        compareAmounts(addAmounts([refunded, dto.amount]), transaction.amount) >
        0
      ) {
        throw new ConflictException(
          'El reembolso excede el importe capturado',
          {
            transactionId,
            captured: transaction.amount,
            alreadyRefunded: refunded,
          },
          PaymentsErrorReason.REFUND_EXCEEDS_CAPTURED_AMOUNT,
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
        throw new ResourceNotFoundException(
          'Transacción no encontrada',
          {
            transactionId,
          },
          PaymentsErrorReason.PAYMENT_TRANSACTION_NOT_FOUND,
        );
      }
      if (transaction.statusConceptId === CONCEPTS.TXN_SETTLED) {
        throw new PreconditionFailedException(
          'La transacción está liquidada; corresponde un reembolso en vez de una anulación',
          { transactionId },
          PaymentsErrorReason.CANCELLATION_TRANSACTION_ALREADY_SETTLED,
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
   * Suma exacta de lo efectivamente cobrado por una intención (MCH-036).
   *
   * Sólo cuentan las transacciones capturadas o liquidadas: una operación en
   * PROCESSING no movió dinero y una autorización tampoco. Por eso una
   * reentrega del mismo callback no incrementa el acumulado: éste se deriva de
   * las filas, no de los eventos.
   *
   * @param tx - Transacción de base de datos activa.
   * @param intentId - Intención de pago.
   * @param inCourse - Transacción cuyo estado está cambiando en esta misma unidad;
   *   se toma su estado nuevo en lugar del persistido.
   * @returns El importe capturado, como cadena decimal.
   */
  private async intentCaptured(
    tx: EntityManager,
    intentId: string,
    inCourse?: { id: string; statusConceptId: string },
  ): Promise<string> {
    const transactions = await this.transactionsRepo.findByIntent(tx, intentId);
    return addAmounts(
      transactions
        .map((t) => ({
          amount: t.amount,
          statusConceptId:
            t.id === inCourse?.id
              ? inCourse.statusConceptId
              : t.statusConceptId,
        }))
        .filter((t) => CAPTURED_STATES.includes(t.statusConceptId))
        .map((t) => t.amount),
    );
  }

  /**
   * Estado de la intención derivado del importe confirmado (MCH-036).
   *
   * No hay un concepto PI_PARTIALLY_CAPTURED en el catálogo, así que una
   * intención cobrada a medias sigue en PI_PROCESSING: es el estado que ya
   * significa "en curso" y no afirma que la obligación esté satisfecha. Un fallo
   * posterior a un cobro parcial tampoco la marca fallida: hay dinero cobrado.
   *
   * @param outcome - Resultado informado por el proveedor.
   * @param captured - Importe efectivamente capturado.
   * @param due - Importe de la intención.
   * @returns El concepto de estado de la intención.
   */
  private intentState(
    outcome: GatewayCallbackDto['outcome'],
    captured: string,
    due: string,
  ): string {
    if (compareAmounts(captured, due) >= 0) return CONCEPTS.PI_SUCCEEDED;
    if (outcome === 'FAILED' && !isPositiveAmount(captured)) {
      return CONCEPTS.PI_FAILED;
    }
    return CONCEPTS.PI_PROCESSING;
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
