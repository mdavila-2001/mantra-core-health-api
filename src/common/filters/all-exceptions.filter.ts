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
   */
  constructor(private readonly logger: PinoLogger) {
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
         * Identificador único de la instancia.
         */
        id?: string;
      }
    >();

    // pino-http asigna `req.id`; se reutiliza como correlationId para hilar el
    // error del cliente con la línea de log del servidor.
    const correlationId =
      (request.id as string | undefined) ??
      (request.headers['x-request-id'] as string | undefined);

    const { status, code, message, details } = this.normalize(exception);

    const body: ErrorResponseBody = {
      code,
      message,
      correlationId,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

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
      body.message = 'Error interno del servidor';
      body.code = ErrorCode.INTERNAL;
      body.details = undefined;
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

  /** Traduce cualquier excepción a la tupla estable (status, code, message, details). */
  private normalize(exception: unknown): {
    /**
     * Valor de status mantenido por la instancia.
     */
    status: number;
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
  private defaultCode(status: number): string {
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
}
