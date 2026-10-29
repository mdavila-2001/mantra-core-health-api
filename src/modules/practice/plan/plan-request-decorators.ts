import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { parseLayoutIfMatch } from './layout-if-match';

interface PlanRequest {
  params: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * `layoutVersion` esperado, de la cabecera `If-Match` de los guardados de
 * layout. Acepta el número o el `ETag` completo del layout del mismo lienzo.
 */
export const LayoutIfMatch = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<PlanRequest>();
    return parseLayoutIfMatch(request.headers['if-match'], request.params.id ?? '');
  },
);

/**
 * Motivo del soporte de plataforma, de `X-Support-Reason`. Sólo lo exige la
 * API a quien actúa como soporte (CONTRATO-PLANO §4, nota 4); al resto no le
 * afecta.
 */
export const SupportReason = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<PlanRequest>();
    const raw = request.headers['x-support-reason'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, 500) : undefined;
  },
);

/** `?dryRun=true` (cualquier otro valor, o su ausencia, es «no»). */
export function isDryRun(raw: string | undefined): boolean {
  return raw === 'true' || raw === '1';
}
