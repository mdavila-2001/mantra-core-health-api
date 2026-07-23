import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'delivery_status_snapshots' })
export class DeliveryStatusSnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  entityTypeConceptId!: string;

  @Property({ fieldName: 'entity_ref_id', type: 'uuid' })
  entityRefId!: string;

  @Property({ fieldName: 'effective_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId!: string;

  @Property({
    fieldName: 'review_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewStatusConceptId?: string;

  @Property({
    fieldName: 'issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  issuesJson?: unknown;

  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
