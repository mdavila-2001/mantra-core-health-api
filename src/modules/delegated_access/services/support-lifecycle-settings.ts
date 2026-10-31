import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { SessionPolicies } from '../../iam/entities';
import { PracticeSettings, Practices } from '../../practice/entities';
import {
  DEFAULT_GOVERNANCE_SETTINGS,
  SUPPORT_GOVERNANCE_SETTING_KEY,
  readGovernanceSettings,
} from './governance-settings.service';

/** Clave de `practice.practice_settings` con los ajustes de gobierno (CONTRATO-GOBIERNO §7.2). */
export const GOVERNANCE_SETTINGS_KEY = SUPPORT_GOVERNANCE_SETTING_KEY;

/** Vida de la caché de ajustes por organización, en milisegundos. */
const SETTINGS_TTL_MS = 30_000;

/** Rol de ejecución del personal de apoyo, para las políticas de sesión por rol. */
const SUPPORT_STAFF_ROLE = 'SUPPORT_STAFF';

/** Ajustes de gobierno que mandan en el ciclo de vida (D-03, D-04). */
export interface LifecycleSettings {
  /** Compuerta de ingreso (D-03): la recomendación es activarla para vínculos nuevos. */
  readonly onboardingRequired: boolean;
  /** La compuerta solo rige para vínculos creados desde esta fecha. */
  readonly onboardingRequiredSince: Date | null;
  /** Días sin actividad tras los cuales se sugiere suspender (D-04). */
  readonly inactivityDays: number;
  /** Días sin actividad tras los cuales se suspende sola; `null` = apagado (D-04). */
  readonly autoSuspendInactiveDays: number | null;
  /** Suspensión (días) a partir de la cual reactivar abre una revisión dirigida. */
  readonly suspensionReviewAfterDays: number;
  /** La organización exige verificación en dos pasos a su personal (política de sesión). */
  readonly requireMfa: boolean;
}

/**
 * Lee `value_json` de `support.governance` con la misma tolerancia que el resto
 * del gobierno de accesos (`readGovernanceSettings`): lo ausente o fuera de
 * rango deja la recomendación del contrato y nunca abre un control. Los
 * ajustes son datos de la organización, no código.
 *
 * @param value - `value_json` tal como está guardado.
 * @param requireMfa - Si la política de sesión de la organización exige dos pasos.
 * @returns Los ajustes del ciclo de vida.
 */
export function parseLifecycleSettings(
  value: unknown,
  requireMfa = false,
): LifecycleSettings {
  const s = readGovernanceSettings(value);
  return {
    onboardingRequired: s.onboardingRequired,
    onboardingRequiredSince: s.onboardingRequiredSince
      ? new Date(s.onboardingRequiredSince)
      : null,
    inactivityDays: s.inactivityDays,
    autoSuspendInactiveDays: s.autoSuspendInactiveDays,
    suspensionReviewAfterDays: s.suspensionReviewAfterDays,
    requireMfa,
  };
}

/** Valores cuando la organización no escribió ajustes: la recomendación de cada decisión. */
export const DEFAULT_LIFECYCLE_SETTINGS: LifecycleSettings =
  parseLifecycleSettings(DEFAULT_GOVERNANCE_SETTINGS);

/**
 * Ajustes de gobierno de una organización, con caché breve. Viven en
 * `practice.practice_settings` de las prácticas de la organización (no hay
 * tabla de ajustes por organización); gana la fila más recientemente editada.
 * La exigencia de dos pasos se toma de las políticas de sesión vigentes.
 */
@Injectable()
export class LifecycleSettingsReader {
  private readonly cache = new Map<
    string,
    { at: number; settings: LifecycleSettings }
  >();

  /**
   * Ajustes vigentes de la organización.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @returns Los ajustes (los de por defecto si no hay fila).
   */
  async forTenant(
    em: EntityManager,
    tenantId: string,
    now: Date = new Date(),
  ): Promise<LifecycleSettings> {
    const hit = this.cache.get(tenantId);
    if (hit && now.getTime() - hit.at < SETTINGS_TTL_MS) return hit.settings;
    const practices = await em.find(Practices, { tenantId });
    const rows =
      practices.length === 0
        ? []
        : await em.find(PracticeSettings, {
            practiceId: { $in: practices.map((p) => p.id) },
            settingKey: GOVERNANCE_SETTINGS_KEY,
          });
    const policies = await em.find(SessionPolicies, {
      tenantId,
      requireMfa: true,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const requireMfa = policies.some(
      (p) => !p.roleCode || p.roleCode === SUPPORT_STAFF_ROLE,
    );
    const newest = [...rows].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0];
    const settings = parseLifecycleSettings(newest?.valueJson, requireMfa);
    this.cache.set(tenantId, { at: now.getTime(), settings });
    return settings;
  }

  /**
   * Descarta la caché de una organización (o de todas): quien escribe los
   * ajustes lo llama para que el efecto sea inmediato.
   *
   * @param tenantId - Organización; sin ella, todas.
   */
  invalidate(tenantId?: string): void {
    if (tenantId) this.cache.delete(tenantId);
    else this.cache.clear();
  }
}
