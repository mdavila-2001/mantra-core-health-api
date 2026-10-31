import {
  isGrantUnused,
  maxSensitivityOf,
  normalizeSensitivity,
  sensitivityRank,
  type ReviewItemState,
} from './support-access-review.shared';
import { canonicalJson, sha256Hex } from './support-canonical-json';
import { describeGrant } from './support-describe';
import type { SupportCondition } from './support-conditions';
import {
  atomsOfGrant,
  isGrantLive,
  type AtomHoldingGrant,
  type GrantTargetFacts,
} from './support-grant-targets';
import {
  PERMISSION_ATOM_BY_CODE,
  type PermissionSensitivity,
  type SupportAtomCode,
} from './support-permission-catalog';
import {
  resolveReviewer,
  type AdminScope,
  type ReviewerContext,
  type ReviewerGrantFacts,
  type ReviewerKind,
  type ReviewKind,
} from './support-reviewer-resolver';
import { TARGET_CONSTRAINTS, isEmptySnapshotRow } from './support-targets';

export * from './support-access-review.shared';
export * from './support-access-review.decision';
export * from './support-access-review.schedule';

/**
 * Campañas de certificación de accesos (CONTRATO-GOBIERNO §6.2), lógica pura:
 * qué concesiones entran en una campaña, a quién se asigna cada ítem, la
 * evidencia congelada y su hash, y los resultados. Las decisiones están en
 * `support-access-review.decision.ts` y los tiempos en
 * `support-access-review.schedule.ts`; ambos se exportan desde aquí.
 */

/** Alcance de una campaña (`scope_json`). */
export type CampaignScope =
  | { readonly kind: 'ORGANIZATION' }
  | {
      readonly kind: 'PRACTITIONER';
      readonly practitionerRoleAssignmentIds: readonly string[];
    }
  | {
      readonly kind: 'SERVICE';
      readonly healthcareServiceIds: readonly string[];
    }
  | {
      readonly kind: 'LOCATION';
      readonly careSpaceIds: readonly string[];
      readonly practiceSiteIds?: readonly string[];
    }
  | { readonly kind: 'TEMPLATE'; readonly templateCodes: readonly string[] };

/** Filtros de una campaña (`filters_json`; todo opcional y se cruzan). */
export interface CampaignFilters {
  /** `ALTA` (contrato) o `HIGH` (catálogo). */
  readonly minSensitivity?: string;
  readonly unusedDays?: number;
  readonly onlyAboveCeiling?: boolean;
  readonly onlySodFindings?: boolean;
  readonly includeSuspended?: boolean;
}

function matchesIds(
  ids: readonly string[],
  wanted: readonly string[],
): boolean {
  return ids.some((id) => wanted.includes(id));
}

function locationInScope(
  loc: { ids: readonly string[]; path?: string; siteId?: string },
  scope: {
    careSpaceIds: readonly string[];
    practiceSiteIds?: readonly string[];
  },
): boolean {
  const wanted = [...scope.careSpaceIds, ...(scope.practiceSiteIds ?? [])];
  return (
    matchesIds(loc.ids, wanted) ||
    wanted.some((id) => loc.path?.includes(`/${id}/`) === true) ||
    (loc.siteId !== undefined &&
      (scope.practiceSiteIds ?? []).includes(loc.siteId))
  );
}

/**
 * ¿La concesión entra en el alcance de la campaña? Entra en `PRACTITIONER`,
 * `SERVICE` o `LOCATION` si su dimensión correspondiente es ESPECÍFICA e igual
 * al objetivo (la ubicación, contenida en él por la ruta materializada) o es
 * «todos» (`ALL_*`/`ALL`); una concesión que no acota esa dimensión (solo por
 * doctor frente a un alcance de servicio) NO entra. Un permiso `FIXED` entra si
 * alguna fila de su foto fija esa dimensión en el objetivo.
 *
 * @param templateCode - Plantilla de la persona (para `TEMPLATE`).
 */
