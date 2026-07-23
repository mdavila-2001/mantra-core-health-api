import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'tracked_links' })
export class TrackedLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'target_url', columnType: 'text' })
  targetUrl!: string;

  @Property({ fieldName: 'utm_source', columnType: 'varchar', nullable: true })
  utmSource?: string;

  @Property({ fieldName: 'utm_medium', columnType: 'varchar', nullable: true })
  utmMedium?: string;

  @Property({
    fieldName: 'utm_campaign',
    columnType: 'varchar',
    nullable: true,
  })
  utmCampaign?: string;

  @Property({ fieldName: 'utm_content', columnType: 'varchar', nullable: true })
  utmContent?: string;

  @Property({ fieldName: 'click_count', type: 'bigint', nullable: true })
  clickCount?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
