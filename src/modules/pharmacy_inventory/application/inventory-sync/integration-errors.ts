import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
} from '../../../../common';
import { PharmacyInventoryErrorReason } from '../../pharmacy_inventory.error-reasons';

/** 422: la API no sabe dónde está el sistema de la farmacia externa. */
export function integrationNotConfigured(): PreconditionFailedException {
  const reason =
    PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_NOT_CONFIGURED;
  return new PreconditionFailedException(
    'La conexión con el sistema de la farmacia no está configurada',
    { reason },
    reason,
  );
}

/** 502: el sistema de la farmacia externa no respondió o no se le entendió. */
export function integrationUnavailable(): DomainException {
  const reason = PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_UNAVAILABLE;
  return new DomainException(
    HttpStatus.BAD_GATEWAY,
    ErrorCode.DEPENDENCY_UNAVAILABLE,
    'No pudimos hablar con el sistema de la farmacia',
    { reason },
    reason,
  );
}

/** 422: la conexión no está activa o no admite consultar stock. */
export function integrationConnectionInactive(): PreconditionFailedException {
  const reason =
    PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_CONNECTION_INACTIVE;
  return new PreconditionFailedException(
    'La conexión no está activa o no permite consultar stock',
    { reason },
    reason,
  );
}

/** 422: el sistema de la farmacia está en una dirección que la plataforma no llama. */
export function integrationHostNotAllowed(): PreconditionFailedException {
  const reason =
    PharmacyInventoryErrorReason.PHARMACY_INTEGRATION_HOST_NOT_ALLOWED;
  return new PreconditionFailedException(
    'La dirección del sistema de la farmacia no está permitida',
    { reason },
    reason,
  );
}
