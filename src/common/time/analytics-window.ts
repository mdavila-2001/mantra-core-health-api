/**
 * Reglas puras de la consulta de analítica: ventana de tiempo acotada y
 * ensamblado de embudos con denominador explícito.
 *
 * Toda consulta tiene ventana. Sin límite, un "dame todo" sobre una tabla de
 * eventos es un escaneo completo disfrazado de lectura de consola.
 */

export const MAX_WINDOW_DAYS = 92;
/** Por hora sólo en ventanas cortas: 92 días por hora son 2 208 cubos. */
export const MAX_HOURLY_WINDOW_DAYS = 7;
export const DEFAULT_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

export type Interval = 'hour' | 'day';

export interface AnalyticsWindow {
  from: Date;
  to: Date;
  interval: Interval;
  /** Zona de los cubos. Los timestamps viajan en UTC; el portal los localiza. */
  timezone: 'UTC';
}

export class WindowError extends Error {
  constructor(
    readonly reason: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Resuelve la ventana pedida. `to` por defecto es ahora; `from` por defecto,
 * siete días antes de `to`.
 */
export function resolveWindow(
  input: { from?: string; to?: string; interval?: Interval },
  now: Date = new Date(),
): AnalyticsWindow {
  const to = input.to ? new Date(input.to) : now;
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new WindowError('INVALID_DATE', 'Fecha de ventana no válida');
  }
  if (from.getTime() >= to.getTime()) {
    throw new WindowError('EMPTY_WINDOW', '"from" debe ser anterior a "to"');
  }
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days > MAX_WINDOW_DAYS) {
    throw new WindowError(
      'WINDOW_TOO_LARGE',
      `La ventana máxima es de ${MAX_WINDOW_DAYS} días`,
    );
  }
  const interval = input.interval ?? (days <= 2 ? 'hour' : 'day');
  if (interval === 'hour' && days > MAX_HOURLY_WINDOW_DAYS) {
    throw new WindowError(
      'INTERVAL_TOO_FINE',
      `El intervalo por hora admite ventanas de hasta ${MAX_HOURLY_WINDOW_DAYS} días`,
    );
  }
  return { from, to, interval, timezone: 'UTC' };
}

export interface FunnelStepInput {
  stepNumber: number;
  eventName: string;
  /** Unidades que alcanzaron este paso respetando el orden. */
  reached: number;
}

export interface FunnelStepResult extends FunnelStepInput {
  /** Sobre el primer paso. null si nadie entró al embudo. */
  conversionFromStart: number | null;
  /** Sobre el paso anterior. null en el primero o si el anterior es 0. */
  conversionFromPrevious: number | null;
  droppedFromPrevious: number | null;
}

const ratio = (num: number, den: number) =>
  den === 0 ? null : Math.round((num / den) * 10_000) / 10_000;

/**
 * Convierte los conteos por paso en el informe. El denominador es siempre el
 * primer paso de la misma unidad (sesión): nunca se mezclan sesiones con
 * sujetos, y 0/0 es null, no 0% ni 100%.
 */
export function assembleFunnel(steps: readonly FunnelStepInput[]) {
  const ordered = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const entered = ordered[0]?.reached ?? 0;
  const results: FunnelStepResult[] = ordered.map((step, index) => {
    const previous = index === 0 ? null : ordered[index - 1].reached;
    return {
      ...step,
      conversionFromStart: ratio(step.reached, entered),
      conversionFromPrevious:
        previous === null ? null : ratio(step.reached, previous),
      droppedFromPrevious: previous === null ? null : previous - step.reached,
    };
  });
  const last = ordered[ordered.length - 1];
  return {
    unit: 'session' as const,
    denominator: entered,
    completed: last?.reached ?? 0,
    overallConversion: last ? ratio(last.reached, entered) : null,
    steps: results,
  };
}
