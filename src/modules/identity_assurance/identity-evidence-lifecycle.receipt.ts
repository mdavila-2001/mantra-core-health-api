import { createHash } from 'node:crypto';
import type {
  IdentityDisposition,
  ResolvedIdentityLifecycleRule,
} from './identity-evidence-lifecycle.config';

/** Technical outcome, never a snapshot of evidence, locator, document hash or subject. */
export function technicalDispositionReceipt(
  plan: {
    operation: IdentityDisposition;
    config: ResolvedIdentityLifecycleRule;
  },
  outcome: string,
) {
  return {
    schemaVersion: 1,
    operation: plan.operation,
    outcome,
    contractDigest: createHash('sha256')
      .update(
        JSON.stringify([
          plan.config.configRevision,
          plan.config.rule.authorizationRevision,
          plan.config.rule.retentionPolicyCode,
          plan.config.rule.expectedRowVersion,
          plan.config.rule,
        ]),
      )
      .digest('hex'),
  };
}
