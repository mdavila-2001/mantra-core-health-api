import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Suma `requestId` al cuerpo de las respuestas de mutación (además de la
 * cabecera `X-Request-Id` que pone pino): la web lo muestra en el estado S9 y
 * lo cita al reportar un problema (CONTRATO-F2-F5 §0, F2/F3). Sólo toca
 * cuerpos que son objetos; un `requestId` que el caso de uso ya puso no se
 * pisa.
 */
@Injectable()
export class RequestIdBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      id?: unknown;
      headers?: Record<string, unknown>;
    }>();
    if (!MUTATIONS.has((req.method ?? '').toUpperCase())) return next.handle();
    const raw = req.id ?? req.headers?.['x-request-id'];
    const value: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
    const requestId =
      typeof value === 'string' && value !== ''
        ? value.slice(0, 100)
        : typeof value === 'number' && Number.isFinite(value)
          ? String(value)
          : undefined;
    return next
      .handle()
      .pipe(
        map((body: unknown) =>
          requestId &&
          body !== null &&
          typeof body === 'object' &&
          !Array.isArray(body) &&
          !('requestId' in (body as Record<string, unknown>))
            ? { ...(body as Record<string, unknown>), requestId }
            : body,
        ),
      );
  }
}
