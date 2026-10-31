import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { MarketingErrorReason } from '../marketing.error-reasons';

/**
 * `If-Match` como número: acepta `3`, `"3"` y `W/"3"`. `null` si no vino;
 * `NaN` si vino pero no es una versión.
 */
export function parseIfMatch(header: string | undefined): number | null {
  const raw = header?.trim();
  if (!raw) return null;
  const match = /^(?:W\/)?"?(\d+)"?$/.exec(raw);
  return match ? Number(match[1]) : Number.NaN;
}

export function versionMismatch(
  expected: number | null,
  actual: number | null,
): DomainException {
  return new DomainException(
    HttpStatus.PRECONDITION_FAILED,
    ErrorCode.CONCURRENCY_CONFLICT,
    'El recurso cambió desde que se leyó; recargar y reintentar',
    {
      expected:
        expected !== null && Number.isNaN(expected) ? 'invalid' : expected,
      actual,
    },
    MarketingErrorReason.INSIGHTS_VERSION_MISMATCH,
  );
}

/**
 * Valida `If-Match` contra la versión actual de la fila.
 *
 * - La fila existe (`actual` es su versión): el cliente debe haber mandado esa
 *   versión; sin cabecera o con otra, 412.
 * - La fila no existe (`actual === null`): el alta no exige cabecera; si viene,
 *   solo vale `0` («todavía no hay nada»); cualquier otra versión es de un
 *   cliente que cree que algo existe, y recibe 412.
 */
export function assertVersion(
  expected: number | null,
  actual: number | null,
): void {
  if (actual === null) {
    if (expected === null || expected === 0) return;
    throw versionMismatch(expected, null);
  }
  if (expected !== actual) throw versionMismatch(expected, actual);
}

/** Falta `If-Match` donde es obligatorio siempre (reglas): 428. */
export function ifMatchRequired(): DomainException {
  return new DomainException(
    HttpStatus.PRECONDITION_REQUIRED,
    ErrorCode.CONCURRENCY_CONFLICT,
    'Falta la cabecera If-Match con la versión del recurso',
    undefined,
    MarketingErrorReason.INSIGHTS_IF_MATCH_REQUIRED,
  );
}
