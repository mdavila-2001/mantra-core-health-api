import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DELEG } from '../delegated_access.concepts';
import {
  SOD_PLATFORM_RULES,
  evaluateSod,
  mergeSodRules,
  deviceCookieEnabledFromEnv,
  validateCondition,
  validateGrantsAgainstGuardrails,
  type AtomHoldingGrant,
  type OrgCeilingRule,
  type SodAction,
  type SodException,
  type SodRule,
  type SodScope,
} from '../domain';
import type { SodRules } from '../entities';
import { GovernanceRulesRepository, SodRepository } from '../repositories';

const SOD_SCOPE: Readonly<Record<string, SodScope>> = {
  [DELEG.SOD_SCOPE_PERSON]: 'PERSON',
  [DELEG.SOD_SCOPE_PERSON_OVERLAP]: 'PERSON_OVERLAP',
  [DELEG.SOD_SCOPE_TRANSACTION]: 'TRANSACTION',
};
const SOD_ACTION: Readonly<Record<string, SodAction>> = {
  [DELEG.SOD_ACTION_BLOCK]: 'BLOCK',
  [DELEG.SOD_ACTION_REQUIRE_APPROVAL]: 'REQUIRE_APPROVAL',
  [DELEG.SOD_ACTION_WARN]: 'WARN',
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Una concesión propuesta (cambio de rol, alta por un delegado…). */
export interface ProposedGrant extends Partial<
  Omit<AtomHoldingGrant, 'grantId' | 'actions' | 'effect'>
> {
  /** Átomos o códigos antiguos. */
  readonly actions: readonly string[];
  readonly effect?: 'ALLOW' | 'DENY';
  /** Condición ABAC de toda la concesión. */
  readonly condition?: unknown;
}

/** Un problema de la propuesta, ya con su estado HTTP estable. */
export interface ProposalIssue {
  readonly code: string;
  readonly httpStatus: 403 | 404 | 409 | 422;
  /** Posición de la concesión en la propuesta; `-1` si afecta al conjunto. */
  readonly grantIndex: number;
  readonly atom?: string;
  readonly ruleId?: string;
  readonly path?: string;
  readonly message: string;
}

/** Entrada de {@link GrantProposalValidator.validate}. */
export interface ProposalInput {
  readonly tenantId: string;
  /** Plantilla de la persona (define su techo). */
  readonly templateCode: string;
  readonly grants: readonly ProposedGrant[];
  /** Un administrador delegado queda además bajo GP-5. */
  readonly actor?: { readonly delegatedAdmin?: boolean };
  /** Vínculo de la persona (para sus excepciones SoD vigentes). */
  readonly subjectEngagementId?: string;
  /** Concesiones que se conservan y cuentan para los conflictos de funciones. */
  readonly kept?: readonly AtomHoldingGrant[];
  readonly now: Date;
}

const MESSAGE: Readonly<Record<string, string>> = {
  GUARDRAIL_NOT_DELEGABLE: 'Este permiso no se puede dar al personal de apoyo.',
  GUARDRAIL_CEILING_EXCEEDED:
    'Este permiso no cabe en el techo de la función de la persona.',
  GUARDRAIL_DELEGATED_FORBIDDEN_ATOM:
    'Un administrador delegado no puede otorgar este permiso.',
  GUARDRAIL_CRITICAL_REQUIRES_EXPIRY:
    'Un permiso crítico exige fecha de fin de hasta 90 días.',
};

/**
 * Validación común de lo que se propone otorgar (CONTRATO-GOBIERNO §6.1 paso 1):
 * condiciones, barandillas de plataforma y de la organización (GP-1, GP-2, GP-5,
 * GP-7, reglas `CEILING`) y segregación de funciones. Solo lee y devuelve TODOS
 * los problemas; quien llama decide cómo responder (422 con la lista, 409 al
 * ejecutar una aprobación). Una concesión `DENY` no cuenta para techos ni conflictos.
 */
@Injectable()
export class GrantProposalValidator {
  /**
   * @param rules - Reglas de la organización (techos `CEILING`).
   * @param sod - Reglas y excepciones de segregación de funciones.
   */
  constructor(
    private readonly rules: GovernanceRulesRepository,
    private readonly sod: SodRepository,
  ) {}

  /**
   * Valida la propuesta.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param input - Qué se propone, para quién y con qué contexto.
   * @returns Los problemas; vacío si todo cabe.
   */
  async validate(
    em: EntityManager,
    input: ProposalInput,
  ): Promise<ProposalIssue[]> {
    const issues: ProposalIssue[] = [];
    input.grants.forEach((g, grantIndex) => {
      if (g.condition === undefined || g.condition === null) return;
      for (const e of validateCondition(g.condition, {
        effect: g.effect ?? 'ALLOW',
        grantAtoms: g.actions,
        deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
      })) {
        issues.push({
          code: e.code,
          httpStatus: 422,
          grantIndex,
          path: e.path,
          ...(e.atom ? { atom: e.atom } : {}),
          message: e.message,
        });
      }
    });
    const ceilingRules = await this.ceilingRules(em, input);
    for (const v of validateGrantsAgainstGuardrails({
      templateCode: input.templateCode,
      now: input.now,
      grants: input.grants.map((g) => ({
        atoms: g.actions,
        validTo: g.validTo,
        effect: g.effect,
      })),
      orgCeilingRules: ceilingRules,
      ...(input.actor ? { actor: input.actor } : {}),
    })) {
      issues.push({
        code: v.code,
        httpStatus: v.httpStatus === 403 ? 403 : 422,
        grantIndex: v.grantIndex,
        ...(v.atom ? { atom: v.atom } : {}),
        ...(v.ruleId ? { ruleId: v.ruleId } : {}),
        message: MESSAGE[v.code] ?? 'La propuesta no cumple una barandilla.',
      });
    }
    issues.push(...(await this.sodIssues(em, input)));
    return issues;
  }

  private async ceilingRules(
    em: EntityManager,
    input: ProposalInput,
  ): Promise<OrgCeilingRule[]> {
    const rows = await this.rules.findActiveForTenant(
      em,
      input.tenantId,
      input.now,
    );
    return rows
      .filter((r) => r.ruleKindConceptId === DELEG.GOV_RULE_CEILING)
      .map((r) => ({
        id: r.id,
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
        ...(r.messageText ? { message: r.messageText } : {}),
      }));
  }

  private async sodIssues(
    em: EntityManager,
    input: ProposalInput,
  ): Promise<ProposalIssue[]> {
    const rows = await this.sod.findRulesVisible(em, input.tenantId);
    const codeOfId = new Map(rows.map((r) => [r.id, r.code]));
    const platformRows = rows.filter((r) => !r.tenantId);
    const platform = platformRows.length
      ? platformRows.map((r) => toSodRule(r, codeOfId))
      : [...SOD_PLATFORM_RULES];
    const rules = mergeSodRules(
      platform,
      rows.filter((r) => !!r.tenantId).map((r) => toSodRule(r, codeOfId)),
    );
    const exceptionRows = input.subjectEngagementId
      ? await this.sod.findActiveExceptions(em, input.tenantId, input.now, [
          input.subjectEngagementId,
        ])
      : [];
    const exceptions: SodException[] = exceptionRows.flatMap((e) => {
      const ruleCode = codeOfId.get(e.sodRuleId);
      return ruleCode
        ? [
            {
              id: e.id ?? ruleCode,
              ruleCode,
              validFrom: e.validFrom,
              validTo: e.validTo,
            },
          ]
        : [];
    });
    const proposed: AtomHoldingGrant[] = input.grants.map((g, i) => ({
      targetKind: g.targetKind ?? 'ALL',
      expansionMode: g.expansionMode,
      practitionerProfileId: g.practitionerProfileId,
      practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
      healthcareServiceId: g.healthcareServiceId,
      careSpaceId: g.careSpaceId,
      practiceSiteId: g.practiceSiteId,
      careSpacePath: g.careSpacePath,
      careSpaceSiteId: g.careSpaceSiteId,
      snapshot: g.snapshot,
      grantId: `proposed:${i}`,
      actions: g.actions,
      effect: g.effect ?? 'ALLOW',
      active: true,
      validFrom: g.validFrom,
      validTo: g.validTo,
    }));
    const findings = evaluateSod(
      [...proposed, ...(input.kept ?? [])],
      rules,
      exceptions,
      input.now,
    );
    const out: ProposalIssue[] = [];
    for (const f of findings) {
      if (f.outcome !== 'BLOCKED' && f.outcome !== 'EXCEPTION_REQUIRED')
        continue;
      const index = [...f.grantIdsA, ...f.grantIdsB]
        .map((id) => /^proposed:(\d+)$/.exec(id))
        .find((m) => !!m);
      // Un conflicto entre lo que se conserva no es culpa de la propuesta.
      if (!index) continue;
      out.push({
        code:
          f.outcome === 'BLOCKED'
            ? 'SOD_CONFLICT_BLOCKED'
            : 'SOD_EXCEPTION_REQUIRED',
        httpStatus: f.outcome === 'BLOCKED' ? 422 : 409,
        grantIndex: Number(index[1]),
        ruleId: f.ruleId ?? f.ruleCode,
        message:
          f.outcome === 'BLOCKED'
            ? `Conflicto de funciones (${f.ruleName}): no se pueden tener a la vez.`
            : `Conflicto de funciones (${f.ruleName}): hace falta una excepción aprobada.`,
      });
    }
    return out;
  }
}

/** Fila de regla SoD → regla del dominio; lo desconocido falla cerrado (la más estricta). */
function toSodRule(
  row: SodRules,
  codeOfId: ReadonlyMap<string, string>,
): SodRule {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    atomsA: strings(row.atomsAJson),
    atomsB: strings(row.atomsBJson),
    scope: SOD_SCOPE[row.scopeConceptId] ?? 'PERSON',
    action: SOD_ACTION[row.actionConceptId] ?? 'BLOCK',
    isHard: row.isHard,
    maxExceptionDays: row.maxExceptionDays ?? null,
    ...(row.rationaleText ? { rationale: row.rationaleText } : {}),
    ...(row.baseRuleId && codeOfId.get(row.baseRuleId)
      ? { baseRuleCode: codeOfId.get(row.baseRuleId) }
      : {}),
  };
}