export function grantInCampaignScope(
  grant: GrantTargetFacts,
  scope: CampaignScope,
  templateCode?: string | null,
): boolean {
  if (scope.kind === 'ORGANIZATION') return true;
  if (scope.kind === 'TEMPLATE') {
    return !!templateCode && scope.templateCodes.includes(templateCode);
  }
  const practitionerIds = [
    grant.practitionerProfileId,
    grant.practitionerRoleAssignmentId,
  ].filter((v): v is string => !!v);
  if (grant.expansionMode === 'FIXED') {
    return (grant.snapshot?.rows ?? []).some((row) => {
      if (isEmptySnapshotRow(row)) return false;
      if (scope.kind === 'PRACTITIONER') {
        return matchesIds(
          [row.practitionerProfileId, row.practitionerRoleAssignmentId].filter(
            (v): v is string => !!v,
          ),
          scope.practitionerRoleAssignmentIds,
        );
      }
      if (scope.kind === 'SERVICE') {
        return (
          !!row.healthcareServiceId &&
          scope.healthcareServiceIds.includes(row.healthcareServiceId)
        );
      }
      return (
        !!row.careSpaceId && locationInScope({ ids: [row.careSpaceId] }, scope)
      );
    });
  }
  const c = TARGET_CONSTRAINTS[grant.targetKind];
  if (scope.kind === 'PRACTITIONER') {
    return (
      c.practitioner === 'ANY' ||
      (c.practitioner === 'SPECIFIC' &&
        matchesIds(practitionerIds, scope.practitionerRoleAssignmentIds))
    );
  }
  if (scope.kind === 'SERVICE') {
    return (
      c.service === 'ANY' ||
      (c.service === 'SPECIFIC' &&
        !!grant.healthcareServiceId &&
        scope.healthcareServiceIds.includes(grant.healthcareServiceId))
    );
  }
  if (c.location === 'ANY') return true;
  if (c.location !== 'SPECIFIC') return false;
  const id = grant.careSpaceId ?? grant.practiceSiteId;
  return locationInScope(
    {
      ids: id ? [id] : [],
      path: grant.careSpacePath,
      siteId: grant.careSpaceSiteId ?? grant.practiceSiteId,
    },
    scope,
  );
}

/** Concesión revisable: qué da, a quién cubre, quién la otorgó y cómo se usó. */
export type ReviewableGrant = AtomHoldingGrant &
  ReviewerGrantFacts & {
    readonly condition?: SupportCondition | null;
    readonly createdAt?: Date;
    readonly grantedAt?: Date;
    /** Está por encima del techo de su plantilla. */
    readonly aboveCeiling?: boolean;
    /** Último `PERMIT` de cualquiera de sus átomos (de `grant_usage_stats`). */
    readonly lastUsedAt?: Date | null;
  };

/** Un vínculo con sus concesiones, tal como entra a la selección. */
export interface ReviewEngagementInput {
  readonly engagementId: string;
  readonly subjectUserId: string;
  readonly supervisorUserId?: string | null;
  readonly templateCode?: string | null;
  readonly state: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
  readonly grants: readonly ReviewableGrant[];
  /** Concesiones que participan de un hallazgo SoD. */
  readonly sodGrantIds?: readonly string[];
}

/** Entrada de la selección de ítems. */
export interface CampaignSelectionInput {
  readonly kind: ReviewKind;
  readonly scope: CampaignScope;
  readonly filters?: CampaignFilters;
  readonly engagements: readonly ReviewEngagementInput[];
  readonly adminScopes: readonly AdminScope[];
  readonly reviewerContext: Omit<ReviewerContext, 'campaignKind'>;
  readonly now: Date;
  /** Claves `engagementId:grantId` (grantId vacío en los de vínculo) con ítem abierto. */
  readonly existingOpenItemKeys?: readonly string[];
}

/** Un ítem por crear (todavía sin evidencia). */
export interface CampaignItemDraft {
  readonly engagementId: string;
  readonly subjectUserId: string;
  /** `null` en un ítem de vínculo (recertificación). */
  readonly grantId: string | null;
  readonly reviewerKind: ReviewerKind;
  readonly reviewerUserIds: readonly string[];
  /** No hay revisor elegible: el llamador abre un hallazgo para el administrador. */
  readonly unresolvedReviewer: boolean;
  readonly maxSensitivity: PermissionSensitivity | null;
  /** Sin uso en `unusedDays`: precarga «Revocar» (el revisor confirma). */
  readonly suggestRevoke: boolean;
}

