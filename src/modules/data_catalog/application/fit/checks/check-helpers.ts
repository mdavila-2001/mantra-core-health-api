import type {
  FitCheck,
  FitCheckOutcome,
  FitEvidence,
  FitFinding,
} from '../fit.types';

/** Resultado de «la fuente que esta comprobación necesita no estaba»: dice cuál y por qué. */
export function noSource(
  name: string,
  source: { readonly reason: string },
): FitCheckOutcome {
  return { kind: 'unavailable', reason: `${name}: ${source.reason}` };
}

/**
 * Mide un universo: cada ítem cumple o genera un hallazgo. Un universo vacío no es «todo en
 * regla»: el evaluador lo informa como `NO_APLICA`, sin porcentaje.
 */
export function measure<T>(
  universe: readonly T[],
  satisfied: (item: T) => boolean,
  finding: (item: T) => FitFinding,
  evidence?: FitEvidence,
  summary?: string,
): FitCheckOutcome {
  const findings: FitFinding[] = [];
  for (const item of universe)
    if (!satisfied(item)) findings.push(finding(item));
  return {
    kind: 'measured',
    covered: universe.length - findings.length,
    denominator: universe.length,
    findings,
    ...(evidence ? { evidence } : {}),
    ...(summary ? { summary } : {}),
  };
}

/** Define una comprobación sin repetir el tipo en cada archivo. */
export const defineCheck = (check: FitCheck): FitCheck => check;

export const answered = (valor: string | null | undefined): boolean =>
  typeof valor === 'string' && valor.trim().length > 0;

/** `a, b, c y N más`, para los detalles de un hallazgo agregado. */
export function sample(items: readonly string[], max = 5): string {
  const vistos = items.slice(0, max).join(', ');
  return items.length > max ? `${vistos} y ${items.length - max} más` : vistos;
}

export const isTable = (kind: string): boolean =>
  kind === 'TABLE' || kind === 'PARTITIONED_TABLE';
