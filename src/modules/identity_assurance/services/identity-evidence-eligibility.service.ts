import { Injectable } from '@nestjs/common';
import type { ResolvedIdentityLifecycleRule } from '../identity-evidence-lifecycle.config';

export interface IdentityEligibilityFacts {
  tenantId: string;
  ownerResolved: boolean;
  evidence: {
    evidenceTypeConceptId: string;
    createdAt: Date;
    issuedAt?: Date;
    expiresAt?: Date;
  };
  case: {
    statusConceptId: string;
    createdAt: Date;
    openedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
  };
  hold: 'CLEAR' | 'ACTIVE' | 'UNKNOWN';
  references: 'CLEAR' | 'BLOCKED' | 'UNKNOWN';
  now: Date;
}
export type IdentityEligibility =
  | { eligible: true; eligibleAt: Date }
  | { eligible: false; reasonCode: string };

@Injectable()
export class IdentityEvidenceEligibilityService {
  evaluate(
    config: ResolvedIdentityLifecycleRule | undefined,
    facts: IdentityEligibilityFacts,
  ): IdentityEligibility {
    const deny = (reasonCode: string): IdentityEligibility => ({
      eligible: false,
      reasonCode,
    });
    if (!config) return deny('MISSING_CONFIGURATION');
    if (!facts.ownerResolved || facts.tenantId !== config.rule.tenantId)
      return deny('OWNER_UNKNOWN');
    if (facts.evidence.evidenceTypeConceptId !== config.evidenceTypeConceptId)
      return deny('TYPE_NOT_ELIGIBLE');
    if (
      !config.allowedCaseStatusConceptIds.includes(facts.case.statusConceptId)
    )
      return deny('STATE_NOT_ELIGIBLE');
    if (facts.hold !== 'CLEAR') return deny('LEGAL_HOLD_ACTIVE_OR_UNKNOWN');
    if (facts.references !== 'CLEAR')
      return deny('REFERENCES_BLOCKED_OR_UNKNOWN');
    const [source, field] = config.rule.baseEvent.split('.');
    const timestamps =
      source === 'evidence'
        ? facts.evidence
        : source === 'case'
          ? facts.case
          : undefined;
    const base = timestamps?.[field as keyof typeof timestamps];
    if (
      !(base instanceof Date) ||
      !Number.isFinite(base.getTime()) ||
      !Number.isSafeInteger(config.retentionPeriodDays) ||
      config.retentionPeriodDays < 0 ||
      !Number.isSafeInteger(config.rule.additionalWaitSeconds) ||
      config.rule.additionalWaitSeconds < 0
    )
      return deny('CUTOFF_UNKNOWN');
    const eligibleAt = new Date(
      base.getTime() +
        config.retentionPeriodDays * 86400000 +
        config.rule.additionalWaitSeconds * 1000,
    );
    if (
      !Number.isFinite(eligibleAt.getTime()) ||
      !Number.isFinite(facts.now.getTime())
    )
      return deny('CUTOFF_UNKNOWN');
    if (facts.now < eligibleAt) return deny('CUTOFF_NOT_REACHED');
    return { eligible: true, eligibleAt };
  }
}