/** Resultado de la selección. */
export interface CampaignSelection {
  readonly items: readonly CampaignItemDraft[];
  readonly skipped: ReadonlyArray<{
    readonly engagementId: string;
    readonly grantId: string | null;
    readonly reason: 'ALREADY_OPEN';
  }>;
  /** Ningún ítem y nada omitido: el alcance no tiene concesiones (422 `REVIEW_SCOPE_EMPTY`). */
  readonly empty: boolean;
}

function passesFilters(
  grant: ReviewableGrant,
  engagement: ReviewEngagementInput,
  filters: CampaignFilters,
  now: Date,
): boolean {
  const min = normalizeSensitivity(filters.minSensitivity);
  if (min) {
    const top = maxSensitivityOf(atomsOfGrant(grant));
    if (top === null || sensitivityRank(top) < sensitivityRank(min))
      return false;
  }
  if (filters.unusedDays !== undefined) {
    if (
      !isGrantUnused({
        lastUsedAt: grant.lastUsedAt,
        createdAt: grant.createdAt,
        now,
        unusedDays: filters.unusedDays,
      })
    ) {
      return false;
    }
  }
  if (filters.onlyAboveCeiling && grant.aboveCeiling !== true) return false;
  if (
    filters.onlySodFindings &&
    !(engagement.sodGrantIds ?? []).includes(grant.grantId)
  )
    return false;
  return true;
}

/**
 * Selecciona los ítems de una campaña. Un ítem por concesión `ALLOW` viva que
 * entra en el alcance y pasa los filtros; en `RECERTIFICATION`, uno por vínculo
 * (con alcance `ORGANIZATION` entran todos los vínculos vivos; con otro, los que
 * tengan alguna concesión que entre). Quedan fuera los vínculos terminados
 * (siempre) y los suspendidos (salvo `includeSuspended`). Cada ítem lleva su
 * revisor según `resolveReviewer`. El resultado sale ordenado por vínculo y
 * concesión: no depende del orden de entrada.
 */
export function selectCampaignItems(
  input: CampaignSelectionInput,
): CampaignSelection {
  const filters = input.filters ?? {};
  const existing = new Set(input.existingOpenItemKeys ?? []);
  const context: ReviewerContext = {
    ...input.reviewerContext,
    campaignKind: input.kind,
  };
  const items: CampaignItemDraft[] = [];
  const skipped: Array<{
    engagementId: string;
    grantId: string | null;
    reason: 'ALREADY_OPEN';
  }> = [];
  const engagements = [...input.engagements].sort((a, b) =>
    a.engagementId.localeCompare(b.engagementId),
  );

  for (const e of engagements) {
    if (e.state === 'ENDED') continue;
    if (e.state === 'SUSPENDED' && !filters.includeSuspended) continue;
    const live = e.grants
      .filter((g) => g.effect !== 'DENY' && isGrantLive(g, input.now))
      .sort((a, b) => a.grantId.localeCompare(b.grantId));
    const matching = live.filter(
      (g) =>
        grantInCampaignScope(g, input.scope, e.templateCode) &&
        passesFilters(g, e, filters, input.now),
    );
    const engagementFacts = {
      subjectUserId: e.subjectUserId,
      supervisorUserId: e.supervisorUserId,
    };
    const push = (
      grant: ReviewerGrantFacts,
      grantId: string | null,
      atoms: readonly string[],
      suggestRevoke: boolean,
    ): void => {
      const key = `${e.engagementId}:${grantId ?? ''}`;
      if (existing.has(key)) {
        skipped.push({
          engagementId: e.engagementId,
          grantId,
          reason: 'ALREADY_OPEN',
        });
        return;
      }
      const reviewer = resolveReviewer(
        grant,
        input.adminScopes,
        engagementFacts,
        context,
      );
      items.push({
        engagementId: e.engagementId,
        subjectUserId: e.subjectUserId,
        grantId,
        reviewerKind: reviewer.kind,
        reviewerUserIds: reviewer.userIds,
        unresolvedReviewer: reviewer.unresolved,
        maxSensitivity: maxSensitivityOf(atoms),
        suggestRevoke,
      });
    };

    if (input.kind === 'RECERTIFICATION') {
      if (input.scope.kind !== 'ORGANIZATION' && matching.length === 0)
        continue;
      push(
        { targetKind: 'ALL' },
        null,
        live.flatMap((g) => atomsOfGrant(g)),
        false,
      );
      continue;
    }
    for (const g of matching) {
      push(
        g,
        g.grantId,
        atomsOfGrant(g),
        isGrantUnused({
          lastUsedAt: g.lastUsedAt,
          createdAt: g.createdAt,
          now: input.now,
          unusedDays: filters.unusedDays,
        }),
      );
    }
  }
  return { items, skipped, empty: items.length === 0 && skipped.length === 0 };
}

