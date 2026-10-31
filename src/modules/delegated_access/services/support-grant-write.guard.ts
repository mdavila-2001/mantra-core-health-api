import { Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  PERMISSION_ATOM_BY_CODE,
  SUPPORT_TEMPLATE_CODES,
  checkActionConditionKeys,
  checkSelfAdmin,
  deviceCookieEnabledFromEnv,
  expandAtomPattern,
  inheritedTemplateCeiling,
  mostRestrictiveTemplateCeiling,
  validateCondition,
  validateGrantsAgainstGuardrails,
  type ConditionError,
  type GrantTargetFacts,
  type OrgCeilingRule,
  type SodFinding,
} from '../domain';
import {
  GovernanceRulesRepository,
  RoleTemplatesRepository,
} from '../repositories';
import { guardrailMessage } from './access-explain.support';
import { governanceError } from './governance-errors';
import { conditionError } from './governance-rules.service';
import { SodService } from './sod.service';

/** Lo que se quiere escribir en un permiso de apoyo. */
export interface GrantWriteInput {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Quien escribe. */
  readonly actor: AuthenticatedUser;
  /** Vínculo que recibe el permiso. */
  readonly engagementId: string;
  /** Persona del vínculo. */
  readonly userId: string;
  /** Plantilla de plataforma del vínculo (para el techo). */
  readonly templateCode?: string;
  /** Permiso a escribir. */
  readonly grant: Partial<GrantTargetFacts> & {
    readonly targetKind: GrantTargetFacts['targetKind'];
    /** Átomos o alias heredados. */
    readonly actions: readonly string[];
    readonly effect?: 'ALLOW' | 'DENY';
    readonly validTo?: Date;
    /** Condición de todo el permiso. */
    readonly condition?: unknown;
    /** Condición propia de cada átomo. */
    readonly actionConditions?: Readonly<Record<string, unknown>>;
  };
  /** Permiso actual que este reemplaza (edición). */
  readonly replacesGrantId?: string;
}

/** Resultado de una comprobación que pasó. */
export interface GrantWriteCheck {
  /** Advertencias de segregación de funciones (se dejan asentadas, no frenan). */
  readonly sodWarnings: readonly SodFinding[];
}

/**
 * Comprobaciones de ESCRITURA de un permiso de apoyo (CONTRATO-GOBIERNO §4.4):
 * se llama antes de crear o editar una concesión y corta con la razón estable
 * que corresponde.
 *
 * Orden: GP-6 (nadie se otorga a sí mismo) → barandillas de plataforma (GP-1
 * no delegable, GP-2 techo de la plantilla, GP-5 lo que un delegado nunca da,
 * GP-7 crítico con fin ≤ 90 días) y techos `CEILING` de la organización →
 * validador de condiciones → segregación de funciones. Las reglas de L1
 * `DENY_PERMISSION`/`REQUIRE_CONDITION`/`FIELD_FLOOR` NO se miran aquí: actúan en
 * cada decisión (efecto inmediato sobre lo ya concedido).
 */
@Injectable()
export class SupportGrantWriteGuard {
  /**
   * @param rulesRepo - Reglas de la organización (techos).
   * @param sod - Segregación de funciones.
   * @param templates - Plantillas: una propia de la organización hereda su techo (A-M7); opcional en suites anteriores.
   */
  constructor(
    private readonly rulesRepo: GovernanceRulesRepository,
    private readonly sod: SodService,
    @Optional() private readonly templates?: RoleTemplatesRepository,
  ) {}

