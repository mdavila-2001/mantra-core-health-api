import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'deletion_requests' })
export class DeletionRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'subject_type', columnType: 'varchar' })
  subjectType!: string;

  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  @Property({ fieldName: 'legal_basis_code', columnType: 'varchar' })
  legalBasisCode!: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;
}