/** Evidencia congelada al lanzar y mostrada al revisor (`evidence_json`). */
export interface ReviewEvidence {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  /** Resumen en lenguaje simple de la concesión y sus condiciones. */
  readonly summary: string;
  readonly grant: {
    readonly grantId: string;
    readonly targetKind: string;
    readonly expansionMode: string;
    readonly effect: string;
    readonly validFrom: string | null;
    readonly validTo: string | null;
    readonly grantedByUserId: string | null;
    readonly approvedByUserIds: readonly string[];
    readonly grantedAt: string | null;
  };
  readonly atoms: ReadonlyArray<{
    readonly code: SupportAtomCode;
    readonly name: string;
    readonly sensitivity: PermissionSensitivity;
  }>;
  /** Objetivos cubiertos (solo identificadores). */
  readonly targets: Readonly<Record<string, string>>;
  /** Uso real de los últimos 90 días por átomo. */
  readonly usage90d: ReadonlyArray<{
    readonly atom: string;
    readonly permit: number;
    readonly deny: number;
    readonly lastUsedAt: string | null;
  }>;
  readonly openAlerts: number;
  readonly sodFindings: ReadonlyArray<{
    readonly ruleCode: string;
    readonly action: string;
  }>;
  readonly aboveCeiling: boolean;
  readonly lastCertifiedAt: string | null;
}

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

/**
 * Arma la evidencia de un ítem: resumen simple, átomos con sensibilidad,
 * objetivos, uso de 90 días, alertas abiertas, hallazgos SoD, techo, última
 * certificación y quién otorgó. Solo identificadores y números: nunca datos de
 * pacientes. Es determinista (misma entrada, misma evidencia).
 */
export function buildReviewEvidence(input: {
  readonly grant: ReviewableGrant;
  readonly usage90d: ReadonlyArray<{
    readonly atom: string;
    readonly permitCount: number;
    readonly denyCount: number;
    readonly lastUsedAt?: Date | null;
  }>;
  readonly openAlerts: number;
  readonly sodFindings: ReadonlyArray<{
    readonly ruleCode: string;
    readonly action: string;
  }>;
  readonly aboveCeiling?: boolean;
  readonly lastCertifiedAt?: Date | null;
  readonly now: Date;
}): ReviewEvidence {
  const g = input.grant;
  const atoms = atomsOfGrant(g).map((code) => {
    const meta = PERMISSION_ATOM_BY_CODE.get(code);
    return {
      code,
      name: meta?.name ?? code,
      sensitivity: meta?.sensitivity ?? 'LOW',
    };
  });
  const targets: Record<string, string> = {};
  if (g.practitionerProfileId)
    targets.practitionerProfileId = g.practitionerProfileId;
  if (g.practitionerRoleAssignmentId)
    targets.practitionerRoleAssignmentId = g.practitionerRoleAssignmentId;
  if (g.healthcareServiceId)
    targets.healthcareServiceId = g.healthcareServiceId;
  if (g.careSpaceId) targets.careSpaceId = g.careSpaceId;
  if (g.practiceSiteId) targets.practiceSiteId = g.practiceSiteId;
  return {
    schemaVersion: 1,
    generatedAt: input.now.toISOString(),
    summary: describeGrant({
      atoms: [...g.actions, ...(g.atomGrants ?? []).map((a) => a.atom)],
      effect: g.effect,
      condition: g.condition ?? null,
    }),
    grant: {
      grantId: g.grantId,
      targetKind: g.targetKind,
      expansionMode: g.expansionMode ?? 'DYNAMIC',
      effect: g.effect ?? 'ALLOW',
      validFrom: iso(g.validFrom),
      validTo: iso(g.validTo),
      grantedByUserId: g.grantedByUserId ?? null,
      approvedByUserIds: (g.approvedByUserIds ?? []).filter(
        (u): u is string => !!u,
      ),
      grantedAt: iso(g.grantedAt ?? g.createdAt),
    },
    atoms,
    targets,
    usage90d: [...input.usage90d]
      .sort((a, b) => a.atom.localeCompare(b.atom))
      .map((u) => ({
        atom: u.atom,
        permit: u.permitCount,
        deny: u.denyCount,
        lastUsedAt: iso(u.lastUsedAt),
      })),
    openAlerts: input.openAlerts,
    sodFindings: [...input.sodFindings]
      .sort((a, b) => a.ruleCode.localeCompare(b.ruleCode))
      .map((f) => ({ ruleCode: f.ruleCode, action: f.action })),
    aboveCeiling: input.aboveCeiling ?? g.aboveCeiling ?? false,
    lastCertifiedAt: iso(input.lastCertifiedAt),
  };
}