  /**
   * Comprueba que el permiso se puede escribir.
   *
   * @param tx - Transacción activa de quien escribe.
   * @param input - Persona, plantilla, permiso y quién lo escribe.
   * @returns Las advertencias de SoD si pasó.
   * @throws DomainException `GUARDRAIL_*`, `CONDITION_*`, `SOD_CONFLICT_BLOCKED` o `SOD_EXCEPTION_REQUIRED`.
   */
  async assertCanWrite(
    tx: EntityManager,
    input: GrantWriteInput,
  ): Promise<GrantWriteCheck> {
    const { actor, grant } = input;
    const self = checkSelfAdmin(actor.id, input.userId);
    if (self) {
      throw governanceError(
        Reason.GUARDRAIL_SELF_ADMIN,
        'Nadie se otorga, aprueba ni revoca permisos propios.',
      );
    }
    const now = new Date();
    const violations = validateGrantsAgainstGuardrails({
      templateCode: input.templateCode ?? '',
      grants: [
        {
          atoms: grant.actions,
          effect: grant.effect,
          ...(grant.validTo ? { validTo: grant.validTo } : {}),
        },
      ],
      now,
      orgCeilingRules: await this.ceilingRules(tx, input.tenantId, now),
      templateCeiling: await this.ownTemplateCeiling(
        tx,
        input.tenantId,
        input.templateCode,
      ),
      actor: {
        delegatedAdmin: !roleAuthorizesInTenant(
          actor,
          'SECURITY_ADMIN',
          input.tenantId,
        ),
      },
    });
    if (violations.length > 0) {
      const first = violations[0];
      const shown = violations.map((v) => ({
        code: v.code,
        guardrailId: v.guardrailId,
        ...(v.atom ? { atom: v.atom } : {}),
        ...(v.ruleId ? { ruleId: v.ruleId } : {}),
        message: guardrailMessage(
          v.code,
          v.atom
            ? (PERMISSION_ATOM_BY_CODE.get(v.atom as never)?.name ?? v.atom)
            : '',
          input.templateCode ?? '',
          (v.details as { message?: string } | undefined)?.message,
        ),
      }));
      throw governanceError(
        Reason[first.code as keyof typeof Reason],
        shown[0].message,
        {
          violations: shown,
        },
      );
    }
    this.assertConditions(grant);
    const check = await this.sod.assertGrantAllowed(tx, input.tenantId, {
      userId: input.userId,
      proposed: [
        {
          ...grant,
          targetKind: grant.targetKind,
          actions: grant.actions,
          effect: grant.effect,
          validTo: grant.validTo,
        },
      ],
      ...(input.replacesGrantId
        ? { replacesGrantIds: [input.replacesGrantId] }
        : {}),
      now,
    });
    return { sodWarnings: check?.warnings ?? [] };
  }

  /**
   * Techo de una plantilla PROPIA de la organización (A-M7): el guardado en la
   * plantilla o, si no lo tiene, el que hereda de sus acciones por defecto (el
   * techo de plataforma más restrictivo que las cubre); sin nada legible, lo
   * común a todas las de plataforma. Plantillas de plataforma y vínculos sin
   * plantilla: `undefined` (no hay techo propio que añadir).
   */
  private async ownTemplateCeiling(
    tx: EntityManager,
    tenantId: string,
    templateCode: string | undefined,
  ): Promise<readonly string[] | undefined> {
    if (
      !this.templates ||
      !templateCode ||
      (SUPPORT_TEMPLATE_CODES as readonly string[]).includes(templateCode)
    ) {
      return undefined;
    }
    const row = await this.templates.findEffectiveByCode(
      tx,
      tenantId,
      templateCode,
    );
    const stored = Array.isArray(row?.ceilingActionsJson)
      ? (row.ceilingActionsJson as unknown[]).filter(
          (a): a is string => typeof a === 'string',
        )
      : [];
    if (stored.length > 0) {
      return [...new Set(stored.flatMap((p) => expandAtomPattern(p)))];
    }
    const defaults = Array.isArray(row?.defaultActionsJson)
      ? (row.defaultActionsJson as unknown[]).filter(
          (a): a is string => typeof a === 'string',
        )
      : [];
    if (defaults.length > 0) {
      const inherited = inheritedTemplateCeiling(defaults);
      if (inherited.ok) return inherited.ceiling;
    }
    return mostRestrictiveTemplateCeiling();
  }

  /** Condición del permiso y de cada átomo, con la ruta en el cuerpo recibido. */
  private assertConditions(grant: GrantWriteInput['grant']): void {
    const errors: ConditionError[] = [];
    const effect = grant.effect ?? 'ALLOW';
    const push = (prefix: string, list: readonly ConditionError[]): void => {
      for (const e of list) {
        errors.push({ ...e, path: e.path ? `${prefix}.${e.path}` : prefix });
      }
    };
    if (grant.condition !== undefined && grant.condition !== null) {
      push(
        'condition',
        validateCondition(grant.condition, {
          effect,
          grantAtoms: grant.actions,
          deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
        }),
      );
    }
    // Primero las CLAVES: un tope y el primer error, no uno por clave inventada.
    const keyError = checkActionConditionKeys(
      Object.keys(grant.actionConditions ?? {}),
    );
    if (keyError) errors.push(keyError);
    for (const [atom, condition] of keyError
      ? []
      : Object.entries(grant.actionConditions ?? {})) {
      push(
        `actionConditions.${atom}`,
        validateCondition(condition, {
          atom,
          effect,
          grantAtoms: grant.actions,
          deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
        }),
      );
    }
    if (errors.length > 0) throw conditionError(errors);
  }

  /** Reglas `CEILING` activas de la organización. */
  private async ceilingRules(
    tx: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<OrgCeilingRule[]> {
    const rows = await this.rulesRepo.findActiveForTenant(tx, tenantId, now);
    return rows
      .filter(
        (r) =>
          r.ruleKindConceptId === DELEG.GOV_RULE_CEILING &&
          r.statusConceptId === CONCEPTS.STATE_ACTIVE,
      )
      .map((r) => ({
        id: r.id,
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
        ...(r.messageText ? { message: r.messageText } : {}),
      }));
  }
}
