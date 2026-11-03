import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface InsuranceAuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  tenantId?: string;
  success?: boolean;
}

export interface InsuranceAuditTrailPort {
  record(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: InsuranceAuditEntry,
  ): Promise<void>;
}

export const INSURANCE_AUDIT_TRAIL_PORT = Symbol('INSURANCE_AUDIT_TRAIL_PORT');
