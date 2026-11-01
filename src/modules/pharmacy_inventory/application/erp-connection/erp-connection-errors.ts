import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { PharmacyInventoryErrorReason as Reason } from '../../pharmacy_inventory.error-reasons';

/** 422: el servidor no tiene la llave para cifrar la clave de la conexión. */
export function encryptionNotConfigured(): PreconditionFailedException {
  return new PreconditionFailedException(
    'Falta configurar el cifrado de conexiones en el servidor',
    { reason: Reason.PHARMACY_CONNECTION_ENCRYPTION_NOT_CONFIGURED },
    Reason.PHARMACY_CONNECTION_ENCRYPTION_NOT_CONFIGURED,
  );
}

/** 422: el tipo de sistema no tiene su fila de proveedor. */
export function systemNotAvailable(
  systemCode: string,
): PreconditionFailedException {
  return new PreconditionFailedException(
    'Ese tipo de sistema todavía no está disponible',
    { reason: Reason.PHARMACY_SYSTEM_NOT_AVAILABLE, systemCode },
    Reason.PHARMACY_SYSTEM_NOT_AVAILABLE,
  );
}

/** 422: conectar exige una clave y no hay ninguna guardada. */
export function keyRequired(): PreconditionFailedException {
  return new PreconditionFailedException(
    'Falta la clave de la conexión',
    { reason: Reason.PHARMACY_CONNECTION_KEY_REQUIRED },
    Reason.PHARMACY_CONNECTION_KEY_REQUIRED,
  );
}

/** 422: un código de sucursal para una sede que no es de la farmacia. */
export function siteNotInPharmacy(siteId: string): PreconditionFailedException {
  return new PreconditionFailedException(
    'Esa sucursal no es de esta farmacia',
    { reason: Reason.PHARMACY_CONNECTION_SITE_NOT_IN_PHARMACY, siteId },
    Reason.PHARMACY_CONNECTION_SITE_NOT_IN_PHARMACY,
  );
}

/** 404: no hay conexión guardada que probar. */
export function connectionNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'La farmacia no tiene una conexión guardada',
    { reason: Reason.PHARMACY_CONNECTION_NOT_FOUND },
    Reason.PHARMACY_CONNECTION_NOT_FOUND,
  );
}

/** 422: para conectar faltan el tipo de sistema, la dirección o el código de farmacia. */
export function connectionIncomplete(): PreconditionFailedException {
  return new PreconditionFailedException(
    'Para conectar hacen falta el tipo de sistema, la dirección y el código de la farmacia',
    { reason: Reason.PHARMACY_CONNECTION_INCOMPLETE },
    Reason.PHARMACY_CONNECTION_INCOMPLETE,
  );
}
