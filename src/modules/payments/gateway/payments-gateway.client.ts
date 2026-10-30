import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { retry, type RetryClock } from '../../../common/resilience';
import { PaymentsGatewayError, parseProblem } from './payments-gateway.errors';
import {
  GATEWAY_PAYMENT_INTENT_STATUSES,
  GATEWAY_PAYMENT_METHOD_TYPES,
  type GatewayPaymentIntent,
  type GatewayPaymentIntentCreate,
} from './payments-gateway.types';
import type { PaymentsGatewayConfig } from './payments-gateway.env';

/** `pi_` + 10 a 40 caracteres, como el contrato (`PaymentIntentId`). */
const PAYMENT_INTENT_ID = /^pi_[a-z0-9]{10,40}$/u;

/** Código del problema cuando la primera petición idéntica sigue en curso. */
const IDEMPOTENCY_IN_PROGRESS = 'idempotency_request_in_progress';

/** Lo opcional de cada llamada. */
export interface GatewayCallOptions {
  /** `X-Request-Id` de correlación (8 a 64 caracteres `[A-Za-z0-9._-]`). */
  requestId?: string;
  /** Observador de cada reintento (la clave NO viaja en el evento). */
  onRetry?: (info: {
    attempt: number;
    delayMs: number;
    reason: string;
  }) => void;
}

/** Resultado de crear un cobro. */
export interface CreatePaymentIntentResult {
  /** Cobro devuelto por la pasarela. */
  intent: GatewayPaymentIntent;
  /** `true` si la pasarela devolvió la respuesta guardada de una petición anterior con la misma clave. */
  replayed: boolean;
}

/**
 * Cliente HTTP de la API pública de la pasarela. Mínimo y escrito a mano.
 *
 * **Regla 11 del proyecto de la pasarela.** Un timeout, un corte, un
 * `500`/`502`/`503`/`504` o un `409 idempotency_request_in_progress` después de
 * enviar `POST /payment_intents` **no prueban que no se ejecutó**. Por eso:
 *
 * - se reintenta SIEMPRE con la MISMA `Idempotency-Key` (la pasarela devuelve el
 *   cobro original), nunca con una nueva: un segundo intento por ambigüedad
 *   sería un segundo cobro;
 * - si los reintentos se agotan sin respuesta, se lanza un
 *   `PaymentsGatewayError` **ambiguo**: el llamador conserva su estado y
 *   reintenta después con la misma clave; no anula ni responde «no existe»;
 * - sólo las respuestas que el contrato declara definitivas (`4xx` con
 *   problema) cortan los reintentos.
 *
 * La clave de API sólo viaja en `Authorization` y no se registra en ningún
 * mensaje de error. No se siguen redirecciones (arrastrarían la credencial).
 */
export class PaymentsGatewayClient {
  private readonly http: AxiosInstance;

