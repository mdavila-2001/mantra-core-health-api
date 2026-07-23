import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_policy_violations' })
export class AdPolicyViolations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_id', type: 'uuid' }) // FK → ads.ads
  adId!: string;

  @Property({ fieldName: 'ad_review_event_id', type: 'uuid', nullable: true }) // FK → ads.ad_review_events
  adReviewEventId?: string;

  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  @Property({ fieldName: 'policy_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  policyCategoryConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  explanation?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
