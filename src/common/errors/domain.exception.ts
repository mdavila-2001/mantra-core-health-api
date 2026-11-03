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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param status - Valor de status requerido por la operación.
   * @param code - Valor de code requerido por la operación.
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   * @param reason - Sub-código de negocio estable, propio del módulo que lanza
   *                 (ej. `ACCOUNTING_PERIOD_NOT_OPEN`). `code` dice el tipo HTTP
   *                 del error (uno de ~15 valores, compartido por todo el API);
   *                 `reason` dice **cuál** error de ese tipo fue, dentro del
   *                 catálogo del módulo (`<modulo>.error-reasons.ts`). Un cliente
   *                 puede ramificar sobre `reason` sin parsear `message`, que
   *                 sigue siendo sólo para humanos.
   */
  constructor(
    status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly reason?: string,
  ) {
    super({ code, message, details, reason }, status);
  }
}

/** Credencial/firma ausente o inválida (autenticación fallida). */
export class UnauthorizedException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   */
  constructor(
    message = 'No autenticado',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHENTICATED,
      message,
      details,
      reason,
    );
  }
}

/**
 * 403 por identidad sin verificar.
 *
 * Se distingue del 403 por rol insuficiente a propósito: el cliente tiene que
 * poder ofrecer el flujo de verificación en un caso y no en el otro, y hacerlo
 * comparando el texto del mensaje ata la interfaz a una redacción que este
 * contrato declara cambiable.
 */
export class IdentityVerificationRequiredException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Mensaje para la persona.
   * @param details - Contexto estructurado; `reason` separa los subcasos.
   */
  constructor(
    message = 'Se requiere una identidad verificada',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(
      HttpStatus.FORBIDDEN,
      ErrorCode.IDENTITY_VERIFICATION_REQUIRED,
      message,
      details,
      reason,
    );
  }
}

/** 403 por rol insuficiente: la identidad está verificada pero el rol no autoriza. */
export class InsufficientRoleException extends DomainException {
  constructor(
    message = 'El rol no tiene permiso para esta operación',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, message, details, reason);
  }
}

/** Recurso relacionado o principal inexistente. */
export class ResourceNotFoundException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   */
  constructor(
    message = 'Recurso no encontrado',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message, details, reason);
  }
}

/** Violación de unicidad o estado incompatible con la operación (duplicado). */
export class ConflictException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   */
  constructor(
    message = 'Conflicto de estado',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message, details, reason);
  }
}

/** Precondición de negocio no satisfecha (estado del agregado, consentimiento). */
export class PreconditionFailedException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   */
  constructor(
    message = 'Precondición no satisfecha',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.PRECONDITION_FAILED,
      message,
      details,
      reason,
    );
  }
}

/** Colisión de concurrencia optimista (`row_version`). */
export class ConcurrencyConflictException extends DomainException {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Valor de message requerido por la operación.
   * @param details - Valor de details requerido por la operación.
   */
  constructor(
    message = 'Conflicto de concurrencia',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(
      HttpStatus.CONFLICT,
      ErrorCode.CONCURRENCY_CONFLICT,
      message,
      details,
      reason,
    );
  }
}

/** Cuota o límite de negocio excedido (no es rate limiting de infraestructura). */
export class QuotaExceededException extends DomainException {
  constructor(
    message = 'Se superó el límite permitido para esta operación',
    details?: Record<string, unknown>,
    reason?: string,
  ) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.PRECONDITION_FAILED,
      message,
      details,
      reason,
    );
  }
}
