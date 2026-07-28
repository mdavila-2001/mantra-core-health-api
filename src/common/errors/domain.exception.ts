import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/**
 * Excepción de dominio con código estable. Extiende `HttpException` para que el
 * `AllExceptionsFilter` y el propio Nest la traten como error controlado (no 500),
 * pero adjunta un `ErrorCode` de negocio en el cuerpo, homogéneo entre dominios.
 *
 * Las subclases fijan el `HttpStatus` y el `ErrorCode`; los servicios lanzan la
 * subclase semántica en lugar de las excepciones genéricas de Nest para que el
 * contrato de error sea uniforme.
 */
export class DomainException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}

/** Credencial/firma ausente o inválida (autenticación fallida). */
export class UnauthorizedException extends DomainException {
  constructor(
    message = 'No autenticado',
    details?: Record<string, unknown>,
  ) {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHENTICATED,
      message,
      details,
    );
  }
}

/** Recurso relacionado o principal inexistente. */
export class ResourceNotFoundException extends DomainException {
  constructor(
    message = 'Recurso no encontrado',
    details?: Record<string, unknown>,
  ) {
    super(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message, details);
  }
}

/** Violación de unicidad o estado incompatible con la operación (duplicado). */
export class ConflictException extends DomainException {
  constructor(
    message = 'Conflicto de estado',
    details?: Record<string, unknown>,
  ) {
    super(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message, details);
  }
}

/** Precondición de negocio no satisfecha (estado del agregado, consentimiento). */
export class PreconditionFailedException extends DomainException {
  constructor(
    message = 'Precondición no satisfecha',
    details?: Record<string, unknown>,
  ) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.PRECONDITION_FAILED,
      message,
      details,
    );
  }
}

/** Colisión de concurrencia optimista (`row_version`). */
export class ConcurrencyConflictException extends DomainException {
  constructor(
    message = 'Conflicto de concurrencia',
    details?: Record<string, unknown>,
  ) {
    super(
      HttpStatus.CONFLICT,
      ErrorCode.CONCURRENCY_CONFLICT,
      message,
      details,
    );
  }
}
