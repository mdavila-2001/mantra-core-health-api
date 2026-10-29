import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DEFAULT_AGE_THRESHOLDS,
  type AgeThresholds,
} from '../domain/bed-compatibility-rules';

/** Ajustes `infra.*` que usa la internación (por establecimiento, en `practice_settings`). */
export interface AdtSettings {
  /** `infra.adt_cancel_window_minutes`: ventana para cancelar un traslado. */
  readonly cancelWindowMinutes: number;
  /** `infra.census_close_grace_minutes`: margen tras el corte para cerrar el censo. */
  readonly censusCloseGraceMinutes: number;
  /** `infra.census_close_lookback_days`: cuántos días hacia atrás recorre el cierre programado. */
  readonly censusCloseLookbackDays: number;
  /** `infra.swap_requires_cleaning`: el intercambio deja las camas sucias. */
  readonly swapRequiresCleaning: boolean;
  /** `infra.inspection_required`: una cama limpia necesita inspección para asignarse. */
  readonly inspectionRequired: boolean;
  /** `infra.hvac_validation_max_days`: vigencia de la validación HVAC de un AIIR. */
  readonly hvacValidationMaxDays: number;
  /** `infra.age_group_thresholds`. */
  readonly ageThresholds: AgeThresholds;
}

/**
 * Valores por omisión cuando el establecimiento no configuró el ajuste. Los
 * umbrales etarios y la ventana de 120 minutos son los del contrato (F3.2 y
 * F3.3); el resto son supuestos anotados en el reporte de la franja.
 */
export const DEFAULT_ADT_SETTINGS: AdtSettings = {
  cancelWindowMinutes: 120,
  censusCloseGraceMinutes: 5,
  censusCloseLookbackDays: 7,
  swapRequiresCleaning: false,
  inspectionRequired: false,
  hvacValidationMaxDays: 365,
  ageThresholds: DEFAULT_AGE_THRESHOLDS,
};

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

/** Lee los ajustes `infra.*` de la práctica de una sede, nunca constantes en el código de negocio. */
@Injectable()
export class AdtSettingsService {
  /**
   * Ajustes de la práctica dueña de la sede.
   *
   * @param tx - Transacción o contexto de persistencia.
   * @param practiceId - Práctica de la sede.
   */
  async forPractice(
    tx: EntityManager,
    practiceId: string,
  ): Promise<AdtSettings> {
    const rows = await tx.execute<
      { setting_key: string; value_json: unknown }[]
    >(
      `select setting_key, value_json from practice.practice_settings
        where practice_id = ? and setting_key like 'infra.%'`,
      [practiceId],
    );
    const byKey = new Map(rows.map((row) => [row.setting_key, row.value_json]));
    const thresholds = byKey.get('infra.age_group_thresholds') as
      Partial<AgeThresholds> | undefined;
    const d = DEFAULT_ADT_SETTINGS;
    return {
      cancelWindowMinutes: asNumber(
        byKey.get('infra.adt_cancel_window_minutes'),
        d.cancelWindowMinutes,
      ),
      censusCloseGraceMinutes: asNumber(
        byKey.get('infra.census_close_grace_minutes'),
        d.censusCloseGraceMinutes,
      ),
      censusCloseLookbackDays: asNumber(
        byKey.get('infra.census_close_lookback_days'),
        d.censusCloseLookbackDays,
      ),
      swapRequiresCleaning: asBoolean(
        byKey.get('infra.swap_requires_cleaning'),
        d.swapRequiresCleaning,
      ),
      inspectionRequired: asBoolean(
        byKey.get('infra.inspection_required'),
        d.inspectionRequired,
      ),
      hvacValidationMaxDays: asNumber(
        byKey.get('infra.hvac_validation_max_days'),
        d.hvacValidationMaxDays,
      ),
      ageThresholds: {
        pediatricMaxYears: asNumber(
          thresholds?.pediatricMaxYears,
          d.ageThresholds.pediatricMaxYears,
        ),
        neonatalMaxDays: asNumber(
          thresholds?.neonatalMaxDays,
          d.ageThresholds.neonatalMaxDays,
        ),
      },
    };
  }
}
