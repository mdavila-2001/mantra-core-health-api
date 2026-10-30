import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { PaymentsErrorReason } from '../payments.error-reasons';
import type { GatewayProblem } from './payments-gateway.types';

/**
 * Fallo de una llamada a la pasarela, ya clasificado según la regla 11 del
 * proyecto de la pasarela: **un resultado ambiguo no es un fallo**.
 *
 * - `ambiguous`: no se sabe si la pasarela ejecutó la operación (corte de red,
 *   timeout, `500`/`502`/`503`/`504`, un `2xx` ilegible, o `409
 *   idempotency_request_in_progress`). Nunca prueba que no se ejecutó: se
 *   reintenta con la MISMA `Idempotency-Key`.
 * - `rejected` con `retryable`: la pasarela contestó que no (por ejemplo `429`)
 *   y se puede repetir la misma petición.
 * - `rejected` sin `retryable`: respuesta definitiva del contrato (`401`, `403`,
 *   `404`, `409 invalid_state_transition`, `422`…). Repetir no lo arregla.
 */
export class PaymentsGatewayError extends Error {
  /** Forma mínima que lee `retryAfterFromError` de `common/resilience`. */
  readonly response?: { status: number; headers: Record<string, string> };

  constructor(
    /** Si el resultado es ambiguo. */
    readonly ambiguity: 'ambiguous' | 'rejected',
    /** Si repetir la MISMA petición puede resolverlo. */
    readonly retryable: boolean,
    message: string,
    readonly details: {
      /** Estado HTTP, si hubo respuesta. */
      status?: number;
      /** `code` estable del problema RFC 9457. */
      code?: string;
      /** `request_id` que la pasarela devuelve para soporte. */
      requestId?: string;
      /** Errores por campo del problema (`field` y `code`), para diagnosticar un 422. */
      fieldErrors?: { field: string; code: string }[];
      /** Cabeceras de la respuesta (sólo para `Retry-After`). */
      headers?: Record<string, string>;
    } = {},
  ) {
    super(message);
    this.name = 'PaymentsGatewayError';
    if (details.status !== undefined) {
      this.response = {
        status: details.status,
        headers: details.headers ?? {},
      };
    }
  }

  /**
   * `true` si un intento ANTERIOR de la misma llamada (misma `Idempotency-Key`) fue
   * ambiguo —timeout, corte, 5xx, 409 en curso— y por lo tanto pudo haber llegado a
   * la pasarela y ejecutarse, aunque el ÚLTIMO intento haya recibido una respuesta
   * definitiva. Lo fija el cliente (`PaymentsGatewayClient.send`) al terminar.
   */
  earlierAttemptMayHaveReached = false;

  /**
   * `true` si no se puede afirmar que la pasarela no ejecutó la operación: el
   * error es ambiguo en sí, o algún intento previo de la misma llamada lo fue
   * (un 4xx final no prueba que el primer intento no se ejecutó).
   */
  get isAmbiguous(): boolean {
    return this.ambiguity === 'ambiguous' || this.earlierAttemptMayHaveReached;
  }

  /** Código estable del problema, si la pasarela lo mandó. */
  get code(): string | undefined {
    return this.details.code;
  }

  /** Estado HTTP, si hubo respuesta. */
  get status(): number | undefined {
    return this.details.status;
  }
}

/** Extrae un `GatewayProblem` válido del cuerpo de una respuesta de error, si lo es. */
export function parseProblem(body: unknown): GatewayProblem | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const candidate = body as Record<string, unknown>;
  if (typeof candidate.code !== 'string') return undefined;
  return {
    code: candidate.code,
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    title: typeof candidate.title === 'string' ? candidate.title : undefined,
    request_id:
      typeof candidate.request_id === 'string'
        ? candidate.request_id
        : undefined,
  };
}

/**
 * 504: no se sabe si la pasarela creó el cobro. **No es un fallo**: el cobro
 * local se conserva sin tocar y quien reintente debe usar la misma
 * `idempotencyKey` (de ella sale la misma `Idempotency-Key` de la pasarela).
 */
export class PaymentsGatewayResultAmbiguousException extends DomainException {
  constructor(intentId: string) {
    super(
      HttpStatus.GATEWAY_TIMEOUT,
      ErrorCode.TIMEOUT,
      'No se pudo confirmar el cobro con la pasarela. El cobro puede haberse creado: reintentá con la misma idempotencyKey y no inicies otro',
      { intentId },
      PaymentsErrorReason.PAYMENT_GATEWAY_RESULT_AMBIGUOUS,
    );
  }
}

/** 503: la pasarela no está disponible o rechaza las credenciales de la API (no es culpa del cliente). */
export class PaymentsGatewayUnavailableException extends DomainException {
  constructor(intentId: string) {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.DEPENDENCY_UNAVAILABLE,
      'La pasarela de pagos no está disponible en este momento. El cobro local quedó pendiente: reintentá con la misma idempotencyKey',
      { intentId },
      PaymentsErrorReason.PAYMENT_GATEWAY_UNAVAILABLE,
    );
  }
}

/**
 * 503 reintentable: demasiados cobros por la pasarela en curso en este proceso.
 * No se creó ni se reservó nada; repetir con la misma `idempotencyKey` es seguro.
 * Existe para que las peticiones excedentes no esperen una conexión del pool
 * mientras retienen otra (ver `payments-gateway-concurrency.ts`).
 */
export class PaymentsGatewayBusyException extends DomainException {
  constructor(intentId: string) {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.DEPENDENCY_UNAVAILABLE,
      'Hay demasiados cobros por la pasarela en curso. No se hizo nada: reintentá en unos segundos con la misma idempotencyKey',
      { intentId },
      PaymentsErrorReason.PAYMENT_GATEWAY_BUSY,
    );
  }
}
