import { maxSensitivityOf } from '../domain';
import type { AccessReviewCampaigns, AccessReviewItems } from '../entities';
import type {
  CampaignViewDto,
  ReviewItemViewDto,
} from '../dto/access-reviews.dto';
import {
  CAMPAIGN_STATUS_BY_CONCEPT,
  ITEM_STATE_BY_CONCEPT,
  REVIEWER_KIND_BY_CONCEPT,
  REVIEW_KIND_BY_CONCEPT,
  uncertifiedActionOf,
} from './access-review-concepts';
import { shownEvidence } from './access-review-evidence';

const iso = (d: Date | null | undefined): string | undefined =>
  d ? d.toISOString() : undefined;

function json(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Códigos de átomo que figuran en la evidencia (de la concesión o del vínculo). */
export function evidenceAtomCodes(evidence: unknown): string[] {
  const atoms = json(evidence).atoms;
  return Array.isArray(atoms)
    ? atoms
        .map((a) => json(a).code)
        .filter((c): c is string => typeof c === 'string')
    : [];
}

/** Campaña tal como la ve quien administra. */
export function toCampaignView(row: AccessReviewCampaigns): CampaignViewDto {
  const reminders = Array.isArray(row.reminderDaysBeforeJson)
    ? row.reminderDaysBeforeJson.filter(
        (n): n is number => typeof n === 'number',
      )
    : [];
  return {
    id: row.id,
    name: row.name,
    kind: REVIEW_KIND_BY_CONCEPT[row.kindConceptId] ?? 'PERIODIC',
    status: CAMPAIGN_STATUS_BY_CONCEPT[row.statusConceptId] ?? 'DRAFT',
    scope: json(row.scopeJson),
    ...(row.filtersJson ? { filters: json(row.filtersJson) } : {}),
    dueAt: row.dueAt.toISOString(),
    graceDays: row.graceDays,
    reminderDaysBefore: reminders,
    escalateAfterDays: row.escalateAfterDays,
    uncertifiedAction: uncertifiedActionOf(row.uncertifiedActionConceptId),
    ...(row.ownerUserId ? { ownerUserId: row.ownerUserId } : {}),
    ...(row.launchedAt ? { launchedAt: iso(row.launchedAt) } : {}),
    ...(row.closedAt ? { closedAt: iso(row.closedAt) } : {}),
    ...(row.cancelledAt ? { cancelledAt: iso(row.cancelledAt) } : {}),
  };
}

/**
 * Ítem tal como lo ve quien revisa. La evidencia (lo que se mostró, sin el
 * enrutamiento) solo va en el detalle.
 */
export function toItemView(
  row: AccessReviewItems,
  extra: {
    readonly subjectUserId: string;
    readonly subjectName?: string;
    readonly campaignName?: string;
  },
  withEvidence: boolean,
): ReviewItemViewDto {
  const top = maxSensitivityOf(evidenceAtomCodes(row.evidenceJson));
  return {
    id: row.id,
    campaignId: row.accessReviewCampaignId,
    engagementId: row.organizationUserAssignmentId,
    ...(row.supportScopeGrantId ? { grantId: row.supportScopeGrantId } : {}),
    subjectUserId: extra.subjectUserId,
    ...(extra.subjectName ? { subjectName: extra.subjectName } : {}),
    reviewerKind:
      REVIEWER_KIND_BY_CONCEPT[row.reviewerKindConceptId] ?? 'ADMIN',
    state: ITEM_STATE_BY_CONCEPT[row.decisionConceptId] ?? 'PENDING',
    dueAt: row.dueAt.toISOString(),
    ...(row.decidedAt ? { decidedAt: iso(row.decidedAt) } : {}),
    ...(row.decisionCommentText ? { comment: row.decisionCommentText } : {}),
    escalated: !!row.escalatedAt,
    reminderCount: row.reminderCount,
    ...(top ? { maxSensitivity: top } : {}),
    ...(extra.campaignName ? { campaignName: extra.campaignName } : {}),
    ...(withEvidence
      ? {
          evidence: shownEvidence(row.evidenceJson),
          evidenceHash: row.evidenceHash,
        }
      : {}),
  };
}
