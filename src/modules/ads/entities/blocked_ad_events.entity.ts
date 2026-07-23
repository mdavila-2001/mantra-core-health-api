import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'blocked_ad_events' })
export class BlockedAdEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'ad_event_data_policy_id', type: 'uuid' }) // FK → ads.ad_event_data_policies
  adEventDataPolicyId!: string;

  @Property({
    fieldName: 'source_event_reference',
    columnType: 'varchar',
    nullable: true,
  })
  sourceEventReference?: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'blocked_at', columnType: 'timestamptz' })
  blockedAt!: Date;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({
    fieldName: 'blocked_field_paths_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  blockedFieldPathsJson?: unknown;

  @Property({
    fieldName: 'payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  payloadHash?: string;

  @Property({
    fieldName: 'review_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewStatusConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
