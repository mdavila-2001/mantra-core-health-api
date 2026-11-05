import {
  resolveWindow,
  type AnalyticsWindow,
  type Interval,
} from '../../../common/time/analytics-window';

const DAY_MS = 86_400_000;

/**
 * Ventana de la consulta de tráfico.
 *
 * Reusa las reglas de la analítica de producto (`resolveWindow`: tope de 92 días,
 * por hora sólo hasta 7 días, ventana no vacía) pero con otro valor por defecto:
 * la pregunta de la portada es «¿qué pasó **hoy**?», no «¿y en la última
 * semana?». Sin `from`, la ventana arranca a las 00:00 UTC del día de `to`.
 *
 * Los cubos y los límites son UTC y la respuesta lo declara (`timezone`): el
 * portal localiza al mostrar. «Hoy» en hora de Bolivia queda como decisión del
 * cliente (ver ambigüedades del plan).
 *
 * @throws WindowError con la misma razón que la analítica (`INVALID_DATE`,
 * `EMPTY_WINDOW`, `WINDOW_TOO_LARGE`, `INTERVAL_TOO_FINE`).
 */
export function resolveTrafficWindow(
  input: { from?: string; to?: string; interval?: Interval },
  now: Date = new Date(),
): AnalyticsWindow {
  let from = input.from;
  if (from === undefined) {
    const to = input.to ? new Date(input.to) : now;
    if (!Number.isNaN(to.getTime())) {
      const startOfDay = Date.UTC(
        to.getUTCFullYear(),
        to.getUTCMonth(),
        to.getUTCDate(),
      );
      // `to` justo a medianoche: el día "de hoy" ya terminó, se mira el anterior.
      from = new Date(
        startOfDay < to.getTime() ? startOfDay : startOfDay - DAY_MS,
      ).toISOString();
    }
  }
  return resolveWindow({ from, to: input.to, interval: input.interval }, now);
}
