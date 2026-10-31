import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSettings, Practices } from '../../practice/entities';
import { DEFAULT_CREEP_THRESHOLD, REVIEW_DEFAULTS } from '../domain';

/** Clave de `practice.practice_settings` con los ajustes de gobierno (CONTRATO-GOBIERNO §7.2). */
export const GOVERNANCE_SETTINGS_KEY = 'support.governance';

/** Ajustes de gobierno que usan las campañas, los informes y los barridos. */
export interface GovernanceSweepSettings {
  /** Días sin `PERMIT` para considerar un permiso «sin uso» (D-04). */
  readonly unusedDays: number;
  /** Días sin actividad para sugerir suspender (D-04). */
  readonly inactivityDays: number;
  /** Días sin actividad para suspender sola; `null` = solo sugerir. */
  readonly autoSuspendInactiveDays: number | null;
  /** Cadencia de las campañas periódicas automáticas (6 o 12); `null` = solo manuales. */
  readonly reviewCadenceMonths: 6 | 12 | null;
  /** Umbral de deriva de privilegios (D-20). */
  readonly creepThreshold: number;
  /** Compuerta de ingreso encendida (D-03). */
  readonly onboardingRequired: boolean;
}

/** Valores por defecto: los de la recomendación de cada decisión del contrato (§12). */
export const DEFAULT_SWEEP_SETTINGS: GovernanceSweepSettings = {
  unusedDays: REVIEW_DEFAULTS.unusedDays,
  inactivityDays: 45,
  autoSuspendInactiveDays: null,
  reviewCadenceMonths: null,
  creepThreshold: DEFAULT_CREEP_THRESHOLD,
  onboardingRequired: true,
};

function intIn(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : fallback;
}

/**
 * Lee los ajustes `support.governance` tolerando lo ilegible: un valor ausente,
 * de otro tipo o fuera de rango deja el de siempre (nunca abre un control).
 *
 * @param value - `value_json` de la fila, tal como esté.
 * @returns Los ajustes completos.
 */
export function parseGovernanceSettings(
  value: unknown,
): GovernanceSweepSettings {
  const raw =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const d = DEFAULT_SWEEP_SETTINGS;
  const auto = raw.autoSuspendInactiveDays;
  const cadence = raw.reviewCadenceMonths;
  return {
    unusedDays: intIn(raw.unusedDays, 1, 365, d.unusedDays),
    inactivityDays: intIn(raw.inactivityDays, 7, 365, d.inactivityDays),
    autoSuspendInactiveDays:
      auto === null || auto === undefined
        ? null
        : intIn(auto, 14, 730, -1) === -1
          ? null
          : (auto as number),
    reviewCadenceMonths: cadence === 6 || cadence === 12 ? cadence : null,
    creepThreshold: intIn(raw.creepThreshold, 1, 200, d.creepThreshold),
    onboardingRequired:
      typeof raw.onboardingRequired === 'boolean'
        ? raw.onboardingRequired
        : d.onboardingRequired,
  };
}

/** Lector de los ajustes de gobierno de una organización (solo lectura). */
@Injectable()
export class GovernanceCampaignSettings {
  /**
   * Ajustes de la organización: el valor de `support.governance` de sus
   * prácticas (la primera que lo tenga) sobre los de siempre.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Los ajustes completos.
   */
  async read(
    em: EntityManager,
    tenantId: string,
  ): Promise<GovernanceSweepSettings> {
    const practices = await em.find(Practices, { tenantId });
    if (practices.length === 0) return DEFAULT_SWEEP_SETTINGS;
    const rows = await em.find(
      PracticeSettings,
      {
        practiceId: { $in: practices.map((p) => p.id) },
        settingKey: GOVERNANCE_SETTINGS_KEY,
      },
      { orderBy: { updatedAt: 'desc', id: 'asc' } },
    );
    return parseGovernanceSettings(rows[0]?.valueJson);
  }
}
