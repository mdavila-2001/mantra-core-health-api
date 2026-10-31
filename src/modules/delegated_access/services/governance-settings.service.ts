import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import { PracticeSettings, Practices } from '../../practice/entities';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  GovernanceSettingsDto,
  GovernanceSettingsResponseDto,
  PutGovernanceSettingsDto,
} from '../dto';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';

/** Clave de `practice.practice_settings` con los ajustes de gobierno de apoyo. */
export const SUPPORT_GOVERNANCE_SETTING_KEY = 'support.governance';

/**
 * Valores de siempre: la RECOMENDACIÓN de cada decisión del contrato (§12). Son
 * datos de la organización, no código duro: el administrador los cambia.
 */
export const DEFAULT_GOVERNANCE_SETTINGS: GovernanceSettingsDto = {
  onboardingRequired: true,
  onboardingRequiredSince: null,
  inactivityDays: 45,
  unusedDays: 60,
  autoSuspendInactiveDays: null,
  reviewCadenceMonths: 6,
  maxSodExceptionDays: 90,
  creepThreshold: 15,
  fourEyesActionTtlMinutes: 60,
  suspensionReviewAfterDays: 60,
};

/** Rango entero de cada ajuste numérico. */
const RANGES: Readonly<Record<string, readonly [number, number]>> = {
  inactivityDays: [7, 365],
  unusedDays: [1, 365],
  autoSuspendInactiveDays: [14, 730],
  maxSodExceptionDays: [1, 180],
  creepThreshold: [1, 200],
  fourEyesActionTtlMinutes: [5, 1440],
  suspensionReviewAfterDays: [7, 365],
};

/** Un campo inválido, con el mensaje para la pantalla. */
export interface SettingsIssue {
  readonly field: string;
  readonly message: string;
}

const KNOWN_KEYS = new Set(Object.keys(DEFAULT_GOVERNANCE_SETTINGS));

/**
 * Valida un cuerpo de ajustes (solo lo presente). Devuelve todos los problemas:
 * claves desconocidas, tipos y rangos. Es la regla del PUT.
 *
 * @param input - Cuerpo recibido.
 * @returns Los problemas; vacío si es válido.
 */
export function validateGovernanceSettings(input: unknown): SettingsIssue[] {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return [{ field: '*', message: 'Envíe un objeto con los ajustes.' }];
  }
  const issues: SettingsIssue[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (!KNOWN_KEYS.has(key)) {
      issues.push({ field: key, message: 'Ese ajuste no existe.' });
      continue;
    }
    if (value === undefined) continue;
    if (key === 'onboardingRequired') {
      if (typeof value !== 'boolean') {
        issues.push({ field: key, message: 'Debe ser verdadero o falso.' });
      }
    } else if (key === 'onboardingRequiredSince') {
      if (
        value !== null &&
        (typeof value !== 'string' || Number.isNaN(Date.parse(value)))
      ) {
        issues.push({
          field: key,
          message: 'Debe ser una fecha válida o vacío.',
        });
      }
    } else if (key === 'reviewCadenceMonths') {
      if (value !== 6 && value !== 12) {
        issues.push({ field: key, message: 'Debe ser 6 o 12 meses.' });
      }
    } else {
      const range = RANGES[key];
      const nullable = key === 'autoSuspendInactiveDays' && value === null;
      if (
        !nullable &&
        (!Number.isInteger(value) ||
          (value as number) < range[0] ||
          (value as number) > range[1])
      ) {
        issues.push({
          field: key,
          message: `Debe ser un número entero entre ${range[0]} y ${range[1]}.`,
        });
      }
    }
  }
  return issues;
}

/**
 * Lee los ajustes guardados tolerando lo ilegible: un valor ausente, de otro
 * tipo o fuera de rango deja el de siempre (nunca abre un control).
 *
 * @param raw - `value_json` de la fila, tal como esté.
 * @returns Los ajustes completos.
 */
export function readGovernanceSettings(raw: unknown): GovernanceSettingsDto {
  const stored =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const merged: Record<string, unknown> = { ...DEFAULT_GOVERNANCE_SETTINGS };
  for (const [key, value] of Object.entries(stored)) {
    if (!KNOWN_KEYS.has(key)) continue;
    if (validateGovernanceSettings({ [key]: value }).length === 0) {
      merged[key] = value ?? null;
    }
  }
  return merged as unknown as GovernanceSettingsDto;
}

