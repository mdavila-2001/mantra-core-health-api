import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_creatives' })
export class AdCreatives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  formatConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  body?: string;

  @Property({
    fieldName: 'call_to_action_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  callToActionConceptId?: string;

  @Property({ fieldName: 'link_url', columnType: 'text', nullable: true })
  linkUrl?: string;

  @Property({ fieldName: 'display_url', columnType: 'varchar', nullable: true })
  displayUrl?: string;

  @Property({
    fieldName: 'object_story_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  objectStoryJson?: unknown;

  @Property({
    fieldName: 'primary_media_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  primaryMediaFileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
