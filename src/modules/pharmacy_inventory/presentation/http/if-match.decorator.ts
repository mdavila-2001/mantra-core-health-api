import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { parseIfMatch } from '../../domain/row-version';

/**
 * `rowVersion` esperada, de la cabecera `If-Match` (obligatoria).
 *
 * Falla con 428 si falta y con 400 si no es numérica; el 412 por desajuste lo
 * decide el caso de uso contra la fila cargada.
 */
export const IfMatch = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number =>
    parseIfMatch(
      context.switchToHttp().getRequest<{
        headers: Record<string, string | string[] | undefined>;
      }>().headers['if-match'],
    ),
);
