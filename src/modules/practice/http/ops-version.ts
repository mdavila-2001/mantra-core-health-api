import {
  HttpStatus,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import { OpsErrorReason } from '../practice-ops.error-reasons';

/**
 * 412: `If-Match-Ops` no coincide con la `ops_version` vigente del espacio.
 *
 * La versión operativa va separada de `row_version` (CONTRATO-F2-F5 §F2.1): la
 * limpieza y la enfermería no chocan con una edición de estructura.
 */
export class OpsVersionMismatchException extends DomainException {
  /**
   * @param currentOpsVersion - La versión vigente, para que el cliente recargue.
   */
  constructor(currentOpsVersion?: number) {
    super(
      HttpStatus.PRECONDITION_FAILED,
      ErrorCode.CONCURRENCY_CONFLICT,
      'Otra persona cambió el estado de este espacio; recargá y volvé a intentar',
      currentOpsVersion === undefined ? undefined : { currentOpsVersion },
      OpsErrorReason.OPS_VERSION_MISMATCH,
    );
  }
}

/** 428: la modificación operativa no trae `If-Match-Ops`. */
export class IfMatchOpsRequiredException extends DomainException {
  constructor() {
    super(
      HttpStatus.PRECONDITION_REQUIRED,
      ErrorCode.PRECONDITION_FAILED,
      'Falta la cabecera If-Match-Ops con la opsVersion vigente',
      undefined,
      OpsErrorReason.IF_MATCH_OPS_REQUIRED,
    );
  }
}

/**
 * Lee la `ops_version` de una cabecera `If-Match-Ops`. Acepta `3`, `"3"` y `W/"3"`.
 *
 * @param header - Valor de la cabecera, o `undefined` si no vino.
 * @returns La versión como entero.
 * @throws IfMatchOpsRequiredException si falta.
 * @throws DomainException (400) si no es numérica.
 */
export function parseIfMatchOps(header: string | string[] | undefined): number {
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw === undefined || raw.trim() === '')
    throw new IfMatchOpsRequiredException();
  const match = /^(?:W\/)?"?(\d{1,9})"?$/.exec(raw.trim());
  if (!match) {
    throw new DomainException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      'If-Match-Ops debe ser la opsVersion numérica del espacio',
      undefined,
      OpsErrorReason.IF_MATCH_OPS_REQUIRED,
    );
  }
  return Number(match[1]);
}

/**
 * Exige que la versión operativa esperada sea la vigente.
 *
 * @param current - `ops_version` del espacio cargado.
 * @param expected - La que mandó el cliente.
 * @throws OpsVersionMismatchException si difieren.
 */
export function assertOpsVersion(current: number, expected: number): void {
  if (current !== expected) throw new OpsVersionMismatchException(current);
}

/** `ops_version` esperada, de la cabecera `If-Match-Ops` (obligatoria). */
export const IfMatchOps = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number =>
    parseIfMatchOps(
      context.switchToHttp().getRequest<{
        headers: Record<string, string | string[] | undefined>;
      }>().headers['if-match-ops'],
    ),
);
