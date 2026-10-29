import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { parseIfMatch } from './row-version';

/** Lo mínimo que estos decoradores leen de la petición. */
interface RequestWithId {
  /** Id que asigna pino-http: número por defecto, texto si el cliente mandó `x-request-id`. */
  id?: string | number;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * `rowVersion` esperada, de la cabecera `If-Match` (obligatoria).
 *
 * Falla con 428 si falta y con 400 si no es numérica; el 412 por desajuste lo
 * decide el servicio contra la fila cargada.
 */
export const IfMatch = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number =>
    parseIfMatch(
      context.switchToHttp().getRequest<RequestWithId>().headers['if-match'],
    ),
);

/**
 * Id de correlación de la petición (el mismo que sale como `correlationId` en
 * los errores). Va en los eventos de outbox para hilar la mutación con su log.
 */
export const CorrelationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const raw = request.id ?? request.headers['x-request-id'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value === undefined ? undefined : String(value);
  },
);
