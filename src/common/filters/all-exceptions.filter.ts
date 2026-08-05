import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import type { Request, Response } from 'express';
import { ErrorCode } from '../errors/error-codes';
import {
  APP_ATTR,
  TracingService,
  applyTraceHeader,
} from '../../observability';

/** Forma estable del cuerpo de error que ve el cliente. */
interface ErrorResponseBody {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de message mantenido por la instancia.
   */
  message: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Valor de details mantenido por la instancia.
   */
  details?: unknown;
  /**
   * Valor de timestamp mantenido por la instancia.
   */
  timestamp: string;
  /**
   * Valor de path mantenido por la instancia.
   */
  path: string;
}

/**
 * Normaliza el identificador de la petición a texto, o `undefined` si no hay.
 *
 * `x-request-id` puede llegar repetido, y Express entrega esos casos como
 * array. Se toma el primero en vez de descartar el valor: un correlationId
 * aproximado sirve para encontrar la línea de log; ninguno, no.
 */
function toCorrelationId(value: unknown): string | undefined {
  // El elemento de un `unknown[]` sigue siendo `unknown`: anotarlo evita que
  // TypeScript lo degrade a `any` al indexar y que la regla de asignación
  // insegura salte por un valor que después se comprueba con `typeof`.
  const single: unknown = Array.isArray(value)
    ? (value as unknown[])[0]
    : value;

  if (typeof single === 'string') {
    return single === '' ? undefined : single;
  }
  // `Number.isFinite` descarta NaN e Infinity, que como identificador no
  // ayudarían a nadie a encontrar nada.
  return typeof single === 'number' && Number.isFinite(single)
    ? String(single)
    : undefined;
}