/**
 * Ajustes de gobierno de la organización (CONTRATO-GOBIERNO §7.2): una fila de
 * `practice.practice_settings` con `setting_key = 'support.governance'` (mismo
 * mecanismo que `org_account_mode`, sin tabla nueva). Escribir exige el paso
 * extra. Un valor ilegible en lectura no abre nada: deja el de siempre.
 */
@Injectable()
export class GovernanceSettingsService {
  /**
   * @param em - Contexto de persistencia.
   * @param scope - Organización activa verificada.
   * @param stepUp - Paso extra de la sesión.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly scope: DelegationScopeService,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceSettingsService.name);
  }

  /**
   * Ajustes vigentes de una organización (con los de siempre donde no hay nada).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @returns Los ajustes completos y si son los de siempre.
   */
  async read(
    em: EntityManager,
    tenantId: string,
  ): Promise<GovernanceSettingsResponseDto> {
    const row = await this.findRow(em, tenantId);
    return {
      settings: readGovernanceSettings(row?.valueJson),
      isDefault: !row,
      ...(row ? { updatedAt: row.updatedAt } : {}),
    };
  }

  /** Ajustes de la organización activa (`GET /org/governance/settings`). */
  get(): Promise<GovernanceSettingsResponseDto> {
    return this.read(
      this.em.fork({ keepTransactionContext: true }),
      this.scope.resolveTenant(),
    );
  }

  /**
   * Guarda los ajustes (`PUT /org/governance/settings`): mezcla lo enviado con lo
   * vigente, valida rangos y tipos y crea o actualiza la fila.
   *
   * @param dto - Ajustes a cambiar.
   * @param actor - Quien los cambia (paso extra obligatorio).
   * @returns Los ajustes resultantes.
   */
  async put(
    dto: PutGovernanceSettingsDto,
    actor: AuthenticatedUser,
  ): Promise<GovernanceSettingsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const issues = validateGovernanceSettings(dto);
    if (issues.length > 0) {
      throw governanceError(
        Reason.GOVERNANCE_SETTINGS_INVALID,
        'Algunos ajustes no son válidos: revise los campos indicados.',
        { issues },
      );
    }
    this.logger.info(
      {
        operation: 'delegated_access.governance_settings.put',
        tenantId,
        actorId: actor.id,
      },
      'Updating governance settings',
    );
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const existing = await this.findRow(tx, tenantId);
      const next = {
        ...readGovernanceSettings(existing?.valueJson),
        ...Object.fromEntries(
          Object.entries(dto).filter(([, value]) => value !== undefined),
        ),
      };
      if (existing) {
        existing.valueJson = next;
        touch(existing, actor.id);
      } else {
        const practice = await this.firstPractice(tx, tenantId);
        if (!practice) {
          throw governanceError(
            Reason.GOVERNANCE_SETTINGS_INVALID,
            'La organización no tiene una práctica donde guardar los ajustes.',
          );
        }
        tx.create(
          PracticeSettings,
          {
            practiceId: practice.id,
            settingKey: SUPPORT_GOVERNANCE_SETTING_KEY,
            valueJson: next,
            categoryConceptId: PRAC.SETTING_CATEGORY_GENERAL,
            createdByUserId: actor.id,
            updatedByUserId: actor.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { partial: true },
        );
      }
      await tx.flush();
      return { settings: next, isDefault: false, updatedAt: new Date() };
    });
  }

  /** La fila de ajustes de la organización: la más reciente de sus prácticas. */
  private async findRow(
    em: EntityManager,
    tenantId: string,
  ): Promise<PracticeSettings | null> {
    const practices = await em.find(Practices, { tenantId });
    if (practices.length === 0) return null;
    const rows = await em.find(
      PracticeSettings,
      {
        practiceId: { $in: practices.map((p) => p.id) },
        settingKey: SUPPORT_GOVERNANCE_SETTING_KEY,
      },
      { orderBy: { updatedAt: 'desc', id: 'asc' } },
    );
    return rows[0] ?? null;
  }

  private async firstPractice(
    em: EntityManager,
    tenantId: string,
  ): Promise<Practices | null> {
    const rows = await em.find(
      Practices,
      { tenantId },
      { orderBy: { createdAt: 'asc', id: 'asc' }, limit: 1 },
    );
    return rows[0] ?? null;
  }
}