/**
 * `evidence_hash`: SHA-256 (64 hex) del JSON canónico de lo que se mostró al
 * revisor. La decisión lo guarda para no repudio.
 */
export function hashEvidence(evidence: ReviewEvidence): string {
  return sha256Hex(canonicalJson(evidence));
}

/** Un ítem visto desde los resultados. */
export interface ResultItem {
  readonly itemId: string;
  readonly decision: ReviewItemState;
  readonly reviewerKind: ReviewerKind;
  readonly maxSensitivity: PermissionSensitivity | null;
  readonly launchedAt: Date;
  readonly decidedAt: Date | null;
}

/** Resultados de una campaña (`GET …/results`). */
export interface CampaignResults {
  readonly total: number;
  readonly byDecision: Readonly<Record<ReviewItemState, number>>;
  readonly byReviewerKind: Readonly<Record<ReviewerKind, number>>;
  readonly bySensitivity: Readonly<Record<PermissionSensitivity, number>>;
  readonly pending: number;
  /** % de ítems que ya no están pendientes (decididos, auto-revocados u omitidos). */
  readonly coveragePercent: number;
  /** Tiempo medio de respuesta de las decisiones humanas, en horas; `null` si no hubo. */
  readonly meanResponseHours: number | null;
  readonly autoRevokedItemIds: readonly string[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Resultados de una campaña: conteos, tiempo de respuesta, cobertura y auto-revocados. */
export function summarizeCampaignResults(input: {
  readonly items: readonly ResultItem[];
}): CampaignResults {
  const byDecision: Record<ReviewItemState, number> = {
    PENDING: 0,
    CERTIFIED: 0,
    REVOKED: 0,
    ADJUSTED: 0,
    AUTO_REVOKED: 0,
    SKIPPED: 0,
  };
  const byReviewerKind: Record<ReviewerKind, number> = {
    DOCTOR_OWNER: 0,
    SERVICE_HEAD: 0,
    SUPERVISOR: 0,
    ADMIN: 0,
  };
  const bySensitivity: Record<PermissionSensitivity, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  const hours: number[] = [];
  for (const i of input.items) {
    byDecision[i.decision] += 1;
    byReviewerKind[i.reviewerKind] += 1;
    if (i.maxSensitivity) bySensitivity[i.maxSensitivity] += 1;
    const human =
      i.decision === 'CERTIFIED' ||
      i.decision === 'REVOKED' ||
      i.decision === 'ADJUSTED';
    if (human && i.decidedAt)
      hours.push((i.decidedAt.getTime() - i.launchedAt.getTime()) / 3_600_000);
  }
  const total = input.items.length;
  return {
    total,
    byDecision,
    byReviewerKind,
    bySensitivity,
    pending: byDecision.PENDING,
    coveragePercent:
      total === 0 ? 0 : round2(((total - byDecision.PENDING) / total) * 100),
    meanResponseHours:
      hours.length === 0
        ? null
        : round2(hours.reduce((a, b) => a + b, 0) / hours.length),
    autoRevokedItemIds: input.items
      .filter((i) => i.decision === 'AUTO_REVOKED')
      .map((i) => i.itemId)
      .sort(),
  };
}
