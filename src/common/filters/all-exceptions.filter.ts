import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';
import { ErrorCode } from '../errors/error-codes';

/** Forma estable del cuerpo de error que ve el cliente. */
interface ErrorResponseBody {
  code: string;
  message: string;
  correlationId?: string;
  details?: unknown;
  timestamp: string;
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
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

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
        { err: exception, correlationId, path: request.url, method: request.method },
        'Unhandled exception',
      );
      body.message = 'Error interno del servidor';
      body.code = ErrorCode.INTERNAL;
      body.details = undefined;
    } else {
      this.logger.warn(
        { correlationId, code, path: request.url, method: request.method, status },
        message,
      );
    }

    response.status(status).json(body);
  }

  /** Traduce cualquier excepción a la tupla estable (status, code, message, details). */
  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
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

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL,
      message: 'Error interno del servidor',
    };
  }

  private extractMessage(obj: Record<string, unknown>): string | undefined {
    if (typeof obj.message === 'string') return obj.message;
    if (Array.isArray(obj.message)) return 'Error de validación';
    return undefined;
  }

  /** El ValidationPipe de Nest emite `message: string[]`; se preserva como detalle. */
  private extractValidationDetails(obj: Record<string, unknown>): unknown {
    return Array.isArray(obj.message) ? { violations: obj.message } : undefined;
  }

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

  private isOptimisticLockError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      exception.constructor?.name === 'OptimisticLockError'
    );
  }
}