  /**
   * @param config - Configuración validada al arrancar.
   * @param clock - Reloj/espera inyectables; sólo las pruebas lo sustituyen.
   */
  constructor(
    private readonly config: PaymentsGatewayConfig,
    private readonly clock?: RetryClock,
  ) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      maxRedirects: 0,
      // El estado lo clasifica este cliente; axios no debe lanzar por 4xx/5xx.
      validateStatus: () => true,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
    });
  }

  /**
   * `POST /payment_intents` con `Idempotency-Key`.
   *
   * @param body - Cuerpo del contrato.
   * @param idempotencyKey - Clave determinista; se reutiliza en cada reintento.
   * @throws PaymentsGatewayError ambiguo si se agotan los intentos sin una
   *   respuesta definitiva; no ambiguo si la pasarela rechazó la petición.
   */
  async createPaymentIntent(
    body: GatewayPaymentIntentCreate,
    idempotencyKey: string,
    options: GatewayCallOptions = {},
  ): Promise<CreatePaymentIntentResult> {
    const response = await this.send(
      'payments.gateway.create_payment_intent',
      () =>
        this.http.post('/payment_intents', body, {
          headers: this.headers(options, idempotencyKey),
        }),
      options,
    );
    if (response.status !== 201 && response.status !== 200) {
      throw this.unexpected(response);
    }
    return {
      intent: this.parseIntent(response),
      replayed: response.headers['idempotency-replayed'] === 'true',
    };
  }

  /**
   * `GET /payment_intents/{id}`: consulta autoritativa del cobro.
   *
   * @throws PaymentsGatewayError (`404 resource_not_found` es definitivo).
   */
  async getPaymentIntent(
    id: string,
    options: GatewayCallOptions = {},
  ): Promise<GatewayPaymentIntent> {
    if (!PAYMENT_INTENT_ID.test(id)) {
      throw new PaymentsGatewayError(
        'rejected',
        false,
        'Identificador de cobro de la pasarela inválido',
      );
    }
    const response = await this.send(
      'payments.gateway.get_payment_intent',
      () =>
        this.http.get(`/payment_intents/${id}`, {
          headers: this.headers(options),
        }),
      options,
    );
    if (response.status !== 200) throw this.unexpected(response);
    return this.parseIntent(response);
  }

  private headers(
    options: GatewayCallOptions,
    idempotencyKey?: string,
  ): Record<string, string> {
    return {
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(options.requestId ? { 'X-Request-Id': options.requestId } : {}),
    };
  }

  /** Ejecuta la llamada reintentando sólo lo retryable, con backoff y `Retry-After`. */
  private async send(
    operation: string,
    call: () => Promise<AxiosResponse>,
    options: GatewayCallOptions,
  ): Promise<AxiosResponse> {
    return retry(
      operation,
      async () => this.classify(await this.attempt(call)),
      {
        attempts: this.config.maxAttempts,
        baseDelayMs: this.config.retryBaseMs,
        maxDelayMs: Math.max(this.config.retryBaseMs, 5_000),
        isRetryable: (error) =>
          error instanceof PaymentsGatewayError && error.retryable,
        onRetry: (info) =>
          options.onRetry?.({
            attempt: info.attempt,
            delayMs: info.delayMs,
            reason:
              info.error instanceof PaymentsGatewayError
                ? (info.error.code ?? `http_${info.error.status ?? 'none'}`)
                : 'unknown',
          }),
      },
      undefined,
      this.clock,
    );
  }

  /** Un intento: un corte de red o un timeout no tienen respuesta y son ambiguos. */
  private async attempt(
    call: () => Promise<AxiosResponse>,
  ): Promise<AxiosResponse> {
    try {
      return await call();
    } catch (error) {
      const code =
        typeof (error as { code?: unknown }).code === 'string'
          ? (error as { code: string }).code
          : 'network_error';
      throw new PaymentsGatewayError(
        'ambiguous',
        true,
        `Sin respuesta de la pasarela (${code}); el resultado es ambiguo`,
        { code },
      );
    }
  }

  /** Convierte una respuesta HTTP en éxito o en el error clasificado. */
  private classify(response: AxiosResponse): AxiosResponse {
    const { status } = response;
    if (status >= 200 && status < 300) return response;

    const problem = parseProblem(response.data);
    const details = {
      status,
      code: problem?.code,
      requestId: problem?.request_id,
      fieldErrors: problem?.errors,
      headers: this.retryHeaders(response),
    };

    // 5xx: el contrato lo declara ambiguo para toda operación que mueve dinero.
    if (status >= 500) {
      throw new PaymentsGatewayError(
        'ambiguous',
        true,
        `La pasarela respondió ${status}${problem ? ` (${problem.code})` : ''}; el resultado es ambiguo`,
        details,
      );
    }
    // La primera petición idéntica sigue en curso: puede terminar bien.
    if (status === 409 && problem?.code === IDEMPOTENCY_IN_PROGRESS) {
      throw new PaymentsGatewayError(
        'ambiguous',
        true,
        'La petición idéntica anterior sigue en curso en la pasarela',
        details,
      );
    }
    // 429: la pasarela no ejecutó nada y pide esperar.
    if (status === 429) {
      throw new PaymentsGatewayError(
        'rejected',
        true,
        'La pasarela limitó la velocidad de las peticiones',
        details,
      );
    }
    // El resto de 4xx es respuesta definitiva del contrato: repetir no lo arregla.
    throw new PaymentsGatewayError(
      'rejected',
      false,
      `La pasarela rechazó la petición con ${status}${problem ? ` (${problem.code})` : ''}`,
      details,
    );
  }

  /** Sólo `Retry-After` de la respuesta; ninguna otra cabecera se conserva. */
  private retryHeaders(response: AxiosResponse): Record<string, string> {
    const raw: unknown = response.headers['retry-after'];
    return typeof raw === 'string' ? { 'retry-after': raw } : {};
  }

  /** Un éxito con un código que el contrato no declara para la operación. */
  private unexpected(response: AxiosResponse): PaymentsGatewayError {
    return new PaymentsGatewayError(
      'ambiguous',
      false,
      `La pasarela respondió ${response.status}, que el contrato no declara para esta operación`,
      { status: response.status },
    );
  }

  /** Valida la forma mínima del cobro; un 2xx ilegible es ambiguo. */
  private parseIntent(response: AxiosResponse): GatewayPaymentIntent {
    const data = response.data as Partial<GatewayPaymentIntent> | undefined;
    const valid =
      typeof data === 'object' &&
      data !== null &&
      data.object === 'payment_intent' &&
      typeof data.id === 'string' &&
      PAYMENT_INTENT_ID.test(data.id) &&
      typeof data.amount_minor === 'number' &&
      Number.isSafeInteger(data.amount_minor) &&
      typeof data.currency === 'string' &&
      GATEWAY_PAYMENT_INTENT_STATUSES.includes(
        data.status as GatewayPaymentIntent['status'],
      ) &&
      GATEWAY_PAYMENT_METHOD_TYPES.includes(
        data.payment_method_type as GatewayPaymentIntent['payment_method_type'],
      );
    if (!valid) {
      throw new PaymentsGatewayError(
        'ambiguous',
        false,
        'La pasarela respondió 2xx con un cuerpo que no cumple el contrato; el resultado es ambiguo',
        { status: response.status },
      );
    }
    return data as GatewayPaymentIntent;
  }
}
