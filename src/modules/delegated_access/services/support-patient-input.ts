import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type { ProbeExceeded } from './support-patient-probe-counter';

/** Error de entrada: el mismo dato llegó con dos nombres y valores distintos. */
function conflict(field: string): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    `El campo «${field}» llegó con dos valores distintos.`,
    { field },
    Reason.SUPPORT_PATIENT_INPUT_CONFLICT,
  );
}

/**
 * La organización del cuerpo, venga como `tenantId` o como `org`. Los dos
 * nombres existen porque el contrato compartido y el front no coinciden; si
 * llegan los dos tienen que ser el mismo.
 *
 * @param dto - Cuerpo con `tenantId` y/o `org`.
 * @returns La organización.
 * @throws DomainException (400) si llegan distintas.
 */
export function resolveTenantId(dto: {
  tenantId?: string;
  org?: string;
}): string {
  if (dto.tenantId && dto.org && dto.tenantId !== dto.org) {
    throw conflict('tenantId');
  }
  return (dto.tenantId ?? dto.org) as string;
}

/**
 * El documento del cuerpo, venga como `nationalId` o como `document`.
 *
 * @param dto - Cuerpo con `nationalId` y/o `document`.
 * @returns El documento, si llegó.
 * @throws DomainException (400) si llegan distintos.
 */
export function resolveNationalId(dto: {
  nationalId?: string;
  document?: string;
}): string | undefined {
  if (
    dto.nationalId !== undefined &&
    dto.document !== undefined &&
    dto.nationalId.trim() !== dto.document.trim()
  ) {
    throw conflict('nationalId');
  }
  return dto.nationalId ?? dto.document;
}

/**
 * El 429 de un intento que superó el tope de consultas de pacientes.
 *
 * @param exceeded - Qué tope se superó (persona o IP, minuto o día).
 * @returns La excepción lista para lanzar.
 */
export function throttledException(
  exceeded: ProbeExceeded | undefined,
): DomainException {
  return new DomainException(
    HttpStatus.TOO_MANY_REQUESTS,
    ErrorCode.RATE_LIMITED,
    'Demasiadas consultas de pacientes: espere antes de volver a intentar',
    {
      limit: exceeded?.window === 'DAY' ? 'PER_DAY' : 'PER_MINUTE',
      scope: exceeded?.scope ?? 'PERSON',
    },
    Reason.SUPPORT_PATIENT_SEARCH_THROTTLED,
  );
}
