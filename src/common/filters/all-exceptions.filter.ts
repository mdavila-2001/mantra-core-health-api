import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  CheckConstraintViolationException,
  ConnectionException,
  DeadlockException,
  ForeignKeyConstraintViolationException,
  NotNullConstraintViolationException,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import type { Request, Response } from 'express';
import { ErrorCode } from '../errors/error-codes';
import {
  APP_ATTR,
  TracingService,
  applyTraceHeader,
} from '../../observability';

/**
 * Códigos 5xx cuyo cuerpo **sí** se le devuelve al cliente tal cual.
 *
 * La regla general para los 5xx es ocultarlo todo: son fallos no anticipados y
 * su mensaje puede llevar SQL, rutas o nombres de host. Estos cuatro son la
 * excepción porque no son "algo se rompió" sino estados operativos que el
 * filtro ha reconocido y cuyo texto está escrito para ser leído por un cliente:
 * dependencia caída, plazo agotado, cortacircuitos abierto y mamparo saturado.
 *
 * La diferencia es práctica, no estética. Los cuatro significan "reintenta", y
 * un `INTERNAL` opaco significa lo contrario: sin distinguirlos, un cliente
 * bien programado deja de reintentar justo cuando reintentar era la respuesta
 * correcta.
 */
const EXPOSABLE_5XX_CODES: ReadonlySet<string> = new Set<string>([
  ErrorCode.DEPENDENCY_UNAVAILABLE,
  ErrorCode.TIMEOUT,
  ErrorCode.CIRCUIT_OPEN,
  ErrorCode.CONCURRENCY_LIMIT,
]);

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

    const { status, code, message, details, internals } =
      this.normalize(exception);

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
      if (!EXPOSABLE_5XX_CODES.has(code)) {
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
          // Restricción, tabla y columna del error del driver. Van al log y NO
          // a la respuesta: el nombre de una FK y el valor de la clave que la
          // violó describen el esquema y los datos, y el cliente no ramifica
          // sobre ellos —para eso está `code`—. Con el `correlationId` de la
          // respuesta, soporte llega igual a esta línea.
          ...(internals ? { integrity: internals } : {}),
        },
        message,
      );
    }

    response.status(status).json(body);
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
    /**
     * Contexto interno del error del driver (restricción, tabla, columna).
     * Se registra en el log y **nunca** viaja en la respuesta.
     */
    internals?: unknown;
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
        internals: this.constraintInternals(exception),
      };
    }

    // El resto de excepciones tipadas del driver que MikroORM ya distingue.
    // Sin este bloque, un interbloqueo de PostgreSQL —que se resuelve solo
    // reintentando— y una clave foránea inexistente —que no se resuelve
    // reintentando nunca— llegaban al cliente como el mismo 500 opaco, y no
    // había forma de que supiera cuál de las dos cosas le había pasado.
    const driverFailure = this.driverException(exception);
    if (driverFailure) {
      return driverFailure;
    }

    // Errores del driver que no pasaron por el mapeo de MikroORM: los produce
    // el SQL crudo (`em.getConnection().execute(...)`), que el ORM no envuelve.
    // Se clasifican por SQLSTATE, recorriendo la cadena de causas.
    const integrity = this.integrityViolation(exception);
    if (integrity) {
      return integrity;
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
      case HttpStatus.GATEWAY_TIMEOUT:
      case HttpStatus.REQUEST_TIMEOUT:
        return ErrorCode.TIMEOUT;
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
   * Mapeo de las excepciones **tipadas** que MikroORM ya distingue por driver.
   *
   * Es el camino preferente sobre el SQLSTATE crudo porque no depende de que el
   * ORM conserve el código del driver al envolver el error, cosa que no está
   * garantizada entre versiones.
   *
   * La distinción que más importa es la del interbloqueo: `40P01`/`40001` son
   * fallos **transitorios**, la operación es válida y volver a intentarla
   * funciona. Devolverlos como 500 —lo que pasaba hasta ahora— le decía al
   * cliente exactamente lo contrario de lo que debía hacer.
   */
  private driverException(exception: unknown):
    | {
        status: HttpStatus;
        code: string;
        message: string;
        internals?: unknown;
      }
    | undefined {
    // 422 con `VALIDATION_FAILED` mezclaba dos situaciones bajo un mismo código
    // que el contrato publica como 400; se mantiene el mismo mapeo que la ruta
    // por SQLSTATE para que el cliente reciba lo mismo venga por donde venga.
    if (exception instanceof ForeignKeyConstraintViolationException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: ErrorCode.PRECONDITION_FAILED,
        message:
          'La petición referencia un recurso que no existe: ' +
          'verifique los identificadores enviados',
        internals: this.constraintInternals(exception),
      };
    }

    if (
      exception instanceof NotNullConstraintViolationException ||
      exception instanceof CheckConstraintViolationException
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_FAILED,
        message: 'La petición trae un valor ausente o inválido para el modelo',
        internals: this.constraintInternals(exception),
      };
    }

    // Interbloqueo: dos transacciones se esperan mutuamente y PostgreSQL aborta
    // una. No es culpa de la petición ni un fallo del servidor: es contención,
    // y se resuelve reintentando. Comparte código con la colisión optimista
    // porque para el cliente la acción es idéntica.
    if (exception instanceof DeadlockException) {
      return {
        status: HttpStatus.CONFLICT,
        code: ErrorCode.CONCURRENCY_CONFLICT,
        message:
          'La operación entró en conflicto con otra concurrente; reintente',
      };
    }

    // La base no está accesible. Un 503 con `DEPENDENCY_UNAVAILABLE` le dice al
    // cliente —y al balanceador— que reintente; un 500 le dice que la petición
    // es irrecuperable, que es falso y además impide el failover.
    if (exception instanceof ConnectionException) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message:
          'La base de datos no está disponible; reintente en unos segundos',
      };
    }

    return undefined;
  }

  /**
   * Traduce una violación de PostgreSQL al estado que le corresponde, a partir
   * del `SQLSTATE` crudo.
   *
   * Complementa a `driverException` para los errores que **no** pasan por el
   * mapeo de MikroORM: el SQL crudo (`em.getConnection().execute(...)`), que el
   * ORM entrega sin envolver. Antes de esta versión el método existía pero
   * `normalize` nunca lo llamaba, así que todos ellos —incluida una clave
   * foránea inexistente, que es un error del cliente— terminaban como
   * `500 INTERNAL`.
   *
   * Se recorre la cadena de causas porque el driver anida el error original
   * bajo `cause` cuando lo reenvuelve.
   *
   * @returns el mapeo, o `undefined` si el SQLSTATE no es uno de los tratados.
   */
  private integrityViolation(exception: unknown):
    | {
        /** Código HTTP resultante. */
        status: number;
        /** Código de error estable del contrato de la API. */
        code: string;
        /** Mensaje legible para el cliente. */
        message: string;
        /** Restricción, tabla y columna implicadas: sólo para el log. */
        internals?: unknown;
      }
    | undefined {
    const causa = this.findSqlState(exception);
    if (!causa) {
      return undefined;
    }

    const internals = {
      constraint: causa.constraint,
      table: causa.table,
      column: causa.column,
      detail: causa.detail,
    };

    switch (causa.sqlstate) {
      // Clave foránea inexistente. Es 422 y por tanto **no** puede llevar
      // `VALIDATION_FAILED`, que el contrato publica como 400: un cliente que
      // ramifique por `code` para decidir si reintenta con otro cuerpo recibía
      // el mismo código para dos situaciones distintas.
      case '23503':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: ErrorCode.PRECONDITION_FAILED,
          message:
            'La petición referencia un recurso que no existe: ' +
            'verifique los identificadores enviados',
          internals,
        };
      case '23505':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.CONFLICT,
          message: 'Ya existe un recurso con esa clave',
          internals,
        };
      // Valor ausente, fuera de restricción o con sintaxis inválida: es un
      // defecto de forma del cuerpo, así que 400 + `VALIDATION_FAILED`, igual
      // que cuando lo detecta el `ValidationPipe`. Antes salía 422 con ese
      // mismo código, que el contrato reserva para 400.
      case '23502':
      case '23514':
      case '22P02':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_FAILED,
          message:
            'La petición trae un valor ausente o inválido para el modelo',
          internals,
        };
      // Contención: la operación es válida y reintentarla funciona.
      // `40001` fallo de serialización, `40P01` interbloqueo,
      // `55P03` fila bloqueada por otra transacción.
      case '40001':
      case '40P01':
      case '55P03':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.CONCURRENCY_CONFLICT,
          message:
            'La operación entró en conflicto con otra concurrente; reintente',
        };
      // `57014` consulta cancelada por `statement_timeout`. Es un plazo
      // agotado, no un error de la petición ni un fallo del servidor: el
      // cliente puede reintentar, idealmente acotando más la consulta.
      case '57014':
        return {
          status: HttpStatus.GATEWAY_TIMEOUT,
          code: ErrorCode.TIMEOUT,
          message: 'La consulta excedió el tiempo máximo de ejecución',
        };
      // `53300` sin conexiones libres, `53200` sin memoria, `57P03` arrancando.
      // La base está viva pero saturada: 503 y reintento, nunca 500.
      case '53300':
      case '53200':
      case '57P03':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          code: ErrorCode.DEPENDENCY_UNAVAILABLE,
          message:
            'La base de datos no admite más trabajo ahora mismo; reintente',
        };
      default:
        return undefined;
    }
  }

  /**
   * Busca el primer `SQLSTATE` de la cadena de causas.
   *
   * El límite de profundidad no es paranoia gratuita: una cadena de causas
   * cíclica —que un `cause` mal construido puede producir— colgaría el hilo
   * dentro del filtro de errores, es decir, en el único sitio del que ya no se
   * puede informar de nada.
   */
  private findSqlState(exception: unknown):
    | {
        sqlstate: string;
        constraint?: unknown;
        table?: unknown;
        column?: unknown;
        detail?: unknown;
      }
    | undefined {
    let current: unknown = exception;

    for (let depth = 0; depth < 5 && current; depth += 1) {
      const candidate = current as {
        code?: unknown;
        constraint?: unknown;
        table?: unknown;
        column?: unknown;
        detail?: unknown;
        cause?: unknown;
      };

      // Un SQLSTATE de PostgreSQL son exactamente 5 caracteres alfanuméricos.
      // Comprobarlo evita confundirlo con los códigos de error de Node
      // (`ECONNRESET`), que viajan en el mismo campo `code`.
      if (
        typeof candidate.code === 'string' &&
        /^[0-9A-Z]{5}$/.test(candidate.code)
      ) {
        return {
          sqlstate: candidate.code,
          constraint: candidate.constraint,
          table: candidate.table,
          column: candidate.column,
          detail: candidate.detail,
        };
      }

      current = candidate.cause;
    }

    return undefined;
  }

  /**
   * Columna, tabla y restricción que reporta el driver, si las trae.
   *
   * Va al log, nunca a la respuesta: el `detail` de PostgreSQL incluye el valor
   * de la clave que falló, y el nombre de la restricción describe el esquema.
   */
  private constraintInternals(exception: unknown): unknown {
    const found = this.findSqlState(exception);
    if (!found) return undefined;
    return {
      constraint: found.constraint,
      table: found.table,
      column: found.column,
      detail: found.detail,
    };
  }
}
