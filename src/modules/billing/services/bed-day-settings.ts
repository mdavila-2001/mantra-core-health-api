import type { EntityManager } from '@mikro-orm/postgresql';

/** Ajustes `billing.*` del devengo de día-cama (por práctica, en `practice.practice_settings`). */
export interface BedDaySettings {
  /** `billing.bed_day_min_one`: una estancia sin medianoche cobra un día mínimo. */
  readonly minimumOneDay: boolean;
  /** `billing.bed_day_lookback_days`: cuántos días hacia atrás revisa el devengo programado. */
  readonly lookbackDays: number;
}

/**
 * Valores por omisión cuando la práctica no configuró el ajuste: el día mínimo
 * está activo (lo dice el contrato) y se revisan los últimos 7 días, igual que el
 * cierre programado del censo.
 */
export const DEFAULT_BED_DAY_SETTINGS: BedDaySettings = {
  minimumOneDay: true,
  lookbackDays: 7,
};

/** Tope del retroceso: el devengo programado no revisa más de un mes. */
export const MAX_LOOKBACK_DAYS = 31;

/**
 * Lee los ajustes de día-cama de una práctica (nunca constantes en el código de negocio).
 *
 * @param tx - Transacción o contexto de persistencia.
 * @param practiceId - Práctica.
 */
export async function readBedDaySettings(
  tx: EntityManager,
  practiceId: string,
): Promise<BedDaySettings> {
  const rows = await tx.execute<{ setting_key: string; value_json: unknown }[]>(
    `select setting_key, value_json from practice.practice_settings
      where practice_id = ? and setting_key like 'billing.%'`,
    [practiceId],
  );
  const byKey = new Map(rows.map((row) => [row.setting_key, row.value_json]));
  const minOne = byKey.get('billing.bed_day_min_one');
  const lookback = byKey.get('billing.bed_day_lookback_days');
  return {
    minimumOneDay:
      typeof minOne === 'boolean'
        ? minOne
        : DEFAULT_BED_DAY_SETTINGS.minimumOneDay,
    lookbackDays:
      typeof lookback === 'number' &&
      Number.isInteger(lookback) &&
      lookback >= 1
        ? Math.min(lookback, MAX_LOOKBACK_DAYS)
        : DEFAULT_BED_DAY_SETTINGS.lookbackDays,
  };
}
