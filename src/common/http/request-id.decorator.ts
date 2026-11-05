import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * El identificador de la petición (`req.id` de pino, o `x-request-id`): el
 * mismo `correlationId` que devuelven los errores. Los eventos de
 * infraestructura (A20, ADT) lo guardan para cruzar la fila con el log.
 */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ id?: unknown; headers?: Record<string, unknown> }>();
    const raw = request.id ?? request.headers?.['x-request-id'];
    const value: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
    if (typeof value === 'string' && value !== '') return value.slice(0, 100);
    if (typeof value === 'number' && Number.isFinite(value))
      return String(value);
    return undefined;
  },
);
