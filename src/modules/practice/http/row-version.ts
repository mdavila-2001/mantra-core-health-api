import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';

/**
 * 412: el `If-Match` no coincide con la `rowVersion` vigente (INV-15).
 *
 * `DomainException` y no `PreconditionFailedException` a propósito: la de la casa
 * responde 422 y el contrato de concurrencia de la estructura pide 412 (RFC 9110).
 */
export class RowVersionMismatchException extends DomainException {
  /**
   * @param currentRowVersion - La versión vigente, para que el cliente recargue.
   */
  constructor(currentRowVersion?: number) {
    super(
      HttpStatus.PRECONDITION_FAILED,
      ErrorCode.CONCURRENCY_CONFLICT,
      'Otra persona cambió este recurso; recargá y volvé a intentar',
      currentRowVersion === undefined ? undefined : { currentRowVersion },
      PracticeErrorReason.ROW_VERSION_MISMATCH,
    );
  }
}

/** 428: la modificación no trae `If-Match` (RFC 6585). */
export class IfMatchRequiredException extends DomainException {
  constructor() {
    super(
      HttpStatus.PRECONDITION_REQUIRED,
      ErrorCode.PRECONDITION_FAILED,
      'Falta la cabecera If-Match con la rowVersion vigente',
      undefined,
      PracticeErrorReason.IF_MATCH_REQUIRED,
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
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      'If-Match debe ser la rowVersion numérica del recurso',
      undefined,
      PracticeErrorReason.IF_MATCH_REQUIRED,
    );
  }
  return Number(match[1]);
}

/**
 * Exige que la versión esperada sea la vigente.
 *
 * @param current - `rowVersion` del recurso cargado.
 * @param expected - Versión que mandó el cliente en `If-Match`.
 * @throws RowVersionMismatchException si difieren.
 */
export function assertRowVersion(current: number, expected: number): void {
  if (current !== expected) throw new RowVersionMismatchException(current);
}

/**
 * Ejecuta una escritura traduciendo el choque de versión optimista de MikroORM
 * (otra transacción modificó la fila entre la lectura y el `flush`) al mismo 412.
 *
 * @param write - El `flush` o bloque que escribe.
 * @returns El resultado de `write`.
 */
export async function withVersionConflict<T>(
  write: () => Promise<T>,
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    // Por nombre y no por `instanceof`: es el criterio del filtro global y no
    // depende de que el ORM exporte la clase con la misma identidad.
    if (
      error instanceof Error &&
      error.constructor?.name === 'OptimisticLockError'
    ) {
      throw new RowVersionMismatchException();
    }
    throw error;
  }
}
