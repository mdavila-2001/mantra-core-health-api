import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'care_space_status_events' })
export class CareSpaceStatusEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  @Property({ fieldName: 'axis_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  axisConceptId!: string;

  @Property({ fieldName: 'from_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  fromConceptId?: string;

  @Property({ fieldName: 'to_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  toConceptId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  reasonConceptId?: string;

  @Property({ fieldName: 'reason_text', columnType: 'varchar', nullable: true })
  reasonText?: string;

  @Property({
    fieldName: 'expected_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  expectedUntil?: Date;

  @Property({ fieldName: 'v2_0116_code', columnType: 'char(1)' })
  v20116Code!: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  sourceConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  recordedByUserId?: string;

  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
