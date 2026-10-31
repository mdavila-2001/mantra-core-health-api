import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DIR } from '../../directory/directory.concepts';
import {
  evaluateSod,
  mergeSodRules,
  validateGrantsAgainstGuardrails,
  type AdminDenyRule,
  type OrgCeilingRule,
  type SodAction,
  type SodException,
  type SodRule,
  type SodScope,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { RoleTemplates, type SodRules } from '../entities';
import {
  GovernanceRulesRepository,
  GrantUsageStatsRepository,
  SodRepository,
  SupportAccessRepository,
  type EngagementRecord,
} from '../repositories';
import { STATUS } from './concept-maps';
import { toGrantFacts } from './support-grant-facts';
import type {
  GovernanceWorld,
  WorldEngagement,
  WorldGrant,
} from './governance-world';

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

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : [];
}

/** Fila de regla SoD → regla del dominio; lo desconocido falla cerrado (la más estricta). */
export function toSodRule(
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

/**
 * Carga los hechos de gobierno de una organización: vínculos, concesiones con
 * sus átomos y condiciones, uso, quién otorgó y aprobó, techo, conflictos de
 * segregación de funciones y aceptación de los doctores. Solo lee: lo usan las
 * campañas, los informes, las anomalías y los barridos con el mismo criterio.
 */
@Injectable()
export class GovernanceWorldLoader {
  /**
   * @param access - Lecturas de vínculos, permisos y estructura.
   * @param usage - Estadística de uso por concesión.
   * @param sod - Reglas y excepciones de segregación de funciones.
   * @param rules - Reglas de la organización (techos).
   */
  constructor(
    private readonly access: SupportAccessRepository,
    private readonly usage: GrantUsageStatsRepository,
    private readonly sod: SodRepository,
    private readonly rules: GovernanceRulesRepository,
  ) {}

  /**
   * Hechos de la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param now - Instante de evaluación.
   * @param engagementIds - Si se da, solo estos vínculos.
   * @returns Los hechos, con los vínculos en orden estable.
   */
  async load(
    em: EntityManager,
    tenantId: string,
    now: Date,
    engagementIds?: readonly string[],
  ): Promise<GovernanceWorld> {
    const all = await this.access.findEngagements(em, {
      tenantId,
      ...(engagementIds ? { ids: engagementIds } : {}),
    });
    const records = [...all].sort((a, b) =>
      a.assignment.id.localeCompare(b.assignment.id),
    );
    const ids = records.map((r) => r.assignment.id);
    const withActions = await this.access.findGrantsWithActions(em, ids);
    const roleIds = [
      ...new Set(
        withActions
          .map((g) => g.grant.practitionerRoleAssignmentId)
          .filter((id): id is string => !!id),
      ),
    ];
    const spaceIds = [
      ...new Set(
        withActions
          .map((g) => g.grant.careSpaceId)
          .filter((id): id is string => !!id),
      ),
    ];
    const [
      roles,
      spaces,
      liveRoles,
      delegations,
      lastUsed,
      templateRows,
      sodContext,
      orgCeilings,
      denyRules,
    ] = await Promise.all([
      this.access.findRoleAssignments(em, roleIds),
      this.access.findCareSpaces(em, spaceIds),
      this.access.findRoleAssignmentsOfTenant(em, tenantId),
      this.access.findDelegationsOfEngagements(em, ids),
      this.usage.lastUsedByGrant(
        em,
        tenantId,
        withActions.map((g) => g.grant.id),
      ),
      this.templateCodes(em, records),
      this.sodContext(em, tenantId, now),
      this.orgCeilings(em, tenantId, now),
      this.denyRules(em, tenantId, now),
    ]);
    const liveRoleIds = new Set(liveRoles.map((r) => r.id));
    const engagements = records.map((record) => {
      const a = record.assignment;
      const templateCode = templateRows.get(a.id) ?? null;
      const grants: WorldGrant[] = withActions
        .filter((g) => g.grant.organizationUserAssignmentId === a.id)
        .sort((x, y) => x.grant.id.localeCompare(y.grant.id))
        .map(({ grant, permissionIds, actions }) => {
          const praId = grant.practitionerRoleAssignmentId;
          const facts = toGrantFacts(
            grant,
            permissionIds,
            praId ? roles.get(praId)?.practitionerProfileId : undefined,
            actions,
          );
          const space = grant.careSpaceId
            ? spaces.get(grant.careSpaceId)
            : undefined;
          return {
            ...facts,
            ...(praId ? { practitionerRoleAssignmentId: praId } : {}),
            ...(space
              ? {
                  careSpacePath: space.locationPath,
                  careSpaceSiteId: space.practiceSiteId,
                }
              : {}),
            grantedByUserId: grant.createdByUserId ?? null,
            approvedByUserIds: [grant.approvedByUserId ?? null],
            createdAt: grant.createdAt,
            grantedAt: grant.createdAt,
            lastUsedAt: lastUsed.get(grant.id) ?? null,
            ...(praId && !liveRoleIds.has(praId) ? { doctorGone: true } : {}),
          };
        });
      const ceiling = templateCode
        ? validateGrantsAgainstGuardrails({
            templateCode,
            now,
            orgCeilingRules: orgCeilings,
            grants: grants.map((g) => ({
              atoms: [...g.actions, ...(g.atomGrants ?? []).map((x) => x.atom)],
              effect: g.effect,
            })),
          })
        : [];
      const above = new Set(
        ceiling
          .filter((v) => v.code === 'GUARDRAIL_CEILING_EXCEEDED')
          .map((v) => v.grantIndex),
      );
      const withCeiling = grants.map((g, i) => ({
        ...g,
        aboveCeiling: above.has(i),
      }));
      const findings = evaluateSod(
        withCeiling,
        sodContext.rules,
        sodContext.exceptions.get(a.id) ?? [],
        now,
      );
      return {
        engagementId: a.id,
        tenantId,
        subjectUserId: record.userId,
        supervisorUserId: a.supervisorUserId ?? null,
        templateCode,
        state: stateOf(record),
        grants: withCeiling,
        sodGrantIds: [
          ...new Set(findings.flatMap((f) => [...f.grantIdsA, ...f.grantIdsB])),
        ],
        sodFindings: findings,
        createdAt: a.createdAt,
        lastCertifiedAt: a.lastCertifiedAt ?? null,
        nextRecertificationAt: a.nextRecertificationAt ?? null,
        recertifyEveryMonths: a.recertifyEveryMonths ?? null,
        validTo: a.validTo ?? null,
        membershipLive:
          record.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE &&
          (!record.membershipEndDate ||
            record.membershipEndDate.getTime() > now.getTime()),
        acceptedPractitionerProfileIds: delegations
          .filter(
            ({ delegate }) =>
              delegate.delegateUserAssignmentId === a.id &&
              !!delegate.acceptedAt &&
              delegate.statusConceptId === STATUS.ACTIVE &&
              (!delegate.validTo || delegate.validTo.getTime() > now.getTime()),
          )
          .map((d) => d.practitionerProfileId),
      } satisfies WorldEngagement;
    });
    return { tenantId, now, engagements, denyRules };
  }

  /** Código de plantilla de cada vínculo. */
  private async templateCodes(
    em: EntityManager,
    records: readonly EngagementRecord[],
  ): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    const ids = [
      ...new Set(
        records
          .map((r) => r.assignment.roleTemplateId)
          .filter((id): id is string => !!id),
      ),
    ];
    if (ids.length === 0) return out;
    const templates = await em.find(RoleTemplates, { id: { $in: ids } });
    const codeOf = new Map(templates.map((t) => [t.id, t.code]));
    for (const r of records) {
      const code = r.assignment.roleTemplateId
        ? codeOf.get(r.assignment.roleTemplateId)
        : undefined;
      if (code) out.set(r.assignment.id, code);
    }
    return out;
  }

  /** Reglas SoD vigentes (la versión más alta de cada código) y excepciones por vínculo. */
  private async sodContext(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<{
    rules: SodRule[];
    exceptions: Map<string, SodException[]>;
  }> {
    const rows = await this.sod.findRulesVisible(em, tenantId);
    const codeOfId = new Map(rows.map((r) => [r.id, r.code]));
    const latest = new Map<string, SodRules>();
    for (const row of rows) {
      const key = `${row.tenantId ?? ''}|${row.code}`;
      if (!latest.has(key)) latest.set(key, row);
    }
    const picked = [...latest.values()];
    const rules = mergeSodRules(
      picked.filter((r) => !r.tenantId).map((r) => toSodRule(r, codeOfId)),
      picked.filter((r) => !!r.tenantId).map((r) => toSodRule(r, codeOfId)),
    );
    const exceptions = new Map<string, SodException[]>();
    for (const e of await this.sod.findActiveExceptions(em, tenantId, now)) {
      const code = codeOfId.get(e.sodRuleId);
      if (!code) continue;
      const list = exceptions.get(e.organizationUserAssignmentId) ?? [];
      list.push({
        id: e.id,
        ruleCode: code,
        validFrom: e.validFrom,
        validTo: e.validTo,
        status: 'ACTIVE',
      });
      exceptions.set(e.organizationUserAssignmentId, list);
    }
    return { rules, exceptions };
  }

  /** Reglas `DENY_PERMISSION` de la organización (recortan los átomos de administración). */
  private async denyRules(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<AdminDenyRule[]> {
    const rows = await this.rules.findActiveForTenant(em, tenantId, now);
    return rows
      .filter((r) => r.ruleKindConceptId === DELEG.GOV_RULE_DENY_PERMISSION)
      .map((r) => ({
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
      }));
  }

  /** Reglas `CEILING` de la organización. */
  private async orgCeilings(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<OrgCeilingRule[]> {
    const rows = await this.rules.findActiveForTenant(em, tenantId, now);
    return rows
      .filter((r) => r.ruleKindConceptId === DELEG.GOV_RULE_CEILING)
      .map((r) => ({
        id: r.id,
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
        ...(r.messageText ? { message: r.messageText } : {}),
      }));
  }
}

function stateOf(record: EngagementRecord): 'ACTIVE' | 'SUSPENDED' | 'ENDED' {
  const s = record.assignment.statusConceptId;
  if (s === STATUS.ACTIVE) return 'ACTIVE';
  if (s === STATUS.SUSPENDED) return 'SUSPENDED';
  return 'ENDED';
}
