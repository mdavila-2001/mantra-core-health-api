import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCode } from './error-codes';
import type { SystemErrorReason } from './system-error-reasons';

/**
 * Fábricas de rechazos HTTP del núcleo con `code` **y** `reason` estables.
 *
 * Devuelven las clases de Nest (`BadRequestException`, `ForbiddenException`…)
 * y no `DomainException` a propósito: los guards, interceptores y pipes del
 * núcleo ya se prueban —y los consumidores ya los capturan— con
 * `instanceof <Nest>Exception`, así que cambiar la clase rompería ese
 * contrato sin ganar nada. Lo que sí cambia es el cuerpo: pasa de una cadena
 * suelta a `{ code, message, reason, details }`, que el filtro global
 * serializa tal cual (`reason` de primer nivel).
 *
 * El `message` es sólo para personas y nunca debe interpolar identificadores
 * ajenos ni datos del request; lo que el cliente necesita para ramificar es
 * `reason`.
 */

/** Cuerpo estable de un rechazo del núcleo. */
function body(
  code: ErrorCode,
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
) {
  return { code, message, reason, ...(details ? { details } : {}) };
}

/** 400 `VALIDATION_FAILED` con `reason` de sistema. */
export function badRequestWithReason(
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
): BadRequestException {
  return new BadRequestException(
    body(ErrorCode.VALIDATION_FAILED, message, reason, details),
  );
}

/** 403 `FORBIDDEN` con `reason` de sistema. */
export function forbiddenWithReason(
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
): ForbiddenException {
  return new ForbiddenException(
    body(ErrorCode.FORBIDDEN, message, reason, details),
  );
}

/** 401 `UNAUTHENTICATED` con `reason` de sistema. */
export function unauthorizedWithReason(
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
): UnauthorizedException {
  return new UnauthorizedException(
    body(ErrorCode.UNAUTHENTICATED, message, reason, details),
  );
}

/** 503 `DEPENDENCY_UNAVAILABLE` con `reason` de sistema. */
export function serviceUnavailableWithReason(
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
): ServiceUnavailableException {
  return new ServiceUnavailableException(
    body(ErrorCode.DEPENDENCY_UNAVAILABLE, message, reason, details),
  );
}

/**
 * 500 `INTERNAL` con `reason` de sistema.
 *
 * Es para errores de programación del núcleo, no para condiciones del request:
 * el filtro global no expone el cuerpo de un 500 salvo los `reason` de su lista
 * cerrada, así que el `reason` sirve al log y a soporte, no al cliente.
 */
export function internalWithReason(
  message: string,
  reason: SystemErrorReason,
  details?: Record<string, unknown>,
): InternalServerErrorException {
  return new InternalServerErrorException(
    body(ErrorCode.INTERNAL, message, reason, details),
  );
}
