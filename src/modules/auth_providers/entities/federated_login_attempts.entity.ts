import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'federated_login_attempts' })
export class FederatedLoginAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK (destino no resuelto)
  providerId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({
    fieldName: 'external_subject',
    columnType: 'varchar',
    nullable: true,
  })
  externalSubject?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({
    fieldName: 'failure_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  failureReasonConceptId?: string;

  @Property({ columnType: 'inet', nullable: true })
  ip?: string;

  @Property({ fieldName: 'user_agent', columnType: 'varchar', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
