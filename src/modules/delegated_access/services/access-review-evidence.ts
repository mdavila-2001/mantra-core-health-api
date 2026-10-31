import {
  PERMISSION_ATOM_BY_CODE,
  atomsOfGrant,
  canonicalJson,
  isGrantLive,
  sha256Hex,
  type PermissionSensitivity,
  type ReviewerKind,
  type SodFinding,
} from '../domain';
import type { GrantPermissionUsage } from '../repositories';
import type { WorldEngagement } from './governance-world';

/** Clave de `evidence_json` donde viaja el enrutamiento (no es parte de lo que se mostró ni del hash). */
export const ROUTING_KEY = '_routing';

/** A quién se asignó el ítem al lanzar y a quién se escaló. */
export interface ItemRouting {
  readonly reviewerKind: ReviewerKind;
  readonly reviewerUserIds: readonly string[];
}

/** Evidencia de un ítem de vínculo (recertificación individual). */
export interface EngagementEvidence {
  readonly schemaVersion: 1;
  readonly kind: 'ENGAGEMENT';
  readonly generatedAt: string;
  readonly summary: string;
  readonly engagement: {
    readonly engagementId: string;
    readonly templateCode: string | null;
    readonly state: string;
    readonly createdAt: string;
    readonly nextRecertificationAt: string | null;
    readonly recertifyEveryMonths: number | null;
  };
  readonly grants: ReadonlyArray<{
    readonly grantId: string;
    readonly atoms: readonly string[];
    readonly validTo: string | null;
  }>;
  readonly atoms: ReadonlyArray<{
    readonly code: string;
    readonly name: string;
    readonly sensitivity: PermissionSensitivity;
  }>;
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

/** Uso de 90 días por átomo de una concesión (suma por permiso, orden alfabético). */
export function usageOfGrant(
  rows: readonly GrantPermissionUsage[],
  grantId: string,
): Array<{
  atom: string;
  permitCount: number;
  denyCount: number;
  lastUsedAt: Date | null;
}> {
  const byAtom = new Map<
    string,
    {
      atom: string;
      permitCount: number;
      denyCount: number;
      lastUsedAt: Date | null;
    }
  >();
  for (const r of rows) {
    if (r.grantId !== grantId) continue;
    const cur = byAtom.get(r.permissionCode) ?? {
      atom: r.permissionCode,
      permitCount: 0,
      denyCount: 0,
      lastUsedAt: null,
    };
    cur.permitCount += r.permit;
    cur.denyCount += r.deny;
    if (
      r.lastUsedAt &&
      (!cur.lastUsedAt || r.lastUsedAt.getTime() > cur.lastUsedAt.getTime())
    ) {
      cur.lastUsedAt = r.lastUsedAt;
    }
    byAtom.set(r.permissionCode, cur);
  }
  return [...byAtom.values()].sort((a, b) => a.atom.localeCompare(b.atom));
}

/** Hallazgos SoD que involucran a una concesión (solo código de regla y acción). */
export function sodOfGrant(
  findings: readonly SodFinding[],
  grantId: string,
): Array<{ ruleCode: string; action: string }> {
  return findings
    .filter(
      (f) => f.grantIdsA.includes(grantId) || f.grantIdsB.includes(grantId),
    )
    .map((f) => ({ ruleCode: f.ruleCode, action: f.action }));
}

/**
 * Evidencia del ítem de VÍNCULO: lo que la persona puede hacer hoy (permisos
 * vivos y sus átomos), su uso de 90 días, alertas abiertas, conflictos de
 * segregación, si algún permiso está sobre el techo y su última certificación.
 * Solo identificadores y números; determinista.
 */
export function buildEngagementEvidence(input: {
  readonly engagement: WorldEngagement;
  readonly usage: readonly GrantPermissionUsage[];
  readonly openAlerts: number;
  readonly now: Date;
}): EngagementEvidence {
  const e = input.engagement;
  const live = e.grants.filter(
    (g) => g.effect !== 'DENY' && isGrantLive(g, input.now),
  );
  const atomCodes = [...new Set(live.flatMap((g) => atomsOfGrant(g)))].sort();
  const usageByAtom = new Map<
    string,
    { permit: number; deny: number; lastUsedAt: Date | null }
  >();
  for (const g of live) {
    for (const u of usageOfGrant(input.usage, g.grantId)) {
      const cur = usageByAtom.get(u.atom) ?? {
        permit: 0,
        deny: 0,
        lastUsedAt: null,
      };
      cur.permit += u.permitCount;
      cur.deny += u.denyCount;
      if (
        u.lastUsedAt &&
        (!cur.lastUsedAt || u.lastUsedAt.getTime() > cur.lastUsedAt.getTime())
      )
        cur.lastUsedAt = u.lastUsedAt;
      usageByAtom.set(u.atom, cur);
    }
  }
  const owner = e.supervisorUserId
    ? 'con dueño de cuenta'
    : 'sin dueño de cuenta';
  return {
    schemaVersion: 1,
    kind: 'ENGAGEMENT',
    generatedAt: input.now.toISOString(),
    summary: `Recertificación del vínculo: ${live.length} permiso(s) vivo(s), ${owner}.`,
    engagement: {
      engagementId: e.engagementId,
      templateCode: e.templateCode ?? null,
      state: e.state,
      createdAt: e.createdAt.toISOString(),
      nextRecertificationAt: iso(e.nextRecertificationAt),
      recertifyEveryMonths: e.recertifyEveryMonths,
    },
    grants: live.map((g) => ({
      grantId: g.grantId,
      atoms: atomsOfGrant(g),
      validTo: iso(g.validTo),
    })),
    atoms: atomCodes.map((code) => ({
      code,
      name: PERMISSION_ATOM_BY_CODE.get(code)?.name ?? code,
      sensitivity: PERMISSION_ATOM_BY_CODE.get(code)?.sensitivity ?? 'LOW',
    })),
    usage90d: [...usageByAtom.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([atom, u]) => ({
        atom,
        permit: u.permit,
        deny: u.deny,
        lastUsedAt: iso(u.lastUsedAt),
      })),
    openAlerts: input.openAlerts,
    sodFindings: e.sodFindings
      .map((f) => ({ ruleCode: f.ruleCode, action: f.action }))
      .sort((a, b) => a.ruleCode.localeCompare(b.ruleCode)),
    aboveCeiling: live.some((g) => g.aboveCeiling === true),
    lastCertifiedAt: iso(e.lastCertifiedAt),
  };
}

/** `evidence_hash`: SHA-256 (64 hex) del JSON canónico de lo que se mostró. */
export function hashEvidenceObject(evidence: object): string {
  return sha256Hex(canonicalJson(evidence));
}

/** La evidencia tal como se mostró: `evidence_json` sin el enrutamiento. */
export function shownEvidence(json: unknown): Record<string, unknown> {
  if (json === null || typeof json !== 'object' || Array.isArray(json))
    return {};
  const { [ROUTING_KEY]: _routing, ...rest } = json as Record<string, unknown>;
  return rest;
}

/** `evidence_json` completo: la evidencia más el enrutamiento (fuera del hash). */
export function withRouting(
  evidence: object,
  routing: ItemRouting,
): Record<string, unknown> {
  return {
    ...(evidence as Record<string, unknown>),
    [ROUTING_KEY]: {
      reviewerKind: routing.reviewerKind,
      reviewerUserIds: [...routing.reviewerUserIds],
    },
  };
}

/** Revisores asignados al lanzar (más los escalados), según `evidence_json`. */
export function routedReviewerIds(json: unknown): string[] {
  if (json === null || typeof json !== 'object' || Array.isArray(json))
    return [];
  const routing = (json as Record<string, unknown>)[ROUTING_KEY];
  if (routing === null || typeof routing !== 'object') return [];
  const ids = (routing as Record<string, unknown>).reviewerUserIds;
  return Array.isArray(ids)
    ? ids.filter((v): v is string => typeof v === 'string')
    : [];
}

/** Agrega revisores al enrutamiento (escalamiento), sin repetir y sin tocar la evidencia. */
export function addRoutedReviewers(
  json: unknown,
  userIds: readonly string[],
): Record<string, unknown> {
  const base =
    json !== null && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};
  const routing =
    base[ROUTING_KEY] !== null && typeof base[ROUTING_KEY] === 'object'
      ? (base[ROUTING_KEY] as Record<string, unknown>)
      : {};
  return {
    ...base,
    [ROUTING_KEY]: {
      ...routing,
      reviewerUserIds: [
        ...new Set([...routedReviewerIds(base), ...userIds]),
      ].sort(),
    },
  };
}
