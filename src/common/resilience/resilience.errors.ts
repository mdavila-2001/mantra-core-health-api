import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../errors/error-codes';

/**
 * Errores que produce el propio kernel de resiliencia.
 *
 * Los tres son `HttpException` con el mismo cuerpo estable (`code`, `message`,
 * `details`) que el resto del contrato de error: cuando el kernel protege una
 * llamada dentro de una petición HTTP, `AllExceptionsFilter` los serializa sin
 * ningún caso especial y el cliente recibe un código sobre el que puede
 * ramificar. Cuando protege un tick de worker, el job los registra como
 * cualquier otro fallo.
 *
 * Todos llevan `details.operation`: sin el nombre de la operación protegida, un
 * `CIRCUIT_OPEN` en el log no dice **qué** dependencia está caída, que es lo
 * único que el operador necesita saber a las 3 de la mañana.
 */

/** La operación no terminó dentro de su plazo y se abortó. */
export class OperationTimeoutError extends HttpException {
  constructor(
    readonly operation: string,
    readonly timeoutMs: number,
  ) {
    super(
      {
        code: ErrorCode.TIMEOUT,
        message: `La operación "${operation}" excedió su plazo de ${timeoutMs} ms`,
        details: { operation, timeoutMs },
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}

/**
 * El cortacircuitos está abierto: la llamada se rechaza sin intentarla.
 *
 * `retryAfterMs` no es decorativo: es lo que permite a quien llama esperar el
 * tiempo justo en vez de reintentar a ciegas y convertir el rechazo barato en
 * una tormenta de reintentos —el fallo que el cortacircuitos existe para
 * evitar—.
 */
export class CircuitOpenError extends HttpException {
  constructor(
    readonly operation: string,
    readonly retryAfterMs: number,
  ) {
    super(
      {
        code: ErrorCode.CIRCUIT_OPEN,
        message:
          `El cortacircuitos de "${operation}" está abierto; ` +
          `se reintentará en ${Math.ceil(retryAfterMs / 1000)} s`,
        details: { operation, retryAfterMs },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/** El mamparo de concurrencia rechazó la operación por saturación. */
export class BulkheadFullError extends HttpException {
  constructor(
    readonly operation: string,
    readonly maxConcurrent: number,
    readonly maxQueued: number,
  ) {
    super(
      {
        code: ErrorCode.CONCURRENCY_LIMIT,
        message:
          `El mamparo de "${operation}" está saturado ` +
          `(${maxConcurrent} en vuelo, ${maxQueued} en cola)`,
        details: { operation, maxConcurrent, maxQueued },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
