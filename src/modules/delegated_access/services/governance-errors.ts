import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import {
  DELEGATED_ACCESS_GOVERNANCE_STATUS,
  DelegatedAccessErrorReason as Reason,
} from '../delegated_access.error-reasons';

/** Código de error de la API por estado HTTP (el mismo que usan las excepciones tipadas). */
const CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = {
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.PRECONDITION_FAILED,
};

/**
 * Excepción de gobierno de accesos con el estado HTTP que le fija
 * `DELEGATED_ACCESS_GOVERNANCE_STATUS` (CONTRATO-GOBIERNO §8.4): una razón tiene
 * el mismo estado en todas las rutas. `reason` es estable para el cliente; el
 * mensaje va en español, de usted, y nunca lleva datos de pacientes.
 *
 * @param reason - Razón estable.
 * @param message - Mensaje para la persona.
 * @param details - Datos que el cliente necesita para actuar (identificadores, topes).
 * @returns La excepción lista para lanzar.
 */
export function governanceError(
  reason: Reason,
  message: string,
  details?: Record<string, unknown>,
): DomainException {
  const status =
    DELEGATED_ACCESS_GOVERNANCE_STATUS[reason] ??
    HttpStatus.UNPROCESSABLE_ENTITY;
  return new DomainException(
    status,
    CODE_BY_STATUS[status] ?? ErrorCode.PRECONDITION_FAILED,
    message,
    details,
    reason,
  );
}