/**
 * Filtro global de excepciones. Homogeneiza cualquier fallo -excepciones de
 * dominio, excepciones de Nest, errores no controlados- en un cuerpo estable con
 * `code`, `message` y `correlationId`, y decide qué se registra.
 *
 * Regla de seguridad central: los 5xx (fallos no anticipados) se registran con
 * el error completo pero el cuerpo devuelto al cliente nunca incluye el stack, el
 * SQL ni el mensaje interno; solo un mensaje genérico y el `correlationId` con el
 * que soporte puede localizar el log. Los <500 son errores de negocio esperados
 * y se registran a `warn` con su contexto seguro.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param logger - Valor de logger requerido por la operación.
   * @param tracing - Capa de trazas; marca el span activo según la política de
   *                  errores. Es un no-op cuando la telemetría está apagada.
   */
  constructor(
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  /**
   * Ejecuta la operación catch.
   *
   * @param exception - Valor de exception requerido por la operación.
   * @param host - Valor de host requerido por la operación.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & {
        /**
         * Identificador de la petición que asigna pino-http.
         *
         * Se declara `string | number` porque **es las dos cosas**: con su
         * generador por defecto pino numera las peticiones y `req.id` llega
         * como número; cuando el cliente manda `x-request-id`, es texto.
         * Declararlo sólo `string` era una afirmación falsa que el cast
         * silenciaba, y por eso el cuerpo salía con un `correlationId`
         * numérico contra un contrato que promete texto.
         */
        id?: string | number;
      }
    >();

    // pino-http asigna `req.id`; se reutiliza como correlationId para hilar el
    // error del cliente con la línea de log del servidor.
    //
    // Se normaliza a texto acá y no en cada cliente: `correlationId` es
    // `string` en el contrato publicado, y un consumidor que lo compare o lo
    // concatene no debería tener que adivinar de qué tipo le llegó esta vez.
    const correlationId = toCorrelationId(
      request.id ?? request.headers['x-request-id'],
    );

    const { status, code, message, details } = this.normalize(exception);

    const body: ErrorResponseBody = {
      code,
      message,
      correlationId,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // La traza se marca ANTES de escribir la respuesta, mientras el span HTTP
    // sigue activo. Y la cabecera `x-trace-id` se aplica también aquí: un fallo
    // rechazado por un guard (401/403) no llega nunca al interceptor global, y
    // esa respuesta también debe poder rastrearse.
    this.markTrace(status, code, exception);
    applyTraceHeader(response);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Error no anticipado: log completo (con stack), respuesta genérica.
      this.logger.error(
        {
          err: exception,
          correlationId,
          path: request.url,
          method: request.method,
        },
        'Unhandled exception',
      );
      if (!this.isDeclaredDependencyUnavailable(exception)) {
        body.message = 'Error interno del servidor';
        body.code = ErrorCode.INTERNAL;
        body.details = undefined;
      }
    } else {
      this.logger.warn(
        {
          correlationId,
          code,
          path: request.url,
          method: request.method,
          status,
        },
        message,
      );
    }

    response.status(status).json(body);
  }

  /**
   * Única excepción 5xx cuyo cuerpo es deliberadamente público: la readiness
   * declara un código estable y detalles ya sanitizados. Un HttpException 503
   * genérico no entra aquí y continúa ocultándose como INTERNAL.
   */
  private isDeclaredDependencyUnavailable(exception: unknown): boolean {
    if (
      !(exception instanceof HttpException) ||
      exception.getStatus() !== Number(HttpStatus.SERVICE_UNAVAILABLE)
    ) {
      return false;
    }
    const response = exception.getResponse();
    return (
      typeof response === 'object' &&
      response !== null &&
      (response as Record<string, unknown>).code ===
        ErrorCode.DEPENDENCY_UNAVAILABLE
    );
  }

  /**
   * Aplica la política de errores sobre el span HTTP activo.
   *
   * Un 4xx **no** marca la traza como fallida: un 404 o un 409 de idempotencia
   * son respuestas correctas del sistema, y marcarlas como error dispararía la
   * tasa de error de Jaeger hasta volverla inútil para detectar incidentes
   * reales. Se registran como evento, con su código estable, para que sigan
   * siendo visibles en la traza.
   *
   * Los 5xx sí marcan el span y adjuntan la excepción. El filtro no crea ni
   * cierra spans: solo anota el que la instrumentación HTTP ya abrió.
   */
  private markTrace(
    status: HttpStatus,
    code: string,
    exception: unknown,
  ): void {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.tracing.setAttribute(APP_ATTR.ERROR_CODE, code);
      this.tracing.recordException(exception);
      return;
    }
    this.tracing.addEvent('http.business_error', {
      [APP_ATTR.ERROR_CODE]: code,
      'http.response.status_code': status,
    });
  }

  /** Traduce cualquier excepción a la tupla estable (status, code, message, details). */
  private normalize(exception: unknown): {
    /**
     * Valor de status mantenido por la instancia.
     */
    status: HttpStatus;
    /**
     * Valor de code mantenido por la instancia.
     */
    code: string;
    /**
     * Valor de message mantenido por la instancia.
     */
    message: string;
    /**
     * Valor de details mantenido por la instancia.
     */
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        return {
          status,
          code: (obj.code as string) ?? this.defaultCode(status),
          message: this.extractMessage(obj) ?? exception.message,
          details: obj.details ?? this.extractValidationDetails(obj),
        };
      }
      return { status, code: this.defaultCode(status), message: String(res) };
    }

    // Colisión de versión optimista de MikroORM: se mapea a 409 estable.
    if (this.isOptimisticLockError(exception)) {
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONCURRENCY_CONFLICT,
        message: 'El recurso fue modificado por otra operación; reintente',
      };
    }

    // Violación de restricción UNIQUE (p. ej. carrera entre dos flujos que
    // reutilizan el mismo valor único, como una clave de idempotencia): es un
    // conflicto de negocio esperado, no un fallo interno; nunca debe
    // devolverse como 500 opaco.
    if (exception instanceof UniqueConstraintViolationException) {
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONFLICT,
        message: 'El valor ya está en uso por otro registro',
      };
    }

    // Errores de los middlewares HTTP anteriores a Nest —`express.json()` y
    // `urlencoded()` con su límite de 1 MB, o un JSON mal formado—. No son
    // `HttpException`, así que sin este caso caían en el 500 genérico: un
    // cliente que subía un cuerpo de más recibía INTERNAL y no podía distinguir
    // su propio error de una caída del servidor. Traen el status HTTP correcto
    // en `status`/`statusCode`, que es lo que se aprovecha aquí.
    const httpish = this.asHttpishError(exception);
    if (httpish) {
      return {
        status: httpish,
        code: this.defaultCode(httpish),
        message: this.messageForHttpish(httpish),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL,
      message: 'Error interno del servidor',
    };
  }

  /**
   * Ejecuta la operación extract message.
   *
   * @param obj - Valor de obj requerido por la operación.
   * @returns Resultado de extract message conforme al contrato `string | undefined`.
   */
  private extractMessage(obj: Record<string, unknown>): string | undefined {
    if (typeof obj.message === 'string') return obj.message;
    if (Array.isArray(obj.message)) return 'Error de validación';
    return undefined;
  }

  /**
   * Rescata el status HTTP de un error de middleware que no es `HttpException`.
   *
   * `body-parser` marca los suyos con `status`/`statusCode` (413 cuando el
   * cuerpo excede el límite, 400 cuando el JSON está mal formado). Sólo se
   * aceptan códigos 4xx: un 5xx ajeno no debe suplantar al INTERNAL propio.
   *
   * @param exception - Error capturado por el filtro.
   * @returns El status 4xx del error, o `undefined` si no lo declara.
   */
  private asHttpishError(exception: unknown): HttpStatus | undefined {
    if (typeof exception !== 'object' || exception === null) return undefined;
    const candidate = exception as { status?: unknown; statusCode?: unknown };
    const raw =
      typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.statusCode === 'number'
          ? candidate.statusCode
          : undefined;
    if (raw === undefined || raw < 400 || raw >= 500) return undefined;
    return raw;
  }

  /** Mensaje estable para los errores de middleware, que traen texto interno. */
  private messageForHttpish(status: HttpStatus): string {
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return 'El cuerpo de la petición excede el tamaño máximo permitido';
    }
    if (status === HttpStatus.BAD_REQUEST) {
      return 'El cuerpo de la petición no es un JSON válido';
    }
    return 'La petición no pudo procesarse';
  }

  /** El ValidationPipe de Nest emite `message: string[]`; se preserva como detalle. */
  private extractValidationDetails(obj: Record<string, unknown>): unknown {
    return Array.isArray(obj.message) ? { violations: obj.message } : undefined;
  }

  /**
   * Ejecuta la operación default code.
   *
   * @param status - Valor de status requerido por la operación.
   * @returns Resultado de default code conforme al contrato `string`.
   */
  private defaultCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.PRECONDITION_FAILED;
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return ErrorCode.PAYLOAD_TOO_LARGE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.DEPENDENCY_UNAVAILABLE;
      default:
        return ErrorCode.INTERNAL;
    }
  }

  /**
   * Obtiene is optimistic lock error.
   *
   * @param exception - Valor de exception requerido por la operación.
   * @returns Resultado de is optimistic lock error conforme al contrato `boolean`.
   */
  private isOptimisticLockError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      exception.constructor?.name === 'OptimisticLockError'
    );
  }

  /**
   * Traduce una violación de integridad de PostgreSQL al 4xx que le corresponde.
   *
   * Solo se mapean los `SQLSTATE` cuya causa es el contenido de la petición:
   *   - `23503` clave foránea: referencia a algo que no existe → 422.
   *   - `23505` clave única: el recurso ya existe → 409.
   *   - `23502` NOT NULL y `22P02` sintaxis de entrada (p. ej. un valor que no
   *     pertenece a un enum) → 422.
   * El resto sigue cayendo a 500, que es donde deben quedar los fallos reales del
   * servidor. `details` lleva la columna y la tabla que Postgres reporta, para que
   * el cliente sepa qué corregir sin tener que pedir el log.
   *
   * @returns el mapeo, o `undefined` si la excepción no es una violación mapeable.
   */
  private integrityViolation(exception: unknown):
    | {
        /** Código HTTP resultante. */
        status: number;
        /** Código de error estable del contrato de la API. */
        code: string;
        /** Mensaje legible para el cliente. */
        message: string;
        /** Columna y tabla implicadas, cuando Postgres las informa. */
        details?: unknown;
      }
    | undefined {
    // El driver adjunta el SQLSTATE en `code`; MikroORM lo envuelve conservándolo.
    const causa = exception as {
      code?: unknown;
      column?: unknown;
      table?: unknown;
      constraint?: unknown;
      detail?: unknown;
    };
    const sqlstate = typeof causa?.code === 'string' ? causa.code : undefined;
    if (!sqlstate) {
      return undefined;
    }

    const details = {
      constraint: causa.constraint,
      table: causa.table,
      column: causa.column,
      detail: causa.detail,
    };

    switch (sqlstate) {
      case '23503':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: ErrorCode.VALIDATION_FAILED,
          message:
            'La petición referencia un recurso que no existe: ' +
            'verifique los identificadores enviados',
          details,
        };
      case '23505':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.CONFLICT,
          message: 'Ya existe un recurso con esa clave',
          details,
        };
      case '23502':
      case '22P02':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: ErrorCode.VALIDATION_FAILED,
          message:
            'La petición trae un valor ausente o inválido para el modelo',
          details,
        };
      default:
        return undefined;
    }
  }
}
