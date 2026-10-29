import { DomainException } from '../../../common/errors/domain.exception';
import { ErrorCode } from '../../../common/errors/error-codes';
import { PharmacyInventoryErrorReason } from '../pharmacy_inventory.error-reasons';

/**
 * 412: el `If-Match` no coincide con la `rowVersion` vigente de la ubicación.
 *
 * `DomainException` y no `PreconditionFailedException` a propósito: la de la casa
 * responde 422 y el contrato de concurrencia de la estructura pide 412 (RFC 9110).
 * Lleva el mismo `reason` (`ROW_VERSION_MISMATCH`) que el resto de la estructura
 * física: el cliente ramifica igual sea una sala o una ubicación de stock.
 */
export class RowVersionMismatchException extends DomainException {
  /**
   * @param currentRowVersion - La versión vigente, para que el cliente recargue.
   */
  constructor(currentRowVersion?: number) {
    super(
      412,
      ErrorCode.CONCURRENCY_CONFLICT,
      'Otra persona cambió este recurso; recargá y volvé a intentar',
      currentRowVersion === undefined ? undefined : { currentRowVersion },
      PharmacyInventoryErrorReason.ROW_VERSION_MISMATCH,
    );
  }
}

/** 428: la modificación no trae `If-Match` (RFC 6585). */
export class IfMatchRequiredException extends DomainException {
  constructor() {
    super(
      428,
      ErrorCode.PRECONDITION_FAILED,
      'Falta la cabecera If-Match con la rowVersion vigente',
      undefined,
      PharmacyInventoryErrorReason.IF_MATCH_REQUIRED,
    );
  }
}

/**
 * Lee la `rowVersion` de una cabecera `If-Match`.
 *
 * Acepta `3`, `"3"` y `W/"3"` (ETag débil). Cualquier otra cosa es un 400: un
 * `If-Match: *` no sirve acá, porque no dice contra qué versión se edita.
 *
 * @param header - Valor de la cabecera, o `undefined` si no vino.
 * @returns La versión como entero.
 * @throws IfMatchRequiredException si la cabecera falta.
 * @throws DomainException (400) si no es una versión numérica.
 */
export function parseIfMatch(header: string | string[] | undefined): number {
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw === undefined || raw.trim() === '')
    throw new IfMatchRequiredException();
  const match = /^(?:W\/)?"?(\d{1,9})"?$/.exec(raw.trim());
  if (!match) {
    throw new DomainException(
      400,
      ErrorCode.VALIDATION_FAILED,
      'If-Match debe ser la rowVersion numérica del recurso',
      undefined,
      PharmacyInventoryErrorReason.IF_MATCH_REQUIRED,
    );
  }
  return Number(match[1]);
}
