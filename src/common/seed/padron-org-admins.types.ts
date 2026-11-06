import type { DemoGateSkip } from './demo-gate';

/** Reserved test email domain: prevents emails from dispatching to real recipients. */
export const DEMO_EMAIL_DOMAIN = 'alovida.test';

/** Aggregated results from executing the organization administrator seeder. */
export interface PadronOrgAdminsResult {
  /** Newly provisioned administrator user accounts. */
  created: number;
  /** Existing administrator accounts discovered in the database. */
  existing: number;
  /** Organizations that already possess an active @alovida.test admin. */
  adopted: number;
  /** Total ADMIN memberships provisioned or linked. */
  memberships: number;
  /** Organizations not yet seeded whose admin creation is deferred. */
  organizationMissing: number;
  /** Failed account operations with corresponding error details. */
  failed: string[];
  /** Reason when the seeder execution was skipped by demo gates. */
  reason?: DemoGateSkip;
}

/** Represents a target organization receiving a demo administrator. */
export interface AdminTarget {
  /** Consistent slug derived from facility or carrier code. */
  slug: string;
  /** Human-readable display name for account profiling. */
  organizationName: string;
  /** Associated organization tenant UUID if resolved. */
  tenantId: string | undefined;
}

/** Derives standard URL-safe slug from facility or insurer codes (e.g. BO_EST_CLINICA_LAS_AMERICAS -> clinica-las-americas). */
export function slugOf(code: string): string {
  return code
    .replace(/^BO_EST_/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Formats official demo administrator email address for an organization slug. */
export function padronAdminEmail(slug: string): string {
  return `admin.${slug}@${DEMO_EMAIL_DOMAIN}`;
}
