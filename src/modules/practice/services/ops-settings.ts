import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Claves `infra.*` de `practice.practice_settings` que lee la operación de espacios
 * (CONTRATO-F2-F5 §0.2: la configuración por establecimiento es dato, no constante).
 */
export const INFRA_SETTING_KEYS = {
  /** Una cama limpia no es asignable hasta que la inspecciona un supervisor. */
  inspectionRequired: 'infra.inspection_required',
  /** Días de vigencia de la validación HVAC de un local de aislamiento aéreo. */
  hvacValidationMaxDays: 'infra.hvac_validation_max_days',
  /** Renovaciones de aire por hora mínimas de un local de aislamiento aéreo (opcional). */
  aiirMinAirChanges: 'infra.aiir_min_air_changes',
  /** Plazo de la orden de limpieza en minutos por prioridad (opcional). */
  cleaningDueMinutes: 'infra.cleaning_due_minutes',
} as const;

/** Configuración resuelta de un establecimiento. */
export interface InfraSettings {
  readonly inspectionRequired: boolean;
  readonly hvacValidationMaxDays: number;
  /** `null`: no se exige un mínimo de renovaciones de aire. */
  readonly aiirMinAirChanges: number | null;
  /** `CLN_PRIO_*` → minutos; vacío: las órdenes no llevan plazo. */
  readonly cleaningDueMinutes: Readonly<Record<string, number>>;
}

/**
 * Valores cuando el establecimiento no configuró la clave.
 *
 * `inspectionRequired = true` sigue a `procesos/04` («exigir inspección antes de
 * liberar»). `hvacValidationMaxDays = 365` es un supuesto razonable (certificación
 * anual de un local de presión negativa) y **no** sale de una norma verificada: el
 * establecimiento lo ajusta en `practice_settings`.
 */
export const DEFAULT_INFRA_SETTINGS: InfraSettings = {
  inspectionRequired: true,
  hvacValidationMaxDays: 365,
  aiirMinAirChanges: null,
  cleaningDueMinutes: {},
};

/** Desenvuelve `{ value: x }` (forma que usa la consola de ajustes) o el valor directo. */
function unwrap(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ('value' in record) return record.value;
  }
  return value;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  const raw = unwrap(value);
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function asPositiveNumber(value: unknown): number | null {
  const raw = Number(unwrap(value));
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** Lee la configuración `infra.*` del establecimiento (a través de su práctica). */
@Injectable()
export class OpsSettingsReader {
  /**
   * @param tx - Transacción o contexto activo.
   * @param practiceSiteId - Establecimiento.
   * @returns La configuración resuelta (con los valores por omisión donde falte).
   */
  async forSite(
    tx: EntityManager,
    practiceSiteId: string,
  ): Promise<InfraSettings> {
    const keys = Object.values(INFRA_SETTING_KEYS);
    const rows = await tx.execute<
      { setting_key: string; value_json: unknown }[]
    >(
      `select ps.setting_key, ps.value_json
         from practice.practice_settings ps
         join practice.practice_sites s on s.practice_id = ps.practice_id
        where s.id = ? and ps.setting_key in (${keys.map(() => '?').join(', ')})`,
      [practiceSiteId, ...keys],
    );
    const byKey = new Map(rows.map((row) => [row.setting_key, row.value_json]));
    const due = unwrap(byKey.get(INFRA_SETTING_KEYS.cleaningDueMinutes));
    const cleaningDueMinutes: Record<string, number> = {};
    if (due && typeof due === 'object' && !Array.isArray(due)) {
      for (const [priority, minutes] of Object.entries(due)) {
        const parsed = asPositiveNumber(minutes);
        if (parsed !== null) cleaningDueMinutes[priority] = parsed;
      }
    }
    return {
      inspectionRequired: asBoolean(
        byKey.get(INFRA_SETTING_KEYS.inspectionRequired),
        DEFAULT_INFRA_SETTINGS.inspectionRequired,
      ),
      hvacValidationMaxDays:
        asPositiveNumber(byKey.get(INFRA_SETTING_KEYS.hvacValidationMaxDays)) ??
        DEFAULT_INFRA_SETTINGS.hvacValidationMaxDays,
      aiirMinAirChanges: asPositiveNumber(
        byKey.get(INFRA_SETTING_KEYS.aiirMinAirChanges),
      ),
      cleaningDueMinutes,
    };
  }
}
